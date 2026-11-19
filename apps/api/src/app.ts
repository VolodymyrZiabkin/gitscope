import { randomUUID } from 'node:crypto';
import etag from '@fastify/etag';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Env } from './config/env';
import { createGithubClient, type GithubClient } from './modules/github';
import { healthRoutes } from './modules/health/health.routes';
import { usersRoutes } from './modules/users/users.routes';
import { createUsersService } from './modules/users/users.service';
import { registerErrorHandling } from './plugins/error-handler';
import { registerRateLimit } from './plugins/rate-limit';
import { registerSwagger } from './plugins/swagger';

export interface AppDependencies {
  env: Env;
  /** Injected in tests; by default chosen from the env (token → GraphQL, no token → fixtures). */
  github?: GithubClient;
  now?: () => Date;
}

function loggerOptions(env: Env): FastifyServerOptions['logger'] {
  if (env.NODE_ENV === 'test') return false;
  return {
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'development' && {
      transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
    }),
  };
}

export async function buildApp({ env, github: injectedGithub, now }: AppDependencies) {
  const app = Fastify({
    logger: loggerOptions(env),
    // Trust exactly TRUST_PROXY hops of x-forwarded-for (the number form is missing from Fastify's types).
    trustProxy: (_address, hop) => hop < env.TRUST_PROXY,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandling(app);
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  await app.register(helmet);
  await app.register(etag);
  await registerRateLimit(app, { max: env.RATE_LIMIT_MAX, internalApiKey: env.INTERNAL_API_KEY });
  await registerSwagger(app);

  const github = injectedGithub ?? createGithubClient(env, app.log);
  if (github.mode === 'fixtures') {
    app.log.warn(`GITHUB_TOKEN is not set — serving recorded fixtures from ./${env.FIXTURES_DIR}`);
  }

  await app.register(healthRoutes, { github });
  await app.register(usersRoutes, { service: createUsersService({ github, now }) });

  return app;
}
