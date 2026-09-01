import type { Activity, ActivityWithStreak, Completion, RewardIssue, SeriesDefinition } from '@/types';
import { createContext, useCallback, useEffect, useState } from 'react';

import { archiveActivity, createActivity, deleteActivityHard, restoreActivity, updateActivity } from '@/api/activities';
import { toggleCompletion } from '@/api/completions';
import { createRewardIssue, deleteRewardIssue as apiDeleteRewardIssue, updateRewardIssue as apiUpdateRewardIssue } from '@/api/rewardIssues';
import { createSeriesDefinition as apiCreateSeriesDefinition, deleteSeriesDefinition as apiDeleteSeriesDefinition } from '@/api/seriesDefinitions';
import { fetchAllData } from '@/api/data';
import { toActivity, toCompletion, toRewardIssue, toSeriesDefinition } from '@/api/mapping';
import { useVirtualToday } from './VirtualTodayContext';

export interface ActivitiesValue {
  activities: ActivityWithStreak[];
  archivedActivities: ActivityWithStreak[];
  loading: boolean;
  addActivity: (name: string, seriesLength: number, reward: number, currency: string) => Promise<void>;
  updateName: (activityId: number, name: string) => Promise<void>;
  toggleDone: (activityId: number) => Promise<void>;
  toggleDate: (activityId: number, date: string) => Promise<void>;
  addRewardIssue: (activityId: number, amount: number, currency: string, date: string) => Promise<void>;
  updateRewardIssue: (id: number, amount: number, currency: string, date: string) => Promise<void>;
  deleteRewardIssue: (id: number) => Promise<void>;
  addSeriesDefinition: (activityId: number, seriesLength: number, reward: number, currency: string) => Promise<void>;
  deleteSeriesDefinition: (activityId: number, id: number) => Promise<void>;
  unarchiveActivity: (activityId: number) => Promise<void>;
  deleteActivity: (activityId: number) => Promise<void>;
}

export const ActivitiesContext = createContext<ActivitiesValue | null>(null);

function build(
  activity: Activity,
  allCompletions: Completion[],
  allDefs: SeriesDefinition[],
  allRewardIssues: RewardIssue[],
): ActivityWithStreak {
  const actDefs = allDefs.filter((d) => d.activityId === activity.id);
  const actComps = allCompletions.filter((c) => c.activityId === activity.id);
  const actRewardIssues = allRewardIssues.filter((r) => r.activityId === activity.id);

  return {
    id: activity.id!,
    name: activity.name,
    archived: activity.archived,
    createdAt: activity.createdAt,
    completions: actComps,
    rewardIssues: actRewardIssues,
    seriesDefinitions: actDefs,
  };
}

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityWithStreak[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<ActivityWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const { virtualToday } = useVirtualToday();

  const load = useCallback(async () => {
    try {
      const data = await fetchAllData(virtualToday);
      const all = (data.activities ?? []).map((a) =>
        build(
          toActivity(a),
          (a.completions ?? []).map(toCompletion),
          (a.series_definitions ?? []).map(toSeriesDefinition),
          (a.reward_issues ?? []).map(toRewardIssue),
        ),
      );
      setActivities(all.filter((a) => !a.archived));
      setArchivedActivities(all.filter((a) => a.archived));
    } catch (err) {
      console.error('Failed to load activities from API:', err);
    } finally {
      setLoading(false);
    }
  }, [virtualToday]);

  useEffect(() => {
    load();
  }, [load]);

  // Mutations update the in-memory copy from API response payloads instead of
  // refetching the whole dataset — full load() happens only on mount.
  const patchActivity = (activityId: number, patch: (a: ActivityWithStreak) => ActivityWithStreak) => {
    const apply = (list: ActivityWithStreak[]) => list.map((a) => (a.id === activityId ? patch(a) : a));
    setActivities(apply);
    setArchivedActivities(apply);
  };

  const addActivity = async (name: string, seriesLength: number, reward: number, currency: string) => {
    try {
      const created = await createActivity(name.trim(), seriesLength, reward, currency);
      const defs = created.definition ? [toSeriesDefinition(created.definition)] : [];
      setActivities((prev) => [...prev, build(toActivity(created), [], defs, [])]);
    } catch (err) {
      console.error('API createActivity failed:', err);
    }
  };

  const updateName = async (activityId: number, name: string) => {
    try {
      const updated = await updateActivity(activityId, name.trim());
      patchActivity(activityId, (a) => ({ ...a, name: updated.name }));
    } catch (err) {
      console.error('API updateActivity failed:', err);
    }
  };

  const toggleDone = async (activityId: number) => {
    try {
      const res = await toggleCompletion(activityId, virtualToday);
      patchActivity(activityId, (a) =>
        res.created && res.completion
          ? { ...a, completions: [...a.completions, toCompletion(res.completion)] }
          : { ...a, completions: a.completions.filter((c) => c.date !== virtualToday) },
      );
    } catch (err) {
      console.error('API toggleCompletion failed:', err);
    }
  };

  const toggleDate = async (activityId: number, date: string) => {
    try {
      const res = await toggleCompletion(activityId, date);
      patchActivity(activityId, (a) =>
        res.created && res.completion
          ? { ...a, completions: [...a.completions, toCompletion(res.completion)] }
          : { ...a, completions: a.completions.filter((c) => c.date !== date) },
      );
    } catch (err) {
      console.error('API toggleCompletion failed:', err);
    }
  };

  const addRewardIssue = async (activityId: number, amount: number, currency: string, date: string) => {
    try {
      const issue = await createRewardIssue(activityId, amount, currency, date);
      const mapped = toRewardIssue(issue);
      patchActivity(mapped.activityId, (a) => ({ ...a, rewardIssues: [...a.rewardIssues, mapped] }));
    } catch (err) {
      console.error('API createRewardIssue failed:', err);
    }
  };

  const updateRewardIssue = async (id: number, amount: number, currency: string, date: string) => {
    try {
      const issue = await apiUpdateRewardIssue(id, amount, currency, date);
      const mapped = toRewardIssue(issue);
      patchActivity(mapped.activityId, (a) => ({
        ...a,
        rewardIssues: a.rewardIssues.map((r) => (r.id === id ? mapped : r)),
      }));
    } catch (err) {
      console.error('API updateRewardIssue failed:', err);
    }
  };

  const deleteRewardIssue = async (id: number) => {
    try {
      await apiDeleteRewardIssue(id);
    } catch (err) {
      console.error('API deleteRewardIssue failed:', err);
      return;
    }
    const owner = [...activities, ...archivedActivities].find((a) => a.rewardIssues.some((r) => r.id === id));
    if (!owner) return;
    patchActivity(owner.id, (a) => ({ ...a, rewardIssues: a.rewardIssues.filter((r) => r.id !== id) }));
  };

  const deleteSeriesDefinition = async (activityId: number, id: number) => {
    try {
      await apiDeleteSeriesDefinition(activityId, id);
    } catch (err) {
      console.error('API deleteSeriesDefinition failed:', err);
      return;
    }
    patchActivity(activityId, (a) => ({ ...a, seriesDefinitions: a.seriesDefinitions.filter((d) => d.id !== id) }));
  };

  const addSeriesDefinition = async (activityId: number, seriesLength: number, reward: number, currency: string) => {
    try {
      const def = await apiCreateSeriesDefinition(activityId, seriesLength, reward, currency);
      const mapped = toSeriesDefinition(def);
      patchActivity(activityId, (a) => ({ ...a, seriesDefinitions: [...a.seriesDefinitions, mapped] }));
    } catch (err) {
      console.error('API createSeriesDefinition failed:', err);
    }
  };

  const unarchiveActivity = async (activityId: number) => {
    try {
      await restoreActivity(activityId);
    } catch (err) {
      console.error('API restoreActivity failed:', err);
      return;
    }
    const activity = archivedActivities.find((a) => a.id === activityId);
    if (!activity) return;
    setArchivedActivities((prev) => prev.filter((a) => a.id !== activityId));
    setActivities((prev) => [...prev, { ...activity, archived: false }]);
  };

  const deleteActivity = async (activityId: number) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    const archive = activity.completions.length > 0 || activity.rewardIssues.length > 0;
    try {
      if (archive) {
        await archiveActivity(activityId);
      } else {
        await deleteActivityHard(activityId);
      }
    } catch (err) {
      console.error('API deleteActivity failed:', err);
      return;
    }
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
    if (archive) {
      setArchivedActivities((prev) => [...prev, { ...activity, archived: true }]);
    }
  };

  const value: ActivitiesValue = {
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
    deleteSeriesDefinition,
    unarchiveActivity,
    deleteActivity
  };

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}
