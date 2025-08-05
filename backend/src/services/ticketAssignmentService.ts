import { autoAssignService } from './autoAssignService';

/**
 * Legacy Ticket Assignment Service - Now redirects to AutoAssignService
 * @deprecated Use autoAssignService directly for new implementations
 */
export class TicketAssignmentService {
  
  /**
   * Auto assign ticket to support staff using round-robin
   * @deprecated Use autoAssignService.autoAssignTicket instead
   */
  async autoAssignTicket(ticketId: number): Promise<boolean> {
    console.warn('TicketAssignmentService.autoAssignTicket is deprecated. Use autoAssignService.autoAssignTicket instead');
    return await autoAssignService.autoAssignTicket(ticketId);
  }

  /**
   * Manual assignment (for admin use)
   * @deprecated Use autoAssignService.manualAssignTicket instead
   */
  async manualAssignTicket(ticketId: number, assignedToId: number, adminId: number = 0): Promise<boolean> {
    console.warn('TicketAssignmentService.manualAssignTicket is deprecated. Use autoAssignService.manualAssignTicket instead');
    return await autoAssignService.manualAssignTicket(ticketId, assignedToId, adminId);
  }

  /**
   * Get assignment statistics
   * @deprecated Use autoAssignService.getAssignmentStats instead
   */
  async getAssignmentStats() {
    console.warn('TicketAssignmentService.getAssignmentStats is deprecated. Use autoAssignService.getAssignmentStats instead');
    return await autoAssignService.getAssignmentStats();
  }
}

export const ticketAssignmentService = new TicketAssignmentService();