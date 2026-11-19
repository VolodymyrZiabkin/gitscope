import { setTimeout as delay } from 'node:timers/promises';
import { userNotFound } from '../lib/errors';
import { fixtureKey } from '../modules/github/fixture-client';
import type { ContributionPeriod, GithubClient, GithubContributions, GithubUser } from '../modules/github';

/** In-memory GitHub for route tests: counts calls, can be slowed down or made to fail. */
export class FakeGithubClient implements GithubClient {
  readonly mode = 'live';
  readonly rateLimit = null;
  readonly calls = { fetchUser: 0, fetchContributions: 0 };
  readonly users = new Map<string, GithubUser>();
  readonly contributions = new Map<string, GithubContributions>();
  failure: Error | null = null;
  latencyMs = 0;

  addUser(user: GithubUser, contributions: Record<string, GithubContributions> = {}): this {
    const login = user.login.toLowerCase();
    this.users.set(login, user);
    for (const [key, value] of Object.entries(contributions)) this.contributions.set(`${login}:${key}`, value);
    return this;
  }

  async fetchUser(login: string): Promise<GithubUser> {
    this.calls.fetchUser += 1;
    await this.#simulate();
    const user = this.users.get(login);
    if (!user) throw userNotFound(login);
    return user;
  }

  async fetchContributions(login: string, period: ContributionPeriod): Promise<GithubContributions> {
    this.calls.fetchContributions += 1;
    await this.#simulate();
    const contributions = this.contributions.get(`${login}:${fixtureKey(period)}`);
    if (!contributions) throw userNotFound(login);
    return contributions;
  }

  async #simulate(): Promise<void> {
    if (this.latencyMs > 0) await delay(this.latencyMs);
    if (this.failure) throw this.failure;
  }
}
