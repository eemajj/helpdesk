import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db/connection'
import { authMiddleware, requireSupport } from '../middleware/auth';
import { websocketService } from '../services/websocketService';
import { cacheMiddleware, invalidateTicketCache } from '../middleware/cache';

export const ticketRoutes = Router()

// Advanced search tickets (Public endpoint) - OPTIMIZED & CACHED
ticketRoutes.get('/search', cacheMiddleware(60), async (req: Request, res: Response) => {
  try {
    // Decode URL parameters properly
    const { 
      search, 
      status, 
      priority, 
      problem_type, 
      department, 
      date_from, 
      date_to, 
      assigned_to,
      page = '1', 
      limit = '20' 
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    // Build dynamic where clause
    const where: any = { AND: [] }
    
    console.log('Search request params:', {
      search,
      status: status ? decodeURIComponent(status as string) : null,
      priority,
      problem_type,
      department
    })

    // Text search across multiple fields
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim()
      where.AND.push({
        OR: [
          { ticketId: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { problemType: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } },
          { problemDescription: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }

    // Status filter - decode Thai characters
    if (status && status !== 'all') {
      try {
        const decodedStatus = decodeURIComponent(status as string)
        where.AND.push({ status: decodedStatus })
        console.log('Status filter applied:', decodedStatus)
      } catch (error) {
        console.error('Failed to decode status:', status, error)
        where.AND.push({ status: status as string })
      }
    }

    // Priority filter - decode Thai characters
    if (priority && priority !== 'all') {
      try {
        const decodedPriority = decodeURIComponent(priority as string)
        where.AND.push({ priority: decodedPriority })
      } catch (error) {
        where.AND.push({ priority: priority as string })
      }
    }

    // Problem type filter - decode Thai characters
    if (problem_type && problem_type !== 'all') {
      try {
        const decodedProblemType = decodeURIComponent(problem_type as string)
        where.AND.push({ problemType: decodedProblemType })
      } catch (error) {
        where.AND.push({ problemType: problem_type as string })
      }
    }

    // Department filter - decode Thai characters
    if (department && department !== 'all') {
      try {
        const decodedDepartment = decodeURIComponent(department as string)
        where.AND.push({ department: decodedDepartment })
      } catch (error) {
        where.AND.push({ department: department as string })
      }
    }

    // Date range filter
    if (date_from || date_to) {
      const dateFilter: any = {}
      if (date_from) dateFilter.gte = new Date(date_from as string)
      if (date_to) dateFilter.lte = new Date(date_to as string)
      where.AND.push({ createdAt: dateFilter })
    }

    // Assigned to filter
    if (assigned_to && assigned_to !== 'all') {
      where.AND.push({ assignedToId: parseInt(assigned_to as string) })
    }

    // Use empty where clause if no filters (show all tickets)
    const finalWhere = where.AND.length === 0 ? {} : where
    
    console.log('Search debug:', { 
      originalQuery: req.query, 
      whereClause: finalWhere,
      hasFilters: where.AND.length > 0 
    })

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: finalWhere,
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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limitNum
      }),
      prisma.ticket.count({ where: finalWhere })
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

// Get ticket by ticketId (Public endpoint - for ticket tracking) - OPTIMIZED & CACHED
ticketRoutes.get('/track/:ticketId', cacheMiddleware(30), async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params

    // Use findFirst since ticketId might not have unique constraint
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
            isInternal: false
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
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 50 // Limit comments for performance
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
    
    // Invalidate cache
    invalidateTicketCache();

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

// Get all tickets (Support/Admin only) - OPTIMIZED & CACHED
ticketRoutes.get('/', authMiddleware, requireSupport, cacheMiddleware(30), async (req: Request, res: Response) => {
  try {
    const { status, assignedUserId, page = '1', limit = '10' } = req.query
    
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10))
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (status && status !== 'all') where.status = status
    if (assignedUserId && assignedUserId !== 'all') {
      where.assignedToId = parseInt(assignedUserId as string)
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
          updatedAt: true,
          assignedTo: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          _count: {
            comments: true
          }
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      
      // Invalidate cache
      invalidateTicketCache();
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

// Update ticket status by ticketId (Support/Admin only)
ticketRoutes.put('/update-status/:ticketId', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status, comment, isInternal = false } = req.body;
    const user = req.user!;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุสถานะใหม่'
      });
    }

    // Find ticket by ticketId
    const existingTicket = await prisma.ticket.findFirst({
      where: { ticketId },
      include: {
        assignedTo: true
      }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลแจ้งปัญหา'
      });
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: existingTicket.id },
      data: { 
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'เสร็จสิ้น' ? new Date() : null
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
    });

    // Add status update comment
    const statusComment = await prisma.ticketComment.create({
      data: {
        ticketId: existingTicket.id,
        userId: user.userId,
        comment: comment || `สถานะเปลี่ยนเป็น: ${status}`,
        commentType: 'status_change',
        isInternal: isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    // Create notification for ticket creator (if not internal)
    if (!isInternal) {
      const notification = await prisma.notification.create({
        data: {
          title: `สถานะแจ้งปัญหาอัปเดท`,
          message: `แจ้งปัญหา ${ticketId} เปลี่ยนสถานะเป็น "${status}"`,
          ticketId: existingTicket.id,
          userId: user.userId // Should be admin/support user for now
        }
      });

      // Send real-time notification
      websocketService.sendToAdmins('new_notification', notification);
    }

    // Invalidate cache
    invalidateTicketCache();

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      ticket: updatedTicket,
      comment: statusComment
    });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
    });
  }
})

// Get status options
ticketRoutes.get('/status-options', async (req: Request, res: Response) => {
  try {
    const statusOptions = [
      { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: 'yellow' },
      { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', color: 'blue' },
      { value: 'รอข้อมูลเพิ่มเติม', label: 'รอข้อมูลเพิ่มเติม', color: 'orange' },
      { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น', color: 'green' },
      { value: 'ยกเลิก', label: 'ยกเลิก', color: 'red' }
    ];

    res.json({
      success: true,
      statusOptions
    });
  } catch (error) {
    console.error('Get status options error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ'
    });
  }
})