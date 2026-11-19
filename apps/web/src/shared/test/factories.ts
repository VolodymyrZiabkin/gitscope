import type { Contributions, Repository } from '@gitscope/shared';

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

/** Consecutive days from `from` with the given counts, plus consistent aggregates. */
export function makeContributions(from: string, counts: number[], year: number | null = null): Contributions {
  const start = Date.parse(`${from}T00:00:00Z`);
  const days = counts.map((count, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count,
    level: Math.min(count, 4),
  }));
  const total = counts.reduce((sum, count) => sum + count, 0);
  return {
    period: { from: days[0]?.date ?? from, to: days.at(-1)?.date ?? from, year },
    total,
    restricted: 0,
    breakdown: { commits: total, pullRequests: 0, issues: 0, reviews: 0, repositories: 0 },
    days,
    monthly: [{ month: from.slice(0, 7), count: total }],
    weekdays: [0, total, 0, 0, 0, 0, 0],
    streaks: { current: 0, longest: null },
    bestDay: null,
    activeDays: counts.filter((count) => count > 0).length,
  };
}
