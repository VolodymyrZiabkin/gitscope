import type { GithubContributions, GithubUser, RateLimit } from './schemas';

export type ContributionPeriod = { kind: 'rolling' } | { kind: 'year'; year: number };

export interface GithubClient {
  readonly mode: 'live' | 'fixtures';
  /** Latest known GraphQL quota; `null` before the first request and in fixture mode. */
  readonly rateLimit: RateLimit | null;
  /** Profile with all analysed repositories merged into `repositories.nodes`. Throws `USER_NOT_FOUND`. */
  fetchUser(login: string): Promise<GithubUser>;
  fetchContributions(login: string, period: ContributionPeriod): Promise<GithubContributions>;
}
