import { problemSchema, userReportSchema, type Problem } from '@gitscope/shared';
import type { LightMyRequestResponse } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { loadEnv } from './config/env';
import { githubQuotaExceeded, upstreamError } from './lib/errors';
import { makeGithubContributions, makeGithubRepository, makeGithubUser } from './test/factories';
import { FakeGithubClient } from './test/fake-github';

const NOW = new Date('2026-11-19T12:00:00Z');
const INTERNAL_KEY = 'i'.repeat(32);

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

function createGithub() {
  return new FakeGithubClient().addUser(
    makeGithubUser({ login: 'Octo' }, [makeGithubRepository({ stargazerCount: 3 })]),
    {
      rolling: makeGithubContributions('2025-11-20', [1, 2, 0, 3]),
      '2025': makeGithubContributions('2025-01-01', [4, 0, 1]),
    },
  );
}

async function setup(github = createGithub(), env: Record<string, string> = {}) {
  app = await buildApp({
    env: loadEnv({ NODE_ENV: 'test', INTERNAL_API_KEY: INTERNAL_KEY, ...env }),
    github,
    now: () => NOW,
  });
  return { app, github };
}

function problemOf(response: LightMyRequestResponse): Problem {
  expect(response.headers['content-type']).toBe('application/problem+json; charset=utf-8');
  return problemSchema.parse(response.json());
}

describe('GET /users/:username', () => {
  it('returns a report that matches the contract', async () => {
    const { app } = await setup();
    const response = await app.inject({ url: '/users/octo' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300, stale-while-revalidate=600');
    expect(userReportSchema.parse(response.json()).profile.login).toBe('Octo');
  });

  it('serves repeated and case-variant requests from the cache', async () => {
    const { app, github } = await setup();

    const first = await app.inject({ url: '/users/octo' });
    const second = await app.inject({ url: '/users/OCTO' });

    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(github.calls.fetchUser).toBe(1);
  });

  it('coalesces concurrent requests into one GitHub call', async () => {
    const { app, github } = await setup();
    github.latencyMs = 20;

    const responses = await Promise.all(Array.from({ length: 5 }, () => app.inject({ url: '/users/octo' })));

    expect(responses.every((response) => response.statusCode === 200)).toBe(true);
    expect(github.calls.fetchUser).toBe(1);
  });

  it('answers 304 when the ETag still matches', async () => {
    const { app } = await setup();
    const first = await app.inject({ url: '/users/octo' });
    const etag = first.headers.etag;
    expect(etag).toBeTypeOf('string');

    const second = await app.inject({ url: '/users/octo', headers: { 'if-none-match': etag as string } });
    expect(second.statusCode).toBe(304);
  });

  it('returns USER_NOT_FOUND and remembers it briefly', async () => {
    const { app, github } = await setup();

    const response = await app.inject({ url: '/users/ghost' });
    await app.inject({ url: '/users/ghost' });

    expect(response.statusCode).toBe(404);
    expect(problemOf(response)).toMatchObject({ code: 'USER_NOT_FOUND', title: 'Not Found', status: 404 });
    expect(github.calls.fetchUser).toBe(1);
  });

  it('rejects an invalid username without calling GitHub', async () => {
    const { app, github } = await setup();
    const response = await app.inject({ url: '/users/bad--name' });

    expect(response.statusCode).toBe(400);
    expect(problemOf(response)).toMatchObject({
      code: 'INVALID_REQUEST',
      detail: 'Invalid params.username: Not a valid GitHub username',
    });
    expect(github.calls.fetchUser).toBe(0);
  });

  it('returns 503 with Retry-After when the GitHub quota is exhausted', async () => {
    const github = createGithub();
    github.failure = githubQuotaExceeded(120);
    const { app } = await setup(github);

    const response = await app.inject({ url: '/users/octo' });

    expect(response.statusCode).toBe(503);
    expect(response.headers['retry-after']).toBe('120');
    expect(problemOf(response)).toMatchObject({ code: 'RATE_LIMITED', retryAfterSeconds: 120 });
  });

  it('returns 502 when GitHub fails', async () => {
    const github = createGithub();
    github.failure = upstreamError('GitHub responded with HTTP 500');
    const { app } = await setup(github);

    const response = await app.inject({ url: '/users/octo' });
    expect(response.statusCode).toBe(502);
    expect(problemOf(response)).toMatchObject({ code: 'UPSTREAM_ERROR' });
  });

  it('hides the details of unexpected errors', async () => {
    const github = createGithub();
    github.failure = new Error('database password is hunter2');
    const { app } = await setup(github);

    const response = await app.inject({ url: '/users/octo' });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('hunter2');
    expect(problemOf(response)).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });
});

describe('GET /users/:username/contributions', () => {
  it('returns the rolling year by default', async () => {
    const { app } = await setup();
    const response = await app.inject({ url: '/users/octo/contributions' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ period: { year: null }, total: 6 });
  });

  it('returns a specific year', async () => {
    const { app } = await setup();
    const response = await app.inject({ url: '/users/octo/contributions?year=2025' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ period: { from: '2025-01-01', year: 2025 }, total: 5 });
  });

  it.each([
    ['2027', 'Year must not be later than 2026'],
    ['2007', 'Invalid querystring.year'],
    ['abc', 'Invalid querystring.year'],
  ])('rejects year=%s', async (year, detail) => {
    const { app } = await setup();
    const response = await app.inject({ url: `/users/octo/contributions?year=${year}` });

    expect(response.statusCode).toBe(400);
    expect(problemOf(response).detail).toContain(detail);
  });
});

describe('rate limiting', () => {
  const limited = () => setup(createGithub(), { RATE_LIMIT_MAX: '2' });

  it('limits requests per client IP', async () => {
    const { app } = await limited();
    await app.inject({ url: '/users/octo' });
    await app.inject({ url: '/users/octo' });
    const response = await app.inject({ url: '/users/octo' });

    expect(response.statusCode).toBe(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(problemOf(response)).toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  });

  it('counts the forwarded client IP separately when the internal key is valid', async () => {
    const { app } = await limited();
    const asClient = (ip: string) =>
      app.inject({ url: '/users/octo', headers: { 'x-internal-key': INTERNAL_KEY, 'x-client-ip': ip } });

    await asClient('203.0.113.1');
    await asClient('203.0.113.1');
    expect((await asClient('203.0.113.1')).statusCode).toBe(429);
    expect((await asClient('203.0.113.2')).statusCode).toBe(200);
  });

  it('ignores the forwarded IP without a valid internal key', async () => {
    const { app } = await limited();
    const spoofed = (ip: string) =>
      app.inject({ url: '/users/octo', headers: { 'x-internal-key': 'x'.repeat(32), 'x-client-ip': ip } });

    await spoofed('198.51.100.1');
    await spoofed('198.51.100.2');
    expect((await spoofed('198.51.100.3')).statusCode).toBe(429);
  });

  it('does not limit the health check', async () => {
    const { app } = await limited();
    const responses = await Promise.all(Array.from({ length: 4 }, () => app.inject({ url: '/health' })));
    expect(responses.map((response) => response.statusCode)).toEqual([200, 200, 200, 200]);
  });
});

describe('service routes', () => {
  it('reports health and the data source', async () => {
    const { app } = await setup();
    const response = await app.inject({ url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', mode: 'live', githubRateLimit: null });
  });

  it('publishes an OpenAPI document generated from the Zod schemas', async () => {
    const { app } = await setup();
    const document = (await app.inject({ url: '/docs/json' })).json<{ paths: Record<string, unknown> }>();

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(['/users/{username}', '/users/{username}/contributions', '/health']),
    );
  });

  it('returns problem details for unknown routes and echoes the request id', async () => {
    const { app } = await setup();
    const response = await app.inject({ url: '/nope', headers: { 'x-request-id': 'req-123' } });

    expect(response.statusCode).toBe(404);
    expect(response.headers['x-request-id']).toBe('req-123');
    expect(problemOf(response)).toMatchObject({ code: 'NOT_FOUND' });
  });
});
