export interface Ticket {
  id: number;
  ticket_id: string;
  problem_type: string;
  problem_description: string;
  full_name: string;
  department: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to_name?: string;
}

export interface SearchTicket {
  id: number;
  ticketId: string;
  problemType: string;
  problemDescription: string;
  fullName: string;
  department: string;
  division?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: {
    fullName: string;
  };
  resolvedAt?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}