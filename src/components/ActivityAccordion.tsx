import './ActivityAccordion.css';

import { memo, useMemo, useState } from 'react';

import type { ActivityWithStreak } from '../types';
import { CompletionsTab } from './CompletionsTab';
import { IssueRewardModal } from './IssueRewardModal';
import { RewardHistoryTab } from './RewardHistoryTab';
import { SeriesDefinitionTab } from './SeriesDefinitionTab';
import { SeriesHistoryTab } from './SeriesHistoryTab';
import { SeriesWidget } from './SeriesWidget';
import { TabSwitcher } from './TabSwitcher';
import { UnissuedRow } from './UnissuedRow';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { latestDef } from '../hooks/useActivities';
import { calcEarnedByCurrency, calcIssuedByCurrency, calcUnissuedByCurrency } from '../utils/rewards';
import { computeSeries } from '../utils/series';

type Tab = 'defs' | 'series' | 'rewards' | 'completions';

interface Props {
  activity: ActivityWithStreak;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActivityAccordion = memo(function ActivityAccordion({ activity, isOpen, onToggle }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();
  const [tab, setTab] = useState<Tab>('series');
  const [showIssue, setShowIssue] = useState(false);
  const [issueInfo, setIssueInfo] = useState<{ currency: string; defaultAmount: number }>({ currency: '', defaultAmount: 0 });

  const handleIssue = (currency: string, defaultAmount: number) => {
    setIssueInfo({ currency, defaultAmount });
    setShowIssue(true);
  };

  // Compute series on the fly with current virtualToday
  const series = useMemo(
    () => computeSeries(activity.seriesDefinitions, activity.completions, virtualToday),
    [activity.seriesDefinitions, activity.completions, virtualToday]
  );

  // Compute per-currency unissued from series + rewardIssues
  const unissuedByCurrency = useMemo(() => {
    const earned = calcEarnedByCurrency(series);
    const issued = calcIssuedByCurrency(activity.rewardIssues);
    return calcUnissuedByCurrency(earned, issued);
  }, [series, activity.rewardIssues]);

  // Currencies with unissued > 0
  const unissuedCurrencies = Object.entries(unissuedByCurrency)
    .filter(([, v]) => v > 0)
    .map(([c]) => c);

  // Active series for display in header (fallback to empty widget)
  const activeSeries = series.find((s) => s.status === 'active');

  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      <div className="accordion__header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <span className="accordion__name">{activity.name}</span>
        <span className="accordion__unissued-list">
          {unissuedCurrencies.map((c) => (
            <UnissuedRow
              key={c}
              currency={c}
              amount={unissuedByCurrency[c]}
              onIssue={handleIssue}
            />
          ))}
        </span>
        <span className={`accordion__arrow ${isOpen ? 'accordion__arrow--up' : ''}`}>▾</span>
      </div>
      <div className="accordion__active-series" onClick={(e) => e.stopPropagation()}>
        <SeriesWidget
          startDate={activeSeries ? activeSeries.startDate : virtualToday}
          seriesLength={activeSeries ? activeSeries.seriesLength : latestDef(activity.seriesDefinitions, activity.id).seriesLength}
          completions={activeSeries ? activeSeries.completions : []}
        />
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
            {tab === 'series' && <SeriesHistoryTab series={series} />}
            {tab === 'rewards' && <RewardHistoryTab activity={activity} />}
            {tab === 'completions' && <CompletionsTab activity={activity} />}
          </div>
        </div>
      )}
      {showIssue && (
        <IssueRewardModal
          activity={activity}
          onClose={() => setShowIssue(false)}
          initialCurrency={issueInfo.currency}
          defaultAmount={issueInfo.defaultAmount}
        />
      )}
    </div>
  );
});
