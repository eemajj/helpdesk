import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language: 'th' | 'en') => {
    i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language as 'th' | 'en';

  const isRTL = false; // Thai and English are both LTR

  const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (currentLanguage === 'th') {
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    if (currentLanguage === 'th') {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'THB'
      }).format(amount);
    }
  };

  return {
    t,
    changeLanguage,
    currentLanguage,
    isRTL,
    formatThaiDate,
    formatCurrency
  };
};