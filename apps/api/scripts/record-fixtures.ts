/**
 * Records real GitHub data for fixture mode (the API without a token: local dev, CI, E2E).
 *
 *   pnpm --filter @gitscope/api fixtures:record gaearon sindresorhus
 *
 * Needs GITHUB_TOKEN in apps/api/.env. Records the profile, the rolling year and the latest contribution years.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeUsername } from '@gitscope/shared';
import { fixtureSchema, type Fixture } from '../src/modules/github/fixture-client';
import { GraphqlGithubClient } from '../src/modules/github/graphql-client';

const YEARS_TO_RECORD = 3;

if (existsSync('.env')) process.loadEnvFile('.env');
const token = process.env.GITHUB_TOKEN;
const logins = process.argv.slice(2);

if (!token) {
  console.error('GITHUB_TOKEN is required to record fixtures (apps/api/.env).');
  process.exit(1);
}
if (logins.length === 0) {
  console.error('Usage: pnpm --filter @gitscope/api fixtures:record <login> [<login> …]');
  process.exit(1);
}

const client = new GraphqlGithubClient({ token });
const directory = path.resolve(process.env.FIXTURES_DIR ?? 'fixtures');
await mkdir(directory, { recursive: true });

for (const login of logins) {
  const user = await client.fetchUser(login);
  const years = [...user.contributionsCollection.contributionYears].sort((a, b) => b - a).slice(0, YEARS_TO_RECORD);

  const contributions: Fixture['contributions'] = {
    rolling: await client.fetchContributions(login, { kind: 'rolling' }),
  };
  for (const year of years) {
    contributions[String(year)] = await client.fetchContributions(login, { kind: 'year', year });
  }

  // Only recorded years are offered by the year switch in fixture mode.
  const fixture = fixtureSchema.parse({
    recordedAt: new Date().toISOString(),
    user: { ...user, contributionsCollection: { contributionYears: years } },
    contributions,
  });
  await writeFile(path.join(directory, `${normalizeUsername(login)}.json`), `${JSON.stringify(fixture)}\n`);
  console.log(`✓ ${user.login}: ${user.repositories.nodes.length} repositories, years ${years.join(', ')}`);
}

console.log(`GitHub quota left: ${client.rateLimit?.remaining ?? 'unknown'}`);
