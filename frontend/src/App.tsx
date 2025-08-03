import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useLanguage } from './hooks/useLanguage';
import Layout from './components/Layout';
import DocumentTitle from './components/DocumentTitle';
import HomePage from './pages/HomePage';
import TicketFormPage from './pages/TicketFormPage';
import TicketTrackingPage from './pages/TicketTrackingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';

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
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/submit" element={<TicketFormPage />} />
              <Route path="/track" element={<TicketTrackingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Routes>
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