import { useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useActivities } from '@/hooks/useActivities';
import './AddActivity.css';

const DEFAULTS = { length: 7, reward: 0, currency: '₽' };

export function AddActivity() {
  const { t, lang } = useLocale();
  const { addActivity } = useActivities();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [length, setLength] = useState(DEFAULTS.length);
  const [reward, setReward] = useState(DEFAULTS.reward);
  const [currency, setCurrency] = useState(DEFAULTS.currency);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setLength(DEFAULTS.length);
    setReward(DEFAULTS.reward);
    setCurrency(DEFAULTS.currency);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t.addError); return; }
    if (length < 1) { setError(t.addErrorLength); return; }
    await addActivity(name.trim(), length, reward, currency);
    reset();
    setOpen(false);
  };

  return (
    <>
      <button className="add-activity-card" type="button" onClick={() => setOpen(true)}>
        <span className="add-activity-card__plus">＋</span>
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3 className="modal__title">{t.addButton}</h3>
            <label className="modal__field">
              <span>{t.addPlaceholder}</span>
              <input
                className="modal__input"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                autoFocus
              />
            </label>
            <label className="modal__field">
              <span>{t.seriesLengthLabel}</span>
              <input
                className="modal__input modal__input--short"
                type="number"
                min={1}
                max={365}
                value={length}
                onChange={(e) => setLength(Number(e.target.value) || 1)}
              />
            </label>
            <label className="modal__field">
              <span>{t.rewardLabel}</span>
              <input
                className="modal__input modal__input--short"
                type="number"
                min={0}
                value={reward}
                onChange={(e) => setReward(Number(e.target.value) || 0)}
              />
            </label>
            <label className="modal__field">
              <span>{t.currencyLabel}</span>
              <input
                className="modal__input modal__input--short"
                type="text"
                maxLength={10}
                value={currency}
                onChange={(e) => setCurrency(e.target.value || '₽')}
              />
            </label>
            {error && <span className="add-activity__error">{error}</span>}
            <div className="modal__actions">
              <button className="modal__btn modal__btn--submit" type="submit">{t.addButton}</button>
              <button
                className="modal__btn modal__btn--cancel"
                type="button"
                onClick={() => { reset(); setOpen(false); }}
              >
                {lang === 'en' ? 'Cancel' : 'Отмена'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
