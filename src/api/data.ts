import { apiFetch } from './fetch';
import type { ApiAllData } from './types';

/** Loads the whole dataset: activities with definitions, completions and reward issues. */
export async function fetchAllData(): Promise<ApiAllData> {
  return apiFetch<ApiAllData>('/api/v1/data');
}
