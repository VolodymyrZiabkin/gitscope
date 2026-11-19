import { STATUS_CODES } from 'node:http';
import type { ApiErrorCode, Problem } from '@gitscope/shared';
import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';
import { AppError } from '../lib/errors';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

function problem(status: number, code: ApiErrorCode, detail?: string, retryAfterSeconds?: number): Problem {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    code,
    ...(detail !== undefined && { detail }),
    ...(retryAfterSeconds !== undefined && { retryAfterSeconds }),
  };
}

/** Maps any thrown value to RFC 9457 problem details. Unexpected errors never leak their message. */
export function toProblem(error: unknown): Problem {
  if (error instanceof AppError) {
    return problem(error.statusCode, error.code, error.message, error.retryAfterSeconds);
  }
  if (hasZodFastifySchemaValidationErrors(error)) {
    const [issue] = error.validation;
    const field = `${error.validationContext ?? 'request'}${issue?.instancePath.replaceAll('/', '.') ?? ''}`;
    return problem(400, 'INVALID_REQUEST', `Invalid ${field}: ${issue?.message ?? 'validation failed'}`);
  }
  if (isResponseSerializationError(error)) {
    return problem(500, 'INTERNAL_ERROR');
  }
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    return problem(statusCode, 'INVALID_REQUEST', (error as Error).message);
  }
  return problem(500, 'INTERNAL_ERROR');
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const body = toProblem(error);
    if (body.status >= 500) request.log.error({ err: error }, body.detail ?? body.title);
    else request.log.info({ code: body.code }, body.detail ?? body.title);

    if (body.retryAfterSeconds !== undefined) void reply.header('retry-after', String(body.retryAfterSeconds));
    return reply.status(body.status).type(PROBLEM_CONTENT_TYPE).send(body);
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .status(404)
      .type(PROBLEM_CONTENT_TYPE)
      .send(problem(404, 'NOT_FOUND', `Route ${request.method} ${request.url} does not exist`)),
  );
}
