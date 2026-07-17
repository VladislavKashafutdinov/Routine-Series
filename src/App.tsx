import { useState } from 'react';
import { LangSwitcher } from './components/LangSwitcher/LangSwitcher';
import { PageTabs } from './components/PageTabs/PageTabs';
import { TimeTravel } from './components/TimeTravel/TimeTravel';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MonitoringPage } from './components/MonitoringPage/MonitoringPage';
import { ArchivePage } from './components/ArchivePage/ArchivePage';
import { DataActions } from './components/DataActions/DataActions';
import type { Page } from './components/PageTabs/PageTabs';
import './App.css';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
        <TimeTravel />
        <DataActions />
        <PageTabs page={page} onChange={setPage} />
      </header>
      <main className="app-main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'monitoring' && <MonitoringPage />}
        {page === 'archive' && <ArchivePage />}
      </main>
    </div>
  );
}
