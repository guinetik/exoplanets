import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, Spinner } from './components';
import { useData } from './context/DataContext';
import { usePageTracking } from './hooks/useAnalytics';

export default function App() {
  const { t } = useTranslation();
  const { isLoading, error } = useData();

  // Track page views on route changes
  usePageTracking();

  // Show spinner while data is loading
  if (isLoading) {
    return <Spinner />;
  }

  // Show error if data failed to load
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-title">{t('common.error')}</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
