import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, Users, Ticket, TrendingUp, Zap } from 'lucide-react';
import MiniChart from './MiniChart';

interface DashboardStats {
  totalTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  activeUsers: number;
  todayTickets: number;
  weeklyData: number[];
  statusDistribution: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  hourlyTickets: number[];
}

interface RealTimeDashboardProps {
  stats?: DashboardStats;
  className?: string;
}

// Mock data generator for demo
const generateMockData = (): DashboardStats => {
  const weeklyData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10);
  const hourlyTickets = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10) + 1);
  
  return {
    totalTickets: 1247,
    pendingTickets: 89,
    resolvedTickets: 1158,
    avgResolutionTime: 4.2,
    activeUsers: 23,
    todayTickets: 15,
    weeklyData,
    statusDistribution: {
      'รอดำเนินการ': 89,
      'กำลังดำเนินการ': 45,
      'รอข้อมูลเพิ่มเติม': 23,
      'เสร็จสิ้น': 1158
    },
    priorityDistribution: {
      'วิกฤต': 5,
      'เร่งด่วน': 15,
      'สูง': 34,
      'ปกติ': 156,
      'ต่ำ': 89
    },
    hourlyTickets
  };
};

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ 
  stats,
  className = '' 
}) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(generateMockData());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Real-time updates simulation
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setDashboardStats(prev => ({
        ...prev,
        todayTickets: prev.todayTickets + Math.floor(Math.random() * 2),
        pendingTickets: Math.max(0, prev.pendingTickets + Math.floor(Math.random() * 3) - 1),
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3) - 1)
      }));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const data = stats || dashboardStats;
  
  const resolutionRate = ((data.resolvedTickets / data.totalTickets) * 100);
  const pendingRate = ((data.pendingTickets / data.totalTickets) * 100);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            {isLive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse">
                <div className="w-full h-full bg-green-500 rounded-full animate-ping"></div>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Real-time Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString('th-TH')}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${
                  isLive 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4" />
          <span>Auto-refresh: 5s</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniChart
          type="line"
          data={data.weeklyData}
          value={data.totalTickets}
          label="Total Tickets"
          change={12}
          color="blue"
          className="animate-scale-in"
        />
        
        <MiniChart
          type="bar"
          data={data.hourlyTickets}
          value={data.pendingTickets}
          label="Pending Tickets"
          change={-5}
          color="orange"
          className="animate-scale-in"
        />
        
        <MiniChart
          type="pie"
          data={Object.values(data.statusDistribution)}
          value={data.resolvedTickets}
          label="Resolved Tickets"
          change={8}
          color="green"
          className="animate-scale-in"
        />
        
        <MiniChart
          type="progress"
          data={[100]}
          value={resolutionRate}
          label="Resolution Rate"
          color="purple"
          className="animate-scale-in"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status Distribution
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(data.statusDistribution).map(([status, count], index) => {
              const percentage = (count / data.totalTickets) * 100;
              const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'];
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {status}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index % colors.length]} transition-all duration-500 animate-progress`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Activity
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {data.activeUsers} online
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.todayTickets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Today's Tickets
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.avgResolutionTime}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Resolution
                </div>
              </div>
            </div>

            {/* Hourly Activity Chart */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                24h Activity
              </h4>
              <div className="h-20 flex items-end space-x-1">
                {data.hourlyTickets.map((tickets, hour) => {
                  const maxHourly = Math.max(...data.hourlyTickets);
                  const height = (tickets / maxHourly) * 100;
                  const isCurrentHour = hour === new Date().getHours();
                  
                  return (
                    <div
                      key={hour}
                      className={`flex-1 rounded-sm transition-all duration-300 hover:scale-110 ${
                        isCurrentHour 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 animate-glow' 
                          : 'bg-gradient-to-t from-blue-400 to-blue-500'
                      }`}
                      style={{ height: `${height}%`, minHeight: '2px' }}
                      title={`${hour}:00 - ${tickets} tickets`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>24</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;