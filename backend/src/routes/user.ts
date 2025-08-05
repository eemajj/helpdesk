import express from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import { autoAssignService } from '../services/autoAssignService';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Middleware to ensure support role
 */
const requireSupport = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'support') {
    return res.status(403).json({
      success: false,
      error: 'Support role required'
    });
  }
  next();
};

// Validation schemas
const autoAssignRequestSchema = z.object({
  requestType: z.enum(['disable', 'enable']),
  reason: z.string().max(500).optional()
});

/**
 * USER PROFILE ROUTES
 */

// GET /api/user/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        autoAssignEnabled: true,
        createdAt: true,
        lastLogin: true,
        lastAssignedAt: true,
        assignedTickets: {
          where: {
            status: { notIn: ['เสร็จสิ้น', 'ยกเลิก'] }
          },
          select: {
            id: true,
            ticketId: true,
            problemType: true,
            status: true,
            priority: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...user,
        activeTicketsCount: user.assignedTickets.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AUTO ASSIGN MANAGEMENT ROUTES (for Support users)
 */

// GET /api/user/auto-assign/status - Get current auto assign status
router.get('/auto-assign/status', authenticateToken, requireSupport, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        autoAssignEnabled: true,
        lastAssignedAt: true
      }
    });

    // Get pending request if any
    const pendingRequest = await prisma.autoAssignRequest.findFirst({
      where: {
        userId: req.user.userId,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        autoAssignEnabled: user?.autoAssignEnabled || false,
        lastAssignedAt: user?.lastAssignedAt,
        pendingRequest: pendingRequest ? {
          id: pendingRequest.id,
          requestType: pendingRequest.requestType,
          reason: pendingRequest.reason,
          createdAt: pendingRequest.createdAt
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/user/auto-assign/request - Request to toggle auto assign
router.post('/auto-assign/request', authenticateToken, requireSupport, async (req: any, res: any) => {
  try {
    const { requestType, reason } = autoAssignRequestSchema.parse(req.body);
    
    const success = await autoAssignService.requestAutoAssignToggle(
      req.user.userId,
      requestType,
      reason
    );

    if (success) {
      res.json({
        success: true,
        message: 'Auto assign request submitted successfully. Please wait for admin approval.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to submit request'
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/user/auto-assign/requests - Get user's auto assign requests history
router.get('/auto-assign/requests', authenticateToken, requireSupport, async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [requests, total] = await Promise.all([
      prisma.autoAssignRequest.findMany({
        where: { userId: req.user.userId },
        include: {
          approver: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.autoAssignRequest.count({ 
        where: { userId: req.user.userId } 
      })
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * TICKET MANAGEMENT ROUTES
 */

// GET /api/user/tickets - Get user's assigned tickets
router.get('/tickets', authenticateToken, async (req: any, res: any) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {
      assignedToId: req.user.userId
    };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          comments: {
            select: {
              id: true,
              comment: true,
              commentType: true,
              createdAt: true,
              user: {
                select: {
                  fullName: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 3 // Get last 3 comments for preview
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              originalFilename: true,
              uploadedAt: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/user/notifications - Get user notifications
router.get('/notifications', authenticateToken, async (req: any, res: any) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {
      userId: req.user.userId
    };

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          ticket: {
            select: {
              ticketId: true,
              problemType: true,
              status: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        },
        unreadCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/user/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req: any, res: any) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user.userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/user/notifications/mark-all-read - Mark all notifications as read
router.post('/notifications/mark-all-read', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DASHBOARD STATS FOR USERS
 */

// GET /api/user/stats - Get user dashboard statistics
router.get('/stats', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const [
      totalAssigned,
      activeTickets,
      completedTickets,
      pendingTickets,
      inProgressTickets,
      recentActivity
    ] = await Promise.all([
      // Total tickets ever assigned
      prisma.ticket.count({
        where: { assignedToId: userId }
      }),
      // Active tickets (not completed/cancelled)
      prisma.ticket.count({
        where: {
          assignedToId: userId,
          status: { notIn: ['เสร็จสิ้น', 'ยกเลิก'] }
        }
      }),
      // Completed tickets
      prisma.ticket.count({
        where: {
          assignedToId: userId,
          status: 'เสร็จสิ้น'
        }
      }),
      // Pending tickets
      prisma.ticket.count({
        where: {
          assignedToId: userId,
          status: 'รอดำเนินการ'
        }
      }),
      // In progress tickets
      prisma.ticket.count({
        where: {
          assignedToId: userId,
          status: 'กำลังดำเนินการ'
        }
      }),
      // Recent ticket activity (last 7 days)
      prisma.ticket.count({
        where: {
          assignedToId: userId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        tickets: {
          total: totalAssigned,
          active: activeTickets,
          completed: completedTickets,
          pending: pendingTickets,
          inProgress: inProgressTickets
        },
        activity: {
          recentActivity
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as userRoutes };