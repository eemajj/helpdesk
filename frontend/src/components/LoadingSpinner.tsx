import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'กำลังโหลด...', 
  className = '',
  fullScreen = true
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-primary-600 dark:text-primary-400 animate-spin`} />
        <div className="absolute inset-0 rounded-full bg-primary-200 dark:bg-primary-800 opacity-20 animate-pulse"></div>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-gray-600 dark:text-gray-400 animate-pulse-soft text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/10">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;