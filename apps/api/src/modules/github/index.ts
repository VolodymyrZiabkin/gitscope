import type { Env } from '../../config/env';
import { FixtureGithubClient } from './fixture-client';
import { GraphqlGithubClient, type GraphqlGithubClientOptions } from './graphql-client';
import type { GithubClient } from './types';

export type { ContributionPeriod, GithubClient } from './types';
export type { GithubContributions, GithubRepository, GithubUser, RateLimit } from './schemas';

export function createGithubClient(env: Env, logger?: GraphqlGithubClientOptions['logger']): GithubClient {
  return env.GITHUB_TOKEN
    ? new GraphqlGithubClient({ token: env.GITHUB_TOKEN, logger })
    : new FixtureGithubClient(env.FIXTURES_DIR);
}
