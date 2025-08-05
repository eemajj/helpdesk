import { prisma } from '../db/connection';

const STATUS_OPTIONS = [
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ' },
    { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ' },
    { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น' },
    { value: 'ยกเลิก', label: 'ยกเลิก' },
];

export const ticketStatusService = {
    getStatusOptions: () => STATUS_OPTIONS,
    getAllowedTransitions: (currentStatus: string) => STATUS_OPTIONS.map(s => s.value),

    async getStatusStats(dateRange?: { from: Date; to: Date }) {
        return [];
    },

    async updateTicketStatus(ticketId: number, newStatus: string, userId: number, comment?: string, isInternal?: boolean) {
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: newStatus }
        });
        return { success: true, error: null, ticket: ticket, comment: null, notifications: [] };
    },

    async getStatusHistory(ticketId: number) {
        return [];
    }
};