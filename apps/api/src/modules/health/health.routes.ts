import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { GithubClient } from '../github';

const healthSchema = z.object({
  status: z.literal('ok'),
  mode: z.enum(['live', 'fixtures']),
  uptimeSeconds: z.int().nonnegative(),
  githubRateLimit: z.object({ limit: z.int(), remaining: z.int(), resetAt: z.string() }).nullable(),
});

/** Also used by the web app to wake the free-tier instance up before the user submits a search. */
export const healthRoutes: FastifyPluginAsyncZod<{ github: GithubClient }> = async (app, { github }) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Liveness, data source and remaining GitHub quota',
        response: { 200: healthSchema },
      },
      config: { rateLimit: false },
    },
    async (_request, reply) => {
      reply.header('cache-control', 'no-store');
      const rateLimit = github.rateLimit;
      return {
        status: 'ok' as const,
        mode: github.mode,
        uptimeSeconds: Math.floor(process.uptime()),
        githubRateLimit: rateLimit
          ? { limit: rateLimit.limit, remaining: rateLimit.remaining, resetAt: rateLimit.resetAt }
          : null,
      };
    },
  );
};
