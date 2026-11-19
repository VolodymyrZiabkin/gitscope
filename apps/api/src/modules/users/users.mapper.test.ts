import { contributionsSchema, userReportSchema } from '@gitscope/shared';
import { describe, expect, it } from 'vitest';
import { makeGithubContributions, makeGithubRepository, makeGithubUser } from '../../test/factories';
import { toContributions, toUserReport } from './users.mapper';

const NOW = new Date('2026-11-19T12:00:00Z');

describe('toUserReport', () => {
  const user = makeGithubUser({ createdAt: '2015-06-01T00:00:00Z', forks: { totalCount: 4 } }, [
    makeGithubRepository({
      name: 'big',
      stargazerCount: 90,
      forkCount: 9,
      homepageUrl: '',
      languages: {
        edges: [
          { size: 700, node: { name: 'TypeScript', color: '#3178c6' } },
          { size: 100, node: { name: 'CSS', color: '#663399' } },
        ],
      },
      repositoryTopics: { nodes: [{ topic: { name: 'react' } }] },
    }),
    makeGithubRepository({ name: 'small', stargazerCount: 10, languages: null, licenseInfo: null, isArchived: true }),
  ]);

  it('produces a report that satisfies the API contract', () => {
    expect(() => userReportSchema.parse(toUserReport(user, NOW))).not.toThrow();
  });

  it('maps repositories and computes stats and insights', () => {
    const report = toUserReport({ ...user, repositories: { ...user.repositories, totalCount: 5 } }, NOW);

    expect(report.repositories[0]).toMatchObject({ name: 'big', stars: 90, homepageUrl: null, topics: ['react'] });
    expect(report.repositories[1]).toMatchObject({ license: null, isArchived: true });
    expect(report.stats).toEqual({ repositories: 5, forkedRepositories: 4, totalStars: 100, totalForks: 9 });
    expect(report.repositoriesTruncated).toBe(true);
    expect(report.languages.map((language) => [language.name, language.share])).toEqual([
      ['TypeScript', 0.875],
      ['CSS', 0.125],
    ]);
    expect(report.insights).toEqual({
      topLanguage: 'TypeScript',
      mostStarredRepository: { name: 'big', stars: 90 },
      averageStarsPerRepository: 50,
      accountAgeYears: 11,
      lastPushedAt: '2024-01-01T00:00:00Z',
      archivedRepositories: 1,
    });
  });

  it('sorts contribution years newest first', () => {
    expect(toUserReport(user, NOW).contributionYears).toEqual([2026, 2025, 2024]);
  });
});

describe('toContributions', () => {
  it('flattens the calendar and computes activity analytics', () => {
    const contributions = toContributions(makeGithubContributions('2026-11-13', [0, 1, 4, 0, 2, 3, 0, 5]), {
      kind: 'rolling',
    });

    expect(() => contributionsSchema.parse(contributions)).not.toThrow();
    expect(contributions.period).toEqual({ from: '2026-11-13', to: '2026-11-20', year: null });
    expect(contributions.days.map((day) => day.level)).toEqual([0, 1, 4, 0, 2, 3, 0, 4]);
    expect(contributions).toMatchObject({
      total: 15,
      activeDays: 5,
      bestDay: { date: '2026-11-20', count: 5 },
      streaks: { current: 1, longest: { length: 2, from: '2026-11-14', to: '2026-11-15' } },
    });
  });

  it('keeps only the days of the requested year', () => {
    const contributions = toContributions(makeGithubContributions('2025-12-30', [1, 1, 1, 1]), {
      kind: 'year',
      year: 2026,
    });
    expect(contributions.period).toEqual({ from: '2026-01-01', to: '2026-01-02', year: 2026 });
  });

  it('rejects an empty calendar', () => {
    expect(() => toContributions(makeGithubContributions('2026-01-01', []), { kind: 'rolling' })).toThrow(
      'GitHub returned an empty contribution calendar',
    );
  });
});
