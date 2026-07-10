import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { dayDiff } from '../utils/date';
import type { Completion } from '../types';
import './SeriesWidget.css';

interface Props {
  startDate: string;
  seriesLength: number;
  completions: Completion[];
}

type Status = 'active' | 'completed' | 'broken';

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

function calcStatus(completions: Completion[], seriesLength: number, todayStr: string): Status {
  if (completions.length === 0) return 'broken';
  if (completions.length >= seriesLength) return 'completed';
  const lastDate = completions[completions.length - 1].date;
  if (dayDiff(lastDate, todayStr) <= 1) return 'active';
  return 'broken';
}

function statusLabel(status: Status, t: ReturnType<typeof import('../i18n/LocaleContext').useLocale>['t']): string {
  switch (status) {
    case 'completed': return t.statusCompleted;
    case 'broken': return t.statusBroken;
    default: return t.statusActive;
  }
}

export const SeriesWidget = memo(function SeriesWidget({ startDate, seriesLength, completions }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();

  const status = calcStatus(completions, seriesLength, virtualToday);
  const dates = datesFrom(startDate, seriesLength);
  const doneSet = new Set(completions.map((c) => c.date));
  const endDate = dates[dates.length - 1];

  return (
    <div className={`swidget swidget--${status}`}>
      <div className="swidget__progress">
        <span className="swidget__date swidget__date--start">{startDate}</span>
        <div className="swidget__squares">
          {dates.map((d) => {
            const done = doneSet.has(d);
            return (
              <div
                key={d}
                className={`swidget__dot${done ? ' swidget__dot--done' : ''}`}
                title={d}
              />
            );
          })}
        </div>
        <span className="swidget__date swidget__date--end">{endDate}</span>
      </div>
      <span className={`swidget__badge swidget__badge--${status}`}>
        {statusLabel(status, t)}
      </span>
    </div>
  );
});
