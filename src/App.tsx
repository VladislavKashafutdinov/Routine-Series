import { useState } from 'react';
import { LangSwitcher } from './components/LangSwitcher';
import { PageTabs } from './components/PageTabs';
import { TimeTravel } from './components/TimeTravel';
import { Dashboard } from './components/Dashboard';
import { MonitoringPage } from './components/MonitoringPage';
import { ArchivePage } from './components/ArchivePage';
import type { Page } from './components/PageTabs';
import './App.css';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
        <TimeTravel />
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
