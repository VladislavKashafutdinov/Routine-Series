import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import { ActivityAccordion } from './ActivityAccordion';
import './MonitoringPage.css';

export const MonitoringPage = memo(function MonitoringPage() {
  const { t } = useLocale();
  const { activities, loading } = useActivities();
  const [openId, setOpenId] = useState<number | null>(null);

  if (loading) return <p className="app-placeholder">{t.loading}</p>;
  if (activities.length === 0) return <p className="app-placeholder">{t.empty}</p>;

  return (
    <div className="monitoring">
      <h2 className="monitoring__title">{t.monitoringTitle}</h2>
      <div className="monitoring__list">
        {activities.map((a) => (
          <ActivityAccordion
            key={a.id}
            activity={a}
            isOpen={openId === a.id}
            onToggle={() => setOpenId(openId === a.id ? null : a.id)}
          />
        ))}
      </div>
    </div>
  );
});
