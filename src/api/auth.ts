import { apiFetch } from './fetch';
import type { ApiUser } from './types';

/** Requests the current user; throws ApiFetchError with 401 when unauthenticated. */
export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/v1/auth/me');
}

/** Asks the backend to send a login code to the given email. */
export function requestLoginCode(email: string): Promise<void> {
  return apiFetch<void>('/api/v1/auth/code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
