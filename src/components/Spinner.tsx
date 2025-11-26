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
        <div className="spinner-orbit">
          <div className="spinner-planet" />
        </div>
        <p className="spinner-text">{message ?? t('common.loading')}</p>
      </div>
    </div>
  );
}
