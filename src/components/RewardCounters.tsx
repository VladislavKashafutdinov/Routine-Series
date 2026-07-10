import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import './RewardCounters.css';

interface Props {
  earnedByCurrency: Record<string, number>;
  issuedByCurrency: Record<string, number>;
}

export const RewardCounters = memo(function RewardCounters({ earnedByCurrency, issuedByCurrency }: Props) {
  const { t } = useLocale();

  const currencies = [...new Set([
    ...Object.keys(earnedByCurrency),
    ...Object.keys(issuedByCurrency),
  ])].filter(c => earnedByCurrency[c] || issuedByCurrency[c]);

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
