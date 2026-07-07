import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { today } from '../utils/date';
import { computeCurrentStreak, computeLongestStreak } from '../utils/streak';
import type { Activity, ActivityWithStreak, Completion } from '../types';

function build(activity: Activity, allCompletions: Completion[], todayStr: string): ActivityWithStreak {
  const dates = allCompletions
    .filter((c) => c.activityId === activity.id)
    .map((c) => c.date);

  return {
    id: activity.id!,
    name: activity.name,
    createdAt: activity.createdAt,
    seriesLength: activity.seriesLength,
    reward: activity.reward,
    currency: activity.currency,
    currentStreak: computeCurrentStreak(dates, todayStr),
    longestStreak: computeLongestStreak(dates),
    isDoneToday: dates.includes(todayStr),
    completions: allCompletions.filter((c) => c.activityId === activity.id),
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [acts, comps] = await Promise.all([
        db.activities.toArray(),
        db.completions.toArray(),
      ]);
      const todayStr = today();
      return acts.map((a) => build(a, comps, todayStr));
    }).subscribe({
      next: (data) => { setActivities(data); setLoading(false); },
      error: (err) => { console.error(err); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, []);

  const addActivity = async (name: string, seriesLength: number, reward: number, currency: string) => {
    const id = await db.activities.add({ name: name.trim(), createdAt: new Date() });
    await db.seriesDefinitions.add({
      activityId: id as number,
      seriesLength,
      reward,
      currency,
      createdAt: new Date(),
    });
  };

  const toggleDone = async (activityId: number) => {
    const dateStr = today();
    const existing = await db.completions
      .where({ activityId, date: dateStr })
      .first();
    if (existing) {
      await db.completions.delete(existing.id!);
    } else {
      await db.completions.add({ activityId, date: dateStr });
    }
  };

  const deleteActivity = async (activityId: number) => {
    await db.activities.delete(activityId);
    await db.completions.where({ activityId }).delete();
  };

  return { activities, loading, addActivity, toggleDone, deleteActivity };
}
