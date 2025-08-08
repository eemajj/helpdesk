import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Clock, Users, FileText, Shield, Zap, Award, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-transparent via-primary-50/30 to-transparent dark:via-primary-900/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/50 dark:from-primary-900/10 dark:via-gray-800 dark:to-primary-800/10 py-20 lg:py-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.3)_1px,transparent_0)] bg-[size:40px_40px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>ระบบพร้อมให้บริการ 24/7</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
              <span className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-400 dark:via-primary-300 dark:to-primary-200 bg-clip-text text-transparent">
                {t('homepage.title')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-4xl mx-auto animate-fade-in text-balance leading-relaxed">
              {t('homepage.subtitle')}
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto animate-fade-in">
              {t('homepage.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <Link to="/submit" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 transition-all duration-300">
                <FileText className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                {t('homepage.submitNew')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/track" className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-105 transition-all duration-300 shadow-md">
                <Search className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                {t('homepage.trackStatus')}
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center animate-fade-in">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ให้บริการ</div>
              </div>
              <div className="text-center animate-fade-in">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">&lt; 2 ชม.</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">เวลาตอบสนอง</div>
              </div>
              <div className="text-center animate-fade-in">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">99%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ความพึงพอใจ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t('homepage.features.title')}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('homepage.features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('homepage.features.easyReport.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('homepage.features.easyReport.description')}
              </p>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('homepage.features.realTimeTracking.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('homepage.features.realTimeTracking.description')}
              </p>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('homepage.features.professionalTeam.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('homepage.features.professionalTeam.description')}
              </p>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('homepage.features.reportSystem.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('homepage.features.reportSystem.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Types Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('homepage.problemTypes.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('homepage.problemTypes.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { nameKey: 'ticketForm.fields.problemType.options.computer', descKey: 'homepage.problemTypes.computer' },
              { nameKey: 'ticketForm.fields.problemType.options.internet', descKey: 'homepage.problemTypes.internet' },
              { nameKey: 'ticketForm.fields.problemType.options.printer', descKey: 'homepage.problemTypes.printer' },
              { nameKey: 'ticketForm.fields.problemType.options.information', descKey: 'homepage.problemTypes.information' },
              { nameKey: 'ticketForm.fields.problemType.options.installation', descKey: 'homepage.problemTypes.installation' },
              { nameKey: 'ticketForm.fields.problemType.options.others', descKey: 'homepage.problemTypes.others' }
            ].map((item, index) => (
              <div key={index} className="card animate-fade-in">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t(item.nameKey)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t(item.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:60px_60px]"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Star className="w-4 h-4 text-yellow-300" />
            <span>เริ่มต้นใช้งานวันนี้</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('homepage.cta.title')}
          </h2>
          
          <p className="text-xl md:text-2xl text-primary-100 mb-10 leading-relaxed max-w-3xl mx-auto">
            {t('homepage.cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/submit"
              className="group inline-flex items-center px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-2xl shadow-black/20 text-lg"
            >
              <FileText className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
              {t('homepage.cta.startReport')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/track"
              className="group inline-flex items-center px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border-2 border-white/30 hover:bg-white/10 hover:border-white/50 hover:scale-105 transition-all duration-300 text-lg"
            >
              <Search className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              ตรวจสอบสถานะ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;