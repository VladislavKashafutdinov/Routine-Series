import type { Activity, Completion, RewardIssue, SeriesDefinition } from '@/types';
import type { ApiActivity, ApiCompletion, ApiRewardIssue, ApiSeriesDefinition } from './types';

export function toActivity(a: ApiActivity): Activity {
  return {
    id: a.id,
    name: a.name,
    archived: a.archived,
    createdAt: new Date(a.created_at),
  };
}

export function toSeriesDefinition(d: ApiSeriesDefinition): SeriesDefinition {
  return {
    id: d.id,
    activityId: d.activity_id,
    seriesLength: d.series_length,
    reward: d.reward,
    currency: d.currency,
    createdAt: new Date(d.created_at),
  };
}

export function toCompletion(c: ApiCompletion): Completion {
  return {
    id: c.id,
    activityId: c.activity_id,
    date: c.date,
  };
}

export function toRewardIssue(r: ApiRewardIssue): RewardIssue {
  return {
    id: r.id,
    activityId: r.activity_id,
    date: r.date,
    amount: r.amount,
    currency: r.currency,
  };
}
