import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { today } from '../utils/date';
import { computeCurrentStreak, computeLongestStreak } from '../utils/streak';
import { useTimeOffset } from './TimeOffsetContext';
import type { Activity, ActivityWithStreak, Completion, SeriesDefinition } from '../types';

function latestDef(defs: SeriesDefinition[], activityId: number): SeriesDefinition {
  const actDefs = defs.filter((d) => d.activityId === activityId);
  return actDefs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

function build(
  activity: Activity,
  allCompletions: Completion[],
  allDefs: SeriesDefinition[],
  todayStr: string
): ActivityWithStreak {
  const def = latestDef(allDefs, activity.id!);
  const dates = allCompletions
    .filter((c) => c.activityId === activity.id)
    .map((c) => c.date);

  return {
    id: activity.id!,
    name: activity.name,
    archived: activity.archived,
    createdAt: activity.createdAt,
    seriesLength: def?.seriesLength ?? 7,
    reward: def?.reward ?? 0,
    currency: def?.currency ?? '₽',
    currentStreak: computeCurrentStreak(dates, todayStr),
    longestStreak: computeLongestStreak(dates),
    isDoneToday: dates.includes(todayStr),
    completions: allCompletions.filter((c) => c.activityId === activity.id),
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const { offset } = useTimeOffset();

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [acts, comps, defs] = await Promise.all([
        db.activities.toArray(),
        db.completions.toArray(),
        db.seriesDefinitions.toArray(),
      ]);
      const todayStr = today(offset);
      return acts
        .filter((a) => !a.archived)
        .map((a) => build(a, comps, defs, todayStr));
    }).subscribe({
      next: (data) => { setActivities(data); setLoading(false); },
      error: (err) => { console.error(err); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, [offset]);

  const addActivity = async (name: string, seriesLength: number, reward: number, currency: string) => {
    const id = await db.activities.add({ name: name.trim(), archived: false, createdAt: new Date() });
    await db.seriesDefinitions.add({
      activityId: id as number,
      seriesLength,
      reward,
      currency,
      createdAt: new Date(),
    });
  };

  const updateName = async (activityId: number, name: string) => {
    await db.activities.update(activityId, { name: name.trim() });
  };

  const toggleDone = async (activityId: number) => {
    const dateStr = today(offset);
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
    const hasCompletions = (await db.completions.where({ activityId }).count()) > 0;
    // RewardIssue check will be added when the table exists (Task 6)
    if (hasCompletions) {
      await db.activities.update(activityId, { archived: true });
    } else {
      await db.activities.delete(activityId);
      await db.seriesDefinitions.where({ activityId }).delete();
      await db.completions.where({ activityId }).delete();
    }
  };

  return { activities, loading, addActivity, updateName, toggleDone, deleteActivity };
}
