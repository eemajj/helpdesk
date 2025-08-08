import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import thTranslations from './locales/th.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: {
        translation: thTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    lng: 'th',
    fallbackLng: 'th',
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false
    },
    debug: true // Add this line for debugging
  });

export default i18n;