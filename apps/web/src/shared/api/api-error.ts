import type { ApiErrorCode, Problem } from '@gitscope/shared';

/** An API failure as a value: thrown on the client (TanStack Query), returned on the server (`ApiResult`). */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(problem: Pick<Problem, 'code' | 'status' | 'detail' | 'title' | 'retryAfterSeconds'>) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.code = problem.code;
    this.status = problem.status;
    this.retryAfterSeconds = problem.retryAfterSeconds;
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export const apiUnavailable = () =>
  new ApiError({
    code: 'UPSTREAM_ERROR',
    status: 503,
    title: 'Service Unavailable',
    detail: 'The GitScope API is not reachable right now',
  });
