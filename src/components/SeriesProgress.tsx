import { memo } from 'react';
import { today } from '../utils/date';
import { useTimeOffset } from '../hooks/TimeOffsetContext';
import type { Completion } from '../types';

interface Props {
  completions: Completion[];
  seriesLength: number;
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

export const SeriesProgress = memo(function SeriesProgress({ completions, seriesLength }: Props) {
  const { offset } = useTimeOffset();
  const sorted = [...completions.map((c) => c.date)].sort();
  const start = sorted.length > 0 ? sorted[0] : today(offset);
  const dates = datesFrom(start, seriesLength);
  const doneSet = new Set(completions.map((c) => c.date));

  return (
    <div className="sprog">
      {dates.map((d) => (
        <div
          key={d}
          className={`sprog__dot ${doneSet.has(d) ? 'sprog__dot--done' : ''}`}
          title={d}
        />
      ))}
    </div>
  );
});
