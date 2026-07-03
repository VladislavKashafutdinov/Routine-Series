import { useEffect } from 'react';
import { getDateRange } from '../utils/date';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithStreak } from '../types';

interface HistoryModalProps {
  activity: ActivityWithStreak;
  onClose: () => void;
}

export function HistoryModal({ activity, onClose }: HistoryModalProps) {
  const { t } = useLocale();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const dates = getDateRange(60);
  const doneSet = new Set(activity.completions.map((c) => c.date));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t.historyAria(activity.name)}
      >
        <div className="modal__header">
          <h2>{activity.name}</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal__stats">
          <div>
            <strong>{t.currentStreak}</strong> {activity.currentStreak} {t.daysSuffix(activity.currentStreak)}
          </div>
          <div>
            <strong>{t.longestStreak}</strong> {activity.longestStreak} {t.daysSuffix(activity.longestStreak)}
          </div>
        </div>

        <h3 className="modal__subtitle">{t.lastNDays(60)}</h3>
        <div className="modal__grid">
          {dates.map((d) => (
            <div
              key={d}
              className={`modal__day ${doneSet.has(d) ? 'modal__day--done' : ''}`}
              title={d}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
