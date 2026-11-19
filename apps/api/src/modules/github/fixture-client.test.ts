import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { makeGithubContributions, makeGithubUser } from '../../test/factories';
import { FixtureGithubClient, type Fixture } from './fixture-client';

let client: FixtureGithubClient;
const user = makeGithubUser({ login: 'Octo' });
const rolling = makeGithubContributions('2025-11-20', [1, 0, 2]);

beforeAll(async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'gitscope-fixtures-'));
  const fixture: Fixture = { recordedAt: '2026-11-19T00:00:00Z', user, contributions: { rolling } };
  await writeFile(path.join(directory, 'octo.json'), JSON.stringify(fixture));
  client = new FixtureGithubClient(directory);
});

describe('FixtureGithubClient', () => {
  it('serves a recorded user case-insensitively', async () => {
    await expect(client.fetchUser('OCTO')).resolves.toEqual(user);
    await expect(client.fetchContributions('octo', { kind: 'rolling' })).resolves.toEqual(rolling);
  });

  it('lists the recorded logins when a user is missing', async () => {
    await expect(client.fetchUser('ghost')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      message: '"ghost" is not recorded. Fixture mode serves: octo',
    });
  });

  it('never turns an invalid login into a file path', async () => {
    await expect(client.fetchUser('../octo')).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('reports a year that was not recorded', async () => {
    await expect(client.fetchContributions('octo', { kind: 'year', year: 2020 })).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
  });
});
