import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import './RewardCounters.css';

interface Props {
  earned: number;
  issued: number;
  unissued: number;
  currency: string;
}

export const RewardCounters = memo(function RewardCounters({ earned, issued, unissued, currency }: Props) {
  const { t } = useLocale();

  return (
    <span className="rcounters">
      <span className="rcounters__item rcounters__item--earned" title={t.earned}>
        {t.earned}: {earned}{currency}
      </span>
      <span className="rcounters__item rcounters__item--issued" title={t.issued}>
        {t.issued}: {issued}{currency}
      </span>
      <span className="rcounters__item rcounters__item--unissued" title={t.unissued}>
        {t.unissued}: {unissued}{currency}
      </span>
    </span>
  );
});
