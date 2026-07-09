import { useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useActivities } from '../hooks/useActivities';
import './AddActivity.css';

const DEFAULTS = { length: 7, reward: 0, currency: '₽' };

export function AddActivity() {
  const { t } = useLocale();
  const { addActivity } = useActivities();
  const [name, setName] = useState('');
  const [length, setLength] = useState(DEFAULTS.length);
  const [reward, setReward] = useState(DEFAULTS.reward);
  const [currency, setCurrency] = useState(DEFAULTS.currency);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t.addError); return; }
    if (length < 1) { setError(t.addErrorLength); return; }
    await addActivity(name.trim(), length, reward, currency);
    setName(''); setLength(DEFAULTS.length); setReward(DEFAULTS.reward);
    setCurrency(DEFAULTS.currency); setExpanded(false); setError('');
  };

  return (
    <form className="add-activity" onSubmit={submit}>
      <div className="add-activity__row">
        <input
          className="add-activity__input"
          type="text"
          placeholder={t.addPlaceholder}
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onFocus={() => setExpanded(true)}
          autoFocus
        />
        <button className="add-activity__btn" type="submit">{t.addButton}</button>
      </div>
      {expanded && (
        <div className="add-activity__opts">
          <label className="add-activity__opt">{t.seriesLengthLabel}
            <input className="add-activity__num" type="number" min={1} max={365}
              value={length} onChange={(e) => setLength(Number(e.target.value) || 1)} />
          </label>
          <label className="add-activity__opt">{t.rewardLabel}
            <input className="add-activity__num" type="number" min={0}
              value={reward} onChange={(e) => setReward(Number(e.target.value) || 0)} />
          </label>
          <label className="add-activity__opt add-activity__opt--short">{t.currencyLabel}
            <input className="add-activity__num" type="text" maxLength={10}
              value={currency} onChange={(e) => setCurrency(e.target.value || '₽')} />
          </label>
        </div>
      )}
      {error && <span className="add-activity__error">{error}</span>}
    </form>
  );
}
