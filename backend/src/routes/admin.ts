import express from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import { autoAssignService } from '../services/autoAssignService';
import { userManagementService } from '../services/userManagementService';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Middleware to ensure admin role
 */
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'support', 'user'])
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'support', 'user']).optional(),
  autoAssignEnabled: z.boolean().optional()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6)
});

/**
 * USER MANAGEMENT ROUTES
 */

// GET /api/admin/users - Get all users with filtering
router.get('/users', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { role, isActive, search, page, limit } = req.query;
    
    const result = await userManagementService.getUsers({
      role: role as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    const newUser = await userManagementService.createUser(
      req.user.userId,
      validatedData
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
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

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const validatedData = updateUserSchema.parse(req.body);
    
    const updatedUser = await userManagementService.updateUser(
      req.user.userId,
      userId,
      validatedData
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
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

// PATCH /api/admin/users/:id/status - Toggle user active status
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean'
      });
    }

    const updatedUser = await userManagementService.toggleUserStatus(
      req.user.userId,
      userId,
      isActive
    );

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = resetPasswordSchema.parse(req.body);
    
    const result = await userManagementService.resetUserPassword(
      req.user.userId,
      userId,
      newPassword
    );

    res.json({
      success: true,
      message: result.message
    });
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

// DELETE /api/admin/users/:id - Delete user (soft delete)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    
    const result = await userManagementService.deleteUser(
      req.user.userId,
      userId
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AUTO ASSIGN MANAGEMENT ROUTES
 */

// GET /api/admin/auto-assign/stats - Get assignment statistics
router.get('/auto-assign/stats', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const stats = await autoAssignService.getAssignmentStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/tickets/:id/assign - Manual ticket assignment
router.post('/tickets/:id/assign', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { assignToUserId } = req.body;
    
    if (!assignToUserId) {
      return res.status(400).json({
        success: false,
        error: 'assignToUserId is required'
      });
    }

    const success = await autoAssignService.manualAssignTicket(
      ticketId,
      assignToUserId,
      req.user.userId
    );

    if (success) {
      res.json({
        success: true,
        message: 'Ticket assigned successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to assign ticket'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/auto-assign/requests - Get auto assign requests
router.get('/auto-assign/requests', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [requests, total] = await Promise.all([
      prisma.autoAssignRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true
            }
          },
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
      prisma.autoAssignRequest.count({ where: whereClause })
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

// POST /api/admin/auto-assign/requests/:id/process - Approve/Reject auto assign request
router.post('/auto-assign/requests/:id/process', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const requestId = parseInt(req.params.id);
    const { action, adminNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "approved" or "rejected"'
      });
    }

    const success = await autoAssignService.processAutoAssignRequest(
      requestId,
      req.user.userId,
      action,
      adminNotes
    );

    if (success) {
      res.json({
        success: true,
        message: `Request ${action} successfully`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process request'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ACTIVITY LOGS & STATISTICS
 */

// GET /api/admin/activity-logs - Get user activity logs
router.get('/activity-logs', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { userId, adminId, action, targetType, page, limit } = req.query;
    
    const result = await userManagementService.getUserActivityLogs({
      userId: userId ? parseInt(userId as string) : undefined,
      adminId: adminId ? parseInt(adminId as string) : undefined,
      action: action as string,
      targetType: targetType as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const userStats = await userManagementService.getUserStats();
    const assignmentStats = await autoAssignService.getAssignmentStats();
    
    // Get pending auto assign requests count
    const pendingRequests = await prisma.autoAssignRequest.count({
      where: { status: 'pending' }
    });

    res.json({
      success: true,
      data: {
        users: userStats,
        assignments: assignmentStats,
        pendingRequests
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as adminRoutes };