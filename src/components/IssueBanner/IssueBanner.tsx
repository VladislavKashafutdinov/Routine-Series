import './IssueBanner.css';

import { calcEarnedByCurrency, calcIssuedByCurrency, calcUnissuedByCurrency } from '@/utils/rewards';
import { memo, useMemo, useState } from 'react';

import type { ActivityWithStreak } from '@/types';
import { IssueRewardModal } from '@components/IssueRewardModal/IssueRewardModal';
import { useAllSeries } from '@/hooks/SeriesContext';
import { useLocale } from '@/i18n/LocaleContext';

interface Props {
  activities: ActivityWithStreak[];
}

interface IssueEntry {
  activity: ActivityWithStreak;
  currency: string;
  unissued: number;
}

export const IssueBanner = memo(function IssueBanner({ activities }: Props) {
  const { t } = useLocale();
  const [showIssue, setShowIssue] = useState(false);
  const [issueInfo, setIssueInfo] = useState<{
    activity: ActivityWithStreak;
    currency: string;
    amount: number;
  } | null>(null);

  const seriesMap = useAllSeries();

  // Compute unissued per activity per currency
  const entries: IssueEntry[] = useMemo(() => {
    const result: IssueEntry[] = [];
    for (const a of activities) {
      const series = seriesMap.get(a.id) || [];
      const earned = calcEarnedByCurrency(series);
      const issued = calcIssuedByCurrency(a.rewardIssues);
      const unissued = calcUnissuedByCurrency(earned, issued);
      for (const [c, v] of Object.entries(unissued)) {
        if (v > 0) result.push({ activity: a, currency: c, unissued: v });
      }
    }
    return result;
  }, [activities, seriesMap]);

  if (entries.length === 0) return null;

  return (
    <>
      <div className="ibanner">
        {entries.map((e) => (
          <div key={`${e.activity.id}-${e.currency}`} className="ibanner__row">
            <span className="ibanner__name">{e.activity.name}</span>
            <span className="ibanner__amount">{t.unissued}: {e.unissued}{e.currency}</span>
            <button
              className="ibanner__btn"
              onClick={() => {
                setIssueInfo({ activity: e.activity, currency: e.currency, amount: e.unissued });
                setShowIssue(true);
              }}
              type="button"
            >
              {t.issueReward}{e.currency}
            </button>
          </div>
        ))}
      </div>
      {showIssue && issueInfo && (
        <IssueRewardModal
          activity={issueInfo.activity}
          onClose={() => setShowIssue(false)}
          initialCurrency={issueInfo.currency}
          defaultAmount={issueInfo.amount}
        />
      )}
    </>
  );
});
