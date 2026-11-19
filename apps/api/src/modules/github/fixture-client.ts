import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeUsername, USERNAME_PATTERN } from '@gitscope/shared';
import { z } from 'zod';
import { AppError, upstreamError } from '../../lib/errors';
import { githubContributionsSchema, githubUserSchema, type GithubContributions, type GithubUser } from './schemas';
import type { ContributionPeriod, GithubClient } from './types';

export const fixtureSchema = z.object({
  recordedAt: z.iso.datetime(),
  user: githubUserSchema,
  /** Keyed by `rolling` or a year (`"2025"`). */
  contributions: z.record(z.string(), githubContributionsSchema),
});

export type Fixture = z.infer<typeof fixtureSchema>;

export function fixtureKey(period: ContributionPeriod): string {
  return period.kind === 'rolling' ? 'rolling' : String(period.year);
}

/** Serves GitHub data recorded by `pnpm fixtures:record` — lets the app run without a token (local dev, CI, E2E). */
export class FixtureGithubClient implements GithubClient {
  readonly mode = 'fixtures';
  readonly rateLimit = null;
  readonly #directory: string;

  constructor(directory: string) {
    this.#directory = path.resolve(directory);
  }

  async fetchUser(login: string): Promise<GithubUser> {
    return (await this.#read(login)).user;
  }

  async fetchContributions(login: string, period: ContributionPeriod): Promise<GithubContributions> {
    const contributions = (await this.#read(login)).contributions[fixtureKey(period)];
    if (!contributions) throw upstreamError(`Fixture for "${login}" has no contributions for ${fixtureKey(period)}`);
    return contributions;
  }

  async listLogins(): Promise<string[]> {
    const files = await readdir(this.#directory).catch(() => []);
    return files.filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -'.json'.length));
  }

  async #read(login: string): Promise<Fixture> {
    // Logins are validated by the route schema; re-check here because the value becomes a file path.
    if (!USERNAME_PATTERN.test(login)) throw await this.#notRecorded(login);
    const file = path.join(this.#directory, `${normalizeUsername(login)}.json`);

    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw await this.#notRecorded(login);
      throw error;
    }
    return fixtureSchema.parse(JSON.parse(raw));
  }

  async #notRecorded(login: string): Promise<AppError> {
    const available = (await this.listLogins()).join(', ') || 'none';
    return new AppError('USER_NOT_FOUND', 404, `"${login}" is not recorded. Fixture mode serves: ${available}`);
  }
}
