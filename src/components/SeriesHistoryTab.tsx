import { memo, useState } from 'react';

import type { ActivityWithStreak } from '../types';
import { Paginator } from './Paginator';
import { SeriesWidget } from './SeriesWidget';
import { useLocale } from '../i18n/LocaleContext';

const PER_PAGE = 5;

interface Props {
  activity: ActivityWithStreak;
}

export const SeriesHistoryTab = memo(function SeriesHistoryTab({ activity }: Props) {
  const { t } = useLocale();
  const [page, setPage] = useState(0);

  const total = activity.series.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = activity.series.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (total === 0) {
    return <div className="accordion__placeholder">{t.noSeriesYet}</div>;
  }

  return (
    <>
      <div className="accordion__series-list">
        {paged.map((s) => (
          <SeriesWidget key={s.number} series={s} activityId={activity.id} />
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
