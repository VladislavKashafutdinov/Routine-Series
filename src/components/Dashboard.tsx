import { StreakCard } from './StreakCard';
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
  if (loading) {
    return <div className="dashboard__loading">Loading…</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="dashboard__empty">
        No tasks yet. Add one above to get started.
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
