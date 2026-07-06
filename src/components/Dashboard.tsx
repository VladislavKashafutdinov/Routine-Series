import { ActivityCard } from './ActivityCard';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import type { ActivityWithStreak } from '../types';

interface Props {
  onShowHistory: (a: ActivityWithStreak) => void;
}

export function Dashboard({ onShowHistory }: Props) {
  const { t } = useLocale();
  const { activities, loading } = useActivities();

  if (loading) return <div className="dash__msg">{t.loading}</div>;
  if (activities.length === 0) return <div className="dash__msg">{t.empty}</div>;

  return (
    <div className="dashboard">
      {activities.map((a) => (
        <ActivityCard key={a.id} activity={a} onShowHistory={onShowHistory} />
      ))}
    </div>
  );
}
