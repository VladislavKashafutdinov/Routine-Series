import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import { SeriesProgress } from './SeriesProgress';
import './ActivityCard.css';
import type { ActivityWithStreak } from '../types';

interface Props {
  activity: ActivityWithStreak;
}

export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
  const { t } = useLocale();
  const { updateName, toggleDone, deleteActivity } = useActivities();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== activity.name) {
      updateName(activity.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div className={`card ${activity.isDoneToday ? 'card--done' : ''}`}>
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
      <SeriesProgress completions={activity.completions} seriesLength={activity.seriesLength} />
      <button
        className={`card__done ${activity.isDoneToday ? 'card__done--yes' : 'card__done--no'}`}
        onClick={() => toggleDone(activity.id)}
      >
        {activity.isDoneToday ? t.doneToday : t.markDone}
      </button>
    </div>
  );
});
