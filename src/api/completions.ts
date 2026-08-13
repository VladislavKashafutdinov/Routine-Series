import type { ApiToggleResponse } from './types';
import { apiFetch } from './fetch';

export async function toggleCompletion(
  activityId: number,
  date: string,
): Promise<ApiToggleResponse> {
  return apiFetch<ApiToggleResponse>('/api/v1/completions/toggle', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, date }),
  });
}
