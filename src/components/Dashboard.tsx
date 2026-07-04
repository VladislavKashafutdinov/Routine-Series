import { RewardSummary } from './RewardSummary';
import { ActivityGroup } from './ActivityGroup';
import { useLocale } from '../i18n/LocaleContext';
import { useActivitiesContext } from '../hooks/ActivitiesContext';
import type { ActivityWithSeries } from '../types';

interface DashboardProps {
  onShowHistory: (activity: ActivityWithSeries) => void;
}

export function Dashboard({ onShowHistory }: DashboardProps) {
  const { t } = useLocale();
  const { activities, loading } = useActivitiesContext();

  if (loading) {
    return <div className="dashboard__loading">{t.loading}</div>;
  }

  if (activities.length === 0) {
    return <div className="dashboard__empty">{t.empty}</div>;
  }

  return (
    <div className="dashboard">
      <RewardSummary />

      {activities.map((a) => (
        <div key={a.id} className="dashboard__group">
          <button
            className="dashboard__group-header"
            onClick={() => onShowHistory(a)}
          >
            {a.name}
            <span className="dashboard__group-arrow">→</span>
          </button>
          <ActivityGroup activity={a} />
        </div>
      ))}
    </div>
  );
}
