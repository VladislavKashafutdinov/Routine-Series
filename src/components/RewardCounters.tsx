import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { computeSeries } from '../utils/series';
import { calcEarnedByCurrency, calcIssuedByCurrency, getCurrencies } from '../utils/rewards';
import type { Completion, RewardIssue, SeriesDefinition } from '../types';
import './RewardCounters.css';

interface Props {
  completions: Completion[];
  rewardIssues: RewardIssue[];
  seriesDefinitions: SeriesDefinition[];
}

export const RewardCounters = memo(function RewardCounters({ completions, rewardIssues, seriesDefinitions }: Props) {
  const { t } = useLocale();
  const { virtualToday } = useVirtualToday();

  const series = computeSeries(seriesDefinitions, completions, virtualToday);
  const earnedByCurrency = calcEarnedByCurrency(series);
  const issuedByCurrency = calcIssuedByCurrency(rewardIssues);

  const currencies = getCurrencies(seriesDefinitions, rewardIssues);

  if (currencies.length === 0) return null;

  return (
    <span className="rcounters">
      {currencies.map((c) => {
        const unissued = (earnedByCurrency[c] || 0) - (issuedByCurrency[c] || 0);
        return (
          <span key={c} className="rcounters__currency-group">
            <span className="rcounters__item rcounters__item--earned" title={`${t.earned} (${c})`}>
              {t.earned}: {earnedByCurrency[c] || 0}{c}
            </span>
            <span className="rcounters__item rcounters__item--issued" title={`${t.issued} (${c})`}>
              {t.issued}: {issuedByCurrency[c] || 0}{c}
            </span>
            {unissued > 0 && (
              <span className="rcounters__item rcounters__item--unissued" title={`${t.unissued} (${c})`}>
                {t.unissued}: {unissued}{c}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
});
