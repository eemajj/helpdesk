import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, HelpCircle, Search, User, Home, Languages, BarChart3, Settings, Menu, X, Headphones, FileText } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'th' ? 'en' : 'th');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-4">
              <Link to="/" className="group flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-lg flex items-center justify-center group-hover:shadow-primary-500/25 transition-all duration-300">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-200 bg-clip-text text-transparent">{t('site.title')}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-48 truncate leading-tight">{t('site.subtitle')}</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">DWF</h1>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  isActive('/') 
                    ? 'text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-md border border-primary-200/50 dark:border-primary-700/50' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Home className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive('/') ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span>{t('navigation.home')}</span>
              </Link>
              
              <Link
                to="/submit"
                className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  isActive('/submit') 
                    ? 'text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <FileText className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive('/submit') ? 'text-white' : ''}`} />
                <span>{t('navigation.submit')}</span>
              </Link>
              
              <Link
                to="/track"
                className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  isActive('/track') 
                    ? 'text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-md border border-primary-200/50 dark:border-primary-700/50' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Search className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive('/track') ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span>{t('navigation.track')}</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>{t('navigation.dashboard')}</span>
                  </Link>

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

                  {user && user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/dashboard') 
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('navigation.admin')}</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLanguage}
                className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-sm"
                aria-label={t('language.switch')}
                title={`${t('language.switch')} (${currentLanguage === 'th' ? t('language.english') : t('language.thai')})`}
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-sm"
                aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 hover:text-primary-600" />
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell />
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="nav-text thai-text">{user.fullName}</span>
                    <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex-shrink-0 thai-text">
                      {user.role === 'admin' ? 'ผู้ดูแล' : user.role === 'support' ? 'เจ้าหน้าที่' : 'ผู้ใช้'}
                    </span>
                  </div>
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

        {/* Mobile menu button */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {user && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="nav-text thai-text">{user.fullName}</span>
                <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded flex-shrink-0 thai-text">
                  {user.role === 'admin' ? 'ผู้ดูแล' : user.role === 'support' ? 'เจ้าหน้าที่' : 'ผู้ใช้'}
                </span>
              </div>
            )}
          </div>
          
          {/* Mobile navigation menu */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
              <div className="px-4 py-3 space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/') 
                      ? 'text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-md border border-primary-200/50 dark:border-primary-700/50' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>{t('navigation.home')}</span>
                </Link>
                <Link
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/submit') 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('navigation.submit')}</span>
                </Link>
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/track') 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('navigation.track')}</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard') 
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{t('navigation.dashboard')}</span>
                    </Link>
                    <Link
                      to="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/search') 
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span>{t('navigation.search')}</span>
                    </Link>
                    {user && user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/dashboard') 
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('navigation.admin')}</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      <User className="w-4 h-4" />
                      <span>{t('navigation.logout')}</span>
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-primary-600 dark:text-primary-400"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('navigation.login')}</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-lg shadow-md flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-200 bg-clip-text text-transparent">{t('site.title')}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('site.subtitle')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;