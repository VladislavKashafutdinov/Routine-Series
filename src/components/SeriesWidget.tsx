import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { useActivities } from '../hooks/useActivities';
import type { ComputedSeries } from '../types';

interface Props {
  series: ComputedSeries;
  activityId: number;
}

function datesFrom(start: string, count: number): string[] {
  const result: string[] = [];
  const d = new Date(start + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return result;
}

function statusLabel(status: string, t: ReturnType<typeof import('../i18n/LocaleContext').useLocale>['t']): string {
  switch (status) {
    case 'completed': return t.statusCompleted;
    case 'broken': return t.statusBroken;
    default: return t.statusActive;
  }
}

export const SeriesWidget = memo(function SeriesWidget({ series, activityId }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { toggleDate } = useActivities();
  const todayStr = virtualToday;
  const dates = datesFrom(series.startDate, series.seriesLength);
  const doneSet = new Set(series.completions.map((c) => c.date));

  // First unfilled day (click to mark done)
  let firstGray: string | null = null;
  for (const d of dates) {
    if (!doneSet.has(d)) {
      firstGray = d;
      break;
    }
  }

  // Last filled day (click to undo)
  let lastGreen: string | null = null;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (doneSet.has(dates[i])) {
      lastGreen = dates[i];
      break;
    }
  }

  const isClickable = (d: string): boolean => {
    if (d > todayStr) return false;
    return d === firstGray || d === lastGreen;
  };

  return (
    <div className={`swidget swidget--${series.status}`}>
      <span className="swidget__date swidget__date--start">{series.startDate}</span>
      <div className="swidget__squares">
        {dates.map((d) => {
          const done = doneSet.has(d);
          const clickable = isClickable(d);
          return (
            <div
              key={d}
              className={`swidget__dot${done ? ' swidget__dot--done' : ''}${clickable ? ' swidget__dot--clickable' : ''}`}
              title={d}
              onClick={clickable ? () => { toggleDate(activityId, d); } : undefined}
            />
          );
        })}
      </div>
      <span className="swidget__date swidget__date--end">{dates[dates.length - 1]}</span>
      <span className={`swidget__badge swidget__badge--${series.status}`}>
        {statusLabel(series.status, t)}
      </span>
    </div>
  );
});
