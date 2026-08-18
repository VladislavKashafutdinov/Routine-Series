import './Dashboard.css';

import { ActivityCard } from '@components/ActivityCard/ActivityCard';
import { AddActivity } from '@components/AddActivity/AddActivity';
import { IssueBanner } from '@components/IssueBanner/IssueBanner';
import { useActivities } from '@/hooks/useActivities';
import { useLocale } from '@/i18n/LocaleContext';
import { useVirtualToday } from '@/hooks/VirtualTodayContext';

export function Dashboard() {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { activities } = useActivities();

  const pending = activities.filter((a) => !a.completions.some((c) => c.date === virtualToday));
  const done = activities.filter((a) => a.completions.some((c) => c.date === virtualToday));

  return (
    <div className="dashboard">
      <AddActivity />

      <IssueBanner activities={activities} />

      {activities.length === 0 && (
        <div className="dash-msg">{t.empty}</div>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="dash-section__title">{t.pendingTitle}</h2>
          <div className="dash-grid">
            {pending.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="dash-section__title">{t.doneTitle}</h2>
          <div className="dash-grid">
            {done.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
