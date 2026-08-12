import type { ApiActivityWithDef } from './types';
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
