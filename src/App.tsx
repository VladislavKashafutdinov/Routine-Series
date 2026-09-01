import { useMemo, useState } from 'react';
import { HeaderMenu } from '@components/HeaderMenu/HeaderMenu';
import { PageTabs } from '@components/PageTabs/PageTabs';
import { Dashboard } from '@components/Dashboard/Dashboard';
import { MonitoringPage } from '@components/MonitoringPage/MonitoringPage';
import { RewardsPage } from '@components/RewardsPage/RewardsPage';
import { ArchivePage } from '@components/ArchivePage/ArchivePage';
import { LoadingOverlay } from '@components/LoadingOverlay/LoadingOverlay';
import { LoadError } from '@components/LoadError/LoadError';
import { LoginPage } from '@components/LoginPage/LoginPage';
import { ActivitiesProvider } from '@/hooks/ActivitiesContext';
import { SeriesProvider, useAllSeries } from '@/hooks/SeriesContext';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/AuthContext';
import { calcUnissuedEntries } from '@/utils/rewards';
import type { Page } from '@components/PageTabs/PageTabs';
import './App.css';

function MainApp() {
  const [page, setPage] = useState<Page>('dashboard');
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
        <HeaderMenu onOpenArchive={() => setPage('archive')} />
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
