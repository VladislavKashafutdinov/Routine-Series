import type { ApiActivityWithDef, ApiToggleResponse } from './types';
import { apiFetch } from './fetch';

export async function createActivity(
  name: string,
  seriesLength: number,
  reward: number,
  currency: string,
): Promise<ApiActivityWithDef> {
  return apiFetch<ApiActivityWithDef>('/api/v1/activities', {
    method: 'POST',
    body: JSON.stringify({
      name,
      series_length: seriesLength,
      reward,
      currency,
    }),
  });
}

export async function toggleCompletion(
  activityId: number,
  date: string,
): Promise<ApiToggleResponse> {
  return apiFetch<ApiToggleResponse>('/api/v1/completions/toggle', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, date }),
  });
}

export async function updateActivity(
  id: number,
  name: string,
): Promise<ApiActivityWithDef> {
  return apiFetch<ApiActivityWithDef>(`/api/v1/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}
