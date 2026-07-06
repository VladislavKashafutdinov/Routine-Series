import { useState } from 'react';
import { AddActivity } from './components/AddActivity';
import { LangSwitcher } from './components/LangSwitcher';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';
import type { ActivityWithStreak } from './types';
import './App.css';

export default function App() {
  const [historyTarget, setHistoryTarget] = useState<ActivityWithStreak | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
      </header>
      <main className="app-main">
        <AddActivity />
        <Dashboard onShowHistory={setHistoryTarget} />
      </main>
      {historyTarget && (
        <HistoryModal activity={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
