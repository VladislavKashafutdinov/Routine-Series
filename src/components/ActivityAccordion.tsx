import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { TabSwitcher } from './TabSwitcher';
import { SeriesHistoryTab } from './SeriesHistoryTab';
import { RewardHistoryTab } from './RewardHistoryTab';
import { IssueRewardModal } from './IssueRewardModal';
import { SeriesDefinitionTab } from './SeriesDefinitionTab';
import { CompletionsTab } from './CompletionsTab';
import type { ActivityWithStreak } from '../types';
import './ActivityAccordion.css';

type Tab = 'defs' | 'series' | 'rewards' | 'completions';

interface Props {
  activity: ActivityWithStreak;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActivityAccordion = memo(function ActivityAccordion({ activity, isOpen, onToggle }: Props) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('series');
  const [showIssue, setShowIssue] = useState(false);
  const [issueCurrency, setIssueCurrency] = useState(activity.currency);

  // Currencies with unissued > 0
  const unissuedCurrencies = Object.entries(activity.unissuedByCurrency)
    .filter(([, v]) => v > 0)
    .map(([c]) => c);

  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      <div className="accordion__header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <span className="accordion__name">{activity.name}</span>
        <span className="accordion__unissued-list">
          {unissuedCurrencies.map((c) => (
            <span key={c} className="accordion__unissued-row">
              <span className="accordion__unissued">
                {t.unissued}: {activity.unissuedByCurrency[c]}{c}
              </span>
              <button
                className="accordion__issue-btn"
                onClick={(e) => { e.stopPropagation(); setIssueCurrency(c); setShowIssue(true); }}
                type="button"
              >
                {t.issueReward}{c}
              </button>
            </span>
          ))}
        </span>
        <span className={`accordion__arrow ${isOpen ? 'accordion__arrow--up' : ''}`}>▾</span>
      </div>
      {isOpen && (
        <div className="accordion__body">
          <TabSwitcher
            tabs={[
              { key: 'defs', label: t.defsTab },
              { key: 'series', label: t.seriesHistoryTab },
              { key: 'rewards', label: t.rewardHistoryTab },
              { key: 'completions', label: t.completionsTab },
            ]}
            active={tab}
            onSelect={(k) => setTab(k as Tab)}
          />
          <div className="accordion__tab-content">
            {tab === 'defs' && <SeriesDefinitionTab activity={activity} />}
            {tab === 'series' && <SeriesHistoryTab activity={activity} />}
            {tab === 'rewards' && <RewardHistoryTab activity={activity} />}
            {tab === 'completions' && <CompletionsTab activity={activity} />}
          </div>
        </div>
      )}
      {showIssue && (
        <IssueRewardModal
          activity={activity}
          onClose={() => setShowIssue(false)}
          currencyOverride={issueCurrency}
        />
      )}
    </div>
  );
});
