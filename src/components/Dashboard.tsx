import { StreakCard } from './StreakCard';
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
    return (
      <div className="dashboard__empty">
        {t.empty}
      </div>
    );
  }

  return (
    <div className="dashboard">
      {activities.map((a) => (
        <StreakCard
          key={a.id}
          activity={a}
          onToggleDone={onToggleDone}
          onDelete={onDelete}
          onShowHistory={onShowHistory}
          onClaimReward={onClaimReward}
        />
      ))}
    </div>
  );
}
