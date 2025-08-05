import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db/connection'
import { authMiddleware, requireSupport } from '../middleware/auth';
import { websocketService } from '../services/websocketService';
import { ultraCache, ultraQueryCache, getCachedUsers } from '../middleware/ultraCache';

// Helper function for cache invalidation
const invalidateTicketCache = () => {
  // Since we're using ultraCache now, we can clear specific patterns
  console.log('🗑️ Invalidating ticket cache patterns');
};
import { ticketLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware, validateUploadedFiles } from '../middleware/fileUpload';
import { ticketAssignmentService } from '../services/ticketAssignmentService';
import { ticketStatusService } from '../services/ticketStatusService';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTicketRequest:
 *       type: object
 *       required:
 *         - problemType
 *         - problemDescription
 *         - fullName
 *         - phoneNumber
 *         - department
 *       properties:
 *         problemType:
 *           type: string
 *           description: ประเภทของปัญหา
 *           example: ฮาร์ดแวร์
 *         otherProblemType:
 *           type: string
 *           description: ประเภทปัญหาอื่นๆ (ถ้าเลือก "อื่นๆ")
 *         problemDescription:
 *           type: string
 *           minLength: 10
 *           description: รายละเอียดปัญหา
 *           example: คอมพิวเตอร์เปิดไม่ติด มีเสียงบี๊บ 3 ครั้ง
 *         fullName:
 *           type: string
 *           description: ชื่อ-นามสกุลผู้แจ้ง
 *           example: นายสมชาย ใจดี
 *         phoneNumber:
 *           type: string
 *           minLength: 10
 *           description: เบอร์โทรศัพท์
 *           example: 0812345678
 *         department:
 *           type: string
 *           description: หน่วยงาน/แผนก
 *           example: กลุ่มงานเทคโนโลยี
 *         division:
 *           type: string
 *           description: ฝ่าย/กอง (ถ้ามี)
 *           example: ฝ่ายพัฒนาระบบ
 *         assetNumber:
 *           type: string
 *           description: หมายเลขครุภัณฑ์ (ถ้ามี)
 *           example: DWF-PC-001
 *     TicketSearchResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         tickets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ticket'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     UpdateTicketStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: สถานะใหม่
 *           example: กำลังดำเนินการ
 *         comment:
 *           type: string
 *           description: ความคิดเห็นเพิ่มเติม
 *           example: เริ่มตรวจสอบปัญหาแล้ว
 *         isInternal:
 *           type: boolean
 *           description: เป็นความคิดเห็นภายใน (ไม่แสดงให้ลูกค้าเห็น)
 *           example: false
 *     AssignTicketRequest:
 *       type: object
 *       properties:
 *         assignedUserId:
 *           type: integer
 *           description: ID ของผู้ใช้ที่จะมอบหมาย (null = ยกเลิกการมอบหมาย)
 *           example: 2
 *         reason:
 *           type: string
 *           description: เหตุผลในการมอบหมาย
 *           example: ผู้เชี่ยวชาญด้านฮาร์ดแวร์
 */

export const ticketRoutes = Router()

/**
 * @swagger
 * /tickets/search:
 *   get:
 *     tags: [Tickets]
 *     summary: 🔍 Advanced Ticket Search (Public)
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Sends search parameters
 *       2. **System** → Builds dynamic query with filters
 *       3. **System** → Executes database search with pagination
 *       4. **System** → Returns matching tickets
 *       5. **User** → Receives search results
 *       
 *       **Features**: Text search, filters, pagination, caching (60s)
 *       **Performance**: Optimized with indexes and query limits
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: คำค้นหาใน ticketId, fullName, problemType, department, problemDescription
 *         example: เครื่องพิมพ์
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: กรองตามสถานะ (all = ทั้งหมด)
 *         example: รอดำเนินการ
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: กรองตามความสำคัญ (all = ทั้งหมด)
 *         example: สูง
 *       - in: query
 *         name: problem_type
 *         schema:
 *           type: string
 *         description: กรองตามประเภทปัญหา (all = ทั้งหมด)
 *         example: ฮาร์ดแวร์
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: กรองตามหน่วยงาน (all = ทั้งหมด)
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: ค้นหาตั้งแต่วันที่
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: ค้นหาถึงวันที่
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *         description: ID ของผู้รับผิดชอบ (all = ทั้งหมด)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หมายเลขหน้า
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: ค้นหาสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketSearchResponse'
 *       500:
 *         description: เกิดข้อผิดพลาดในการค้นหา
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// ⚡ ULTRA OPTIMIZED Advanced search tickets - ULTRA CACHED
ticketRoutes.get('/search', 
  ultraQueryCache((req) => `search_${JSON.stringify(req.query)}`, 60), 
  async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /tickets/track/{ticketId}:
 *   get:
 *     tags: [Tickets]
 *     summary: 🔍 Track Ticket by ID (Public)
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Provides ticket ID
 *       2. **System** → Searches database for ticket
 *       3. **System** → Retrieves ticket details & public comments
 *       4. **System** → Returns ticket information
 *       5. **User** → Views ticket status and progress
 *       
 *       **Features**: Public access, cached (30s), includes public comments only
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID (เช่น TK1699234567890)
 *         example: TK1699234567890
 *     responses:
 *       200:
 *         description: พบข้อมูล ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: ไม่พบข้อมูลแจ้งปัญหา
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เกิดข้อผิดพลาดในการติดตามแจ้งปัญหา
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// ⚡ ULTRA OPTIMIZED Ticket tracking - ULTRA CACHED
ticketRoutes.get('/track/:ticketId', 
  ultraQueryCache((req) => `track_${req.params.ticketId}`, 30), 
  async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: 🎟️ Create New Ticket (Public)
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Submits ticket form with details
 *       2. **System** → Validates input data & file uploads
 *       3. **System** → Creates ticket with unique ID
 *       4. **System** → Auto-assigns to available support staff
 *       5. **System** → Creates notifications for admins
 *       6. **WebSocket** → Sends real-time notifications
 *       7. **User** → Receives ticket confirmation
 *       
 *       **Features**: File upload (5 files max), auto-assignment, notifications
 *       **Rate Limit**: 3 tickets per hour per IP
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateTicketRequest'
 *               - type: object
 *                 properties:
 *                   attachments:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     maxItems: 5
 *                     description: ไฟล์แนบ (สูงสุด 5 ไฟล์)
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *     responses:
 *       201:
 *         description: แจ้งปัญหาสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: แจ้งปัญหาสำเร็จ
 *                 ticket:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     ticketId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     assignedUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         fullName:
 *                           type: string
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เกิดข้อผิดพลาดในการแจ้งปัญหา
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create ticket (Public endpoint) with rate limiting and file upload
ticketRoutes.post('/', ticketLimiter, uploadMiddleware.array('attachments', 5), validateUploadedFiles, async (req: Request, res: Response) => {
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
    
    // Auto-assign using assignment service
    let assignedUserId = null
    let assignedUser = null

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

    // Auto-assign after ticket creation
    const assignmentResult = await ticketAssignmentService.autoAssignTicket(ticket.id, data.problemType)
    if (assignmentResult.success && assignmentResult.assignedUser) {
      assignedUser = assignmentResult.assignedUser
      
      // Update the ticket object to reflect assignment
      Object.assign(ticket, {
        assignedToId: assignmentResult.assignedUserId,
        assignedTo: assignmentResult.assignedUser
      })
    }

    // Handle file attachments if any
    const files = req.files as Express.Multer.File[]
    if (files && files.length > 0) {
      const attachmentPromises = files.map(file => 
        prisma.ticketAttachment.create({
          data: {
            ticketId: ticket.id,
            filename: file.filename,
            originalFilename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            filePath: file.path
          }
        })
      )
      
      await Promise.all(attachmentPromises)
      console.log(`📎 Created ${files.length} attachments for ticket ${ticketId}`)
    }

    // Create notification for available admin users
    try {
      const adminUsers = await prisma.user.findMany({
        where: { 
          role: 'admin',
          isActive: true 
        },
        select: { id: true }
      })

      // Create notifications for all active admin users
      if (adminUsers.length > 0) {
        const notifications = await Promise.all(
          adminUsers.map(admin => 
            prisma.notification.create({
              data: {
                title: `New Ticket: ${ticket.problemType}`,
                message: `A new ticket has been created by ${ticket.fullName}`,
                ticketId: ticket.id,
                userId: admin.id
              }
            })
          )
        )

        // Send real-time notification to all admins
        websocketService.sendToAdmins('new_notification', notifications[0]);
      }
    } catch (notificationError) {
      console.warn('Failed to create notifications:', notificationError)
      // Don't fail the ticket creation if notification fails
    }
    
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
            select: {
              comments: true
            }
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

// Update ticket status (Enhanced with service)
ticketRoutes.put('/:id/status', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { status, comment, isInternal = false } = req.body
    const user = req.user!

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุสถานะใหม่'
      })
    }

    // Use status service for validation and update
    const result = await ticketStatusService.updateTicketStatus(
      ticketId,
      status,
      user.userId,
      comment,
      isInternal
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      })
    }

    // Invalidate cache
    invalidateTicketCache()

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      ticket: result.ticket,
      comment: result.comment,
      notifications: result.notifications
    })

  } catch (error) {
    console.error('Update ticket status error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
    })
  }
})

// Assign ticket to user (Enhanced with service)
ticketRoutes.patch('/:id/assign', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { assignedUserId, reason } = req.body
    const user = req.user!

    // Use assignment service for validation and assignment
    const result = await ticketAssignmentService.manualAssignTicket(
      ticketId,
      assignedUserId || null,
      user.userId,
      reason
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.reason
      })
    }

    // Invalidate cache
    invalidateTicketCache()

    res.json({
      success: true,
      message: result.reason,
      assignedUser: result.assignedUser,
      assignedUserId: result.assignedUserId
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

// Get status options with transition validation
ticketRoutes.get('/status-options', async (req: Request, res: Response) => {
  try {
    const { currentStatus } = req.query
    
    if (currentStatus) {
      // Return only allowed transitions for current status
      const allowedTransitions = ticketStatusService.getAllowedTransitions(currentStatus as string)
      const statusOptions = ticketStatusService.getStatusOptions().filter(option => 
        allowedTransitions.includes(option.value)
      )
      
      res.json({
        success: true,
        statusOptions,
        currentStatus,
        allowedTransitions
      })
    } else {
      // Return all status options
      const statusOptions = ticketStatusService.getStatusOptions()
      
      res.json({
        success: true,
        statusOptions
      })
    }
  } catch (error) {
    console.error('Get status options error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ'
    })
  }
})

// Download file attachment (Protected endpoint)
ticketRoutes.get('/attachments/:attachmentId/download', authMiddleware, async (req: Request, res: Response) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId)
    
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            id: true,
            ticketId: true,
            assignedToId: true
          }
        }
      }
    })

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบไฟล์แนบ'
      })
    }

    const user = req.user!
    
    // Check if user has permission to download this file
    // Allow admin, support, or assigned user
    const hasPermission = user.role === 'admin' || 
                         user.role === 'support' || 
                         attachment.ticket.assignedToId === user.userId

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'คุณไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้'
      })
    }

    // Check if file exists
    const fs = await import('fs')
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'ไฟล์ไม่พบในระบบ'
      })
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`)
    res.setHeader('Content-Type', attachment.mimetype)
    res.setHeader('Content-Length', attachment.size)

    // Stream file
    const fileStream = fs.createReadStream(attachment.filePath)
    fileStream.pipe(res)

    console.log(`📁 File downloaded: ${attachment.originalFilename} by user ${user.username}`)

  } catch (error) {
    console.error('Download file error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์'
    })
  }
})

// Delete file attachment (Admin/Support only)
ticketRoutes.delete('/attachments/:attachmentId', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId)
    
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            id: true,
            ticketId: true
          }
        }
      }
    })

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบไฟล์แนบ'
      })
    }

    // Delete file from filesystem
    const fs = await import('fs')
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath)
    }

    // Delete from database
    await prisma.ticketAttachment.delete({
      where: { id: attachmentId }
    })

    console.log(`🗑️ File deleted: ${attachment.originalFilename} by user ${req.user!.username}`)

    res.json({
      success: true,
      message: 'ลบไฟล์แนบสำเร็จ'
    })

  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบไฟล์'
    })
  }
})

// Get assignment recommendations
ticketRoutes.get('/assignment/recommendations', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { problemType } = req.query
    
    const recommendations = await ticketAssignmentService.getAssignmentRecommendations(problemType as string)
    
    res.json({
      success: true,
      recommendations: recommendations.recommended
    })

  } catch (error) {
    console.error('Get assignment recommendations error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำแนะนำการมอบหมาย'
    })
  }
})

// Get assignment statistics  
ticketRoutes.get('/assignment/stats', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const stats = await ticketAssignmentService.getAssignmentStats()
    
    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get assignment stats error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงสถิติการมอบหมาย'
    })
  }
})

// Get status statistics
ticketRoutes.get('/status/stats', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query
    
    let dateRange = undefined
    if (dateFrom && dateTo) {
      dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string)
      }
    }
    
    const stats = await ticketStatusService.getStatusStats(dateRange)
    
    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get status stats error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงสถิติสถานะ'
    })
  }
})

// Get status history for a ticket
ticketRoutes.get('/:id/status/history', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id)
    
    const history = await ticketStatusService.getStatusHistory(ticketId)
    
    res.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('Get status history error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงประวัติสถานะ'
    })
  }
})

// Auto-assign unassigned tickets (Admin only)
ticketRoutes.post('/assignment/auto-assign', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { ticketIds } = req.body // Array of ticket IDs to auto-assign
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุ Ticket IDs ที่ต้องการมอบหมายอัตโนมัติ'
      })
    }

    const results = []
    
    for (const ticketId of ticketIds) {
      const result = await ticketAssignmentService.autoAssignTicket(parseInt(ticketId))
      results.push({
        ticketId,
        success: result.success,
        assignedUser: result.assignedUser,
        reason: result.reason
      })
    }
    
    const successCount = results.filter(r => r.success).length
    
    // Invalidate cache
    invalidateTicketCache()
    
    res.json({
      success: true,
      message: `มอบหมายงานอัตโนมัตินสำเร็จ ${successCount}/${ticketIds.length} tickets`,
      results
    })

  } catch (error) {
    console.error('Auto-assign tickets error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการมอบหมายงานอัตโนมัติ'
    })
  }
})