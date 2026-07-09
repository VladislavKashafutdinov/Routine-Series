import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { Paginator } from './Paginator';
import type { ActivityWithStreak } from '../types';
import './RewardHistoryTab.css';

const PER_PAGE = 50;

interface Props {
  activity: ActivityWithStreak;
}

export const RewardHistoryTab = memo(function RewardHistoryTab({ activity }: Props) {
  const { t } = useLocale();
  const [page, setPage] = useState(0);

  const issues = [...activity.rewardIssues].sort((a, b) => b.date.localeCompare(a.date));
  const total = issues.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = issues.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (total === 0) {
    return <div className="accordion__placeholder">{t.noRewardsYet}</div>;
  }

  return (
    <>
      <table className="rtable">
        <thead>
          <tr>
            <th>{t.rewardDate}</th>
            <th>{t.rewardAmount}</th>
            <th>{t.rewardCurrency}</th>
            <th>{t.rewardActions}</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((r) => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>{r.amount}</td>
              <td>{r.currency}</td>
              <td>
                <button className="rtable__del-btn" onClick={() => {/* TODO: 10d-iv */}} type="button">
                  {t.deleteTitle}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginator
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </>
  );
});
