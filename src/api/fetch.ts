import type { ApiError, ApiVerifyResponse } from './types';
import { clearTokens, getAccessToken, getRefreshToken, notifyUnauthorized, saveTokens } from './tokens';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const REFRESH_PATH = '/api/v1/auth/refresh';
const LOGOUT_PATH = '/api/v1/auth/logout';

/** Error thrown by apiFetch on non-2xx responses; carries the HTTP status. */
export class ApiFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Single-flight refresh: concurrent 401s share one refresh request, otherwise
// parallel refreshes would rotate the token out from under each other.
let refreshPromise: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as ApiVerifyResponse;
    saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

/**
 * fetch wrapper: adds JSON headers and the Authorization header when a token
 * exists. On 401 it refreshes the tokens once and retries (except for the
 * token endpoints themselves); if the session can't be restored, it clears
 * the tokens and notifies AuthContext. Throws ApiFetchError on non-2xx
 * with the API error message; resolves undefined for empty (204) bodies.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies must not get a Content-Type header (browser sets the boundary)
  const isFormData = init?.body instanceof FormData;
  const buildHeaders = () => ({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    ...init?.headers,
  });

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(),
  });

  const allowRefresh = path !== REFRESH_PATH && path !== LOGOUT_PATH;
  if (res.status === 401 && allowRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: buildHeaders(),
      });
    }
  }

  if (res.status === 401) {
    clearTokens();
    notifyUnauthorized();
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep the HTTP status message
    }
    throw new ApiFetchError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
