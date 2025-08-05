
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface AdminStats {
    totalUsers: number;
    supportUsersWithAutoAssign: number;
    totalSupportUsers: number;
    pendingRequests: number;
    activeTickets: number;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            navigate('/login');
            return;
        }

        const fetchAdminStats = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3002/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch admin statistics. Please try again later.');
                }

                const data: AdminStats = await response.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminStats();
    }, [token, user, navigate]);

    const StatCard: React.FC<{ title: string; value: string | number; bgColor: string }> = ({ title, value, bgColor }) => (
        <div className={`${bgColor} text-white p-6 rounded-lg shadow-lg`}>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
    );

    if (loading) {
        return <Layout><LoadingSpinner /></Layout>;
    }

    if (error) {
        return <Layout><div className="text-red-500 text-center p-4">{error}</div></Layout>;
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard title="Total Users" value={stats.totalUsers} bgColor="bg-blue-500" />
                        <StatCard 
                            title="Support Auto-Assign" 
                            value={`${stats.supportUsersWithAutoAssign} / ${stats.totalSupportUsers}`} 
                            bgColor="bg-green-500" 
                        />
                        <StatCard title="Pending Requests" value={stats.pendingRequests} bgColor="bg-yellow-500" />
                        <StatCard title="Active Tickets" value={stats.activeTickets} bgColor="bg-indigo-500" />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminDashboardPage;
