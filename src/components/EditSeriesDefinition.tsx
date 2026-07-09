import { memo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import type { ActivityWithStreak } from '../types';
import './EditSeriesDefinition.css';

interface Props {
  activity: ActivityWithStreak;
}

export const EditSeriesDefinition = memo(function EditSeriesDefinition({ activity }: Props) {
  const { t } = useLocale();
  const { addSeriesDefinition } = useActivities();
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(activity.seriesLength);
  const [reward, setReward] = useState(activity.reward);
  const [currency, setCurrency] = useState(activity.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (length < 1) return;
    await addSeriesDefinition(activity.id, length, reward, currency || '₽');
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="esdef__toggle" onClick={() => setOpen(true)} type="button">
        {t.editSeries}
      </button>
    );
  }

  return (
    <form className="esdef" onSubmit={handleSubmit}>
      <label className="esdef__field">
        {t.seriesLengthLabel}
        <input className="esdef__num" type="number" min={1} max={365} value={length} onChange={(e) => setLength(Number(e.target.value) || 1)} />
      </label>
      <label className="esdef__field">
        {t.rewardLabel}
        <input className="esdef__num" type="number" min={0} value={reward} onChange={(e) => setReward(Number(e.target.value) || 0)} />
      </label>
      <label className="esdef__field">
        {t.currencyLabel}
        <input className="esdef__num" type="text" maxLength={10} value={currency} onChange={(e) => setCurrency(e.target.value || '₽')} />
      </label>
      <button className="esdef__save" type="submit">{t.editSeriesSave}</button>
      <button className="esdef__cancel" type="button" onClick={() => setOpen(false)}>{t.editSeriesCancel}</button>
    </form>
  );
});
