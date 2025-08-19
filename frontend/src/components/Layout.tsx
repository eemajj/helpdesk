import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Search, User, Home, Languages, BarChart3, Settings, Headphones, FileText } from 'lucide-react';
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

  // Hamburger Menu for ALL screen sizes

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'th' ? 'en' : 'th');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="group flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-lg flex items-center justify-center group-hover:shadow-primary-500/25 transition-all duration-300">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-200 bg-clip-text text-transparent">{t('site.title')}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-48 truncate leading-tight">{t('site.subtitle')}</p>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">DWF</h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - NOW HIDDEN, USING HAMBURGER FOR ALL SCREEN SIZES */}

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Essential Controls - Always visible */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleLanguage}
                  className="p-2 rounded-lg bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                  aria-label={t('language.switch')}
                  title={`${t('language.switch')} (${currentLanguage === 'th' ? t('language.english') : t('language.thai')})`}
                >
                  <Languages className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                  aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-600 hover:text-primary-500" />
                  )}
                </button>

                {user && <NotificationBell />}
              </div>

              {/* 🍔 HAMBURGER MENU BUTTON - NOW VISIBLE ON ALL SCREEN SIZES */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 rounded-xl bg-primary-100/80 dark:bg-primary-900/80 hover:bg-primary-200 dark:hover:bg-primary-800 transition-all duration-200 hover:scale-105 backdrop-blur-sm border-2 border-primary-300 dark:border-primary-700"
                aria-label="Toggle menu"
                title={t('menu.toggle')}
              >
                <div className="relative w-6 h-6 flex flex-col justify-center">
                  <div className={`w-6 h-0.5 bg-primary-700 dark:bg-primary-300 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></div>
                  <div className={`w-6 h-0.5 bg-primary-700 dark:bg-primary-300 transition-all duration-300 mt-1 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-6 h-0.5 bg-primary-700 dark:bg-primary-300 transition-all duration-300 mt-1 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 🍔 HAMBURGER MENU DROPDOWN - NOW VISIBLE ON ALL SCREEN SIZES */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 z-50">
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                {/* Hamburger Menu Content */}
                
                {/* User Info - Now on ALL screen sizes */}
                {user && (
                  <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400">
                        {t(`user.role.${user.role}` as any)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/') 
                      ? 'text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-md border border-primary-200/50 dark:border-primary-700/50' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>{t('navigation.home')}</span>
                </Link>

                <Link
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/submit') 
                      ? 'text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>{t('navigation.submit')}</span>
                </Link>

                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/track') 
                      ? 'text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-md border border-primary-200/50 dark:border-primary-700/50' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Search className="w-5 h-5" />
                  <span>{t('navigation.track')}</span>
                </Link>

                {/* Authenticated Menu Items */}
                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('menu.staff')}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive('/dashboard') 
                          ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>{t('navigation.dashboard')}</span>
                    </Link>

                    <Link
                      to="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive('/search') 
                          ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Search className="w-5 h-5" />
                      <span>{t('navigation.search')}</span>
                    </Link>

                    {user && user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive('/admin/dashboard') 
                            ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        <span>{t('navigation.admin')}</span>
                      </Link>
                    )}
                  </>
                )}

                {/* Bottom Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
                  <div className="flex items-center justify-between px-4 py-2 mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('menu.settings')}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleLanguage}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title={currentLanguage === 'th' ? 'English' : 'ภาษาไทย'}
                      >
                        <Languages className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {isDark ? (
                          <Sun className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Moon className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span>{t('navigation.logout')}</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25 transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span>{t('navigation.login')}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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