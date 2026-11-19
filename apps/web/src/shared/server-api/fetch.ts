import 'server-only';
import { headers } from 'next/headers';
import type { z } from 'zod';
import { ApiError, apiUnavailable, parseResponse, type ApiResult } from '@/shared/api';
import { serverEnv } from './env';

/** Generous: a free-tier API instance may need up to a minute to wake up. */
const TIMEOUT_MS = 60_000;

/** The client IP as seen by the hosting edge (Vercel sets x-real-ip / x-forwarded-for). */
export function clientIpFrom(requestHeaders: Headers): string | undefined {
  return requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
}

/** Headers that let the API rate-limit by the real visitor instead of the Next.js server. */
export function forwardingHeaders(requestHeaders: Headers): Record<string, string> {
  const forwarded: Record<string, string> = { accept: 'application/json' };
  const clientIp = clientIpFrom(requestHeaders);
  if (serverEnv.INTERNAL_API_KEY && clientIp) {
    forwarded['x-internal-key'] = serverEnv.INTERNAL_API_KEY;
    forwarded['x-client-ip'] = clientIp;
  }
  return forwarded;
}

/**
 * Server Components → Fastify API. Never cached by Next: the API owns caching, and every request carries
 * the visitor's IP for rate limiting. Expected failures come back as values, not exceptions.
 */
export async function serverApiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  { timeoutMs = TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${serverEnv.API_URL}${path}`, {
      cache: 'no-store',
      headers: forwardingHeaders(await headers()),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: true, data: await parseResponse(response, schema) };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error : apiUnavailable() };
  }
}

const PROXIED_PATH = /^\/(health|users\/[A-Za-z0-9-]{1,39}(\/contributions)?)$/;
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'cache-control', 'etag', 'retry-after', 'x-cache', 'x-request-id'];

/** Same-origin proxy for the browser: no CORS, the API address and the internal key stay on the server. */
export async function proxyToApi(path: string, search: string, request: Request): Promise<Response> {
  if (!PROXIED_PATH.test(path)) {
    return Response.json(
      { type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND', detail: 'Unknown API route' },
      { status: 404, headers: { 'content-type': 'application/problem+json' } },
    );
  }

  const requestHeaders = forwardingHeaders(request.headers);
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch) requestHeaders['if-none-match'] = ifNoneMatch;

  try {
    const upstream = await fetch(`${serverEnv.API_URL}${path}${search}`, {
      cache: 'no-store',
      headers: requestHeaders,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const responseHeaders = new Headers();
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    const error = apiUnavailable();
    return Response.json(
      { type: 'about:blank', title: 'Service Unavailable', status: 503, code: error.code, detail: error.message },
      { status: 503, headers: { 'content-type': 'application/problem+json' } },
    );
  }
}
