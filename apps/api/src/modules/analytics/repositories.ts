import type { Repository } from '@gitscope/shared';

export interface RepositorySummary {
  totalStars: number;
  totalForks: number;
  /** `null` when there are no repositories or none has a star. */
  mostStarred: { name: string; stars: number } | null;
  archived: number;
  lastPushedAt: string | null;
}

export function summarizeRepositories(repositories: readonly Repository[]): RepositorySummary {
  let totalStars = 0;
  let totalForks = 0;
  let archived = 0;
  let mostStarred: RepositorySummary['mostStarred'] = null;
  let lastPushedAt: string | null = null;

  for (const repository of repositories) {
    totalStars += repository.stars;
    totalForks += repository.forks;
    if (repository.isArchived) archived += 1;
    if (repository.stars > (mostStarred?.stars ?? 0)) {
      mostStarred = { name: repository.name, stars: repository.stars };
    }
    if (repository.pushedAt && (!lastPushedAt || Date.parse(repository.pushedAt) > Date.parse(lastPushedAt))) {
      lastPushedAt = repository.pushedAt;
    }
  }

  return { totalStars, totalForks, mostStarred, archived, lastPushedAt };
}
