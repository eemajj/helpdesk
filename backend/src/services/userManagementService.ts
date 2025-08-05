import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * User Management Service - Complete CRUD operations with role-based access
 * - Admin can create, update, suspend, delete users
 * - All actions are logged for audit trail
 * - Password management with secure hashing
 */
export class UserManagementService {

  /**
   * Create new user (Admin only)
   */
  async createUser(adminId: number, userData: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    role: 'admin' | 'support' | 'user';
  }) {
    try {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Check if email already exists (if provided)
      if (userData.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          username: userData.username,
          passwordHash: passwordHash,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          isActive: true,
          autoAssignEnabled: userData.role === 'support' // Only support users get auto-assign by default
        }
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: newUser.id,
          action: 'create',
          targetType: 'user',
          targetId: newUser.id.toString(),
          description: `Created new ${userData.role} user: ${userData.fullName} (${userData.username})`,
          metadata: JSON.stringify({ 
            role: userData.role, 
            email: userData.email,
            autoAssignEnabled: userData.role === 'support'
          })
        }
      });

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user information (Admin only)
   */
  async updateUser(adminId: number, userId: number, updateData: {
    fullName?: string;
    email?: string;
    role?: 'admin' | 'support' | 'user';
    autoAssignEnabled?: boolean;
  }) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check email uniqueness if being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: userId,
          action: 'update',
          targetType: 'user',
          targetId: userId.toString(),
          description: `Updated user: ${updatedUser.fullName} (${updatedUser.username})`,
          metadata: JSON.stringify({ 
            changes: updateData,
            previousData: {
              fullName: existingUser.fullName,
              email: existingUser.email,
              role: existingUser.role,
              autoAssignEnabled: existingUser.autoAssignEnabled
            }
          })
        }
      });

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;

    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Suspend/Activate user (Admin only)
   */
  async toggleUserStatus(adminId: number, userId: number, isActive: boolean) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Cannot suspend yourself
      if (userId === adminId) {
        throw new Error('Cannot suspend your own account');
      }

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: isActive,
          updatedAt: new Date()
        }
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: userId,
          action: isActive ? 'activate' : 'suspend',
          targetType: 'user',
          targetId: userId.toString(),
          description: `${isActive ? 'Activated' : 'Suspended'} user: ${updatedUser.fullName} (${updatedUser.username})`,
          metadata: JSON.stringify({ 
            previousStatus: existingUser.isActive,
            newStatus: isActive
          })
        }
      });

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;

    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Reset user password (Admin only)
   */
  async resetUserPassword(adminId: number, userId: number, newPassword: string) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { 
          passwordHash: passwordHash,
          updatedAt: new Date()
        }
      });

      // Log activity (don't include password in metadata for security)
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: userId,
          action: 'password_reset',
          targetType: 'user',
          targetId: userId.toString(),
          description: `Reset password for user: ${existingUser.fullName} (${existingUser.username})`,
          metadata: JSON.stringify({ 
            resetAt: new Date().toISOString()
          })
        }
      });

      return { success: true, message: 'Password reset successfully' };

    } catch (error) {
      console.error('❌ Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Delete user (Admin only) - Soft delete by setting inactive
   */
  async deleteUser(adminId: number, userId: number) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assignedTickets: {
            where: {
              status: { notIn: ['เสร็จสิ้น', 'ยกเลิก'] }
            }
          }
        }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Cannot delete yourself
      if (userId === adminId) {
        throw new Error('Cannot delete your own account');
      }

      // Check for active assigned tickets
      if (existingUser.assignedTickets.length > 0) {
        throw new Error(`Cannot delete user with ${existingUser.assignedTickets.length} active assigned tickets`);
      }

      // Soft delete by setting inactive and appending timestamp to username
      const timestamp = Date.now();
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          username: `${existingUser.username}_deleted_${timestamp}`,
          email: existingUser.email ? `${existingUser.email}_deleted_${timestamp}` : null,
          updatedAt: new Date()
        }
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: userId,
          action: 'delete',
          targetType: 'user',
          targetId: userId.toString(),
          description: `Deleted user: ${existingUser.fullName} (${existingUser.username})`,
          metadata: JSON.stringify({ 
            originalUsername: existingUser.username,
            originalEmail: existingUser.email,
            deletedAt: new Date().toISOString()
          })
        }
      });

      return { success: true, message: 'User deleted successfully' };

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(filters: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { role, isActive, search, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      
      if (role) whereClause.role = role;
      if (isActive !== undefined) whereClause.isActive = isActive;
      if (search) {
        whereClause.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            autoAssignEnabled: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            lastAssignedAt: true,
            assignedTickets: {
              where: {
                status: { notIn: ['เสร็จสิ้น', 'ยกเลิก'] }
              },
              select: { id: true }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      // Add active tickets count
      const usersWithStats = users.map(user => ({
        ...user,
        activeTicketsCount: user.assignedTickets.length,
        assignedTickets: undefined // Remove the full array, keep only count
      }));

      return {
        users: usersWithStats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(filters: {
    userId?: number;
    adminId?: number;
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { userId, adminId, action, targetType, page = 1, limit = 50 } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      
      if (userId) whereClause.userId = userId;
      if (adminId) whereClause.adminId = adminId;
      if (action) whereClause.action = action;
      if (targetType) whereClause.targetType = targetType;

      const [activities, total] = await Promise.all([
        prisma.userActivity.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            },
            admin: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.userActivity.count({ where: whereClause })
      ]);

      return {
        activities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error getting activity logs:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const [totalUsers, activeUsers, adminCount, supportCount, userCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'admin', isActive: true } }),
        prisma.user.count({ where: { role: 'support', isActive: true } }),
        prisma.user.count({ where: { role: 'user', isActive: true } })
      ]);

      return {
        totalUsers,
        activeUsers,
        suspendedUsers: totalUsers - activeUsers,
        roles: {
          admin: adminCount,
          support: supportCount,
          user: userCount
        }
      };

    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();