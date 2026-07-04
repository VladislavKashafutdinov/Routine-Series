import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { getDateRange, today } from '../utils/date';
import { useLocale } from '../i18n/LocaleContext';
import { useActivitiesContext } from '../hooks/ActivitiesContext';
import type { ActivityWithSeries, Series, Completion } from '../types';

interface HistoryModalProps {
  activity: ActivityWithSeries;
  onClose: () => void;
}

export function HistoryModal({ activity, onClose }: HistoryModalProps) {
  const { t } = useLocale();
  const { toggleDate } = useActivitiesContext();
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [allCompletions, setAllCompletions] = useState<Completion[]>([]);
  const todayStr = today();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const subscription = liveQuery(() =>
      Promise.all([
        db.series.where({ activityId: activity.id }).toArray(),
        db.completions.where({ activityId: activity.id }).toArray(),
      ])
    ).subscribe({
      next: ([sers, comps]) => {
        setAllSeries(sers.sort((a, b) => b.number - a.number));
        setAllCompletions(comps);
      },
      error: (err) => console.error(err),
    });
    return () => subscription.unsubscribe();
  }, [activity.id]);

  const dates = getDateRange(60);

  const activeSeries = allSeries.find((s) => s.status === 'active');
  const activeDoneSet = new Set(
    allCompletions
      .filter((c) => activeSeries && c.seriesId === activeSeries.id)
      .map((c) => c.date)
  );

  const otherDoneSet = new Set(
    allCompletions
      .filter((c) => !activeSeries || c.seriesId !== activeSeries.id)
      .map((c) => c.date)
  );

  const isEditable = !!activeSeries;

  const handleDayClick = (date: string) => {
    if (!isEditable) return;
    if (date > todayStr) return;
    toggleDate(activity.id, date);
  };

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
            {t.seriesLengthLabel}: {activity.seriesLength} {t.daysSuffix(activity.seriesLength)}
          </div>
          <div>
            {t.rewardLabel}: {activity.reward} {activity.currency}
          </div>
        </div>

        <h3 className="modal__subtitle">
          {t.lastNDays(60)}
          {isEditable && <span className="modal__hint"> — {t.clickToToggle}</span>}
        </h3>
        <div className="modal__grid">
          {dates.map((d) => {
            const isActive = activeDoneSet.has(d);
            const isOther = otherDoneSet.has(d);
            const isFuture = d > todayStr;
            const clickable = isEditable && !isFuture;

            let cls = 'modal__day';
            if (isActive) cls += ' modal__day--active';
            else if (isOther) cls += ' modal__day--other';
            if (isFuture) cls += ' modal__day--future';
            if (clickable) cls += ' modal__day--clickable';

            return (
              <div
                key={d}
                className={cls}
                title={isFuture ? d : clickable ? `${d} — ${t.clickToToggle}` : d}
                onClick={() => handleDayClick(d)}
              />
            );
          })}
        </div>

        <h3 className="modal__subtitle">{t.seriesHistory}</h3>
        {allSeries.length === 0 ? (
          <p className="modal__empty">{t.noSeriesYet}</p>
        ) : (
          <ul className="modal__series-list">
            {allSeries.map((s) => {
              const comps = allCompletions.filter((c) => c.seriesId === s.id);
              const days = new Set(comps.map((c) => c.date)).size;
              return (
                <li key={s.id} className={`modal__series-item modal__series-item--${s.status}`}>
                  <span className="modal__series-num">#{s.number}</span>
                  <span className="modal__series-days">
                    {days}/{activity.seriesLength} {t.daysSuffix(activity.seriesLength)}
                  </span>
                  <span className="modal__series-status">
                    {s.status === 'completed'
                      ? s.rewardIssued
                        ? t.statusRewardClaimed
                        : t.statusCompleted
                      : s.status === 'broken'
                        ? t.statusBroken
                        : t.statusActive}
                  </span>
                  {s.status === 'completed' && activity.reward > 0 && (
                    <span className="modal__series-reward">
                      {s.rewardIssued ? '✓' : ''} {activity.reward} {activity.currency}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
