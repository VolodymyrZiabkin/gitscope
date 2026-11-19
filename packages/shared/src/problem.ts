import { z } from 'zod';

export const API_ERROR_CODES = [
  'USER_NOT_FOUND',
  'INVALID_REQUEST',
  'RATE_LIMITED',
  'UPSTREAM_ERROR',
  'NOT_FOUND',
  'INTERNAL_ERROR',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

/** RFC 9457 problem details with a machine-readable `code` extension. */
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.int(),
  detail: z.string().optional(),
  code: apiErrorCodeSchema,
  /** Present for `RATE_LIMITED`: seconds until a retry makes sense. */
  retryAfterSeconds: z.int().nonnegative().optional(),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type Problem = z.infer<typeof problemSchema>;

export function isProblem(value: unknown): value is Problem {
  return problemSchema.safeParse(value).success;
}
