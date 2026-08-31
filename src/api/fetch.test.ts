import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from './fetch';

vi.mock('./tokens', () => ({
  getAccessToken: () => null,
  getRefreshToken: () => null,
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
  notifyUnauthorized: vi.fn(),
}));

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as Response;

describe('apiFetch retry on 504', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a timed-out GET and resolves on the second attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(504, { error: 'request timed out' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(apiFetch('/api/v1/activities')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 5000);

  it('does not retry non-GET requests', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(504, { error: 'request timed out' }));

    await expect(apiFetch('/api/v1/completions/toggle', { method: 'POST' })).rejects.toMatchObject({
      status: 504,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry other 5xx statuses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: 'failed' }));

    await expect(apiFetch('/api/v1/activities')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after the retry budget and throws 504', async () => {
    fetchMock.mockResolvedValue(jsonResponse(504, { error: 'request timed out' }));

    await expect(apiFetch('/api/v1/activities')).rejects.toMatchObject({ status: 504 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 10000);
});
