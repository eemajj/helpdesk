import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Clock, Users } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in">
            {t('homepage.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in">
            {t('homepage.subtitle')}
            <br />
            {t('homepage.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/submit" className="btn-primary px-8 py-3 text-lg">
              <HelpCircle className="w-5 h-5 mr-2" />
              {t('homepage.submitNew')}
            </Link>
            <Link to="/track" className="btn-secondary px-8 py-3 text-lg">
              <Search className="w-5 h-5 mr-2" />
              {t('homepage.trackStatus')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('homepage.features.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('homepage.features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('homepage.features.easyReport.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('homepage.features.easyReport.description')}
              </p>
            </div>

            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('homepage.features.realTimeTracking.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('homepage.features.realTimeTracking.description')}
              </p>
            </div>

            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('homepage.features.professionalTeam.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('homepage.features.professionalTeam.description')}
              </p>
            </div>

            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('homepage.features.reportSystem.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
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
      <section className="py-16 bg-primary-600 dark:bg-primary-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('homepage.cta.title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('homepage.cta.description')}
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            {t('homepage.cta.startReport')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;