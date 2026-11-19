import type { z } from 'zod';
import { apiUnavailable } from './api-error';
import { parseResponse } from './parse-response';

/** Browser → Next proxy route (`/api/*`) → Fastify API. Throws `ApiError`, which suits TanStack Query. */
export async function browserApiFetch<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { signal, headers: { accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw apiUnavailable();
  }
  return parseResponse(response, schema);
}
