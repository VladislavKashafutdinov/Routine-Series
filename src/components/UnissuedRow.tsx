import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';

interface Props {
  currency: string;
  amount: number;
  onIssue: (currency: string, amount: number) => void;
}

export const UnissuedRow = memo(function UnissuedRow({ currency, amount, onIssue }: Props) {
  const { t } = useLocale();

  return (
    <span className="accordion__unissued-row">
      <span className="accordion__unissued">
        {t.unissued}: {amount}{currency}
      </span>
      <button
        className="accordion__issue-btn"
        onClick={(e) => { e.stopPropagation(); onIssue(currency, amount); }}
        type="button"
      >
        {t.issueReward}{currency}
      </button>
    </span>
  );
});
