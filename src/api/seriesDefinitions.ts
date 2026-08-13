import type { ApiSeriesDefinition } from './types';
import { apiFetch } from './fetch';

export async function fetchSeriesDefinitions(
  activityId: number,
): Promise<ApiSeriesDefinition[]> {
  return apiFetch<ApiSeriesDefinition[]>(
    `/api/v1/activities/${activityId}/series-definitions`,
  );
}

export async function createSeriesDefinition(
  activityId: number,
  seriesLength: number,
  reward: number,
  currency: string,
): Promise<ApiSeriesDefinition> {
  return apiFetch<ApiSeriesDefinition>(
    `/api/v1/activities/${activityId}/series-definitions`,
    {
      method: 'POST',
      body: JSON.stringify({
        series_length: seriesLength,
        reward,
        currency,
      }),
    },
  );
}

export async function deleteSeriesDefinition(
  activityId: number,
  defId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/v1/activities/${activityId}/series-definitions/${defId}`,
    { method: 'DELETE' },
  );
}
