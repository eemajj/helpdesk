import { Router, Request, Response } from 'express';
import { prisma } from '../db/connection';
import { authMiddleware, requireSupport } from '../middleware/auth';
import { websocketService } from '../services/websocketService';
import { invalidateTicketCache } from '../middleware/cache';

export const statusRoutes = Router();

// Get ticket status options
statusRoutes.get('/options', async (req: Request, res: Response) => {
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
});

// Update ticket status (Support/Admin only)
statusRoutes.put('/:ticketId/status', authMiddleware, requireSupport, async (req: Request, res: Response) => {
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
});

// Add comment to ticket (Support/Admin only)
statusRoutes.post('/:ticketId/comment', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { comment, isInternal = false } = req.body;
    const user = req.user!;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุความคิดเห็น'
      });
    }

    // Find ticket by ticketId
    const existingTicket = await prisma.ticket.findFirst({
      where: { ticketId }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลแจ้งปัญหา'
      });
    }

    // Add comment
    const newComment = await prisma.ticketComment.create({
      data: {
        ticketId: existingTicket.id,
        userId: user.userId,
        comment: comment.trim(),
        commentType: 'comment',
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

    // Create notification for relevant users (if not internal)
    if (!isInternal) {
      const notification = await prisma.notification.create({
        data: {
          title: `ความคิดเห็นใหม่`,
          message: `มีความคิดเห็นใหม่สำหรับแจ้งปัญหา ${ticketId}`,
          ticketId: existingTicket.id,
          userId: user.userId
        }
      });

      // Send real-time notification
      websocketService.sendToAdmins('new_notification', notification);
    }

    // Invalidate cache
    invalidateTicketCache();

    res.json({
      success: true,
      message: 'เพิ่มความคิดเห็นสำเร็จ',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น'
    });
  }
});