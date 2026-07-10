import { AddActivity } from './AddActivity';
import { ActivityCard } from './ActivityCard';
import { IssueBanner } from './IssueBanner';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import './Dashboard.css';

export function Dashboard() {
  const { t } = useLocale();
  const { activities, loading } = useActivities();

  const pending = activities.filter((a) => !a.isDoneToday);
  const done = activities.filter((a) => a.isDoneToday);

  return (
    <div className="dashboard">
      <AddActivity />

      {!loading && <IssueBanner activities={activities} />}

      {loading && <div className="dash-msg">{t.loading}</div>}

      {!loading && activities.length === 0 && (
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
