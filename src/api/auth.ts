import { apiFetch } from './fetch';
import type { ApiUser, ApiVerifyResponse } from './types';

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

/** Verifies the login code; on success returns session tokens and the user. */
export function verifyLoginCode(email: string, code: string): Promise<ApiVerifyResponse> {
  return apiFetch<ApiVerifyResponse>('/api/v1/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}
