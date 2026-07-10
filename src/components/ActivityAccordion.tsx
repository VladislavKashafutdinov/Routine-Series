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
import { computeSeries, findCurrentSeries } from '../utils/series';

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

  // Current series — the one whose date window contains virtualToday
  const currentSeries = findCurrentSeries(series, virtualToday);

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
      {activity.seriesDefinitions.length > 0 && (
        <div className="accordion__active-series" onClick={(e) => e.stopPropagation()}>
          <SeriesWidget
            startDate={currentSeries ? currentSeries.startDate : virtualToday}
            seriesLength={currentSeries ? currentSeries.seriesLength : latestDef(activity.seriesDefinitions, activity.id).seriesLength}
            completions={currentSeries ? currentSeries.completions : []}
          />
        </div>
      )}
      {isOpen && activity.seriesDefinitions.length === 0 && (
        <div className="accordion__body">
          <div className="accordion__placeholder">{t.loading}</div>
        </div>
      )}
      {isOpen && activity.seriesDefinitions.length > 0 && (
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
            {tab === 'rewards' && <RewardHistoryTab activity={activity} onIssue={handleIssue} />}
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
