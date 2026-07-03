import { memo } from 'react';
import type { ActivityWithStreak } from '../types';

interface StreakCardProps {
  activity: ActivityWithStreak;
  onToggleDone: (id: number) => void;
  onDelete: (id: number) => void;
  onShowHistory: (activity: ActivityWithStreak) => void;
}

export const StreakCard = memo(function StreakCard({
  activity,
  onToggleDone,
  onDelete,
  onShowHistory,
}: StreakCardProps) {
  const flameIcon = activity.isDoneToday ? '🔥' : '🕯️';

  return (
    <div className={`streak-card ${activity.isDoneToday ? 'streak-card--done' : ''}`}>
      <div className="streak-card__header">
        <span className="streak-card__name" title={activity.name}>
          {activity.name}
        </span>
        <button
          className="streak-card__delete"
          onClick={() => {
            if (confirm(`Delete "${activity.name}"?`)) onDelete(activity.id);
          }}
          title="Delete"
        >
          ×
        </button>
      </div>

      <button
        className="streak-card__streak"
        onClick={() => onShowHistory(activity)}
      >
        <span className="streak-card__flame">{flameIcon}</span>
        <span className="streak-card__count">{activity.currentStreak}</span>
        <span className="streak-card__label">
          day{activity.currentStreak !== 1 ? 's' : ''}
        </span>
      </button>

      <button
        className={`streak-card__done ${
          activity.isDoneToday ? 'streak-card__done--yes' : 'streak-card__done--no'
        }`}
        onClick={() => onToggleDone(activity.id)}
      >
        {activity.isDoneToday ? '✓ Done today' : 'Mark done'}
      </button>
    </div>
  );
});
