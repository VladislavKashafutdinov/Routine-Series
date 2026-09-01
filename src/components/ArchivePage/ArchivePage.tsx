import { memo, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useActivities } from '@/hooks/useActivities';
import { Spinner } from '@components/Spinner/Spinner';
import './ArchivePage.css';

export const ArchivePage = memo(function ArchivePage() {
  const { t } = useLocale();
  const { archivedActivities, unarchiveActivity } = useActivities();
  const [pendingId, setPendingId] = useState<number | null>(null);

  return (
    <div className="archive">
      <h2 className="archive__title">{t.archiveTitle}</h2>
      {archivedActivities.length === 0 ? (
        <p className="archive__empty">{t.archiveEmpty}</p>
      ) : (
        <div className="archive__list">
          {archivedActivities.map((a) => (
            <div key={a.id} className="archive__row">
              <span className="archive__name">{a.name}</span>
              <span className="archive__comps">{a.completions.length} {t.daysSuffix(a.completions.length)}</span>
              <button
                className="archive__restore"
                disabled={pendingId !== null}
                onClick={() => {
                  if (confirm(t.restoreConfirm(a.name))) {
                    setPendingId(a.id);
                    unarchiveActivity(a.id).finally(() => setPendingId(null));
                  }
                }}
                type="button"
              >
                {pendingId === a.id ? <Spinner /> : t.restore}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
