import { useMemo, useState } from 'react';
import { LangSwitcher } from '@components/LangSwitcher/LangSwitcher';
import { PageTabs } from '@components/PageTabs/PageTabs';
import { TimeTravel } from '@components/TimeTravel/TimeTravel';
import { Dashboard } from '@components/Dashboard/Dashboard';
import { MonitoringPage } from '@components/MonitoringPage/MonitoringPage';
import { RewardsPage } from '@components/RewardsPage/RewardsPage';
import { ArchivePage } from '@components/ArchivePage/ArchivePage';
import { DataActions } from '@components/DataActions/DataActions';
import { LoadingOverlay } from '@components/LoadingOverlay/LoadingOverlay';
import { LoadError } from '@components/LoadError/LoadError';
import { LoginPage } from '@components/LoginPage/LoginPage';
import { ActivitiesProvider } from '@/hooks/ActivitiesContext';
import { SeriesProvider, useAllSeries } from '@/hooks/SeriesContext';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { calcUnissuedEntries } from '@/utils/rewards';
import type { Page } from '@components/PageTabs/PageTabs';
import './App.css';

function MainApp() {
  const [page, setPage] = useState<Page>('dashboard');
  const { logout } = useAuth();
  const { t } = useLocale();
  const { loading, loadError, retryLoad, activities } = useActivities();
  const seriesMap = useAllSeries();
  const unissuedCount = useMemo(
    () => calcUnissuedEntries(activities, seriesMap).length,
    [activities, seriesMap],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
        <button className="app-logout" type="button" onClick={() => void logout()}>
          {t.logoutButton}
        </button>
        <TimeTravel />
        <DataActions />
        <PageTabs page={page} onChange={setPage} badges={{ rewards: unissuedCount }} />
      </header>
      <main className="app-main">
        {loadError ? (
          <LoadError retry={retryLoad} />
        ) : (
          <>
            {page === 'dashboard' && <Dashboard />}
            {page === 'monitoring' && <MonitoringPage />}
            {page === 'rewards' && <RewardsPage />}
            {page === 'archive' && <ArchivePage />}
          </>
        )}
      </main>
      {loading && <LoadingOverlay />}
    </div>
  );
}

export default function App() {
  const { status } = useAuth();

  // Unauthenticated users see only the login screen; data providers mount
  // (and load from the API) only once authenticated.
  if (status === 'unauthenticated') return <LoginPage />;
  if (status === 'loading') return <LoadingOverlay />;

  return (
    <ActivitiesProvider>
      <SeriesProvider>
        <MainApp />
      </SeriesProvider>
    </ActivitiesProvider>
  );
}
