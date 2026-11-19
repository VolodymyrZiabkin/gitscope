import { describe, expect, it } from 'vitest';
import { makeRepository } from '../../test/factories';
import { summarizeRepositories } from './repositories';

describe('summarizeRepositories', () => {
  it('sums stars and forks and finds the most starred repository', () => {
    const summary = summarizeRepositories([
      makeRepository({ name: 'a', stars: 5, forks: 1 }),
      makeRepository({ name: 'b', stars: 40, forks: 7 }),
      makeRepository({ name: 'c', stars: 40, forks: 0, isArchived: true }),
    ]);
    expect(summary).toMatchObject({
      totalStars: 85,
      totalForks: 8,
      mostStarred: { name: 'b', stars: 40 },
      archived: 1,
    });
  });

  it('picks the latest push and skips empty repositories', () => {
    const summary = summarizeRepositories([
      makeRepository({ pushedAt: '2024-05-01T10:00:00Z' }),
      makeRepository({ pushedAt: null }),
      makeRepository({ pushedAt: '2025-01-02T00:00:00Z' }),
    ]);
    expect(summary.lastPushedAt).toBe('2025-01-02T00:00:00Z');
  });

  it('has no "most starred" repository when nothing is starred', () => {
    expect(summarizeRepositories([makeRepository({ stars: 0 })]).mostStarred).toBeNull();
    expect(summarizeRepositories([])).toEqual({
      totalStars: 0,
      totalForks: 0,
      mostStarred: null,
      archived: 0,
      lastPushedAt: null,
    });
  });
});
