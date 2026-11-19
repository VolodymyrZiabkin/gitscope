import type { Repository } from '@gitscope/shared';
import type { ContributionLevel, GithubContributions, GithubRepository, GithubUser } from '../modules/github/schemas';

export function makeRepository(overrides: Partial<Repository> = {}): Repository {
  return {
    name: 'repo',
    description: null,
    url: 'https://github.com/octo/repo',
    homepageUrl: null,
    stars: 0,
    forks: 0,
    isArchived: false,
    primaryLanguage: null,
    topics: [],
    license: null,
    createdAt: '2020-01-01T00:00:00Z',
    pushedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeGithubRepository(overrides: Partial<GithubRepository> = {}): GithubRepository {
  return {
    name: 'repo',
    description: 'A repository',
    url: 'https://github.com/octo/repo',
    homepageUrl: null,
    stargazerCount: 0,
    forkCount: 0,
    isArchived: false,
    createdAt: '2020-01-01T00:00:00Z',
    pushedAt: '2024-01-01T00:00:00Z',
    primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    languages: { edges: [{ size: 1000, node: { name: 'TypeScript', color: '#3178c6' } }] },
    repositoryTopics: { nodes: [] },
    licenseInfo: { spdxId: 'MIT', name: 'MIT License' },
    ...overrides,
  };
}

export function makeGithubUser(overrides: Partial<GithubUser> = {}, repositories: GithubRepository[] = []): GithubUser {
  return {
    login: 'Octo',
    name: 'Octo Cat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    bio: null,
    company: null,
    location: null,
    websiteUrl: null,
    twitterUsername: null,
    url: 'https://github.com/Octo',
    createdAt: '2015-06-01T00:00:00Z',
    followers: { totalCount: 10 },
    following: { totalCount: 2 },
    repositories: {
      totalCount: repositories.length,
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: repositories,
    },
    forks: { totalCount: 0 },
    contributionsCollection: { contributionYears: [2024, 2026, 2025] },
    ...overrides,
  };
}

const LEVELS: ContributionLevel[] = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

/** A contribution collection for consecutive days starting at `from`. */
export function makeGithubContributions(from: string, counts: number[]): GithubContributions {
  const start = Date.parse(`${from}T00:00:00Z`);
  const days = counts.map((count, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    contributionCount: count,
    contributionLevel: LEVELS[Math.min(count, 4)] ?? 'NONE',
  }));
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) weeks.push({ contributionDays: days.slice(index, index + 7) });
  const total = counts.reduce((sum, count) => sum + count, 0);

  return {
    totalCommitContributions: total,
    totalPullRequestContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalRepositoryContributions: 0,
    restrictedContributionsCount: 0,
    contributionCalendar: { totalContributions: total, weeks },
  };
}
