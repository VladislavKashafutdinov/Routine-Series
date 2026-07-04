import { useState } from 'react';
import { useActivities } from './hooks/useActivities';
import { ActivitiesProvider } from './hooks/ActivitiesContext';
import { AddActivity } from './components/AddActivity';
import { LangSwitcher } from './components/LangSwitcher';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';
import type { ActivityWithSeries } from './types';
import './App.css';

function App() {
  const data = useActivities();
  const [historyTarget, setHistoryTarget] =
    useState<ActivityWithSeries | null>(null);

  return (
    <ActivitiesProvider value={data}>
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
          <HistoryModal
            activity={historyTarget}
            onClose={() => setHistoryTarget(null)}
          />
        )}
      </div>
    </ActivitiesProvider>
  );
}

export default App;
