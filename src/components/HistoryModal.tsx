import { useEffect } from 'react';
import { getDateRange } from '../utils/date';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithStreak } from '../types';

interface Props {
  activity: ActivityWithStreak;
  onClose: () => void;
}

export function HistoryModal({ activity, onClose }: Props) {
  const { t } = useLocale();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const dates = getDateRange(60);
  const doneSet = new Set(activity.completions.map((c) => c.date));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal__header">
          <h2>{activity.name}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__stats">
          <div>{t.currentStreak} {activity.currentStreak} {t.daysSuffix(activity.currentStreak)}</div>
          <div>{t.longestStreak} {activity.longestStreak} {t.daysSuffix(activity.longestStreak)}</div>
        </div>
        <h3 className="modal__sub">{t.lastNDays(60)}</h3>
        <div className="modal__grid">
          {dates.map((d) => (
            <div key={d} className={`modal__day ${doneSet.has(d) ? 'modal__day--done' : ''}`} title={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
