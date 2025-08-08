import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdvancedSearch from '../components/AdvancedSearch';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock,
  Download,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCcw,
  Eye,
  ArrowLeft,
  Loader2,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Award,
  AlertCircle,
  Ticket,
  Building,
  Shield,
  CheckCircle,
  XCircle
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

const SearchPage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { lastTicketUpdate } = useWebSocket();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // TODO: Implement virtualization for large lists
  // const { visibleItems, handleScroll, totalHeight } = useVirtualization(tickets, {
  //   itemHeight: 80,
  //   containerHeight: 600,
  //   overscan: 5
  // });
  
  // TODO: Implement filtered tickets for performance
  // const filteredTickets = useMemo(() => {
  //   if (!debouncedSearchKeyword) return tickets;
  //   return tickets.filter(ticket => 
  //     ticket.ticketId.toLowerCase().includes(debouncedSearchKeyword.toLowerCase()) ||
  //     ticket.fullName.toLowerCase().includes(debouncedSearchKeyword.toLowerCase()) ||
  //     ticket.problemType.toLowerCase().includes(debouncedSearchKeyword.toLowerCase())
  //   );
  // }, [tickets, debouncedSearchKeyword]);

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
      
      // Add search parameters - ensure at least one filter is provided
      let hasFilters = false;
      
      if (filters.keyword && filters.keyword.trim()) {
        params.append('search', filters.keyword.trim());
        hasFilters = true;
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
        hasFilters = true;
      }
      if (filters.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority);
        hasFilters = true;
      }
      if (filters.problemType && filters.problemType !== 'all') {
        params.append('problem_type', filters.problemType);
        hasFilters = true;
      }
      if (filters.department && filters.department !== 'all') {
        params.append('department', filters.department);
        hasFilters = true;
      }
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
        hasFilters = true;
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo);
        hasFilters = true;
      }
      if (filters.assignedTo && filters.assignedTo !== 'all') {
        params.append('assigned_to', filters.assignedTo);
        hasFilters = true;
      }
      
      // Allow search without filters to show recent tickets
      console.log('Search filters:', { filters, hasFilters, params: params.toString() });
      
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
      console.error('Search error details:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        params: error.config?.params
      });
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
        ticket.ticketId === lastTicketUpdate.ticket_id 
          ? { ...ticket, status: lastTicketUpdate.status, updatedAt: lastTicketUpdate.updated_at }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'รอดำเนินการ': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'กำลังดำเนินการ': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'รอข้อมูลเพิ่มเติม': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'เสร็จสิ้น': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ยกเลิก': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-gray-800 dark:to-primary-900/10">
      {/* Advanced Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-purple-600/5 to-blue-600/10 dark:from-primary-900/20 dark:via-purple-900/10 dark:to-blue-900/20"></div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto py-16 px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left Side - Main Title */}
            <div className="flex-1 animate-fade-in">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="ml-6">
                  <h1 className="text-5xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                      ค้นหา
                    </span>
                    <span className="text-gray-900 dark:text-white ml-3">Advanced</span>
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                    ค้นหาและวิเคราะห์ Tickets ด้วยเครื่องมือขั้นสูง พร้อมสถิติแบบเรียลไทม์
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Side - Quick Stats */}
            <div className="lg:max-w-md animate-slide-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total || '0'}</div>
                      <div className="text-xs text-gray-500">Total Results</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentFilters ? '1' : '0'}</div>
                      <div className="text-xs text-gray-500">Active Search</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.totalPages || '0'}</div>
                      <div className="text-xs text-gray-500">Pages</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{viewMode === 'list' ? 'List' : 'Grid'}</div>
                      <div className="text-xs text-gray-500">View Mode</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Search Component */}
        <AdvancedSearch
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          results={pagination.total}
        />

        {/* Advanced Results Section */}
        {currentFilters && (
          <div className="space-y-8">
            {/* Modern Results Dashboard */}
            <div className="relative overflow-hidden">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                {/* Header with gradient accent */}
                <div className="bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-blue-500/10 dark:from-primary-900/20 dark:via-purple-900/10 dark:to-blue-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    {/* Left Side - Results Info */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{pagination.total > 0 ? '✓' : '×'}</span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          ผลการค้นหา
                        </h2>
                        {pagination.total > 0 ? (
                          <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 text-primary-700 dark:text-primary-300 text-lg font-bold rounded-2xl border border-primary-200/50 dark:border-primary-700/50">
                              <TrendingUp className="w-5 h-5 mr-2" />
                              {pagination.total.toLocaleString()} รายการ
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              แสดง {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-lg">ไม่พบผลการค้นหา</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Side - Quick Analytics */}
                    {pagination.total > 0 && (
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                          <div className="flex items-center space-x-3">
                            <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{pagination.totalPages}</div>
                              <div className="text-xs text-gray-500">หน้าทั้งหมด</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                          <div className="flex items-center space-x-3">
                            <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{pagination.page}</div>
                              <div className="text-xs text-gray-500">หน้าปัจจุบัน</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Controls Panel */}
                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Sort Controls */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">เรียงตาม:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        >
                          <option value="createdAt">วันที่สร้าง</option>
                          <option value="updatedAt">วันที่อัปเดต</option>
                          <option value="priority">ความสำคัญ</option>
                          <option value="status">สถานะ</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="p-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all hover:shadow-md"
                          title={sortOrder === 'asc' ? 'เรียงจากน้อยไปมาก' : 'เรียงจากมากไปน้อย'}
                        >
                          {sortOrder === 'asc' ? 
                            <SortAsc className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
                            <SortDesc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center space-x-4">
                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 border border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${
                            viewMode === 'list' 
                              ? 'bg-primary-600 text-white shadow-lg' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600'
                          }`}
                        >
                          <List className="w-4 h-4" />
                          <span className="hidden sm:inline">รายการ</span>
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${
                            viewMode === 'grid' 
                              ? 'bg-primary-600 text-white shadow-lg' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600'
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                          <span className="hidden sm:inline">ตาราง</span>
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => currentFilters && searchTickets(currentFilters, pagination.page)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all hover:shadow-lg font-medium"
                          title="รีเฟรชผลการค้นหา"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          <span className="hidden md:inline">รีเฟรช</span>
                        </button>
                        
                        {tickets.length > 0 && (
                          <button
                            onClick={exportResults}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl transition-all hover:shadow-lg font-medium"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">ส่งออก CSV</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Results List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-primary-600 dark:border-primary-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="ml-6">
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">กำลังค้นหา...</p>
                  <p className="text-gray-600 dark:text-gray-400">กรุณารอสักครู่</p>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="relative overflow-hidden">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg opacity-50">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-8 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-lg">🔍</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    ไม่พบผลการค้นหา
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรองเพื่อผลลัพธ์ที่ดีขึ้น
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
                      💡 คำแนะนำการค้นหา
                    </h4>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-2 text-left max-w-md mx-auto">
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span>ลองใช้คำค้นที่สั้นและเฉพาะเจาะจง</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span>ตรวจสอบการสะกดคำในการค้นหา</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span>ลองปรับช่วงวันที่หรือสถานะให้กว้างขึ้น</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-6">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="relative overflow-hidden group">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:border-primary-300/50 dark:hover:border-primary-600/50 transition-all duration-300">
                      {/* Status Accent Bar */}
                      <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"></div>
                      
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4 flex-wrap">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Ticket className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <span className="font-mono text-lg bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 px-4 py-2 rounded-2xl font-bold text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-700/50">
                                {ticket.ticketId}
                              </span>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className={`px-4 py-2 text-sm font-semibold rounded-2xl ${getStatusColor(ticket.status)} border border-opacity-50`}>
                                  {ticket.status}
                                </span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                  🔥 {ticket.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">สร้างเมื่อ</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'ไม่ระบุ'}
                              </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-all duration-200 hover:scale-105" title="ดูรายละเอียด">
                              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                              {ticket.problemType}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg line-clamp-3">
                              {ticket.problemDescription}
                            </p>
                            
                            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-6">
                              <span className="flex items-center space-x-2">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">{ticket.fullName}</span>
                              </span>
                              <span className="flex items-center space-x-2">
                                <Building className="h-4 w-4 flex-shrink-0" />
                                <span>{ticket.department}{ticket.division ? ` - ${ticket.division}` : ''}</span>
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {ticket.assignedTo?.fullName && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">ผู้รับผิดชอบ</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.assignedTo.fullName}</div>
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <div>
                                  <span className="font-medium">อัปเดตล่าสุด:</span>
                                  <div className="text-gray-900 dark:text-white">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</div>
                                </div>
                              </div>

                              {ticket.resolvedAt && (
                                <div className="flex items-center space-x-3 text-sm text-green-600 dark:text-green-400">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium">แก้ไขเสร็จ:</span>
                                    <div className="font-semibold">{new Date(ticket.resolvedAt).toLocaleDateString('th-TH')}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Enhanced Grid View
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="relative overflow-hidden group">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:border-primary-300/50 dark:hover:border-primary-600/50 transition-all duration-300 hover:scale-105">
                      {/* Status Accent Bar */}
                      <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"></div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Ticket className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-mono text-sm bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 px-3 py-1 rounded-xl font-bold text-primary-700 dark:text-primary-300">
                              {ticket.ticketId}
                            </span>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200" title="ดูรายละเอียด">
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 leading-tight">
                            {ticket.problemType}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                            {ticket.problemDescription}
                          </p>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <User className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate font-medium">{ticket.fullName}</span>
                            </div>
                            
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                              <Building className="h-3 w-3 mr-2 flex-shrink-0" />
                              {ticket.department}{ticket.division ? ` - ${ticket.division}` : ''}
                            </div>

                            {ticket.assignedTo?.fullName && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                <span className="font-medium">ผู้รับผิดชอบ:</span> {ticket.assignedTo.fullName}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'ไม่ระบุ'}
                              </span>
                              {ticket.resolvedAt && (
                                <span className="text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                  ✓ เสร็จสิ้น
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
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