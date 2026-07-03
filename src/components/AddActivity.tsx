import { useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

interface AddActivityProps {
  onAdd: (name: string) => Promise<void>;
}

export function AddActivity({ onAdd }: AddActivityProps) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.addError);
      return;
    }
    setError('');
    await onAdd(trimmed);
    setName('');
  };

  return (
    <form className="add-activity" onSubmit={handleSubmit}>
      <input
        className="add-activity__input"
        type="text"
        placeholder={t.addPlaceholder}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError('');
        }}
        autoFocus
      />
      <button className="add-activity__btn" type="submit">
        {t.addButton}
      </button>
      {error && <span className="add-activity__error">{error}</span>}
    </form>
  );
}
