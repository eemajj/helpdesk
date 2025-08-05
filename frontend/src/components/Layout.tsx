import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, HelpCircle, Search, User, Home, Languages } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'th' ? 'en' : 'th');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('site.title')}</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('site.subtitle')}</p>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('navigation.home')}</span>
              </Link>
              
              <Link
                to="/submit"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/submit') 
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t('navigation.submit')}</span>
              </Link>
              
              <Link
                to="/track"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/track') 
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>{t('navigation.track')}</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/search"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/search') 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('navigation.search')}</span>
                </Link>
              )}

              {user && user.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin/dashboard') 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={t('language.switch')}
                title={`${t('language.switch')} (${currentLanguage === 'th' ? t('language.english') : t('language.thai')})`}
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell />
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.fullName}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {t('navigation.logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary"
                >
                  {t('navigation.login')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('navigation.home')}
            </Link>
            <Link
              to="/submit"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/submit') 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('navigation.submit')}
            </Link>
            <Link
              to="/track"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/track') 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('navigation.track')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;