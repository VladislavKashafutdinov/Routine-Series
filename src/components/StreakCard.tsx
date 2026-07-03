import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithSeries } from '../types';

interface StreakCardProps {
  activity: ActivityWithSeries;
  onToggleDone: (id: number) => void;
  onDelete: (id: number) => void;
  onShowHistory: (activity: ActivityWithSeries) => void;
  onClaimReward: (seriesId: number) => void;
}

export const StreakCard = memo(function StreakCard({
  activity,
  onToggleDone,
  onDelete,
  onShowHistory,
  onClaimReward,
}: StreakCardProps) {
  const { t } = useLocale();

  const series = activity.activeSeries;
  const completedDays = series
    ? new Set(series.completions.map((c) => c.date)).size
    : 0;
  const total = activity.seriesLength;
  const pct = total > 0 ? Math.round((completedDays / total) * 100) : 0;
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

      {/* Progress bar */}
      <div className="streak-card__progress">
        <div className="streak-card__bar">
          <div
            className="streak-card__fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="streak-card__progress-text">
          {completedDays}/{total}
        </span>
      </div>

      {/* Series info */}
      <button
        className="streak-card__streak"
        onClick={() => onShowHistory(activity)}
      >
        <span className="streak-card__flame">{flameIcon}</span>
        <span className="streak-card__count">
          {series ? `#${series.number}` : '—'}
        </span>
      </button>

      {/* Reward info */}
      {activity.reward > 0 && (
        <div className="streak-card__reward-info">
          {t.rewardLabel}: {activity.reward} {activity.currency}
        </div>
      )}

      {/* Mark done button */}
      <button
        className={`streak-card__done ${
          activity.isDoneToday ? 'streak-card__done--yes' : 'streak-card__done--no'
        }`}
        onClick={() => onToggleDone(activity.id)}
      >
        {activity.isDoneToday ? t.doneToday : t.markDone}
      </button>

      {/* Claim reward for last completed series */}
      {activity.lastCompletedSeries && activity.reward > 0 && (
        <button
          className="streak-card__claim"
          onClick={() => onClaimReward(activity.lastCompletedSeries!.id!)}
        >
          {t.claimReward}: {activity.reward} {activity.currency}
        </button>
      )}
    </div>
  );
});
