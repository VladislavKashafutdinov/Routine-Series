import { useState } from 'react';

interface AddActivityProps {
  onAdd: (name: string) => Promise<void>;
}

export function AddActivity({ onAdd }: AddActivityProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name');
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
        placeholder="New daily task…"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError('');
        }}
        autoFocus
      />
      <button className="add-activity__btn" type="submit">
        + Add
      </button>
      {error && <span className="add-activity__error">{error}</span>}
    </form>
  );
}
