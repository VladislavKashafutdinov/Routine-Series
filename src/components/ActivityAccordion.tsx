import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { RewardCounters } from './RewardCounters';
import { TabSwitcher } from './TabSwitcher';
import { SeriesHistoryTab } from './SeriesHistoryTab';
import { RewardHistoryTab } from './RewardHistoryTab';
import type { ActivityWithStreak } from '../types';
import './ActivityAccordion.css';

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
      <div className="accordion__header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <span className="accordion__name">{activity.name}</span>
        <RewardCounters
          earned={activity.totalEarned}
          issued={activity.totalIssued}
          unissued={activity.totalUnissued}
          currency={activity.currency}
        />
        <button className="accordion__issue-btn" onClick={(e) => { e.stopPropagation(); }} type="button">
          {t.issueReward}
        </button>
        <span className={`accordion__arrow ${isOpen ? 'accordion__arrow--up' : ''}`}>▾</span>
      </div>
      {isOpen && (
        <div className="accordion__body">
          <TabSwitcher
            tabs={[
              { key: 'series', label: t.seriesHistoryTab },
              { key: 'rewards', label: t.rewardHistoryTab },
            ]}
            active={tab}
            onSelect={(k) => setTab(k as Tab)}
          />
          <div className="accordion__tab-content">
            {tab === 'series' && <SeriesHistoryTab activity={activity} />}
            {tab === 'rewards' && <RewardHistoryTab activity={activity} />}
          </div>
        </div>
      )}
    </div>
  );
});
