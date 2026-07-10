import './ActivityCard.css';

import { latestDef, useActivities } from '../hooks/useActivities';
import { memo, useState } from 'react';

import type { ActivityWithStreak } from '../types';
import { SeriesProgress } from './SeriesProgress';
import { computeSeries, findCurrentSeries } from '../utils/series';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';

interface Props {
  activity: ActivityWithStreak;
}

export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { updateName, toggleDone, deleteActivity } = useActivities();

  // Find current series (window contains virtualToday)
  const series = computeSeries(activity.seriesDefinitions, activity.completions, virtualToday);
  const currentSeries = findCurrentSeries(series, virtualToday);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);

  const isDoneToday = activity.completions.some((c) => c.date === virtualToday);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== activity.name) {
      updateName(activity.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div className={`card ${isDoneToday ? 'card--done' : ''}`}>
      <div className="card__header">
        {editing ? (
          <input
            className="card__name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setName(activity.name); setEditing(false); } }}
            autoFocus
          />
        ) : (
          <span
            className="card__name"
            title={activity.name}
            onClick={() => { setName(activity.name); setEditing(true); }}
          >
            {activity.name}
          </span>
        )}
        <button
          className="card__del"
          onClick={() => { if (confirm(t.deleteConfirm(activity.name))) deleteActivity(activity.id); }}
          title={t.deleteTitle}
        >
          ×
        </button>
      </div>
      {activity.seriesDefinitions.length > 0 && (
        <SeriesProgress
          startDate={currentSeries ? currentSeries.startDate : virtualToday}
          seriesLength={currentSeries ? currentSeries.seriesLength : latestDef(activity.seriesDefinitions, activity.id).seriesLength}
          doneCount={currentSeries ? currentSeries.completions.length : 0}
        />
      )}
      <button
        className={`card__done ${isDoneToday ? 'card__done--yes' : 'card__done--no'}`}
        onClick={() => toggleDone(activity.id)}
      >
        {isDoneToday ? t.doneToday : t.markDone}
      </button>
    </div>
  );
});
