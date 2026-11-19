import type { ApiErrorCode } from '@gitscope/shared';

/** An expected failure that maps to a problem+json response. */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    code: ApiErrorCode,
    statusCode: number,
    message: string,
    options: { retryAfterSeconds?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function isAppError(error: unknown, code?: ApiErrorCode): error is AppError {
  return error instanceof AppError && (code === undefined || error.code === code);
}

export const userNotFound = (login: string) =>
  new AppError('USER_NOT_FOUND', 404, `GitHub user "${login}" does not exist or is an organization`);

export const invalidRequest = (message: string) => new AppError('INVALID_REQUEST', 400, message);

export const upstreamError = (message: string, cause?: unknown) =>
  new AppError('UPSTREAM_ERROR', 502, message, { cause });

/** Our GitHub quota is exhausted: the service is unavailable, the client did nothing wrong — hence 503. */
export const githubQuotaExceeded = (retryAfterSeconds: number) =>
  new AppError('RATE_LIMITED', 503, 'GitHub API quota is exhausted, please try again later', { retryAfterSeconds });

/** The client exceeded our own rate limit. */
export const tooManyRequests = (retryAfterSeconds: number) =>
  new AppError('RATE_LIMITED', 429, 'Too many requests, please slow down', { retryAfterSeconds });
