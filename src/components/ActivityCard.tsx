import { memo, useState } from 'react';
import { useActivities } from '../hooks/useActivities';
import type { ActivityWithStreak } from '../types';

interface Props {
  activity: ActivityWithStreak;
}

export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
  const { updateName } = useActivities();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== activity.name) {
      updateName(activity.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div className={`card ${activity.isDoneToday ? 'card--done' : ''}`}>
      {editing ? (
        <input
          className="card__name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setName(activity.name); setEditing(false); } }}
          autoFocus
        />
      ) : (
        <span
          className="card__name"
          title={activity.name}
          onClick={() => { setName(activity.name); setEditing(true); }}
        >
          {activity.name}
        </span>
      )}
    </div>
  );
});
