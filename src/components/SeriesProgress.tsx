import { memo } from 'react';
import { getDateRange } from '../utils/date';
import type { Completion } from '../types';

interface Props {
  completions: Completion[];
  seriesLength: number;
}

export const SeriesProgress = memo(function SeriesProgress({ completions, seriesLength }: Props) {
  const dates = getDateRange(seriesLength).reverse(); // oldest first
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
