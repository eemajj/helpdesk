import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';

interface MiniChartProps {
  type: 'line' | 'bar' | 'pie' | 'progress';
  data: number[];
  value: number;
  label: string;
  change?: number;
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
  className?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({
  type,
  data,
  value,
  label,
  change,
  color = 'primary',
  className = ''
}) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
    green: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20'
  };

  const gradientClasses = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600', 
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  const renderIcon = () => {
    switch (type) {
      case 'line':
        return <Activity className="w-5 h-5" />;
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const renderMiniChart = () => {
    const max = Math.max(...data);
    
    switch (type) {
      case 'line':
        const points = data.map((val, idx) => {
          const x = (idx / (data.length - 1)) * 100;
          const y = 100 - (val / max) * 100;
          return `${x},${y}`;
        }).join(' ');
        
        return (
          <div className="h-12 w-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-${color}-500`}
              />
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${points} 100,100`}
                fill={`url(#gradient-${color})`}
                className={`text-${color}-500`}
              />
            </svg>
          </div>
        );
        
      case 'bar':
        return (
          <div className="h-12 w-20 flex items-end space-x-1">
            {data.slice(-6).map((val, idx) => (
              <div 
                key={idx}
                className={`bg-gradient-to-t ${gradientClasses[color]} rounded-sm flex-1 transition-all duration-300 hover:scale-110`}
                style={{ height: `${(val / max) * 100}%`, minHeight: '2px' }}
              />
            ))}
          </div>
        );
        
      case 'pie':
        const total = data.reduce((sum, val) => sum + val, 0);
        const percentage = total > 0 ? (value / total) * 100 : 0;
        
        return (
          <div className="h-12 w-12 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-gray-200 dark:stroke-gray-700"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                strokeWidth="3"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset="0"
                className={`stroke-${color}-500 transition-all duration-500`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        );
        
      case 'progress':
        const progressPercentage = Math.min(100, (value / Math.max(...data)) * 100);
        
        return (
          <div className="h-12 w-20 flex flex-col justify-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div
                className={`h-2 bg-gradient-to-r ${gradientClasses[color]} rounded-full transition-all duration-500 animate-progress`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover-lift ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          {renderIcon()}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </div>
      </div>
      
      <div className="flex justify-center">
        {renderMiniChart()}
      </div>
    </div>
  );
};

export default MiniChart;