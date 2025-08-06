import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  PlayIcon, 
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  TicketIcon,
  UsersIcon,
  SettingsIcon,
  RefreshCcwIcon
} from 'lucide-react';

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


interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { 
    lastTicketUpdate, 
    notifications, 
    setNotifications,
    markAsRead
  } = useWebSocket();

  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'inProgress' | 'completed'>('all');
  const [adminView, setAdminView] = useState<'dashboard' | 'users' | 'assign'>('dashboard');

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
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
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/dashboard/tickets?limit=10'),
        api.get('/dashboard/notifications?limit=10')
      ];

      if (user?.role === 'admin') {
        requests.push(api.get('/dashboard/users'));
      }

      const responses = await Promise.all(requests);

      setStats(responses[0].data.stats);
      setTickets(responses[1].data.tickets);
      setNotifications(responses[2].data.notifications);
      
      if (user?.role === 'admin' && responses[3]) {
        setUsers(responses[3].data.users);
      }
      
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status !== 401) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role, logout]);

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      if (newStatus === 'เสร็จสิ้น') {
        // Use the close endpoint for completing tickets
        await api.post(`/tickets/${ticketId}/close`, { resolution_notes: 'ปิดงานผ่าน Dashboard' });
      } else {
        // Use the status endpoint for other status changes
        await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      }
      toast.success('อัปเดตสถานะสำเร็จ');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const autoAssignTicket = async (ticketId: number) => {
    try {
      await api.post(`/dashboard/assign-ticket/${ticketId}`);
      toast.success('มอบหมาย Ticket สำเร็จ');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Auto assign error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการมอบหมาย');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  useEffect(() => {
    if (lastTicketUpdate) {
      setTickets(prev => prev.map(ticket => 
        ticket.ticket_id === lastTicketUpdate.ticket_id 
          ? { ...ticket, status: lastTicketUpdate.status, created_at: lastTicketUpdate.updated_at }
          : ticket
      ));
      fetchDashboardData();
    }
  }, [lastTicketUpdate, fetchDashboardData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.status === {
      'pending': 'รอดำเนินการ',
      'inProgress': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น'
    }[activeTab];
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.welcome')} {user?.fullName} ({user?.role})</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card animate-slide-up"><div className="card-body flex items-center"><TicketIcon className="h-10 w-10 text-primary-500 mr-4" /><div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.totalTickets')}</h3><p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p></div></div></div>
            <div className="card animate-slide-up"><div className="card-body flex items-center"><ClockIcon className="h-10 w-10 text-yellow-500 mr-4" /><div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.pending')}</h3><p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p></div></div></div>
            <div className="card animate-slide-up"><div className="card-body flex items-center"><PlayIcon className="h-10 w-10 text-blue-500 mr-4" /><div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.inProgress')}</h3><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p></div></div></div>
            <div className="card animate-slide-up"><div className="card-body flex items-center"><CheckCircleIcon className="h-10 w-10 text-green-500 mr-4" /><div><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.completed')}</h3><p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p></div></div></div>
        </div>

        {user?.role === 'admin' && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-4">
                <button onClick={() => setAdminView('dashboard')} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${adminView === 'dashboard' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}><TicketIcon className="h-4 w-4 mr-2" />Dashboard</button>
                <button onClick={() => setAdminView('users')} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${adminView === 'users' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}><UsersIcon className="h-4 w-4 mr-2" />จัดการผู้ใช้ ({users.length})</button>
                <button onClick={() => setAdminView('assign')} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${adminView === 'assign' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}><SettingsIcon className="h-4 w-4 mr-2" />จัดการ Tickets</button>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'admin' && adminView === 'users' && (
          <div className="mb-8"><div className="card animate-fade-in"><div className="card-header"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">จัดการผู้ใช้งาน</h2></div><div className="card-body"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ผู้ใช้</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">บทบาท</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เข้าสู่ระบบล่าสุด</th></tr></thead><tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{users.map(userItem => (<tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700"><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><UserIcon className="h-8 w-8 text-gray-400 mr-3" /><div><div className="text-sm font-medium text-gray-900 dark:text-white">{userItem.full_name}</div><div className="text-sm text-gray-500 dark:text-gray-400">@{userItem.username}</div></div></div></td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : userItem.role === 'support' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>{userItem.role === 'admin' ? 'ผู้ดูแลระบบ' : userItem.role === 'support' ? 'เจ้าหน้าที่' : 'ผู้ใช้ทั่วไป'}</span></td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{userItem.is_active ? 'ใช้งานได้' : 'ระงับ'}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{userItem.last_login ? new Date(userItem.last_login).toLocaleString('th-TH') : 'ไม่เคยเข้าสู่ระบบ'}</td></tr>))}</tbody></table></div></div></div></div>
        )}

        {user?.role === 'admin' && adminView === 'assign' && (
          <div className="mb-8"><div className="card animate-fade-in"><div className="card-header"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">จัดการ Tickets - Auto Assignment</h2></div><div className="card-body"><div className="space-y-4">{tickets.filter(ticket => !ticket.assigned_to_name).map(ticket => (<div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-2 mb-2"><span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{ticket.ticket_id}</span><span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">ยังไม่ได้มอบหมาย</span><span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></div><h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.problem_type}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{ticket.problem_description}</p><div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4"><span className="flex items-center"><UserIcon className="h-3 w-3 mr-1" />{ticket.full_name} ({ticket.department})</span><span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" />{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '-'}</span></div></div><div className="ml-4"><button onClick={() => autoAssignTicket(ticket.id)} className="flex items-center px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"><RefreshCcwIcon className="h-4 w-4 mr-2" />Auto Assign</button></div></div></div>))}{tickets.filter(ticket => !ticket.assigned_to_name).length === 0 && (<div className="text-center py-8"><CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">ทุก Tickets ได้รับการมอบหมายแล้ว</p></div>)}</div></div></div></div>
        )}

        {(user?.role !== 'admin' || adminView === 'dashboard') && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><div className="card animate-fade-in"><div className="card-header"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tickets ของฉัน</h2><div className="flex space-x-1 mt-4">{[{ key: 'all', label: 'ทั้งหมด', count: stats.total },{ key: 'pending', label: 'รอดำเนินการ', count: stats.pending },{ key: 'inProgress', label: 'กำลังดำเนินการ', count: stats.inProgress },{ key: 'completed', label: 'เสร็จสิ้น', count: stats.completed }].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{tab.label} ({tab.count})</button>))}</div></div><div className="card-body">{filteredTickets.length === 0 ? (<div className="text-center py-8"><XCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">ไม่มี Tickets ในหมวดนี้</p></div>) : (<div className="space-y-4">{filteredTickets.map(ticket => (<div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-2 mb-2"><span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{ticket.ticket_id}</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>{ticket.status}</span><span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></div><h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.problem_type}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{ticket.problem_description}</p><div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4"><span className="flex items-center"><UserIcon className="h-3 w-3 mr-1" />{ticket.full_name} ({ticket.department})</span><span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" />{new Date(ticket.created_at).toLocaleDateString('th-TH')}</span></div></div>{ticket.status !== 'เสร็จสิ้น' && (<div className="ml-4 flex space-x-2">{ticket.status === 'รอดำเนินการ' && (<button onClick={() => updateTicketStatus(ticket.id, 'กำลังดำเนินการ')} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">เริ่มดำเนินการ</button>)}{ticket.status === 'กำลังดำเนินการ' && (<button onClick={() => updateTicketStatus(ticket.id, 'เสร็จสิ้น')} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">ปิดงาน</button>)}</div>)}</div></div>))}</div>)}</div></div></div>
            <div className="lg:col-span-1"><div className="card animate-fade-in"><div className="card-header"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">การแจ้งเตือน</h2></div><div className="card-body">{notifications.length === 0 ? (<div className="text-center py-8"><CheckCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">ไม่มีการแจ้งเตือนใหม่</p></div>) : (<div className="space-y-4">{notifications.map(notification => (<div key={notification.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${notification.is_read ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700'}`}                         onClick={() => !notification.is_read && markAsRead(notification.id)}><div className="flex justify-between items-start mb-2"><h4 className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</h4>{!notification.is_read && (<div className="w-2 h-2 bg-primary-500 rounded-full"></div>)}</div><p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p><p className="text-xs text-gray-500 dark:text-gray-500">{new Date(notification.created_at).toLocaleString('th-TH')}</p></div>))}</div>)}</div></div></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
