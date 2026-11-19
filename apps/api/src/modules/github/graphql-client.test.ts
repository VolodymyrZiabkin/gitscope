import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../lib/errors';
import { makeGithubContributions, makeGithubRepository, makeGithubUser } from '../../test/factories';
import { GraphqlGithubClient, periodRange, retryAfterSeconds } from './graphql-client';
import type { GithubUser } from './schemas';

const NOW = new Date('2026-11-19T12:00:00Z');
const rateLimit = { limit: 5000, remaining: 4990, cost: 1, resetAt: '2026-11-19T13:00:00Z' };

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

function setup(...responses: (Response | Error)[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response);
    else fetch.mockResolvedValueOnce(response);
  }
  const client = new GraphqlGithubClient({ token: 'secret-token', fetch, now: () => NOW, retryDelayMs: 0 });
  return { client, fetch };
}

function requestBody(fetch: ReturnType<typeof setup>['fetch'], call: number) {
  return JSON.parse(fetch.mock.calls[call]?.[1]?.body as string) as {
    query: string;
    variables: Record<string, unknown>;
  };
}

async function expectAppError(promise: Promise<unknown>, expected: Partial<AppError>) {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject(expected);
}

describe('GraphqlGithubClient.fetchUser', () => {
  it('sends an authenticated query and returns the parsed user', async () => {
    const user = makeGithubUser({}, [makeGithubRepository()]);
    const { client, fetch } = setup(json({ data: { rateLimit, user } }));

    await expect(client.fetchUser('octo')).resolves.toEqual(user);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe('https://api.github.com/graphql');
    expect(new Headers(init?.headers).get('authorization')).toBe('bearer secret-token');
    expect(requestBody(fetch, 0).variables).toEqual({ login: 'octo', pageSize: 100 });
    expect(client.rateLimit).toEqual(rateLimit);
  });

  it('turns `user: null` into USER_NOT_FOUND', async () => {
    const { client } = setup(
      json({ data: { rateLimit, user: null }, errors: [{ type: 'NOT_FOUND', message: 'Could not resolve' }] }),
    );
    await expectAppError(client.fetchUser('ghost'), { code: 'USER_NOT_FOUND', statusCode: 404 });
  });

  it('follows repository pages up to the configured limit', async () => {
    const page = (name: string, hasNextPage: boolean, endCursor: string | null) => ({
      totalCount: 250,
      pageInfo: { hasNextPage, endCursor },
      nodes: [makeGithubRepository({ name })],
    });
    const first: GithubUser = { ...makeGithubUser(), repositories: page('one', true, 'c1') };
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ data: { rateLimit, user: first } }))
      .mockResolvedValueOnce(json({ data: { rateLimit, user: { repositories: page('two', true, 'c2') } } }))
      .mockResolvedValueOnce(json({ data: { rateLimit, user: { repositories: page('three', false, null) } } }));
    const client = new GraphqlGithubClient({ token: 't', fetch, maxRepositoryPages: 2 });

    const user = await client.fetchUser('octo');

    expect(user.repositories.nodes.map((repository) => repository.name)).toEqual(['one', 'two']);
    expect(user.repositories.totalCount).toBe(250);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(requestBody(fetch, 1).variables).toMatchObject({ cursor: 'c1' });
  });

  it('rejects data that does not match the schema', async () => {
    const { client } = setup(json({ data: { rateLimit, user: { login: 42 } } }));
    await expectAppError(client.fetchUser('octo'), { code: 'UPSTREAM_ERROR', statusCode: 502 });
  });

  it('surfaces unexpected GraphQL errors', async () => {
    const { client } = setup(json({ errors: [{ type: 'INTERNAL', message: 'Something broke' }] }));
    await expectAppError(client.fetchUser('octo'), {
      code: 'UPSTREAM_ERROR',
      message: 'GitHub GraphQL error: Something broke',
    });
  });
});

describe('GraphqlGithubClient transport', () => {
  it('maps an exhausted primary quota to 503 RATE_LIMITED with the time until reset', async () => {
    const reset = NOW.getTime() / 1000 + 90;
    const { client } = setup(
      new Response('{}', {
        status: 403,
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
      }),
    );
    await expectAppError(client.fetchUser('octo'), { code: 'RATE_LIMITED', statusCode: 503, retryAfterSeconds: 90 });
  });

  it('maps a GraphQL RATE_LIMITED error', async () => {
    const { client } = setup(json({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] }));
    await expectAppError(client.fetchUser('octo'), { code: 'RATE_LIMITED', retryAfterSeconds: 60 });
  });

  it('retries once on a 5xx response', async () => {
    const user = makeGithubUser();
    const { client, fetch } = setup(new Response('bad gateway', { status: 502 }), json({ data: { rateLimit, user } }));
    await expect(client.fetchUser('octo')).resolves.toEqual(user);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry', async () => {
    const { client, fetch } = setup(new Response('', { status: 502 }), new Response('', { status: 503 }));
    await expectAppError(client.fetchUser('octo'), {
      code: 'UPSTREAM_ERROR',
      message: 'GitHub responded with HTTP 503',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries a network failure or timeout once', async () => {
    const { client, fetch } = setup(new TypeError('fetch failed'), new DOMException('timed out', 'TimeoutError'));
    await expectAppError(client.fetchUser('octo'), {
      code: 'UPSTREAM_ERROR',
      message: 'GitHub did not respond in time',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry an invalid token', async () => {
    const { client, fetch } = setup(new Response('', { status: 401 }));
    await expectAppError(client.fetchUser('octo'), {
      code: 'UPSTREAM_ERROR',
      message: 'GitHub rejected the API token',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('GraphqlGithubClient.fetchContributions', () => {
  it('queries the requested year', async () => {
    const contributions = makeGithubContributions('2025-01-01', [1, 2]);
    const { client, fetch } = setup(json({ data: { rateLimit, user: { contributionsCollection: contributions } } }));

    await expect(client.fetchContributions('octo', { kind: 'year', year: 2025 })).resolves.toEqual(contributions);
    expect(requestBody(fetch, 0).variables).toEqual({
      login: 'octo',
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-12-31T23:59:59.000Z',
    });
  });
});

describe('periodRange', () => {
  it('omits the range for the rolling year', () => {
    expect(periodRange({ kind: 'rolling' }, NOW)).toEqual({});
  });

  it('ends the current year now so there are no future days', () => {
    expect(periodRange({ kind: 'year', year: 2026 }, NOW)).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-11-19T12:00:00.000Z',
    });
  });
});

describe('retryAfterSeconds', () => {
  it('prefers retry-after (secondary limits)', () => {
    expect(retryAfterSeconds(new Headers({ 'retry-after': '30' }), NOW)).toBe(30);
  });

  it('ignores headers of a non-quota error', () => {
    expect(retryAfterSeconds(new Headers({ 'x-ratelimit-remaining': '12' }), NOW)).toBeUndefined();
  });
});
