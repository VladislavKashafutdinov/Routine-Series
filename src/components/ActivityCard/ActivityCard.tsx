import './ActivityCard.css';

import { latestDef, useActivities } from '@/hooks/useActivities';
import { memo, useState } from 'react';

import type { ActivityWithStreak } from '@/types';
import { SeriesProgress } from '@components/SeriesProgress/SeriesProgress';
import { Spinner } from '@components/Spinner/Spinner';
import { findCurrentSeries } from '@/utils/series';
import { useLocale } from '@/i18n/LocaleContext';
import { useSeries } from '@/hooks/SeriesContext';
import { useVirtualToday } from '@/hooks/VirtualTodayContext';

interface Props {
  activity: ActivityWithStreak;
}

export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { updateName, toggleDone, deleteActivity } = useActivities();

  // Find current series (window contains virtualToday)
  const series = useSeries(activity.id);
  const currentSeries = findCurrentSeries(series, virtualToday);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);
  const [busy, setBusy] = useState(false);

  const isDoneToday = activity.completions.some((c) => c.date === virtualToday);

  const save = async () => {
    const trimmed = name.trim();
    setEditing(false);
    if (trimmed && trimmed !== activity.name) {
      setBusy(true);
      try {
        await updateName(activity.id, trimmed);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleDelete = async () => {
    if (busy || !confirm(t.deleteConfirm(activity.name))) return;
    setBusy(true);
    try {
      await deleteActivity(activity.id);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleDone(activity.id);
    } finally {
      setBusy(false);
    }
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
          disabled={busy}
          onClick={handleDelete}
          title={t.deleteTitle}
        >
          {busy ? <Spinner /> : '×'}
        </button>
      </div>
      {activity.seriesDefinitions.length > 0 && (
        <>
          <SeriesProgress
            startDate={currentSeries ? currentSeries.startDate : virtualToday}
            seriesLength={currentSeries ? currentSeries.seriesLength : latestDef(activity.seriesDefinitions, activity.id).seriesLength}
            doneCount={currentSeries ? currentSeries.completions.length : 0}
          />
          <span className="card__reward">
            {latestDef(activity.seriesDefinitions, activity.id).reward}{latestDef(activity.seriesDefinitions, activity.id).currency}
          </span>
        </>
      )}
      <button
        className={`card__done ${isDoneToday ? 'card__done--yes' : 'card__done--no'}`}
        disabled={busy}
        onClick={handleToggle}
      >
        {busy ? <Spinner /> : isDoneToday ? t.doneToday : t.markDone}
      </button>
    </div>
  );
});
