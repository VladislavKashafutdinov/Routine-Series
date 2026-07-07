import { useState } from 'react';
import { LangSwitcher } from './components/LangSwitcher';
import { PageTabs } from './components/PageTabs';
import { AddActivity } from './components/AddActivity';
import type { Page } from './components/PageTabs';
import './App.css';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
        <PageTabs page={page} onChange={setPage} />
      </header>
      <main className="app-main">
        {page === 'dashboard' && <AddActivity />}
        {page === 'monitoring' && <div className="app-placeholder">Мониторинг (будет в задаче 10)</div>}
        {page === 'archive' && <div className="app-placeholder">Архив (будет в задаче 11)</div>}
      </main>
    </div>
  );
}
