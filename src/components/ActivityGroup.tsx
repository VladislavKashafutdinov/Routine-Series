import { memo, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { useLocale } from '../i18n/LocaleContext';
import { useActivitiesContext } from '../hooks/ActivitiesContext';
import type { ActivityWithSeries, Series, Completion } from '../types';

interface ActivityGroupProps {
  activity: ActivityWithSeries;
}

export const ActivityGroup = memo(function ActivityGroup({
  activity,
}: ActivityGroupProps) {
  const { t } = useLocale();
  const { toggleDone, deleteActivity, claimReward } = useActivitiesContext();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);

  useEffect(() => {
    const subscription = liveQuery(() =>
      Promise.all([
        db.series.where({ activityId: activity.id }).toArray(),
        db.completions.where({ activityId: activity.id }).toArray(),
      ])
    ).subscribe({
      next: ([sers, comps]) => {
        setSeriesList(sers.sort((a, b) => b.number - a.number));
        setCompletions(comps);
      },
      error: (err) => console.error(err),
    });
    return () => subscription.unsubscribe();
  }, [activity.id]);

  const activeSeries = seriesList.find((s) => s.status === 'active');
  const activeDays = activeSeries
    ? new Set(completions.filter((c) => c.seriesId === activeSeries.id).map((c) => c.date)).size
    : 0;
  const pct = activity.seriesLength > 0
    ? Math.round((activeDays / activity.seriesLength) * 100)
    : 0;

  const flameIcon = activity.isDoneToday ? '🔥' : '🕯️';

  return (
    <div className={`activity-group ${activity.isDoneToday ? 'activity-group--done' : ''}`}>
      <div className="activity-group__header">
        <span className="activity-group__name" title={activity.name}>
          {activity.name}
        </span>
        <button
          className="activity-group__delete"
          onClick={() => {
            if (confirm(t.deleteConfirm(activity.name))) deleteActivity(activity.id);
          }}
          title={t.deleteTitle}
        >
          ×
        </button>
      </div>

      <div className="activity-group__active">
        <div className="activity-group__progress">
          <div className="activity-group__bar">
            <div className="activity-group__fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="activity-group__progress-text">
            {activeSeries ? `#${activeSeries.number}` : '—'} {activeDays}/{activity.seriesLength}
          </span>
        </div>

        <button
          className={`activity-group__done ${
            activity.isDoneToday ? 'activity-group__done--yes' : 'activity-group__done--no'
          }`}
          onClick={() => toggleDone(activity.id)}
        >
          <span className="activity-group__flame">{flameIcon}</span>
          {activity.isDoneToday ? t.doneToday : t.markDone}
        </button>

        {activity.reward > 0 && (
          <div className="activity-group__reward-info">
            {t.rewardLabel}: {activity.reward} {activity.currency}
          </div>
        )}
      </div>

      {activity.lastCompletedSeries && activity.reward > 0 && (
        <button
          className="activity-group__claim"
          onClick={() => claimReward(activity.lastCompletedSeries!.id!)}
        >
          {t.claimReward}: {activity.reward} {activity.currency}
        </button>
      )}

      {seriesList.length > 0 && (
        <div className="activity-group__history">
          {seriesList.slice(0, 5).map((s) => {
            const days = new Set(
              completions.filter((c) => c.seriesId === s.id).map((c) => c.date)
            ).size;
            return (
              <div
                key={s.id}
                className={`activity-group__series activity-group__series--${s.status}`}
              >
                <span className="activity-group__series-num">#{s.number}</span>
                <span className="activity-group__series-days">
                  {days}/{activity.seriesLength}
                </span>
                <span className="activity-group__series-status">
                  {s.status === 'completed'
                    ? s.rewardIssued
                      ? '✓'
                      : t.statusCompleted
                    : s.status === 'broken'
                      ? '✗'
                      : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
