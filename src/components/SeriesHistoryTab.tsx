import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { Paginator } from './Paginator';
import { SeriesWidget } from './SeriesWidget';
import type { ActivityWithStreak, ComputedSeries } from '../types';
import './SeriesHistoryTab.css';

const GROUPS_PER_PAGE = 5;

interface Props {
  activity: ActivityWithStreak;
}

interface Group {
  key: string;
  length: number;
  reward: number;
  currency: string;
  createdAt: Date;
  series: ComputedSeries[];
}

export const SeriesHistoryTab = memo(function SeriesHistoryTab({ activity }: Props) {
  const { t } = useLocale();
  const [page, setPage] = useState(0);

  // Group series by definitionCreatedAt
  const groups: Group[] = [];
  for (const s of activity.series) {
    const key = s.definitionCreatedAt.getTime().toString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.series.push(s);
    } else {
      groups.push({
        key,
        length: s.seriesLength,
        reward: s.reward,
        currency: s.currency,
        createdAt: s.definitionCreatedAt,
        series: [s],
      });
    }
  }

  const total = groups.length;
  const totalPages = Math.max(1, Math.ceil(total / GROUPS_PER_PAGE));
  const paged = groups.slice(page * GROUPS_PER_PAGE, (page + 1) * GROUPS_PER_PAGE);

  if (total === 0) {
    return <div className="accordion__placeholder">{t.noSeriesYet}</div>;
  }

  return (
    <>
      <div className="accordion__series-list">
        {paged.map((g) => (
          <div key={g.key} className="shist-group">
            <div className="shist-group__header">
              {g.length} {t.streakDays(g.length)} · {g.reward}{g.currency} · {g.createdAt.toISOString().slice(0, 10)}
            </div>
            {g.series.map((s) => (
              <SeriesWidget key={s.number} series={s} activityId={activity.id} />
            ))}
          </div>
        ))}
      </div>
      <Paginator
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </>
  );
});
