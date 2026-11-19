import { setTimeout as delay } from 'node:timers/promises';
import type { z } from 'zod';
import { githubQuotaExceeded, upstreamError, userNotFound } from '../../lib/errors';
import { CONTRIBUTIONS_QUERY, REPOSITORY_PAGE_QUERY, USER_QUERY } from './queries';
import {
  contributionsQueryDataSchema,
  graphqlEnvelopeSchema,
  repositoryPageQueryDataSchema,
  userQueryDataSchema,
  type GithubContributions,
  type GithubUser,
  type RateLimit,
} from './schemas';
import type { ContributionPeriod, GithubClient } from './types';

const ENDPOINT = 'https://api.github.com/graphql';
const PAGE_SIZE = 100;
const MAX_RETRIES = 1;

export interface GraphqlGithubClientOptions {
  token: string;
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  timeoutMs?: number;
  /** Repositories are fetched 100 per page; 3 pages = the 300 most-starred repositories. */
  maxRepositoryPages?: number;
  retryDelayMs?: number;
  logger?: { warn: (details: object, message: string) => void };
}

export class GraphqlGithubClient implements GithubClient {
  readonly mode = 'live';

  readonly #token: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #now: () => Date;
  readonly #timeoutMs: number;
  readonly #maxRepositoryPages: number;
  readonly #retryDelayMs: number;
  readonly #logger: GraphqlGithubClientOptions['logger'];
  #rateLimit: RateLimit | null = null;

  constructor(options: GraphqlGithubClientOptions) {
    this.#token = options.token;
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#now = options.now ?? (() => new Date());
    this.#timeoutMs = options.timeoutMs ?? 10_000;
    this.#maxRepositoryPages = options.maxRepositoryPages ?? 3;
    this.#retryDelayMs = options.retryDelayMs ?? 300;
    this.#logger = options.logger;
  }

  get rateLimit(): RateLimit | null {
    return this.#rateLimit;
  }

  async fetchUser(login: string): Promise<GithubUser> {
    const { user } = await this.#query(USER_QUERY, { login, pageSize: PAGE_SIZE }, userQueryDataSchema);
    if (!user) throw userNotFound(login);

    const nodes = [...user.repositories.nodes];
    let { pageInfo } = user.repositories;
    for (let page = 1; page < this.#maxRepositoryPages && pageInfo.hasNextPage && pageInfo.endCursor; page++) {
      const next = await this.#query(
        REPOSITORY_PAGE_QUERY,
        { login, pageSize: PAGE_SIZE, cursor: pageInfo.endCursor },
        repositoryPageQueryDataSchema,
      );
      if (!next.user) throw userNotFound(login);
      nodes.push(...next.user.repositories.nodes);
      pageInfo = next.user.repositories.pageInfo;
    }

    return { ...user, repositories: { ...user.repositories, pageInfo, nodes } };
  }

  async fetchContributions(login: string, period: ContributionPeriod): Promise<GithubContributions> {
    const { user } = await this.#query(
      CONTRIBUTIONS_QUERY,
      { login, ...periodRange(period, this.#now()) },
      contributionsQueryDataSchema,
    );
    if (!user) throw userNotFound(login);
    return user.contributionsCollection;
  }

  async #query<T extends { rateLimit: RateLimit }>(
    query: string,
    variables: Record<string, unknown>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const envelope = graphqlEnvelopeSchema.safeParse(await this.#post(query, variables));
    if (!envelope.success) throw upstreamError('Unexpected response from GitHub', envelope.error);

    const errors = envelope.data.errors ?? [];
    if (errors.some((error) => error.type === 'RATE_LIMITED')) {
      throw githubQuotaExceeded(this.#secondsUntilReset());
    }
    // NOT_FOUND arrives together with `user: null` in data — callers turn it into USER_NOT_FOUND.
    const unexpected = errors.find((error) => error.type !== 'NOT_FOUND');
    if (unexpected) throw upstreamError(`GitHub GraphQL error: ${unexpected.message}`);

    const data = schema.safeParse(envelope.data.data);
    if (!data.success) throw upstreamError('Unexpected response from GitHub', data.error);

    this.#trackRateLimit(data.data.rateLimit);
    return data.data;
  }

  /** Transport layer: one retry on network errors, timeouts and 5xx; quota errors become 503 with Retry-After. */
  async #post(query: string, variables: Record<string, unknown>): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      const canRetry = attempt < MAX_RETRIES;
      let response: Response;
      try {
        response = await this.#fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `bearer ${this.#token}`,
            'content-type': 'application/json',
            'user-agent': 'gitscope',
          },
          body: JSON.stringify({ query, variables }),
          signal: AbortSignal.timeout(this.#timeoutMs),
        });
      } catch (error) {
        if (canRetry) {
          await delay(this.#retryDelayMs);
          continue;
        }
        throw upstreamError('GitHub did not respond in time', error);
      }

      if (response.ok) {
        try {
          return await response.json();
        } catch (error) {
          throw upstreamError('GitHub returned malformed JSON', error);
        }
      }

      await response.body?.cancel();
      if (response.status === 403 || response.status === 429) {
        const retryAfter = retryAfterSeconds(response.headers, this.#now());
        if (retryAfter !== undefined) throw githubQuotaExceeded(retryAfter);
      }
      if (response.status >= 500 && canRetry) {
        await delay(this.#retryDelayMs);
        continue;
      }
      if (response.status === 401) throw upstreamError('GitHub rejected the API token');
      throw upstreamError(`GitHub responded with HTTP ${response.status}`);
    }
  }

  #trackRateLimit(rateLimit: RateLimit): void {
    this.#rateLimit = rateLimit;
    if (rateLimit.remaining < rateLimit.limit * 0.1) {
      this.#logger?.warn({ rateLimit }, 'GitHub GraphQL quota is running low');
    }
  }

  #secondsUntilReset(): number {
    const resetAt = this.#rateLimit?.resetAt;
    if (!resetAt) return 60;
    return Math.max(1, Math.ceil((Date.parse(resetAt) - this.#now().getTime()) / 1000));
  }
}

/** GitHub accepts at most one year per query; the current year ends "now" so the heatmap has no future days. */
export function periodRange(period: ContributionPeriod, now: Date): { from?: string; to?: string } {
  if (period.kind === 'rolling') return {};
  const endOfYear = new Date(Date.UTC(period.year, 11, 31, 23, 59, 59));
  return {
    from: new Date(Date.UTC(period.year, 0, 1)).toISOString(),
    to: (endOfYear < now ? endOfYear : now).toISOString(),
  };
}

/** Primary limits: `x-ratelimit-remaining: 0` + `x-ratelimit-reset`; secondary limits: `retry-after`. */
export function retryAfterSeconds(headers: Headers, now: Date): number | undefined {
  const retryAfter = headers.get('retry-after');
  if (retryAfter && /^\d+$/.test(retryAfter)) return Number(retryAfter);

  const reset = Number(headers.get('x-ratelimit-reset'));
  if (headers.get('x-ratelimit-remaining') === '0' && Number.isFinite(reset)) {
    return Math.max(1, Math.ceil(reset - now.getTime() / 1000));
  }
  return undefined;
}
