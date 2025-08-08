import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Shield, Users, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import toast from 'react-hot-toast';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success(t('messages.loginSuccess'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-[calc(100vh-8rem)]">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">DWF Helpdesk</h1>
              <p className="text-xl text-primary-100 mb-8">
กรมกิจการสตรีและสถาบันครอบครัว<br />
ระบบแจ้งปัญหาและติดตามงาน IT</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary-200" />
                <span className="text-primary-100">ระบบจัดการผู้ใช้งานแบบครบวงจร</span>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-primary-200" />
                <span className="text-primary-100">เครื่องมือจัดการ Ticket ขั้นสูง</span>
              </div>
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-primary-200" />
                <span className="text-primary-100">การสนับสนุนแบบ Real-time</span>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-20 h-20 bg-white/5 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
          <div className="max-w-md w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="lg:hidden mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('login.title')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('login.description')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('login.fields.username.label')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        {...register('username', { required: t('login.errors.usernameRequired') })}
                        className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                          errors.username 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        placeholder={t('login.fields.username.placeholder')}
                        aria-describedby={errors.username ? 'username-error' : undefined}
                      />
                    </div>
                    {errors.username && (
                      <p id="username-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('login.fields.password.label')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        {...register('password', { required: t('login.errors.passwordRequired') })}
                        className={`block w-full pl-12 pr-12 py-3 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                          errors.password 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        placeholder={t('login.fields.password.placeholder')}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('login.button.loading')}</span>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>{t('login.button.login')}</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('login.forgotPassword')}
              </p>
              
              {/* Demo Credentials */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-left">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">บัญชีทดสอบ:</h4>
                <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                  <div><strong>Admin:</strong> admin / admin123</div>
                  <div><strong>Support:</strong> support1 / support123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;