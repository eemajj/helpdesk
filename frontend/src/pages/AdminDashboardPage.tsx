
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/User';
import UserEditModal from '../components/UserEditModal';
import { Users, Settings, BarChart3, UserPlus } from 'lucide-react';

interface AdminStats {
    totalUsers: number;
    supportUsersWithAutoAssign: number;
    totalSupportUsers: number;
    pendingRequests: number;
    activeTickets: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        const fetchAdminData = async () => {
            try {
                setLoading(true);
                const [statsResponse, usersResponse] = await Promise.all([
                    fetch('/api/admin/stats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('/api/admin/users', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (!statsResponse.ok || !usersResponse.ok) {
                    throw new Error('Failed to fetch admin data.');
                }

                const statsData: AdminStats = await statsResponse.json();
                const usersData: User[] = await usersResponse.json();
                
                setStats(statsData);
                setUsers(usersData);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [token, user, navigate]);

    const StatCard: React.FC<{ title: string; value: string | number; bgColor: string }> = ({ title, value, bgColor }) => (
        <div className={`${bgColor} text-white p-6 rounded-lg shadow-lg`}>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
    );

    const handleCreateUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (userToEdit: User) => {
        setEditingUser(userToEdit);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (userData: User) => {
        try {
            const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
            const method = editingUser ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Failed to save user');
            }

            const savedUser = await response.json();
            
            if (editingUser) {
                setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
            } else {
                setUsers([savedUser, ...users]);
            }
            
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    };

    const handleDeactivateUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to deactivate user');
            }

            const updatedUser = await response.json();
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Error deactivating user:', error);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    const renderDashboard = () => (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="จำนวนผู้ใช้ทั้งหมด" value={stats?.totalUsers || 0} bgColor="bg-blue-500" />
                <StatCard 
                    title="เจ้าหน้าที่ Support" 
                    value={`${stats?.supportUsersWithAutoAssign || 0} / ${stats?.totalSupportUsers || 0}`} 
                    bgColor="bg-green-500" 
                />
                <StatCard title="คำขอรอพิจารณา" value={stats?.pendingRequests || 0} bgColor="bg-yellow-500" />
                <StatCard title="ตั๋วที่กำลังดำเนินการ" value={stats?.activeTickets || 0} bgColor="bg-indigo-500" />
            </div>
        </div>
    );

    const renderUsers = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">จัดการผู้ใช้</h2>
                <button 
                    onClick={handleCreateUser}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>เพิ่มผู้ใช้</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ผู้ใช้</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">บทบาท</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((userItem) => (
                            <tr key={userItem.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{userItem.fullName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                                        userItem.role === 'support' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {userItem.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                                         userItem.role === 'support' ? 'เจ้าหน้าที่' : 'ผู้ใช้'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {userItem.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => handleEditUser(userItem)}
                                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                    >
                                        แก้ไข
                                    </button>
                                    {userItem.isActive && userItem.id !== user?.id && (
                                        <button 
                                            onClick={() => handleDeactivateUser(userItem.id!)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            ปิดใช้งาน
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">การตั้งค่าระบบ</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400">ฟีเจอร์การตั้งค่าระบบจะพัฒนาในเวอร์ชันต่อไป</p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 dark:text-gray-400">
                    <li>การตั้งค่า Email Templates</li>
                    <li>การจัดการหมวดหมู่และความสำคัญ</li>
                    <li>การตั้งค่า SLA</li>
                    <li>การจัดการการแจ้งเตือน</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">จัดการระบบ</h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                        activeTab === 'dashboard' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>ภาพรวมระบบ</span>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                        activeTab === 'users' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>จัดการผู้ใช้</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                        activeTab === 'settings' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    <span>การตั้งค่า</span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'settings' && renderSettings()}

            {/* User Edit Modal */}
            <UserEditModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
        </div>
    );
};

export default AdminDashboardPage;
