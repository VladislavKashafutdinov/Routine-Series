import { memo } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import type { ActivityWithStreak } from '../types';

interface Props {
  activity: ActivityWithStreak;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActivityAccordion = memo(function ActivityAccordion({ activity, isOpen, onToggle }: Props) {
  const { t } = useLocale();

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
          {/* TODO: tabs in 10b, 10c */}
          <div className="accordion__placeholder">История серий / История начислений (будут в следующих задачах)</div>
        </div>
      )}
    </div>
  );
});
