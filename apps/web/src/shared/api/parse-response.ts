import { isProblem } from '@gitscope/shared';
import type { z } from 'zod';
import { ApiError, apiUnavailable } from './api-error';

/** Turns an API response into data (validated against the shared contract) or an `ApiError`. */
export async function parseResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const parsed = schema.safeParse(body);
    if (parsed.success) return parsed.data;
    throw new ApiError({
      code: 'INTERNAL_ERROR',
      status: 500,
      title: 'Contract mismatch',
      detail: 'The API response does not match the expected contract',
    });
  }
  if (isProblem(body)) throw new ApiError(body);
  throw apiUnavailable();
}
