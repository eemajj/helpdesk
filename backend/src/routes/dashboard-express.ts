import { Router, Request, Response } from 'express'
import { prisma } from '../db/connection'
import { authMiddleware, requireSupport } from '../middleware/auth'

export const dashboardRoutes = Router()

// Dashboard stats
dashboardRoutes.get('/stats', authMiddleware, requireSupport, async (req: Request, res: Response) => {
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

// Recent tickets
dashboardRoutes.get('/tickets', authMiddleware, requireSupport, async (req: Request, res: Response) => {
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

// Get notifications for the logged-in user
dashboardRoutes.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      notifications
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

// Get all users for admin dashboard
dashboardRoutes.get('/users', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      users
    })

  } catch (error) {
    console.error('Dashboard users error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    })
  }
})