import { StreakCard } from './StreakCard';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithStreak } from '../types';

interface DashboardProps {
  activities: ActivityWithStreak[];
  loading: boolean;
  onToggleDone: (id: number) => void;
  onDelete: (id: number) => void;
  onShowHistory: (activity: ActivityWithStreak) => void;
}

export function Dashboard({
  activities,
  loading,
  onToggleDone,
  onDelete,
  onShowHistory,
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
        />
      ))}
    </div>
  );
}
