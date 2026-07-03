import { useState, useEffect } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/db';
import { today } from '../utils/date';
import { isSeriesBroken, isSeriesCompleted } from '../utils/streak';
import type {
  Activity,
  ActivityWithSeries,
  Series,
  SeriesWithCompletions,
  Completion,
} from '../types';

function buildActivityWithSeries(
  activity: Activity,
  allSeries: Series[],
  allCompletions: Completion[],
  todayStr: string
): ActivityWithSeries {
  const activitySeries = allSeries
    .filter((s) => s.activityId === activity.id)
    .sort((a, b) => b.number - a.number);

  const enrich = (s: Series): SeriesWithCompletions => ({
    ...s,
    completions: allCompletions.filter((c) => c.seriesId === s.id),
  });

  const activeSeries = activitySeries.find((s) => s.status === 'active');
  const enrichedActive = activeSeries ? enrich(activeSeries) : null;

  // Check if active series needs auto-complete or auto-break
  if (enrichedActive) {
    if (isSeriesCompleted(enrichedActive, activity.seriesLength)) {
      // Will be handled on next tick — just mark here for now
      db.series.update(enrichedActive.id!, { status: 'completed' });
      enrichedActive.status = 'completed';
    } else if (isSeriesBroken(enrichedActive, todayStr)) {
      db.series.update(enrichedActive.id!, { status: 'broken' });
      enrichedActive.status = 'broken';
    }
  }

  const lastCompleted = activitySeries.find(
    (s) => s.status === 'completed' && !s.rewardIssued
  );
  const enrichedCompleted = lastCompleted ? enrich(lastCompleted) : null;

  return {
    id: activity.id!,
    name: activity.name,
    createdAt: activity.createdAt,
    seriesLength: activity.seriesLength,
    reward: activity.reward,
    currency: activity.currency,
    activeSeries: enrichedActive && enrichedActive.status === 'active' ? enrichedActive : null,
    lastCompletedSeries: enrichedCompleted,
    isDoneToday: enrichedActive
      ? enrichedActive.completions.some((c) => c.date === todayStr)
      : false,
  };
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityWithSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [acts, sers, comps] = await Promise.all([
        db.activities.toArray(),
        db.series.toArray(),
        db.completions.toArray(),
      ]);
      const todayStr = today();
      return acts.map((a) => buildActivityWithSeries(a, sers, comps, todayStr));
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

  const addActivity = async (
    name: string,
    seriesLength: number,
    reward: number,
    currency: string
  ) => {
    await db.activities.add({
      name: name.trim(),
      createdAt: new Date(),
      seriesLength,
      reward,
      currency,
    });
  };

  const toggleDate = async (activityId: number, dateStr: string) => {
    const activity = await db.activities.get(activityId);
    if (!activity) return;

    // Only allow toggling past or today, not future
    if (dateStr > today()) return;

    // Find or create active series
    let activeSeries = await db.series
      .where({ activityId, status: 'active' })
      .first();

    if (!activeSeries) {
      const allSeries = await db.series.where({ activityId }).toArray();
      const nextNumber = allSeries.length + 1;

      const newId = await db.series.add({
        activityId,
        number: nextNumber,
        status: 'active',
        rewardIssued: false,
        createdAt: new Date(),
      });
      activeSeries = await db.series.get(newId);
    }

    if (!activeSeries) return;

    // Check if date already completed in this series
    const existing = await db.completions
      .where({ seriesId: activeSeries.id, date: dateStr })
      .first();

    if (existing) {
      await db.completions.delete(existing.id!);
      const remaining = await db.completions
        .where({ seriesId: activeSeries.id })
        .count();
      if (remaining === 0) {
        await db.series.delete(activeSeries.id!);
      }
    } else {
      await db.completions.add({
        seriesId: activeSeries.id!,
        activityId,
        date: dateStr,
        createdAt: new Date(),
      });

      // Check if series is now completed
      const allComps = await db.completions
        .where({ seriesId: activeSeries.id })
        .toArray();
      const uniqueDates = new Set(allComps.map((c) => c.date));
      if (uniqueDates.size >= activity.seriesLength) {
        await db.series.update(activeSeries.id!, { status: 'completed' });
      }
    }
  };

  const toggleDone = async (activityId: number) => {
    await toggleDate(activityId, today());
  };

  const claimReward = async (seriesId: number) => {
    await db.series.update(seriesId, { rewardIssued: true });
  };

  const deleteActivity = async (activityId: number) => {
    await db.activities.delete(activityId);
    const seriesIds = (
      await db.series.where({ activityId }).toArray()
    ).map((s) => s.id!);
    for (const sid of seriesIds) {
      await db.completions.where({ seriesId: sid }).delete();
    }
    await db.series.where({ activityId }).delete();
  };

  return { activities, loading, addActivity, toggleDone, toggleDate, claimReward, deleteActivity };
}
