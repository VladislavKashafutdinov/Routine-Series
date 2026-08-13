import type { ApiRewardIssue } from './types';
import { apiFetch } from './fetch';

export async function createRewardIssue(
  activityId: number,
  amount: number,
  currency: string,
  date: string,
): Promise<ApiRewardIssue> {
  return apiFetch<ApiRewardIssue>('/api/v1/reward-issues', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, date, amount, currency }),
  });
}

export async function updateRewardIssue(
  id: number,
  amount: number,
  currency: string,
  date: string,
): Promise<ApiRewardIssue> {
  return apiFetch<ApiRewardIssue>(`/api/v1/reward-issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount, currency, date }),
  });
}

export async function deleteRewardIssue(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/reward-issues/${id}`, { method: 'DELETE' });
}
