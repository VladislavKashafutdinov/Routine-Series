import type { Activity, ActivityWithStreak, Completion, RewardIssue, SeriesDefinition } from '../types';
import { useEffect, useState } from 'react';

import { computeSeries } from '../utils/series';
import { db } from '../db/db';
import { liveQuery } from 'dexie';
import { useVirtualToday } from './VirtualTodayContext';

export function latestDef(defs: SeriesDefinition[], activityId: number): SeriesDefinition {
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
  const actDefs = allDefs.filter((d) => d.activityId === activity.id);
  const actComps = allCompletions.filter((c) => c.activityId === activity.id);
  const actRewardIssues = allRewardIssues.filter((r) => r.activityId === activity.id);

  // Reward calculations still depend on computeSeries
  const series = computeSeries(actDefs, actComps, todayStr);
  const earnedByCurrency: Record<string, number> = {};
  const issuedByCurrency: Record<string, number> = {};
  for (const s of series.filter((s) => s.status === 'completed')) {
    earnedByCurrency[s.currency] = (earnedByCurrency[s.currency] || 0) + s.reward;
  }
  for (const r of actRewardIssues) {
    issuedByCurrency[r.currency] = (issuedByCurrency[r.currency] || 0) + r.amount;
  }
  const unissuedByCurrency: Record<string, number> = {};
  for (const c of new Set([...Object.keys(earnedByCurrency), ...Object.keys(issuedByCurrency)])) {
    unissuedByCurrency[c] = (earnedByCurrency[c] || 0) - (issuedByCurrency[c] || 0);
  }

  return {
    id: activity.id!,
    name: activity.name,
    archived: activity.archived,
    createdAt: activity.createdAt,
    earnedByCurrency,
    issuedByCurrency,
    unissuedByCurrency,
    isDoneToday: actComps.some((c) => c.date === todayStr),
    completions: actComps,
    rewardIssues: actRewardIssues,
    seriesDefinitions: actDefs,
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<ActivityWithStreak[]>([]);
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
      return {
        active: acts.filter((a) => !a.archived).map((a) => build(a, comps, defs, issues, virtualToday)),
        archived: acts.filter((a) => a.archived).map((a) => build(a, comps, defs, issues, virtualToday)),
      };
    }).subscribe({
      next: (data) => { setActivities(data.active); setArchivedActivities(data.archived); setLoading(false); },
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
      createdAt: new Date(virtualToday + 'T' + new Date().toISOString().slice(11, 19)),
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

  const addSeriesDefinition = async (activityId: number, seriesLength: number, reward: number, currency: string) => {
    await db.seriesDefinitions.add({
      activityId,
      seriesLength,
      reward,
      currency,
      createdAt: new Date(virtualToday + 'T' + new Date().toISOString().slice(11, 19)),
    });
  };

  const unarchiveActivity = async (activityId: number) => {
    await db.activities.update(activityId, { archived: false });
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
    archivedActivities,
    loading,
    addActivity,
    updateName, 
    toggleDone, 
    toggleDate,
    addRewardIssue,
    updateRewardIssue,
    deleteRewardIssue,
    addSeriesDefinition,
    unarchiveActivity,
    deleteActivity
  };
}
