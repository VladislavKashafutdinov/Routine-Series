import { useState } from 'react';
import { useActivities } from './hooks/useActivities';
import { AddActivity } from './components/AddActivity';
import { LangSwitcher } from './components/LangSwitcher';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';
import type { ActivityWithSeries } from './types';
import './App.css';

function App() {
  const { activities, loading, addActivity, toggleDone, toggleDate, claimReward, deleteActivity } =
    useActivities();
  const [historyTarget, setHistoryTarget] =
    useState<ActivityWithSeries | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
      </header>
      <main className="app-main">
        <AddActivity onAdd={addActivity} />
        <Dashboard
          activities={activities}
          loading={loading}
          onToggleDone={toggleDone}
          onDelete={deleteActivity}
          onShowHistory={setHistoryTarget}
          onClaimReward={claimReward}
        />
      </main>
      {historyTarget && (
        <HistoryModal
          activity={historyTarget}
          onClose={() => setHistoryTarget(null)}
          onToggleDate={toggleDate}
        />
      )}
    </div>
  );
}

export default App;
