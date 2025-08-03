import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useLanguage } from './hooks/useLanguage';
import Layout from './components/Layout';
import DocumentTitle from './components/DocumentTitle';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const TicketFormPage = lazy(() => import('./pages/TicketFormPage'));
const TicketTrackingPage = lazy(() => import('./pages/TicketTrackingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const AppContent: React.FC = () => {
  const { t } = useLanguage();

  return (
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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/search" element={<SearchPage />} />
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
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;