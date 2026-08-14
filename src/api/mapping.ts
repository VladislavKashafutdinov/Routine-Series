import type { Activity, Completion, RewardIssue, SeriesDefinition } from '@/types';
import type {
  ApiActivity,
  ApiCompletion,
  ApiRewardIssue,
  ApiSeriesDefinition,
  ExportActivity,
  ExportCompletion,
  ExportRewardIssue,
  ExportSeriesDefinition,
} from './types';

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

// ---- API → export/import payload (camelCase, dates stay strings) ----

export function toExportActivity(a: ApiActivity): ExportActivity {
  return {
    id: a.id,
    name: a.name,
    archived: a.archived,
    createdAt: a.created_at,
  };
}

export function toExportSeriesDefinition(d: ApiSeriesDefinition): ExportSeriesDefinition {
  return {
    id: d.id,
    activityId: d.activity_id,
    seriesLength: d.series_length,
    reward: d.reward,
    currency: d.currency,
    createdAt: d.created_at,
  };
}

export function toExportCompletion(c: ApiCompletion): ExportCompletion {
  return {
    id: c.id,
    activityId: c.activity_id,
    date: c.date,
  };
}

export function toExportRewardIssue(r: ApiRewardIssue): ExportRewardIssue {
  return {
    id: r.id,
    activityId: r.activity_id,
    date: r.date,
    amount: r.amount,
    currency: r.currency,
  };
}
