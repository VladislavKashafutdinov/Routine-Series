import type { ApiError } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/** Error thrown by apiFetch on non-2xx responses; carries the HTTP status. */
export class ApiFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * fetch wrapper: adds JSON headers, throws ApiFetchError on non-2xx
 * with the API error message; resolves undefined for empty (204) bodies.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies must not get a Content-Type header (browser sets the boundary)
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });

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
