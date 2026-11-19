import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiError } from './api-error';
import { browserApiFetch } from './browser-fetch';
import { server } from '@/shared/test';

const schema = z.object({ status: z.literal('ok') });
const problem = (status: number, code: string, extra: object = {}) =>
  HttpResponse.json(
    { type: 'about:blank', title: 'Error', status, code, ...extra },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );

describe('browserApiFetch', () => {
  it('returns data validated against the contract', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.json({ status: 'ok' })));
    await expect(browserApiFetch('/health', schema)).resolves.toEqual({ status: 'ok' });
  });

  it('turns problem details into an ApiError with the machine-readable code', async () => {
    server.use(http.get('*/api/users/ghost', () => problem(404, 'USER_NOT_FOUND', { detail: 'No such user' })));
    const error = await browserApiFetch('/users/ghost', schema).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'USER_NOT_FOUND', status: 404, message: 'No such user' });
  });

  it('keeps Retry-After information for rate limits', async () => {
    server.use(http.get('*/api/health', () => problem(429, 'RATE_LIMITED', { retryAfterSeconds: 42 })));
    await expect(browserApiFetch('/health', schema)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSeconds: 42,
    });
  });

  it('reports a contract mismatch instead of passing bad data on', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.json({ status: 'maybe' })));
    await expect(browserApiFetch('/health', schema)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('treats a network failure as the API being unavailable', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.error()));
    await expect(browserApiFetch('/health', schema)).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', status: 503 });
  });
});
