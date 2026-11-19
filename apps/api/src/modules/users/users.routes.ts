import {
  contributionsQuerySchema,
  contributionsSchema,
  problemSchema,
  userReportSchema,
  usernameSchema,
} from '@gitscope/shared';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { CacheStatus } from '../../lib/cache';
import type { UsersService } from './users.service';

const params = z.object({ username: usernameSchema });

const errorResponses = {
  400: problemSchema,
  404: problemSchema,
  429: problemSchema,
  502: problemSchema,
  503: problemSchema,
};

function setCacheHeaders(reply: FastifyReply, status: CacheStatus): void {
  reply.header('cache-control', 'public, max-age=300, stale-while-revalidate=600');
  reply.header('x-cache', status === 'miss' ? 'MISS' : 'HIT');
}

export const usersRoutes: FastifyPluginAsyncZod<{ service: UsersService }> = async (app, { service }) => {
  app.get(
    '/users/:username',
    {
      schema: {
        tags: ['users'],
        summary: 'Analytics report for a GitHub user',
        description: 'Profile, stats, languages, up to 300 most-starred owned repositories and insights.',
        params,
        response: { 200: userReportSchema, ...errorResponses },
      },
    },
    async (request, reply) => {
      const { value, status } = await service.getReport(request.params.username);
      setCacheHeaders(reply, status);
      return value;
    },
  );

  app.get(
    '/users/:username/contributions',
    {
      schema: {
        tags: ['users'],
        summary: 'Contribution calendar and activity analytics',
        description: 'Without `year` — the rolling last year, like the GitHub profile page.',
        params,
        querystring: contributionsQuerySchema,
        response: { 200: contributionsSchema, ...errorResponses },
      },
    },
    async (request, reply) => {
      const { value, status } = await service.getContributions(request.params.username, request.query.year);
      setCacheHeaders(reply, status);
      return value;
    },
  );
};
