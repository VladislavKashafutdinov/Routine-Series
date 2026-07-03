import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
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
  const { t } = useLocale();
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
            if (confirm(t.deleteConfirm(activity.name))) onDelete(activity.id);
          }}
          title={t.deleteTitle}
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
          {t.streakDays(activity.currentStreak)}
        </span>
      </button>

      <button
        className={`streak-card__done ${
          activity.isDoneToday ? 'streak-card__done--yes' : 'streak-card__done--no'
        }`}
        onClick={() => onToggleDone(activity.id)}
      >
        {activity.isDoneToday ? t.doneToday : t.markDone}
      </button>
    </div>
  );
});
