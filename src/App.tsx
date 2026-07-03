import { useState } from 'react';
import { useActivities } from './hooks/useActivities';
import { useLocale } from './i18n/LocaleContext';
import { AddActivity } from './components/AddActivity';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';
import type { ActivityWithSeries } from './types';
import './App.css';

function App() {
  const { activities, loading, addActivity, toggleDone, claimReward, deleteActivity } =
    useActivities();
  const [historyTarget, setHistoryTarget] =
    useState<ActivityWithSeries | null>(null);
  const { lang, setLang } = useLocale();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <button
          className="app-lang"
          onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
          title={lang === 'en' ? 'Русский' : 'English'}
        >
          {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
        </button>
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
        />
      )}
    </div>
  );
}

export default App;
