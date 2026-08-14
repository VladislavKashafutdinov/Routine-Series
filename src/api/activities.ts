import type { ApiActivityWithDef } from './types';
import { apiFetch } from './fetch';

export async function fetchActivities(): Promise<ApiActivityWithDef[]> {
  return apiFetch<ApiActivityWithDef[]>('/api/v1/activities');
}

export async function fetchArchivedActivities(): Promise<ApiActivityWithDef[]> {
  return apiFetch<ApiActivityWithDef[]>('/api/v1/activities/archived');
}

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

export async function updateActivity(
  id: number,
  name: string,
): Promise<ApiActivityWithDef> {
  return apiFetch<ApiActivityWithDef>(`/api/v1/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function archiveActivity(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/activities/${id}/archive`, { method: 'POST' });
}

export async function restoreActivity(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/activities/${id}/restore`, { method: 'POST' });
}

/** Hard-deletes an activity; the API returns 409 when dependents exist. */
export async function deleteActivityHard(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/activities/${id}`, { method: 'DELETE' });
}
