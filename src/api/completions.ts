import type { ApiCompletion, ApiToggleResponse } from './types';
import { apiFetch } from './fetch';

export async function fetchCompletions(
  activityId: number,
  from: string,
  to: string,
): Promise<ApiCompletion[]> {
  const qs = new URLSearchParams({
    activity_id: String(activityId),
    from,
    to,
  });
  return apiFetch<ApiCompletion[]>(`/api/v1/completions?${qs}`);
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
