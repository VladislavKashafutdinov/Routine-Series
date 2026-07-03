import { RewardSummary } from './RewardSummary';
import { ActivityGroup } from './ActivityGroup';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithSeries } from '../types';

interface DashboardProps {
  activities: ActivityWithSeries[];
  loading: boolean;
  onToggleDone: (id: number) => void;
  onDelete: (id: number) => void;
  onShowHistory: (activity: ActivityWithSeries) => void;
  onClaimReward: (seriesId: number) => void;
}

export function Dashboard({
  activities,
  loading,
  onToggleDone,
  onDelete,
  onShowHistory,
  onClaimReward,
}: DashboardProps) {
  const { t } = useLocale();

  if (loading) {
    return <div className="dashboard__loading">{t.loading}</div>;
  }

  if (activities.length === 0) {
    return <div className="dashboard__empty">{t.empty}</div>;
  }

  return (
    <div className="dashboard">
      <RewardSummary activities={activities} />

      {activities.map((a) => (
        <div key={a.id} className="dashboard__group">
          <button
            className="dashboard__group-header"
            onClick={() => onShowHistory(a)}
          >
            {a.name}
            <span className="dashboard__group-arrow">→</span>
          </button>
          <ActivityGroup
            activity={a}
            onToggleDone={onToggleDone}
            onDelete={onDelete}
            onClaimReward={onClaimReward}
          />
        </div>
      ))}
    </div>
  );
}
