
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useLanguage } from './hooks/useLanguage';
import Layout from './components/Layout';
import DocumentTitle from './components/DocumentTitle';
import { SupportRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { PerformanceMonitor, registerServiceWorker, preloadCriticalResources } from './utils/performance';

// ⚡ ULTRA OPTIMIZATION: Lazy load pages for faster initial load
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TicketFormPage = React.lazy(() => import('./pages/TicketFormPage'));
const TicketTrackingPage = React.lazy(() => import('./pages/TicketTrackingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/AdminSettingsPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage'));

// Ultra-fast loading component
const LoadingSpinner = () => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-600">{t('common.loading')}</span>
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useLanguage();

  // ⚡ Performance optimizations on app start
  useEffect(() => {
    PerformanceMonitor.start('app-initialization');
    
    // Register service worker for caching
    registerServiceWorker();
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Performance monitoring
    setTimeout(() => {
      PerformanceMonitor.end('app-initialization');
    }, 100);

    // Cleanup function
    return () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEANUP_CACHE'
        });
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <DocumentTitle />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <a href="#main-content" className="skip-link">
                {t('navigation.skipToContent')}
              </a>
              <Layout>
                <main id="main-content">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/submit" element={<TicketFormPage />} />
                      <Route path="/track" element={<TicketTrackingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route 
                        path="/dashboard" 
                        element={
                          <SupportRoute>
                            <DashboardPage />
                          </SupportRoute>
                        } 
                      />
                      <Route 
                        path="/search" 
                        element={
                          <SupportRoute>
                            <SearchPage />
                          </SupportRoute>
                        } 
                      />
                      <Route
                        path="/admin/dashboard"
                        element={
                          <AdminRoute>
                            <AdminDashboardPage />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/settings"
                        element={
                          <AdminRoute>
                            <AdminSettingsPage />
                          </AdminRoute>
                        }
                      />
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    </Routes>
                  </Suspense>
                </main>
              </Layout>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#059669',
                    },
                  },
                  error: {
                    style: {
                      background: '#dc2626',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
