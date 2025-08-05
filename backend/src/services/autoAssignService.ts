import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Auto Assignment Service - Round Robin for Support Users Only
 * - Admins are excluded from auto assignment
 * - Support users can request to disable auto assignment
 * - Admins can manually assign tickets to anyone
 */
export class AutoAssignService {
  
  /**
   * Get next support user for round robin assignment
   * Excludes: admins, inactive users, users with auto_assign disabled
   */
  async getNextSupportUser(): Promise<any | null> {
    try {
      // Get all eligible support users (active, auto-assign enabled, not admin)
      const eligibleUsers = await prisma.user.findMany({
        where: {
          role: 'support',
          isActive: true,
          autoAssignEnabled: true
        },
        orderBy: [
          { lastAssignedAt: 'asc' }, // Users who haven't been assigned recently get priority
          { id: 'asc' } // Fallback to ID for consistent ordering
        ]
      });

      if (eligibleUsers.length === 0) {
        console.log('⚠️ No eligible support users for auto assignment');
        return null;
      }

      // Get the user who was assigned least recently (or never)
      const nextUser = eligibleUsers[0];

      // Update the last assigned timestamp
      await prisma.user.update({
        where: { id: nextUser.id },
        data: { lastAssignedAt: new Date() }
      });

      console.log(`✅ Auto-assigned to ${nextUser.fullName} (${nextUser.username})`);
      return nextUser;

    } catch (error) {
      console.error('❌ Error in auto assignment:', error);
      return null;
    }
  }

  /**
   * Assign ticket using round robin logic
   */
  async autoAssignTicket(ticketId: number): Promise<boolean> {
    try {
      const nextUser = await this.getNextSupportUser();
      
      if (!nextUser) {
        console.log(`⚠️ Cannot auto-assign ticket ${ticketId} - no eligible users`);
        return false;
      }

      // Update ticket with assignment
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          assignedToId: nextUser.id,
          status: 'กำลังดำเนินการ'
        }
      });

      // Create notification for assigned user
      await prisma.notification.create({
        data: {
          userId: nextUser.id,
          ticketId: ticketId,
          title: 'มีการมอบหมายงานใหม่',
          message: `คุณได้รับมอบหมายให้ดูแลงานใหม่ หมายเลข #${ticketId}`
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Error auto-assigning ticket:', error);
      return false;
    }
  }

  /**
   * Manual assignment by admin (can assign to anyone)
   */
  async manualAssignTicket(ticketId: number, assignToUserId: number, assignedByAdminId: number): Promise<boolean> {
    try {
      // Verify the assignee exists and is active
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignToUserId,
          isActive: true
        }
      });

      if (!assignee) {
        throw new Error('User not found or inactive');
      }

      // Update ticket
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          assignedToId: assignToUserId,
          status: 'กำลังดำเนินการ'
        }
      });

      // Create notification for assigned user
      await prisma.notification.create({
        data: {
          userId: assignToUserId,
          ticketId: ticketId,
          title: 'มีการมอบหมายงานใหม่',
          message: `ผู้ดูแลระบบได้มอบหมายงานใหม่ให้คุณ หมายเลข #${ticketId}`
        }
      });

      // Log the manual assignment
      await prisma.userActivity.create({
        data: {
          adminId: assignedByAdminId,
          userId: assignToUserId,
          action: 'manual_assign',
          targetType: 'ticket',
          targetId: ticketId.toString(),
          description: `Manual assignment of ticket #${ticketId} to ${assignee.fullName}`,
          metadata: JSON.stringify({ ticketId, assignedTo: assignToUserId })
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Error in manual assignment:', error);
      return false;
    }
  }

  /**
   * Request to disable/enable auto assignment (requires admin approval)
   */
  async requestAutoAssignToggle(userId: number, requestType: 'disable' | 'enable', reason?: string): Promise<boolean> {
    try {
      // Check if user has pending request
      const existingRequest = await prisma.autoAssignRequest.findFirst({
        where: {
          userId: userId,
          status: 'pending'
        }
      });

      if (existingRequest) {
        throw new Error('คุณมีคำขอที่รออนุมัติอยู่แล้ว');
      }

      // Create new request
      await prisma.autoAssignRequest.create({
        data: {
          userId: userId,
          requestType: requestType,
          reason: reason || '',
          status: 'pending'
        }
      });

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: 'admin', isActive: true }
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            ticketId: 0, // System notification
            title: 'คำขอเปลี่ยนแปลงสถานะ Auto Assign',
            message: `${user?.fullName} ขอ${requestType === 'disable' ? 'ปิด' : 'เปิด'}ระบบ Auto Assign`
          }
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error creating auto assign request:', error);
      throw error;
    }
  }

  /**
   * Approve/Reject auto assign request (admin only)
   */
  async processAutoAssignRequest(requestId: number, adminId: number, action: 'approved' | 'rejected', adminNotes?: string): Promise<boolean> {
    try {
      const request = await prisma.autoAssignRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request already processed');
      }

      // Update request status
      await prisma.autoAssignRequest.update({
        where: { id: requestId },
        data: {
          status: action,
          approvedBy: adminId,
          approvedAt: new Date(),
          adminNotes: adminNotes
        }
      });

      // If approved, update user's auto assign setting
      if (action === 'approved') {
        const newSetting = request.requestType === 'disable' ? false : true;
        
        await prisma.user.update({
          where: { id: request.userId },
          data: { autoAssignEnabled: newSetting }
        });
      }

      // Notify the requesting user
      await prisma.notification.create({
        data: {
          userId: request.userId,
          ticketId: 0,
          title: `คำขอ ${request.requestType === 'disable' ? 'ปิด' : 'เปิด'} Auto Assign ${action === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}`,
          message: action === 'approved' 
            ? `คำขอของคุณได้รับการอนุมัติแล้ว${adminNotes ? ': ' + adminNotes : ''}`
            : `คำขอของคุณไม่ได้รับการอนุมัติ${adminNotes ? ': ' + adminNotes : ''}`
        }
      });

      // Log admin activity
      await prisma.userActivity.create({
        data: {
          adminId: adminId,
          userId: request.userId,
          action: `auto_assign_${action}`,
          targetType: 'user',
          targetId: request.userId.toString(),
          description: `${action} auto assign ${request.requestType} request for ${request.user.fullName}`,
          metadata: JSON.stringify({ requestId, requestType: request.requestType, adminNotes })
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Error processing auto assign request:', error);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats() {
    try {
      const supportUsers = await prisma.user.findMany({
        where: { role: 'support', isActive: true },
        include: {
          assignedTickets: {
            where: {
              status: { not: 'เสร็จสิ้น' }
            }
          }
        }
      });

      return supportUsers.map(user => ({
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        autoAssignEnabled: user.autoAssignEnabled,
        activeTickets: user.assignedTickets.length,
        lastAssignedAt: user.lastAssignedAt
      }));

    } catch (error) {
      console.error('❌ Error getting assignment stats:', error);
      return [];
    }
  }
}

export const autoAssignService = new AutoAssignService();