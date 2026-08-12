import type { Activity, SeriesDefinition } from '@/types';
import type { ApiActivity, ApiSeriesDefinition } from './types';

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
