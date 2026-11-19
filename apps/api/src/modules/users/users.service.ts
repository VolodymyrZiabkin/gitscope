import { normalizeUsername, type Contributions, type UserReport } from '@gitscope/shared';
import { CachedLoader, type CacheResult } from '../../lib/cache';
import { invalidRequest, isAppError } from '../../lib/errors';
import type { ContributionPeriod, GithubClient } from '../github';
import { toContributions, toUserReport } from './users.mapper';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const CACHE_TTL = {
  report: 10 * MINUTE,
  /** The rolling year and the current year still change. */
  liveContributions: 10 * MINUTE,
  /** Past years are final. */
  pastContributions: DAY,
  /** Remember unknown logins briefly so typos do not burn GitHub quota. */
  notFound: MINUTE,
} as const;

export interface UsersService {
  getReport(username: string): Promise<CacheResult<UserReport>>;
  getContributions(username: string, year?: number): Promise<CacheResult<Contributions>>;
}

export function createUsersService({
  github,
  now = () => new Date(),
}: {
  github: GithubClient;
  now?: () => Date;
}): UsersService {
  const errorTtl = (error: unknown) => (isAppError(error, 'USER_NOT_FOUND') ? CACHE_TTL.notFound : undefined);
  const reports = new CachedLoader<UserReport>({ max: 500, errorTtl });
  const contributions = new CachedLoader<Contributions>({ max: 1000, errorTtl });

  return {
    getReport(username) {
      const login = normalizeUsername(username);
      return reports.load(login, CACHE_TTL.report, async () => toUserReport(await github.fetchUser(login), now()));
    },

    getContributions(username, year) {
      const login = normalizeUsername(username);
      const currentYear = now().getUTCFullYear();
      if (year !== undefined && year > currentYear) {
        return Promise.reject(invalidRequest(`Year must not be later than ${currentYear}`));
      }

      const period: ContributionPeriod = year === undefined ? { kind: 'rolling' } : { kind: 'year', year };
      const ttl = year !== undefined && year < currentYear ? CACHE_TTL.pastContributions : CACHE_TTL.liveContributions;
      return contributions.load(`${login}:${year ?? 'rolling'}`, ttl, async () =>
        toContributions(await github.fetchContributions(login, period), period),
      );
    },
  };
}
