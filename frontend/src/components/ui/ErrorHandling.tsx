/**
 * ⚠️ Advanced Error Handling Components
 * DWF Helpdesk Production-Ready Error Management
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, Bug, Shield } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

// 🚨 Enhanced Error Boundary with Recovery
interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  maxRetries?: number;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  retryCount: number;
  maxRetries: number;
}

export class AdvancedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
      retryCount: 0
    };
  }
  
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
      errorId: this.generateErrorId()
    });
    
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      if (this.state.hasError) {
        this.resetError();
      }
    }
  }
  
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
  
  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount
    };
    
    // Send to error monitoring service (e.g., Sentry)
    console.error('🚨 Application Error:', errorReport);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoringService(errorReport);
    }
  };
  
  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
      retryCount: 0
    });
  };
  
  private retryWithDelay = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }
    
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, delay);
  };
  
  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
        />
      );
    }
    
    return this.props.children;
  }
}

// 🎯 Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  retryCount,
  maxRetries
}) => {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate retry delay
    resetError();
    setIsRetrying(false);
  };
  
  const canRetry = retryCount < maxRetries;
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('error.unexpectedError')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('error.pleaseTryAgain')}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {canRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? t('common.retrying') : t('common.retry')}
                {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              {t('navigation.home')}
            </button>
          </div>
          
          {/* Error Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <Bug className="h-4 w-4 mr-1" />
            {showDetails ? t('error.hideDetails') : t('error.showDetails')}
          </button>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {t('error.technicalDetails')}
              </h4>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {error.stack.substring(0, 500)}
                      {error.stack.length > 500 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Contact Support */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-2">
              {t('error.persistentProblem')}
            </p>
            <button
              onClick={() => window.location.href = '/submit'}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              <Mail className="h-4 w-4 mr-1" />
              {t('error.contactSupport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔒 Access Denied Component
export const AccessDenied: React.FC<{
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}> = ({ 
  message,
  showRetry = true,
  onRetry 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-orange-200 p-6 text-center">
        <Shield className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('error.accessDenied')}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message || t('error.insufficientPermissions')}
        </p>
        
        <div className="space-y-3">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              {t('common.retry')}
            </button>
          )}
          
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🌐 Network Error Component
export const NetworkError: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ 
  onRetry,
  isRetrying = false 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center p-6">
      <div className="mx-auto h-16 w-16 text-red-500 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('error.networkError')}
      </h3>
      
      <p className="text-gray-600 mb-4">
        {t('error.checkConnection')}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? t('common.retrying') : t('common.retry')}
        </button>
      )}
    </div>
  );
};

// 📊 Data Not Found Component
export const DataNotFound: React.FC<{
  message?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  createButtonText?: string;
}> = ({
  message,
  showCreateButton = false,
  onCreateClick,
  createButtonText
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center p-8">
      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('common.noDataFound')}
      </h3>
      
      <p className="text-gray-600 mb-4">
        {message || t('common.noDataMessage')}
      </p>
      
      {showCreateButton && onCreateClick && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          {createButtonText || t('common.createNew')}
        </button>
      )}
    </div>
  );
};

export default {
  AdvancedErrorBoundary,
  DefaultErrorFallback,
  AccessDenied,
  NetworkError,
  DataNotFound
};