import { useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

interface AddActivityProps {
  onAdd: (name: string, seriesLength: number, reward: number, currency: string) => Promise<void>;
}

const DEFAULT_LENGTH = 7;
const DEFAULT_REWARD = 0;
const DEFAULT_CURRENCY = '₽';

export function AddActivity({ onAdd }: AddActivityProps) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [seriesLength, setSeriesLength] = useState(DEFAULT_LENGTH);
  const [reward, setReward] = useState(DEFAULT_REWARD);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.addError);
      return;
    }
    if (seriesLength < 1) {
      setError(t.addErrorLength);
      return;
    }
    setError('');
    await onAdd(trimmed, seriesLength, reward, currency);
    setName('');
    setSeriesLength(DEFAULT_LENGTH);
    setReward(DEFAULT_REWARD);
    setCurrency(DEFAULT_CURRENCY);
    setExpanded(false);
  };

  return (
    <form className="add-activity" onSubmit={handleSubmit}>
      <div className="add-activity__row">
        <input
          className="add-activity__input"
          type="text"
          placeholder={t.addPlaceholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          onFocus={() => setExpanded(true)}
          autoFocus
        />
        <button className="add-activity__btn" type="submit">
          {t.addButton}
        </button>
      </div>

      {expanded && (
        <div className="add-activity__opts">
          <label className="add-activity__opt">
            {t.seriesLengthLabel}
            <input
              type="number"
              className="add-activity__num"
              min={1}
              max={365}
              value={seriesLength}
              onChange={(e) => setSeriesLength(Number(e.target.value) || 1)}
            />
          </label>
          <label className="add-activity__opt">
            {t.rewardLabel}
            <input
              type="number"
              className="add-activity__num"
              min={0}
              value={reward}
              onChange={(e) => setReward(Number(e.target.value) || 0)}
            />
          </label>
          <label className="add-activity__opt add-activity__opt--short">
            {t.currencyLabel}
            <input
              type="text"
              className="add-activity__num"
              maxLength={10}
              value={currency}
              onChange={(e) => setCurrency(e.target.value || '₽')}
            />
          </label>
        </div>
      )}

      {error && <span className="add-activity__error">{error}</span>}
    </form>
  );
}
