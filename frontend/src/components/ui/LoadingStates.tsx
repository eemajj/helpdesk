/**
 * ⚡ Ultra-Optimized Loading States
 * DWF Helpdesk Advanced UX Components
 */

import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

// 🎯 Smart Loading Spinner with Context
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  progress?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  progress,
  variant = 'primary',
  inline = false
}) => {
  const { t } = useLanguage();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    success: 'border-green-600',
    warning: 'border-yellow-600',
    error: 'border-red-600'
  };
  
  const containerClasses = inline 
    ? 'inline-flex items-center space-x-2'
    : 'flex flex-col items-center justify-center space-y-3 p-6';
  
  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Main spinner */}
        <div 
          className={`animate-spin rounded-full border-2 border-gray-200 ${colorClasses[variant]} border-t-transparent ${sizeClasses[size]}`}
          role="status"
          aria-label={message || t('common.loading')}
        />
        
        {/* Progress overlay */}
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-medium ${variant === 'primary' ? 'text-primary-600' : 'text-gray-600'}`}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Loading message */}
      {message && !inline && (
        <p className="text-sm text-gray-600 text-center max-w-xs">
          {message}
        </p>
      )}
      
      {message && inline && (
        <span className="text-sm text-gray-600">
          {message}
        </span>
      )}
      
      {/* Progress bar */}
      {progress !== undefined && !inline && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              variant === 'primary' ? 'bg-primary-600' : 
              variant === 'success' ? 'bg-green-600' :
              variant === 'warning' ? 'bg-yellow-600' :
              variant === 'error' ? 'bg-red-600' : 'bg-gray-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

// 📋 Table Loading Skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}) => {
  return (
    <div className="animate-pulse">
      {showHeader && (
        <div className="flex space-x-4 mb-4 p-4 bg-gray-50 rounded-t-lg">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1 h-4 bg-gray-300 rounded" />
          ))}
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 p-4 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`flex-1 h-4 bg-gray-200 rounded ${
                  colIndex === 0 ? 'bg-gray-300' : ''
                }`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// 📊 Card Loading Skeleton
export const CardSkeleton: React.FC<{ 
  count?: number;
  showImage?: boolean;
}> = ({ 
  count = 3,
  showImage = false 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
          {showImage && (
            <div className="w-full h-48 bg-gray-300 rounded-lg mb-4" />
          )}
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="h-6 bg-gray-300 rounded w-20" />
            <div className="h-8 bg-gray-300 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 🔄 Page Loading Overlay
export const PageLoadingOverlay: React.FC<{
  message?: string;
  progress?: number;
  isVisible: boolean;
}> = ({ 
  message,
  progress,
  isVisible 
}) => {
  const { t } = useLanguage();
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl">
        <LoadingSpinner 
          size="lg"
          message={message || t('common.loading')}
          progress={progress}
          variant="primary"
        />
      </div>
    </div>
  );
};

// ⚡ Button Loading State
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  isLoading,
  children,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button'
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          variant={variant === 'secondary' ? 'secondary' : 'primary'} 
          inline 
        />
      )}
      
      <span className={isLoading ? 'ml-2' : ''}>
        {children}
      </span>
    </button>
  );
};

// 📱 Mobile-Optimized Loading States
export const MobileLoadingCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="h-6 bg-gray-300 rounded w-16" />
        <div className="h-6 bg-gray-300 rounded w-12" />
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  TableSkeleton,
  CardSkeleton,
  PageLoadingOverlay,
  LoadingButton,
  MobileLoadingCard
};