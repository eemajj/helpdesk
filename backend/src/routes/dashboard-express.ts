import { Router, Request, Response } from 'express'
import { prisma } from '../db/connection'
import { authMiddleware, requireSupport } from '../middleware/auth'
import { ultraCache, ultraQueryCache, getCachedUsers } from '../middleware/ultraCache'

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         stats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: จำนวน tickets ทั้งหมด
 *               example: 150
 *             open:
 *               type: integer
 *               description: จำนวน tickets ที่รอดำเนินการ
 *               example: 25
 *             inProgress:
 *               type: integer
 *               description: จำนวน tickets ที่กำลังดำเนินการ
 *               example: 45
 *             resolved:
 *               type: integer
 *               description: จำนวน tickets ที่เสร็จสิ้นแล้ว
 *               example: 80
 *             totalUsers:
 *               type: integer
 *               description: จำนวนผู้ใช้ทั้งหมด (ไม่รวม admin)
 *               example: 50
 *     DashboardTickets:
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
 */

export const dashboardRoutes = Router()

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: ดึงข้อมูลสถิติสำหรับหน้า dashboard (รองรับ Ultra Cache)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สถิติ dashboard สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เกิดข้อผิดพลาดในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// ⚡ ULTRA OPTIMIZED Dashboard stats - ULTRA CACHED
dashboardRoutes.get('/stats', authMiddleware, requireSupport, 
  ultraQueryCache((req) => `dashboard_stats_${(req as any).user.role}`, 60), 
  async (req: Request, res: Response) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalUsers
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'รอดำเนินการ' } }),
      prisma.ticket.count({ where: { status: 'กำลังดำเนินการ' } }),
      prisma.ticket.count({ where: { status: 'เสร็จสิ้น' } }),
      prisma.user.count({ where: { role: { not: 'admin' } } })
    ])

    res.json({
      success: true,
      stats: {
        total: totalTickets,
        pending: openTickets,
        inProgress: inProgressTickets,
        completed: resolvedTickets,
        totalUsers
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
    })
  }
})

/**
 * @swagger
 * /dashboard/tickets:
 *   get:
 *     summary: Get recent tickets for dashboard
 *     description: ดึงรายการ tickets ล่าสุดสำหรับหน้า dashboard (รองรับ Ultra Cache)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: จำนวน tickets ที่ต้องการแสดง
 *     responses:
 *       200:
 *         description: รายการ tickets ล่าสุดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardTickets'
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เกิดข้อผิดพลาดในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// ⚡ ULTRA OPTIMIZED Recent tickets - ULTRA CACHED
dashboardRoutes.get('/tickets', authMiddleware, requireSupport, 
  ultraQueryCache((req) => `dashboard_tickets_${req.query.limit || 10}_${(req as any).user.role}`, 30), 
  async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const tickets = await prisma.ticket.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const formattedTickets = tickets.map((ticket: any) => ({
      id: ticket.id,
      ticket_id: ticket.ticketId,
      problem_type: ticket.problemType,
      problem_description: ticket.problemDescription,
      full_name: ticket.fullName,
      department: ticket.department,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.createdAt,
      assigned_to_name: ticket.assignedTo?.fullName || null
    }));

    res.json({
      success: true,
      tickets: formattedTickets
    })

  } catch (error) {
    console.error('Dashboard tickets error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลตั้วอย่าง'
    })
  }
})

// ⚡ ULTRA OPTIMIZED Notifications - ULTRA CACHED
dashboardRoutes.get('/notifications', authMiddleware, 
  ultraQueryCache((req) => `notifications_${(req as any).user.userId}_${req.query.limit || 10}`, 10), 
  async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: {
          select: { ticketId: true }
        }
      }
    });

    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification.id,
      user_id: notification.userId,
      ticket_id: notification.ticketId,
      title: notification.title,
      message: notification.message,
      is_read: notification.isRead,
      created_at: notification.createdAt,
      ticket: notification.ticket
    }));

    res.json({
      success: true,
      notifications: formattedNotifications
    });

  } catch (error) {
    console.error('Dashboard notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน'
    });
  }
});

// Mark a notification as read
dashboardRoutes.put('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId // Ensure user can only update their own notifications
      },
      data: { isRead: true }
    });

    if (updatedNotification.count === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found or access denied' });
    }

    res.json({ success: true, message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน'
    });
  }
});

// ⚡ ULTRA OPTIMIZED Users list - ULTRA CACHED
dashboardRoutes.get('/users', authMiddleware, requireSupport, 
  ultraQueryCache((req) => `admin_users_all`, 120), 
  async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    // ✅ ใช้ cached users แทนการ query ทุกครั้ง
    const userIds = await prisma.user.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const users = await getCachedUsers(userIds.map(u => u.id), prisma);

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      auto_assign_enabled: user.autoAssignEnabled,
      last_login: user.lastLogin,
      last_assigned_at: user.lastAssignedAt,
      created_at: user.createdAt
    }));

    res.json({
      success: true,
      users: formattedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })

  } catch (error) {
    console.error('Dashboard users error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    })
  }
})

// Auto assign ticket to support user
dashboardRoutes.post('/assign-ticket/:ticketId', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId)
    const user = (req as any).user

    // Only admin can manually assign tickets
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'เฉพาะ Admin เท่านั้นที่สามารถมอบหมายงานได้'
      })
    }

    // Import auto assign service
    const { autoAssignService } = await import('../services/autoAssignService')
    
    // Try to auto assign the ticket
    const result = await autoAssignService.autoAssignTicket(ticketId)
    
    if (result) {
      // Get updated ticket info
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTo: {
            select: {
              fullName: true,
              username: true
            }
          }
        }
      })

      res.json({
        success: true,
        message: 'มอบหมายงานสำเร็จ',
        ticket: updatedTicket
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'ไม่สามารถมอบหมายงานได้ ไม่มี Support ที่พร้อมรับงาน'
      })
    }

  } catch (error) {
    console.error('Auto assign ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการมอบหมายงาน'
    })
  }
})

// Manual assign ticket to specific user
dashboardRoutes.post('/assign-ticket/:ticketId/user/:userId', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId)
    const assignToUserId = parseInt(req.params.userId)
    const user = (req as any).user

    // Only admin can manually assign tickets
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'เฉพาะ Admin เท่านั้นที่สามารถมอบหมายงานได้'
      })
    }

    // Import auto assign service
    const { autoAssignService } = await import('../services/autoAssignService')
    
    // Manual assignment
    const result = await autoAssignService.manualAssignTicket(ticketId, assignToUserId, user.userId)
    
    if (result) {
      // Get updated ticket info
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTo: {
            select: {
              fullName: true,
              username: true
            }
          }
        }
      })

      res.json({
        success: true,
        message: 'มอบหมายงานสำเร็จ',
        ticket: updatedTicket
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'ไม่สามารถมอบหมายงานได้'
      })
    }

  } catch (error) {
    console.error('Manual assign ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการมอบหมายงาน'
    })
  }
})

// Update ticket status
dashboardRoutes.put('/tickets/:ticketId/status', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId)
    const { status, comment } = req.body
    const user = (req as any).user

    // Validate status
    const validStatuses = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'สถานะไม่ถูกต้อง'
      })
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status,
        updatedAt: new Date(),
        ...(status === 'เสร็จสิ้น' && { resolvedAt: new Date() })
      },
      include: {
        assignedTo: {
          select: {
            fullName: true,
            username: true
          }
        }
      }
    })

    // Add comment if provided
    if (comment && comment.trim()) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticketId,
          userId: user.userId,
          comment: comment.trim(),
          isInternal: false
        }
      })
    }

    // Create notification for ticket creator if resolved
    if (status === 'เสร็จสิ้น') {
      await prisma.notification.create({
        data: {
          userId: 1, // System notification to admin
          ticketId: ticketId,
          title: 'แจ้งปัญหาได้รับการแก้ไขแล้ว',
          message: `แจ้งปัญหา ${updatedTicket.ticketId} ได้รับการแก้ไขเรียบร้อยแล้ว`
        }
      })
    }

    // Invalidate cache
    const { invalidateTicketCache } = await import('../middleware/cache')
    invalidateTicketCache()

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Update ticket status error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
    })
  }
})

// Delete ticket (Admin only)
dashboardRoutes.delete('/tickets/:ticketId', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId)
    const user = (req as any).user

    // Only admin can delete tickets
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'เฉพาะ Admin เท่านั้นที่สามารถลบแจ้งปัญหาได้'
      })
    }

    // Soft delete by updating status
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status: 'ยกเลิก',
        updatedAt: new Date()
      }
    })

    // Invalidate cache
    const { invalidateTicketCache } = await import('../middleware/cache')
    invalidateTicketCache()

    res.json({
      success: true,
      message: 'ลบแจ้งปัญหาสำเร็จ'
    })

  } catch (error) {
    console.error('Delete ticket error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบแจ้งปัญหา'
    })
  }
})