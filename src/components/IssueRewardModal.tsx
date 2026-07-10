import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { useActivities } from '../hooks/useActivities';
import type { ActivityWithStreak } from '../types';
import './IssueRewardModal.css';

interface Props {
  activity: ActivityWithStreak;
  onClose: () => void;
}

export const IssueRewardModal = memo(function IssueRewardModal({ activity, onClose }: Props) {
  const { t, lang } = useLocale();
  const { virtualToday } = useVirtualToday();
  const { addRewardIssue } = useActivities();

  const defaultAmount = activity.unissuedByCurrency[activity.currency] || activity.reward;

  const [date, setDate] = useState(virtualToday);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [currency, setCurrency] = useState(activity.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!date || isNaN(num)) return;
    await addRewardIssue(activity.id, num, currency || '₽', date);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="modal__title">«{activity.name}» — {t.issueReward}</h3>
        <label className="modal__field">
          <span>{t.rewardDate}</span>
          <input className="modal__input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="modal__field">
          <span>{t.rewardAmount}</span>
          <input className="modal__input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </label>
        <label className="modal__field">
          <span>{t.rewardCurrency}</span>
          <input className="modal__input modal__input--short" type="text" maxLength={10} value={currency} onChange={(e) => setCurrency(e.target.value || '₽')} />
        </label>
        <div className="modal__actions">
          <button className="modal__btn modal__btn--submit" type="submit">{t.issueReward}</button>
          <button className="modal__btn modal__btn--cancel" type="button" onClick={onClose}>
          {lang === 'en' ? 'Cancel' : 'Отмена'}
        </button>
        </div>
      </form>
    </div>
  );
});
