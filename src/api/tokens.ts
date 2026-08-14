const ACCESS_KEY = 'routine-series-access-token';
const REFRESH_KEY = 'routine-series-refresh-token';

/** Access token of the current session, or null when logged out. */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

/** Refresh token of the current session, or null when logged out. */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

/** Persists the session tokens. */
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

/** Removes the session tokens. */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let unauthorizedHandler: (() => void) | null = null;

/** Registers the callback invoked when the session can't be restored (AuthProvider). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Notifies that the session is gone (called by apiFetch after a failed refresh). */
export function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}
