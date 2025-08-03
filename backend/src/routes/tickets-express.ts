import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db/connection'
import { authMiddleware, requireSupport } from '../middleware/auth';
import { websocketService } from '../services/websocketService';

export const ticketRoutes = Router()

// Search tickets (Public endpoint - for ticket tracking)  
ticketRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query
    
    if (!search || typeof search !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุคำค้นหา'
      })
    }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          OR: [
            { ticketId: { contains: search } },
            { fullName: { contains: search } },
            { problemType: { contains: search } },
            { department: { contains: search } }
          ]
        },
        select: {
          id: true,
          ticketId: true,
          problemType: true,
          problemDescription: true,
          fullName: true,
          department: true,
          status: true,
          priority: true,
          createdAt: true,
          assignedTo: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.ticket.count({
        where: {
          OR: [
            { ticketId: { contains: search } },
            { fullName: { contains: search } },
            { problemType: { contains: search } },
            { department: { contains: search } }
          ]
        }
      })
    ])

    res.json({
      success: true,
      tickets,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        limit: limitNum,
        count: total
      }
    })

  } catch (error) {
    console.error('Search tickets error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการค้นหา'
    })
  }
})

// Get ticket by ticketId (Public endpoint - for ticket tracking)
ticketRoutes.get('/track/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params

    const ticket = await prisma.ticket.findFirst({
      where: { ticketId },
      select: {
        id: true,
        ticketId: true,
        problemType: true,
        problemDescription: true,
        fullName: true,
        phoneNumber: true,
        department: true,
        division: true,
        assetNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
          select: {
            fullName: true
          }
        },
        comments: {
          where: {
            isInternal: false  // Only show public comments
          },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลแจ้งปัญหา'
      })
    }

    res.json({
      success: true,
      ticket
    })

  } catch (error) {
    console.error('Track ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการติดตามแจ้งปัญหา'
    })
  }
})

// Create Ticket Schema
const CreateTicketSchema = z.object({
  problemType: z.string().min(1, 'กรุณาเลือกประเภทปัญหา'),
  otherProblemType: z.string().optional(),
  problemDescription: z.string().min(10, 'กรุณาระบุรายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร'),
  fullName: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล'),
  phoneNumber: z.string().min(10, 'กรุณาระบุเบอร์โทรศัพท์'),
  department: z.string().min(1, 'กรุณาระบุหน่วยงาน'),
  division: z.string().optional(),
  assetNumber: z.string().optional()
})

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 })
    return true
  }
  
  if (limit.count >= 3) {
    return false
  }
  
  limit.count++
  return true
}

// Create ticket (Public endpoint)
ticketRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown'
    
    // Clear rate limit for testing
    rateLimitMap.clear()
    console.log('🧪 Rate limit cleared for testing')

    // Validate request body
    const validation = CreateTicketSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const data = validation.data
    const ticketId = `TK${Date.now()}`
    
    // Find next available support user for auto-assignment (simplified)
    const supportUser = await prisma.user.findFirst({
      where: { 
        role: 'support',
        isActive: true 
      }
    })

    const assignedUserId = supportUser ? supportUser.id : null

    const ticket = await prisma.ticket.create({
      data: {
        ticketId,
        problemType: data.problemType,
        otherProblemType: data.otherProblemType,
        problemDescription: data.problemDescription,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        department: data.department,
        division: data.division || '',
        assetNumber: data.assetNumber,
        status: 'รอดำเนินการ',
        assignedToId: assignedUserId,
        clientIp: clientIP as string
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })

    // Create notification for all admins
    const notification = await prisma.notification.create({
      data: {
        title: `New Ticket: ${ticket.problemType}`,
        message: `A new ticket has been created by ${ticket.fullName}`,
        ticketId: ticket.id,
        userId: 1 // Assuming user with ID 1 is an admin
      }
    });

    // Send real-time notification to all admins
    websocketService.sendToAdmins('new_notification', notification);

    res.status(201).json({
      success: true,
      message: 'แจ้งปัญหาสำเร็จ',
      ticket: {
        id: ticket.id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        createdAt: ticket.createdAt,
        assignedUser: ticket.assignedTo
      }
    })

  } catch (error) {
    console.error('Create ticket error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการแจ้งปัญหา',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get all tickets (Support/Admin only)
ticketRoutes.get('/', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { status, assignedUserId, page = '1', limit = '10' } = req.query
    
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (status) where.status = status
    if (assignedUserId) where.assignedToId = parseInt(assignedUserId as string)

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.ticket.count({ where })
    ])

    res.json({
      success: true,
      tickets,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        limit: limitNum,
        count: total
      }
    })

  } catch (error) {
    console.error('Get tickets error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : error
    })
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งปัญหา',
      details: error instanceof Error ? error.message : 'Unknown'
    })
  }
})

// Get ticket by ID
ticketRoutes.get('/:id', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
      }
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลแจ้งปัญหา'
      })
    }

    res.json({
      success: true,
      ticket
    })

  } catch (error) {
    console.error('Get ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งปัญหา'
    })
  }
})

// Update ticket status
ticketRoutes.put('/:id/status', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { status, comment } = req.body
    const user = req.user!

    // Update ticket status
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        assignedTo: true
      }
    })

    // Add comment if provided
    if (comment) {
      await prisma.ticketComment.create({
        data: {
          ticketId,
          userId: user.userId,
          comment: comment,
          isInternal: false
        }
      })
    }

    // Create notification for the user if the ticket is assigned
    if (ticket.assignedToId) {
      const notification = await prisma.notification.create({
        data: {
          title: `Ticket Status Updated: ${ticket.problemType}`,
          message: `The status of your ticket has been updated to ${status}`,
          ticketId: ticket.id,
          userId: ticket.assignedToId
        }
      });

      // Send real-time notification to the user
      websocketService.sendToUser(ticket.assignedToId, 'new_notification', notification);
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      ticket
    })

  } catch (error) {
    console.error('Update ticket status error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
    })
  }
})

// Assign ticket to user
ticketRoutes.patch('/:id/assign', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { assignedUserId } = req.body

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        assignedToId: assignedUserId || null,
        updatedAt: new Date()
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'มอบหมายงานสำเร็จ',
      ticket
    })

  } catch (error) {
    console.error('Assign ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการมอบหมายงาน'
    })
  }
})