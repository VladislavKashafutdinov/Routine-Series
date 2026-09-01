import './RewardsPage.css';

import { calcUnissuedEntries, type UnissuedEntry } from '@/utils/rewards';
import { memo, useMemo, useState } from 'react';

import type { ActivityWithStreak } from '@/types';
import { IssueRewardModal } from '@components/IssueRewardModal/IssueRewardModal';
import { Spinner } from '@components/Spinner/Spinner';
import { UnissuedRewardBanner } from '@components/UnissuedRewardBanner/UnissuedRewardBanner';
import { useAllSeries } from '@/hooks/SeriesContext';
import { useActivities } from '@/hooks/useActivities';
import { useLocale } from '@/i18n/LocaleContext';
import { useVirtualToday } from '@/hooks/VirtualTodayContext';

/** Top-level rewards tab: one banner per unissued reward + issue-all button. */
export const RewardsPage = memo(function RewardsPage() {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { activities, addRewardIssue } = useActivities();
  const seriesMap = useAllSeries();

  const [issuingAll, setIssuingAll] = useState(false);
  const [issueInfo, setIssueInfo] = useState<{
    activity: ActivityWithStreak;
    currency: string;
    amount: number;
  } | null>(null);

  const entries: UnissuedEntry[] = useMemo(
    () => calcUnissuedEntries(activities, seriesMap),
    [activities, seriesMap],
  );

  const handleIssueAll = async () => {
    setIssuingAll(true);
    try {
      // One reward-issue record per activity, issued by a single click.
      for (const e of entries) {
        await addRewardIssue(e.activity.id, e.amount, e.currency, virtualToday);
      }
    } finally {
      setIssuingAll(false);
    }
  };

  return (
    <div className="rewards-page">
      <h2 className="rewards-page__title">{t.rewardsTab}</h2>
      {entries.length === 0 ? (
        <p className="app-placeholder">{t.noUnissuedRewards}</p>
      ) : (
        <>
          <div className="rewards-page__actions">
            <button
              className="rewards-page__issue-all"
              onClick={() => void handleIssueAll()}
              disabled={issuingAll}
              type="button"
            >
              {issuingAll ? <Spinner /> : t.issueAllRewards}
            </button>
          </div>
          <div className="rewards-page__list">
            {entries.map((e) => (
              <UnissuedRewardBanner
                key={`${e.activity.id}-${e.currency}`}
                entry={e}
                disabled={issuingAll}
                onIssue={setIssueInfo}
              />
            ))}
          </div>
        </>
      )}
      {issueInfo && (
        <IssueRewardModal
          activity={issueInfo.activity}
          onClose={() => setIssueInfo(null)}
          initialCurrency={issueInfo.currency}
          defaultAmount={issueInfo.amount}
        />
      )}
    </div>
  );
});
