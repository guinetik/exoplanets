/**
 * Loading Spinner Component
 * Displays while data is being loaded
 */

import { useTranslation } from 'react-i18next';

interface SpinnerProps {
  message?: string;
}

export default function Spinner({ message }: SpinnerProps) {
  const { t } = useTranslation();

  return (
    <div className="spinner-container">
      <div className="spinner-content">
        <img 
          src="/favicon.svg" 
          alt="Loading..." 
          className="w-32 h-32"
          style={{ 
            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        <p className="spinner-text">{message ?? t('common.loading')}</p>
      </div>
    </div>
  );
}
