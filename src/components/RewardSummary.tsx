import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithSeries } from '../types';

interface RewardSummaryProps {
  activities: ActivityWithSeries[];
}

export function RewardSummary({ activities }: RewardSummaryProps) {
  const { t } = useLocale();

  // Aggregate unclaimed rewards by currency
  const totals: Record<string, number> = {};
  for (const a of activities) {
    if (a.lastCompletedSeries && a.reward > 0) {
      totals[a.currency] = (totals[a.currency] || 0) + a.reward;
    }
  }

  const entries = Object.entries(totals);
  if (entries.length === 0) return null;

  return (
    <div className="reward-summary">
      <span className="reward-summary__label">{t.unclaimedRewards}:</span>
      {entries.map(([cur, amount]) => (
        <span key={cur} className="reward-summary__item">
          {amount} {cur}
        </span>
      ))}
    </div>
  );
}
