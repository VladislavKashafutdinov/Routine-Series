import { useRef } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { db } from '@/db/db';
import './DataActions.css';

export function DataActions() {
  const { lang } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);

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
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const msg = lang === 'en'
      ? 'This will replace ALL existing data. Continue?'
      : 'Это заменит ВСЕ существующие данные. Продолжить?';
    if (!confirm(msg)) { e.target.value = ''; return; }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.activities || !data.seriesDefinitions || !data.completions || !data.rewardIssues) {
        throw new Error('Invalid file structure');
      }

      // Convert date strings back to Date objects
      const acts = data.activities.map((a: any) => ({ ...a, createdAt: new Date(a.createdAt) }));
      const defs = data.seriesDefinitions.map((d: any) => ({ ...d, createdAt: new Date(d.createdAt) }));

      // Clear and re-import
      await db.transaction('rw',
        db.activities, db.seriesDefinitions, db.completions, db.rewardIssues,
        async () => {
          await db.activities.clear();
          await db.seriesDefinitions.clear();
          await db.completions.clear();
          await db.rewardIssues.clear();
          await db.activities.bulkAdd(acts);
          await db.seriesDefinitions.bulkAdd(defs);
          await db.completions.bulkAdd(data.completions);
          await db.rewardIssues.bulkAdd(data.rewardIssues);
        }
      );

      alert(lang === 'en' ? 'Import complete. Reloading...' : 'Импорт завершён. Перезагрузка...');
      window.location.reload();
    } catch (err) {
      alert(lang === 'en' ? 'Invalid file format' : 'Неверный формат файла');
    }
    e.target.value = '';
  };

  return (
    <div className="data-actions">
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
      <button className="data-actions__btn" onClick={handleExport} title={lang === 'en' ? 'Export' : 'Экспорт'}>
        ⤓
      </button>
      <button className="data-actions__btn" onClick={handleImport} title={lang === 'en' ? 'Import' : 'Импорт'}>
        ⤒
      </button>
    </div>
  );
}
