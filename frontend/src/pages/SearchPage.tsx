import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdvancedSearch from '../components/AdvancedSearch';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  TicketIcon, 
  UserIcon, 
  CalendarIcon, 
  ClockIcon,
  FileTextIcon,
  DownloadIcon
} from 'lucide-react';

interface SearchFilters {
  keyword: string;
  status: string;
  priority: string;
  problemType: string;
  department: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}

interface Ticket {
  id: number;
  ticket_id: string;
  problem_type: string;
  problem_description: string;
  full_name: string;
  department: string;
  division: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  resolved_at?: string;
}

const SearchPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { lastTicketUpdate } = useWebSocket();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  // Interceptor เพื่อจัดการ token หมดอายุ
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  const searchTickets = async (filters: SearchFilters, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // เพิ่มพารามิเตอร์การค้นหา
      if (filters.keyword) params.append('search', filters.keyword);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.problemType) params.append('problem_type', filters.problemType);
      if (filters.department) params.append('department', filters.department);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.assignedTo) params.append('assigned_to', filters.assignedTo);
      
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/tickets/search?${params.toString()}`);
      
      if (response.data.success) {
        setTickets(response.data.tickets);
        setPagination(response.data.pagination);
        setCurrentFilters(filters);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.response?.status !== 401) {
        toast.error('เกิดข้อผิดพลาดในการค้นหา');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    searchTickets(filters, 1);
  };

  const handleReset = () => {
    setTickets([]);
    setCurrentFilters(null);
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
  };

  const handlePageChange = (page: number) => {
    if (currentFilters) {
      searchTickets(currentFilters, page);
    }
  };

  // อัปเดต tickets เมื่อมี real-time update
  useEffect(() => {
    if (lastTicketUpdate && currentFilters) {
      setTickets(prev => prev.map(ticket => 
        ticket.ticket_id === lastTicketUpdate.ticket_id 
          ? { ...ticket, status: lastTicketUpdate.status, updated_at: lastTicketUpdate.updated_at }
          : ticket
      ));
    }
  }, [lastTicketUpdate, currentFilters]);

  const exportResults = async () => {
    if (!currentFilters) {
      toast.error('กรุณาค้นหาข้อมูลก่อนส่งออก');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (currentFilters.keyword) params.append('search', currentFilters.keyword);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.priority) params.append('priority', currentFilters.priority);
      if (currentFilters.problemType) params.append('problem_type', currentFilters.problemType);
      if (currentFilters.department) params.append('department', currentFilters.department);
      if (currentFilters.dateFrom) params.append('date_from', currentFilters.dateFrom);
      if (currentFilters.dateTo) params.append('date_to', currentFilters.dateTo);
      params.append('export', 'csv');

      const response = await api.get(`/tickets/search?${params.toString()}`, {
        responseType: 'blob'
      });

      // สร้าง blob และดาวน์โหลด
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ส่งออกข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'รอดำเนินการ': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'กำลังดำเนินการ': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'รอข้อมูลเพิ่มเติม': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'เสร็จสิ้น': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'วิกฤต': return 'text-red-600 dark:text-red-400';
      case 'สูง': return 'text-orange-600 dark:text-orange-400';
      case 'ปกติ': return 'text-blue-600 dark:text-blue-400';
      case 'ต่ำ': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ค้นหา Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ค้นหาและกรอง Tickets ด้วยเครื่องมือขั้นสูง
          </p>
        </div>

        {/* Search Component */}
        <AdvancedSearch
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          results={pagination.total}
        />

        {/* Results */}
        {currentFilters && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ผลการค้นหา
                </h2>
                {pagination.total > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    แสดง {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total.toLocaleString()} รายการ
                  </span>
                )}
              </div>

              {/* Export Button */}
              {tickets.length > 0 && (
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>ส่งออก CSV</span>
                </button>
              )}
            </div>

            {/* Results List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังค้นหา...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <FileTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  ไม่พบผลการค้นหา
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <TicketIcon className="h-5 w-5 text-primary-500" />
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {ticket.ticket_id}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {ticket.problem_type}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {ticket.problem_description}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                          <span className="flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {ticket.full_name}
                          </span>
                          <span>{ticket.department} - {ticket.division}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {ticket.assigned_to_name && (
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium mr-2">ผู้รับผิดชอบ:</span>
                            <span>{ticket.assigned_to_name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <CalendarIcon className="h-3 w-3 mr-2" />
                          <span>อัปเดตล่าสุด: {new Date(ticket.updated_at).toLocaleDateString('th-TH')}</span>
                        </div>

                        {ticket.resolved_at && (
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <ClockIcon className="h-3 w-3 mr-2" />
                            <span>แก้ไขเสร็จ: {new Date(ticket.resolved_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  ก่อนหน้า
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;