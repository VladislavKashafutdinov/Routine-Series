import './UnissuedRewardBanner.css';

import { memo } from 'react';

import type { UnissuedEntry } from '@/utils/rewards';
import { useLocale } from '@/i18n/LocaleContext';

interface Props {
  entry: UnissuedEntry;
  disabled?: boolean;
  onIssue: (entry: UnissuedEntry) => void;
}

/** One banner per unissued reward (activity + currency). */
export const UnissuedRewardBanner = memo(function UnissuedRewardBanner({ entry, disabled = false, onIssue }: Props) {
  const { t } = useLocale();
  return (
    <div className="ureward-banner">
      <span className="ureward-banner__name">{entry.activity.name}</span>
      <span className="ureward-banner__amount">{t.unissued}: {entry.amount}{entry.currency}</span>
      <button className="ureward-banner__btn" disabled={disabled} onClick={() => onIssue(entry)} type="button">
        {t.issueReward}{entry.currency}
      </button>
    </div>
  );
});
