import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithStreak } from '../types';

type Tab = 'series' | 'rewards';

interface Props {
  activity: ActivityWithStreak;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActivityAccordion = memo(function ActivityAccordion({ activity, isOpen, onToggle }: Props) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('series');

  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      <button className="accordion__header" onClick={onToggle} type="button">
        <span className="accordion__name">{activity.name}</span>
        <span className="accordion__counters">
          <span className="accordion__counter accordion__counter--earned" title={t.earned}>
            {t.earned}: {activity.totalEarned}{activity.currency}
          </span>
          <span className="accordion__counter accordion__counter--issued" title={t.issued}>
            {t.issued}: {activity.totalIssued}{activity.currency}
          </span>
          <span className="accordion__counter accordion__counter--unissued" title={t.unissued}>
            {t.unissued}: {activity.totalUnissued}{activity.currency}
          </span>
        </span>
        <button className="accordion__issue-btn" onClick={(e) => { e.stopPropagation(); }} type="button">
          {t.issueReward}
        </button>
        <span className={`accordion__arrow ${isOpen ? 'accordion__arrow--up' : ''}`}>▾</span>
      </button>
      {isOpen && (
        <div className="accordion__body">
          <div className="accordion__tabs">
            <button
              className={`accordion__tab ${tab === 'series' ? 'accordion__tab--active' : ''}`}
              onClick={() => setTab('series')}
              type="button"
            >
              {t.seriesHistoryTab}
            </button>
            <button
              className={`accordion__tab ${tab === 'rewards' ? 'accordion__tab--active' : ''}`}
              onClick={() => setTab('rewards')}
              type="button"
            >
              {t.rewardHistoryTab}
            </button>
          </div>
          <div className="accordion__tab-content">
            {tab === 'series' && (
              <div className="accordion__placeholder">{t.seriesHistoryTab} (будет в 10b)</div>
            )}
            {tab === 'rewards' && (
              <div className="accordion__placeholder">{t.rewardHistoryTab} (будет в 10c)</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
