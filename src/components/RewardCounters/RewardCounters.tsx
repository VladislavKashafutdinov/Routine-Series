import { memo } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { useSeries } from '../../hooks/SeriesContext';
import { calcEarnedByCurrency, calcIssuedByCurrency, getCurrencies } from '../../utils/rewards';
import type { ActivityWithStreak } from '../../types';
import './RewardCounters.css';

interface Props {
  activity: ActivityWithStreak;
  onIssue: (currency: string, amount: number) => void;
}

export const RewardCounters = memo(function RewardCounters({ activity, onIssue }: Props) {
  const { t } = useLocale();

  const series = useSeries(activity.id);
  const earnedByCurrency = calcEarnedByCurrency(series);
  const issuedByCurrency = calcIssuedByCurrency(activity.rewardIssues);

  const currencies = getCurrencies(activity.seriesDefinitions, activity.rewardIssues);

  if (currencies.length === 0) return null;

  return (
    <span className="rcounters">
      {currencies.map((c) => {
        const unissued = (earnedByCurrency[c] || 0) - (issuedByCurrency[c] || 0);
        return (
          <span key={c} className="rcounters__currency-group">
            <span className="rcounters__item rcounters__item--earned" title={`${t.earned} (${c})`}>
              {t.earned}: {earnedByCurrency[c] || 0}{c}
            </span>
            <span className="rcounters__item rcounters__item--issued" title={`${t.issued} (${c})`}>
              {t.issued}: {issuedByCurrency[c] || 0}{c}
            </span>
            {unissued > 0 && (
              <>
                <span className="rcounters__item rcounters__item--unissued" title={`${t.unissued} (${c})`}>
                  {t.unissued}: {unissued}{c}
                </span>
                <button
                  className="rcounters__issue-btn"
                  onClick={() => onIssue(c, unissued)}
                  type="button"
                >
                  {t.issueReward}{c}
                </button>
              </>
            )}
          </span>
        );
      })}
    </span>
  );
});
