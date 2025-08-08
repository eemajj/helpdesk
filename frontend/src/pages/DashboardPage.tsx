import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import UserEditModal from '../components/UserEditModal'; // Import the modal
import { 
  Clock, 
  CheckCircle, 
  Play, 
  XCircle,
  User as UserIcon,
  Calendar,
  Ticket,
  Users,
  Settings,
  RefreshCcw,
  Edit,
  Trash2,
  PlusCircle,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  AlertTriangle,
  Target,
  Award,
  Zap,
  Shield,
  Globe,
  Database,
  Monitor,
  FileText,
  Bell,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Sparkles,
  Flame,
  Star,
  Coffee,
  Crown
} from 'lucide-react';
import { User } from '../types/User'; // Moved to top

// Interfaces
interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface Ticket {
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

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { lastTicketUpdate, notifications, setNotifications, markAsRead } = useWebSocket();

  // State declarations
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'inProgress' | 'completed' | 'unassigned'>('all');
  const [adminView, setAdminView] = useState<'dashboard' | 'users' | 'assign'>('dashboard');
  
  // User Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
      }
      return Promise.reject(error);
    }
  );

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/dashboard/notifications?limit=10')
      ];

      // Fetch tickets based on user role
      let ticketApiUrl = '/dashboard/tickets?limit=10';
      if (user?.role === 'user' || user?.role === 'support') {
        ticketApiUrl += `&assignedUserId=${user.id}`;
      }
      requests.splice(1, 0, api.get(ticketApiUrl)); // Insert ticket request at index 1

      if (user?.role === 'admin') {
        requests.push(api.get('/admin/users')); // Use the new admin route
      }

      const [statsRes, ticketsRes, notificationsRes, usersRes] = await Promise.all(requests);

      setStats(statsRes.data.stats);
      setTickets(ticketsRes.data.tickets);
      setNotifications(notificationsRes.data.notifications);
      
      if (user?.role === 'admin' && usersRes) {
        setUsers(usersRes.data);
      }
      
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- User Management Handlers ---
  const handleOpenModal = (user: User | null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (userData: User) => {
    try {
      if (userData.id) { // Editing existing user
        await api.put(`/admin/users/${userData.id}`, userData);
        toast.success('User updated successfully!');
      } else { // Creating new user
        await api.post('/admin/users', userData);
        toast.success('User created successfully!');
      }
      fetchDashboardData(); // Refresh data
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user.');
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
      if (window.confirm('Are you sure you want to deactivate this user?')) {
          try {
              await api.delete(`/admin/users/${userId}`);
              toast.success('User deactivated successfully!');
              fetchDashboardData(); // Refresh data
          } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to deactivate user.');
          }
      }
  };

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      // Convert English status to Thai for backend if needed, or ensure backend handles English
      // For now, assuming backend expects Thai for 'เสร็จสิ้น' and English for others
      const statusToSend = newStatus === 'completed' ? 'เสร็จสิ้น' : newStatus; // Example conversion

      if (statusToSend === 'เสร็จสิ้น') { 
        await api.post(`/tickets/${ticketId}/close`, { resolution_notes: 'ปิดงานผ่าน Dashboard' });
      } else {
        await api.put(`/tickets/${ticketId}/status`, { status: statusToSend });
      }
      toast.success(t('messages.statusUpdateSuccess')); // Use i18n
      fetchDashboardData();
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.error || t('messages.statusUpdateError')); // Use i18n
    }
  };

  const autoAssignTicket = async (ticketId: number) => {
    try {
      await api.post(`/dashboard/assign-ticket/${ticketId}`);
      toast.success(t('messages.assignTicketSuccess')); // Use i18n
      fetchDashboardData();
    } catch (error: any) {
      console.error('Auto assign error:', error);
      toast.error(error.response?.data?.error || t('messages.assignTicketError')); // Use i18n
    }
  };


  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  useEffect(() => {
    if (lastTicketUpdate) {
      fetchDashboardData();
    }
  }, [lastTicketUpdate, fetchDashboardData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Map English status to Thai status from Backend
  const statusMap: { [key: string]: string } = {
    'pending': 'รอดำเนินการ',
    'inProgress': 'กำลังดำเนินการ',
    'waitingInfo': 'รอข้อมูลเพิ่มเติม',
    'completed': 'เสร็จสิ้น',
    'cancelled': 'ยกเลิก',
  };

  // Map English priority to Thai priority from Backend
  const priorityMap: { [key: string]: string } = {
    'CRITICAL': 'วิกฤต',
    'URGENT': 'เร่งด่วนมาก',
    'HIGH': 'เร่งด่วน',
    'ELEVATED': 'สูง',
    'NORMAL': 'ปกติ',
    'LOW': 'ต่ำ',
    'VERY_LOW': 'ต่ำมาก',
    'LOWEST': 'ต่ำสุด',
  };

  const getStatusColor = (status: string) => {
    // Use English status for switch case
    const englishStatus = Object.keys(statusMap).find(key => statusMap[key] === status) || status;
    switch (englishStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inProgress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'waitingInfo': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    // Use English priority for switch case
    const englishPriority = Object.keys(priorityMap).find(key => priorityMap[key] === priority) || priority;
    switch (englishPriority) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400';
      case 'URGENT': return 'text-orange-600 dark:text-orange-400';
      case 'HIGH': return 'text-orange-500 dark:text-orange-300';
      case 'ELEVATED': return 'text-yellow-600 dark:text-yellow-400';
      case 'NORMAL': return 'text-blue-600 dark:text-blue-400';
      case 'LOW': return 'text-gray-600 dark:text-gray-400';
      case 'VERY_LOW': return 'text-gray-500 dark:text-gray-300';
      case 'LOWEST': return 'text-gray-400 dark:text-gray-200';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unassigned') return !ticket.assigned_to_name;
    return ticket.status === statusMap[activeTab];
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-gray-800 dark:to-primary-900/10 flex items-center justify-center px-4">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary-200 dark:border-primary-800 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-primary-600 dark:border-primary-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Monitor className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div className="ml-8">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">กำลังโหลด Dashboard...</p>
          <p className="text-gray-600 dark:text-gray-400">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-gray-800 dark:to-primary-900/10">
      {/* Advanced Dashboard Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-purple-600/5 to-blue-600/10 dark:from-primary-900/20 dark:via-purple-900/10 dark:to-blue-900/20"></div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.1)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.2)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto py-12 px-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            {/* Left Side - Welcome Section */}
            <div className="flex-1 animate-fade-in">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-purple-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/25">
                    <Monitor className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-6">
                  <h1 className="text-5xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>
                  <p className="text-2xl text-gray-600 dark:text-gray-400 mb-3">
                    ยินดีต้อนรับ, <span className="font-bold text-gray-900 dark:text-white">{user?.fullName}</span>
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold shadow-lg ${
                      user?.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                      user?.role === 'support' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' :
                      'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    }`}>
                      {user?.role === 'admin' && <Shield className="w-4 h-4 mr-2" />}
                      {user?.role === 'support' && <Settings className="w-4 h-4 mr-2" />}
                      {user?.role === 'user' && <User className="w-4 h-4 mr-2" />}
                      {t(`common.role.${user?.role}`)}
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {new Date().toLocaleDateString('th-TH', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Status Indicators */}
            <div className="lg:max-w-md animate-slide-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">Online</div>
                      <div className="text-xs text-gray-500">System Status</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">Fast</div>
                      <div className="text-xs text-gray-500">Response Time</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.completed / stats.total * 100) || 0}%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.filter(n => !n.is_read).length}</div>
                      <div className="text-xs text-gray-500">New Alerts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Advanced Stats Dashboard */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {/* Total Tickets Card */}
          <div className="relative overflow-hidden group">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300 hover:scale-105">
              {/* Gradient Accent */}
              <div className="h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"></div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <Database className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tickets ทั้งหมด</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Total System</div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">+12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Tickets Card */}
          <div className="relative overflow-hidden group">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300 hover:scale-105">
              {/* Gradient Accent */}
              <div className="h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    {stats.pending > 10 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{stats.pending}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">รอดำเนินการ</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Pending</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    stats.pending > 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {stats.pending > 10 ? 'ต้องการความสนใจ' : 'ปกติ'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div className="relative overflow-hidden group">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300 hover:scale-105">
              {/* Gradient Accent */}
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-spin">
                      <Settings className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.inProgress}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">กำลังดำเนินการ</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">In Progress</div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="relative overflow-hidden group">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300 hover:scale-105">
              {/* Gradient Accent */}
              <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.completed}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">เสร็จสิ้นแล้ว</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Completed</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {Math.round(stats.completed / stats.total * 100) || 0}%
                    </div>
                    <Target className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Section */}
        {user?.role === 'admin' && (
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Weekly Stats Card */}
            <div className="lg:col-span-2 relative overflow-hidden">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">สถิติรายสัปดาห์</h3>
                      <p className="text-gray-600 dark:text-gray-400">ข้อมูลประสิทธิภาพระบบ</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-6">
                    {[
                      { label: 'Tickets ใหม่', value: 24, progress: 75, color: 'from-blue-500 to-purple-500', icon: FileText },
                      { label: 'Tickets ที่แก้ไขแล้ว', value: 18, progress: 80, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
                      { label: 'ความพึงพอใจ', value: '4.8/5.0', progress: 96, color: 'from-yellow-500 to-orange-500', icon: Star }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{item.label}</div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{item.value}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                                 style={{ width: `${item.progress}%` }}></div>
                          </div>
                          <div className="text-sm font-bold text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                            {item.progress}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Coffee className="w-4 h-4" />
                        <span>เวลาเฉลี่ยในการแก้ไข: <span className="font-bold text-gray-900 dark:text-white">2.4 ชั่วโมง</span></span>
                      </div>
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">ปรับปรุงขึ้น 15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Issues Card */}
            <div className="relative overflow-hidden">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-full">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-rose-500/10 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-rose-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">ประเภทปัญหา</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ยอดนิยม</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { name: 'คอมพิวเตอร์', count: 45, color: 'from-blue-500 to-cyan-500', percentage: 35, icon: Monitor },
                      { name: 'อินเทอร์เน็ต', count: 32, color: 'from-green-500 to-emerald-500', percentage: 25, icon: Globe },
                      { name: 'ปริ้นเตอร์', count: 28, color: 'from-yellow-500 to-orange-500', percentage: 22, icon: FileText },
                      { name: 'ระบบสารสนเทศ', count: 23, color: 'from-purple-500 to-violet-500', percentage: 18, icon: Database }
                    ].map((item, index) => (
                      <div key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl p-3 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-900 dark:text-white font-semibold">{item.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 dark:text-gray-400">{item.count}</span>
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.percentage}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`h-2 bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                                   style={{ width: `${item.percentage}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <Flame className="w-4 h-4 inline mr-2" />
                      อัปเดตทุก 5 นาที
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Admin Navigation */}
        {user?.role === 'admin' && (
          <div className="mb-12">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/10 via-pink-500/5 to-rose-500/10 dark:from-red-900/20 dark:via-pink-900/10 dark:to-rose-900/20 p-2">
                <div className="flex items-center space-x-2">
                  {[
                    { 
                      key: 'dashboard', 
                      label: t('dashboard.title'), 
                      icon: Monitor, 
                      color: 'from-blue-500 to-purple-500',
                      count: stats.total
                    },
                    { 
                      key: 'users', 
                      label: t('dashboard.admin.manageUsers'), 
                      icon: Users, 
                      color: 'from-green-500 to-emerald-500',
                      count: users.length
                    },
                    { 
                      key: 'assign', 
                      label: t('dashboard.admin.manageTickets'), 
                      icon: Settings, 
                      color: 'from-orange-500 to-red-500',
                      count: tickets.filter(t => !t.assigned_to_name).length
                    }
                  ].map((item) => (
                    <button 
                      key={item.key}
                      onClick={() => setAdminView(item.key as any)} 
                      className={`group relative flex items-center space-x-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 ${
                        adminView === item.key 
                          ? `bg-gradient-to-r ${item.color} text-white shadow-2xl` 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${adminView === item.key ? 'text-white' : 'text-current'}`} />
                      <span>{item.label}</span>
                      {item.count > 0 && (
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                          adminView === item.key 
                            ? 'bg-white/20 text-white' 
                            : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      
                      {/* Active indicator */}
                      {adminView === item.key && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin: User Management View */}
        {user?.role === 'admin' && adminView === 'users' && (
          <div className="card animate-fade-in">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('dashboard.admin.manageUsers')}</h2>
              <button onClick={() => handleOpenModal(null)} className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center">
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                {t('common.createUser')}
              </button>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('common.user')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('common.role')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('common.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('common.createdAt')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {users.map(userItem => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{userItem.fullName}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t(`common.role.${userItem.role}`)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {userItem.isActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleOpenModal(userItem)} className="text-blue-600 hover:text-blue-900 mr-4">
                            <EditIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeactivateUser(userItem.id!)} className="text-red-600 hover:text-red-900">
                            <Trash2Icon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Admin: Ticket Management View */}
        {user?.role === 'admin' && adminView === 'assign' && (
          <div className="mb-8">
            <div className="card animate-fade-in">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard.admin.manageTickets')} - {t('dashboard.admin.assignTickets')}</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {tickets.filter(ticket => !ticket.assigned_to_name).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noUnassignedTickets')}</p>
                    </div>
                  ) : (
                    tickets.filter(ticket => !ticket.assigned_to_name).map(ticket => (
                      <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{ticket.ticket_id}</span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t('dashboard.ticketStatus.unassigned')}</span>
                              <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>{t(`tracking.status.${ticket.priority}`)}</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.problem_type}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{ticket.problem_description}</p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                              <span className="flex items-center"><UserIcon className="h-3 w-3 mr-1" />{ticket.full_name} ({ticket.department})</span>
                              <span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" />{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button onClick={() => autoAssignTicket(ticket.id)} className="flex items-center px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors">
                              <RefreshCcwIcon className="h-4 w-4 mr-2" />{t('dashboard.admin.autoAssign')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default View for all users / Admin dashboard view */}
        {(user?.role !== 'admin' || adminView === 'dashboard') && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">{t('dashboard.myTickets')}</h2>
                <div className="flex space-x-1 mt-4">
                  {[{ key: 'all', label: t('dashboard.tabs.all'), count: stats.total },
                    { key: 'pending', label: t('dashboard.tabs.pending'), count: stats.pending },
                    { key: 'inProgress', label: t('dashboard.tabs.inProgress'), count: stats.inProgress },
                    { key: 'completed', label: t('dashboard.tabs.completed'), count: stats.completed }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-body">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <XCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noTicketsInThisCategory')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map(ticket => (
                      <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{ticket.ticket_id}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>{t(`dashboard.ticketStatus.${ticket.status}`)}</span>
                              <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>{t(`tracking.status.${ticket.priority}`)}</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.problem_type}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{ticket.problem_description}</p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                              <span className="flex items-center"><UserIcon className="h-3 w-3 mr-1" />{ticket.full_name} ({ticket.department})</span>
                              <span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" />{new Date(ticket.created_at).toLocaleDateString('th-TH')}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {user?.role === 'support' && ticket.status === 'รอดำเนินการ' && (
                              <button onClick={() => updateTicketStatus(ticket.id, 'inProgress')} className="bg-blue-500 text-white px-3 py-1 rounded text-xs">{t('common.accept')}</button>
                            )}
                            {user?.role === 'support' && ticket.status === 'กำลังดำเนินการ' && (
                              <button onClick={() => updateTicketStatus(ticket.id, 'completed')} className="bg-green-500 text-white px-3 py-1 rounded text-xs">{t('common.close')}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-1 card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">{t('dashboard.notifications')}</h2>
              </div>
              <div className="card-body">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noNewNotifications')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${notification.is_read ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700'}`} 
                           onClick={() => !notification.is_read && markAsRead(notification.id)}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(notification.created_at).toLocaleString('th-TH')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <UserEditModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  );
};

export default DashboardPage;