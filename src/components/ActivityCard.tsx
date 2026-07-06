import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import type { ActivityWithStreak } from '../types';

interface Props {
  activity: ActivityWithStreak;
  onShowHistory: (a: ActivityWithStreak) => void;
}

export const ActivityCard = memo(function ActivityCard({ activity, onShowHistory }: Props) {
  const { t } = useLocale();
  const { toggleDone, deleteActivity } = useActivities();
  const pct = activity.seriesLength > 0
    ? Math.round((activity.currentStreak / activity.seriesLength) * 100) : 0;

  return (
    <div className={`card ${activity.isDoneToday ? 'card--done' : ''}`}>
      <div className="card__header">
        <span className="card__name" title={activity.name}>{activity.name}</span>
        <button className="card__del" onClick={() => {
          if (confirm(t.deleteConfirm(activity.name))) deleteActivity(activity.id);
        }} title={t.deleteTitle}>×</button>
      </div>

      <button className="card__streak" onClick={() => onShowHistory(activity)}>
        <span className="card__flame">{activity.isDoneToday ? '🔥' : '🕯️'}</span>
        <span className="card__count">{activity.currentStreak}</span>
        <span className="card__label">{t.streakDays(activity.currentStreak)}</span>
      </button>

      <div className="card__progress">
        <div className="card__bar">
          <div className="card__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="card__prog-text">{activity.currentStreak}/{activity.seriesLength}</span>
      </div>

      <button
        className={`card__done ${activity.isDoneToday ? 'card__done--yes' : 'card__done--no'}`}
        onClick={() => toggleDone(activity.id)}
      >
        {activity.isDoneToday ? t.doneToday : t.markDone}
      </button>

      {activity.reward > 0 && (
        <div className="card__reward">{t.rewardLabel}: {activity.reward} {activity.currency}</div>
      )}
    </div>
  );
});
