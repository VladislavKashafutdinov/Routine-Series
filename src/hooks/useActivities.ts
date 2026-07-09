import type { Activity, ActivityWithStreak, Completion, RewardIssue, SeriesDefinition } from '../types';
import { useEffect, useState } from 'react';

import { computeSeries } from '../utils/series';
import { db } from '../db/db';
import { liveQuery } from 'dexie';
import { useVirtualToday } from './VirtualTodayContext';

function latestDef(defs: SeriesDefinition[], activityId: number): SeriesDefinition {
  const actDefs = defs.filter((d) => d.activityId === activityId);
  return actDefs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

function build(
  activity: Activity,
  allCompletions: Completion[],
  allDefs: SeriesDefinition[],
  allRewardIssues: RewardIssue[],
  todayStr: string
): ActivityWithStreak {
  const def = latestDef(allDefs, activity.id!);
  const actDefs = allDefs.filter((d) => d.activityId === activity.id);
  const actComps = allCompletions.filter((c) => c.activityId === activity.id);
  const actRewardIssues = allRewardIssues.filter((r) => r.activityId === activity.id);
  const series = computeSeries(actDefs, actComps, todayStr);

  const activeSeries = series.find((s) => s.status === 'active');
  const totalEarned = series
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.reward, 0);
  const totalIssued = actRewardIssues.reduce((sum, r) => sum + r.amount, 0);

  return {
    id: activity.id!,
    name: activity.name,
    archived: activity.archived,
    createdAt: activity.createdAt,
    seriesLength: def?.seriesLength ?? 7,
    reward: def?.reward ?? 0,
    currency: def?.currency ?? '₽',
    currentStreak: activeSeries ? activeSeries.completions.length : 0,
    longestStreak: series.reduce((max, s) => Math.max(max, s.completions.length), 0),
    totalEarned,
    totalIssued,
    totalUnissued: totalEarned - totalIssued,
    isDoneToday: actComps.some((c) => c.date === todayStr),
    completions: actComps,
    series,
    rewardIssues: actRewardIssues,
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const { virtualToday } = useVirtualToday();

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [acts, comps, defs, issues] = await Promise.all([
        db.activities.toArray(),
        db.completions.toArray(),
        db.seriesDefinitions.toArray(),
        db.rewardIssues.toArray(),
      ]);
      return acts
        .filter((a) => !a.archived)
        .map((a) => build(a, comps, defs, issues, virtualToday));
    }).subscribe({
      next: (data) => { setActivities(data); setLoading(false); },
      error: (err) => { console.error(err); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, [virtualToday]);

  const addActivity = async (name: string, seriesLength: number, reward: number, currency: string) => {
    const id = await db.activities.add({ 
      name: name.trim(), 
      archived: false, 
      createdAt: new Date() 
    });
    await db.seriesDefinitions.add({
      activityId: id as number,
      seriesLength,
      reward,
      currency,
      createdAt: new Date(virtualToday + 'T00:00:00'),
    });
  };

  const updateName = async (activityId: number, name: string) => {
    await db.activities.update(activityId, { name: name.trim() });
  };

  const toggleDone = async (activityId: number) => {
    const existing = await db.completions
      .where({ activityId, date: virtualToday })
      .first();
    if (existing) {
      await db.completions.delete(existing.id!);
    } else {
      await db.completions.add({ activityId, date: virtualToday });
    }
  };

  const toggleDate = async (activityId: number, date: string) => {
    const existing = await db.completions
      .where({ activityId, date })
      .first();
    if (existing) {
      await db.completions.delete(existing.id!);
    } else {
      await db.completions.add({ activityId, date });
    }
  };

  const addRewardIssue = async (activityId: number, amount: number, currency: string, date: string) => {
    await db.rewardIssues.add({ activityId, amount, currency, date });
  };

  const updateRewardIssue = async (id: number, amount: number, currency: string, date: string) => {
    await db.rewardIssues.update(id, { amount, currency, date });
  };

  const deleteRewardIssue = async (id: number) => {
    await db.rewardIssues.delete(id);
  };

  const deleteActivity = async (activityId: number) => {
    const hasCompletions = (await db.completions.where({ activityId }).count()) > 0;
    const hasRewardIssues = (await db.rewardIssues.where({ activityId }).count()) > 0;
    if (hasCompletions || hasRewardIssues) {
      await db.activities.update(activityId, { archived: true });
    } else {
      await db.activities.delete(activityId);
      await db.seriesDefinitions.where({ activityId }).delete();
      await db.rewardIssues.where({ activityId }).delete();
      await db.completions.where({ activityId }).delete();
    }
  };

  return { 
    activities, 
    loading, 
    addActivity, 
    updateName, 
    toggleDone, 
    toggleDate,
    addRewardIssue, 
    updateRewardIssue, 
    deleteRewardIssue, 
    deleteActivity 
  };
}
