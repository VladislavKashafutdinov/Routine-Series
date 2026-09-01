import { useRef, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { Spinner } from '@components/Spinner/Spinner';
import { fetchActivities, fetchArchivedActivities } from '@/api/activities';
import { fetchCompletions } from '@/api/completions';
import { importData } from '@/api/dataimport';
import { fetchRewardIssues } from '@/api/rewardIssues';
import { fetchSeriesDefinitions } from '@/api/seriesDefinitions';
import { toExportActivity, toExportCompletion, toExportRewardIssue, toExportSeriesDefinition } from '@/api/mapping';
import type { ExportPayload } from '@/api/types';
import './DataActions.css';

// Export must cover everything: completions from epoch to far future
const EXPORT_FROM = '1970-01-01';
const EXPORT_TO = '9999-12-31';
const REWARD_ISSUES_LIMIT = 1000;

export function DataActions() {
  const { t, lang } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const [active, archived] = await Promise.all([
        fetchActivities(),
        fetchArchivedActivities(),
      ]);
      const all = [...(active ?? []), ...(archived ?? [])];
      const ids = all.map((a) => a.id);

      const [defs, comps, issues] = await Promise.all([
        Promise.all(ids.map((id) => fetchSeriesDefinitions(id))),
        Promise.all(ids.map((id) => fetchCompletions(id, EXPORT_FROM, EXPORT_TO))),
        Promise.all(ids.map((id) => fetchRewardIssues(id, REWARD_ISSUES_LIMIT, 0))),
      ]);

      const data: ExportPayload = {
        activities: all.map(toExportActivity),
        seriesDefinitions: defs.flat().map(toExportSeriesDefinition),
        completions: comps.flat().map(toExportCompletion),
        rewardIssues: issues.flatMap((p) => p?.items ?? []).map(toExportRewardIssue),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routine-series-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert(lang === 'en' ? 'Export failed' : 'Ошибка экспорта');
    }
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

    setImporting(true);
    try {
      // Validate structure before upload
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.activities || !data.seriesDefinitions || !data.completions || !data.rewardIssues) {
        throw new Error('Invalid file structure');
      }

      await importData(file);

      alert(lang === 'en' ? 'Import complete. Reloading...' : 'Импорт завершён. Перезагрузка...');
      window.location.reload();
    } catch (err) {
      console.error('Import failed:', err);
      alert(lang === 'en' ? 'Invalid file format' : 'Неверный формат файла');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="data-actions">
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
      <button className="data-actions__btn" onClick={handleExport} disabled={importing} title={t.exportButton}>
        ⤓ {t.exportButton}
      </button>
      <button className="data-actions__btn" onClick={handleImport} disabled={importing} title={t.importButton}>
        {importing ? <Spinner /> : <>⤒ {t.importButton}</>}
      </button>
    </div>
  );
}
