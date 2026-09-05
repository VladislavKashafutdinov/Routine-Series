import './SeriesProgress.css';

import { memo } from 'react';

interface Props {
  startDate: string;
  seriesLength: number;
  doneCount: number;
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

export const SeriesProgress = memo(function SeriesProgress({ startDate, seriesLength, doneCount }: Props) {
  const dates = datesFrom(startDate, seriesLength);

  return (
    <div className="sprog">
      {dates.map((_, i) => (
        <div
          key={i}
          className={`sprog__dot ${i < doneCount ? 'sprog__dot--done' : ''}`}
        />
      ))}
    </div>
  );
});
