import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Functional component สำหรับใช้ translation hook
const ErrorBoundaryContent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t('common.error')}
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('errors.pageError')}
      </p>
    </>
  );
};

const ErrorBoundaryButtons: React.FC<{ onReset: () => void; onReload: () => void }> = ({ onReset, onReload }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <button
        onClick={onReset}
        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {t('common.retry')}
      </button>
      
      <button
        onClick={onReload}
        className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        {t('common.reload')}
      </button>
    </>
  );
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <AlertTriangle className="w-full h-full" />
            </div>
            
            <ErrorBoundaryContent />

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 dark:text-red-200">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-800 dark:text-red-200 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <ErrorBoundaryButtons
                onReset={this.handleReset}
                onReload={this.handleReload}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;