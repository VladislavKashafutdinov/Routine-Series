import { useState, useEffect } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { today } from '../utils/date';
import { calculateStreak, calculateLongestStreak } from '../utils/streak';
import type { Activity, ActivityWithStreak, Completion } from '../types';

function buildActivityWithStreak(
  activity: Activity,
  allCompletions: Completion[],
  todayStr: string
): ActivityWithStreak {
  const completions = allCompletions.filter((c) => c.activityId === activity.id);
  const dates = completions.map((c) => c.date);

  return {
    id: activity.id!,
    name: activity.name,
    createdAt: activity.createdAt,
    currentStreak: calculateStreak(dates, todayStr),
    longestStreak: calculateLongestStreak(dates),
    isDoneToday: dates.includes(todayStr),
    completions,
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [acts, comps] = await Promise.all([
        db.activities.toArray(),
        db.completions.toArray(),
      ]);
      const todayStr = today();
      return acts.map((a) => buildActivityWithStreak(a, comps, todayStr));
    }).subscribe({
      next: (data) => {
        setActivities(data);
        setLoading(false);
      },
      error: (err) => {
        console.error('liveQuery error', err);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const addActivity = async (name: string) => {
    await db.activities.add({ name: name.trim(), createdAt: new Date() });
  };

  const toggleDone = async (activityId: number) => {
    const dateStr = today();
    const existing = await db.completions
      .where({ activityId, date: dateStr })
      .first();

    if (existing) {
      await db.completions.delete(existing.id!);
    } else {
      await db.completions.add({
        activityId,
        date: dateStr,
        createdAt: new Date(),
      });
    }
  };

  const deleteActivity = async (activityId: number) => {
    await db.activities.delete(activityId);
    await db.completions.where({ activityId }).delete();
  };

  return { activities, loading, addActivity, toggleDone, deleteActivity };
}
