import { apiFetch } from './fetch';
import type { ApiUser } from './types';

/** Requests the current user; throws ApiFetchError with 401 when unauthenticated. */
export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/v1/auth/me');
}
