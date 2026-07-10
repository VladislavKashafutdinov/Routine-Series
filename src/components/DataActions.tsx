import { useLocale } from '../i18n/LocaleContext';
import { db } from '../db/db';
import './DataActions.css';

export function DataActions() {
  const { lang } = useLocale();

  const handleExport = async () => {
    const [activities, seriesDefinitions, completions, rewardIssues] = await Promise.all([
      db.activities.toArray(),
      db.seriesDefinitions.toArray(),
      db.completions.toArray(),
      db.rewardIssues.toArray(),
    ]);
    const data = { activities, seriesDefinitions, completions, rewardIssues };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine-series-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    // TODO: next sub-item
  };

  return (
    <div className="data-actions">
      <button className="data-actions__btn" onClick={handleExport} title={lang === 'en' ? 'Export' : 'Экспорт'}>
        ⤓
      </button>
      <button className="data-actions__btn" onClick={handleImport} title={lang === 'en' ? 'Import' : 'Импорт'}>
        ⤒
      </button>
    </div>
  );
}
