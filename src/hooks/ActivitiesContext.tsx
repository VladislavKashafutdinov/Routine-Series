import type { Activity, ActivityWithStreak, Completion, RewardIssue, SeriesDefinition } from '@/types';
import { createContext, useCallback, useEffect, useState } from 'react';

import { archiveActivity, createActivity, deleteActivityHard, fetchActivities, fetchArchivedActivities, restoreActivity, updateActivity } from '@/api/activities';
import { fetchCompletions, toggleCompletion } from '@/api/completions';
import { createRewardIssue, deleteRewardIssue as apiDeleteRewardIssue, fetchRewardIssues, updateRewardIssue as apiUpdateRewardIssue } from '@/api/rewardIssues';
import { createSeriesDefinition as apiCreateSeriesDefinition, deleteSeriesDefinition as apiDeleteSeriesDefinition, fetchSeriesDefinitions } from '@/api/seriesDefinitions';
import { toActivity, toCompletion, toRewardIssue, toSeriesDefinition } from '@/api/mapping';
import type { ApiActivityWithDef } from '@/api/types';
import { useVirtualToday } from './VirtualTodayContext';

// CompletionsTab calendar starts at Jan 1970, so fetch completions from epoch
const COMPLETIONS_FROM = '1970-01-01';
// Reward issues are paginated client-side (PER_PAGE 50) — fetch all in one page
const REWARD_ISSUES_LIMIT = 1000;

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
    const buildOne = async (apiActivity: ApiActivityWithDef): Promise<ActivityWithStreak> => {
      const [defs, comps, issues] = await Promise.all([
        fetchSeriesDefinitions(apiActivity.id),
        fetchCompletions(apiActivity.id, COMPLETIONS_FROM, virtualToday),
        fetchRewardIssues(apiActivity.id, REWARD_ISSUES_LIMIT, 0),
      ]);
      return build(
        toActivity(apiActivity),
        (comps ?? []).map(toCompletion),
        (defs ?? []).map(toSeriesDefinition),
        (issues?.items ?? []).map(toRewardIssue),
      );
    };

    try {
      const [activeList, archivedList] = await Promise.all([
        fetchActivities(),
        fetchArchivedActivities(),
      ]);
      const [active, archived] = await Promise.all([
        Promise.all((activeList ?? []).map(buildOne)),
        Promise.all((archivedList ?? []).map(buildOne)),
      ]);
      setActivities(active);
      setArchivedActivities(archived);
    } catch (err) {
      console.error('Failed to load activities from API:', err);
    } finally {
      setLoading(false);
    }
  }, [virtualToday]);

  useEffect(() => {
    load();
  }, [load]);

  const addActivity = async (name: string, seriesLength: number, reward: number, currency: string) => {
    try {
      await createActivity(name.trim(), seriesLength, reward, currency);
    } catch (err) {
      console.error('API createActivity failed:', err);
    }
    await load();
  };

  const updateName = async (activityId: number, name: string) => {
    try {
      await updateActivity(activityId, name.trim());
    } catch (err) {
      console.error('API updateActivity failed:', err);
    }
    await load();
  };

  const toggleDone = async (activityId: number) => {
    try {
      await toggleCompletion(activityId, virtualToday);
    } catch (err) {
      console.error('API toggleCompletion failed:', err);
    }
    await load();
  };

  const toggleDate = async (activityId: number, date: string) => {
    try {
      await toggleCompletion(activityId, date);
    } catch (err) {
      console.error('API toggleCompletion failed:', err);
    }
    await load();
  };

  const addRewardIssue = async (activityId: number, amount: number, currency: string, date: string) => {
    try {
      await createRewardIssue(activityId, amount, currency, date);
    } catch (err) {
      console.error('API createRewardIssue failed:', err);
    }
    await load();
  };

  const updateRewardIssue = async (id: number, amount: number, currency: string, date: string) => {
    try {
      await apiUpdateRewardIssue(id, amount, currency, date);
    } catch (err) {
      console.error('API updateRewardIssue failed:', err);
    }
    await load();
  };

  const deleteRewardIssue = async (id: number) => {
    try {
      await apiDeleteRewardIssue(id);
    } catch (err) {
      console.error('API deleteRewardIssue failed:', err);
    }
    await load();
  };

  const deleteSeriesDefinition = async (activityId: number, id: number) => {
    try {
      await apiDeleteSeriesDefinition(activityId, id);
    } catch (err) {
      console.error('API deleteSeriesDefinition failed:', err);
    }
    await load();
  };

  const addSeriesDefinition = async (activityId: number, seriesLength: number, reward: number, currency: string) => {
    try {
      await apiCreateSeriesDefinition(activityId, seriesLength, reward, currency);
    } catch (err) {
      console.error('API createSeriesDefinition failed:', err);
    }
    await load();
  };

  const unarchiveActivity = async (activityId: number) => {
    try {
      await restoreActivity(activityId);
    } catch (err) {
      console.error('API restoreActivity failed:', err);
    }
    await load();
  };

  const deleteActivity = async (activityId: number) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    try {
      if (activity.completions.length > 0 || activity.rewardIssues.length > 0) {
        await archiveActivity(activityId);
      } else {
        await deleteActivityHard(activityId);
      }
    } catch (err) {
      console.error('API deleteActivity failed:', err);
    }
    await load();
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
