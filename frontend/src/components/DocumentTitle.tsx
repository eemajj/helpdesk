import { useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const DocumentTitle: React.FC = () => {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = t('site.title');
  }, [t]);

  return null;
};

export default DocumentTitle;