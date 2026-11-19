import type { Contributions, Repository, UserReport } from '@gitscope/shared';
import { upstreamError } from '../../lib/errors';
import { countActiveDays, computeStreaks, findBestDay, monthlyTotals, weekdayTotals } from '../analytics/contributions';
import { wholeYearsBetween } from '../analytics/dates';
import { aggregateLanguages, OTHER_LANGUAGE } from '../analytics/languages';
import { summarizeRepositories } from '../analytics/repositories';
import type { ContributionPeriod, GithubContributions, GithubRepository, GithubUser } from '../github';
import type { ContributionLevel } from '../github/schemas';

/** GitHub → API contract. Analytics are computed here once and cached together with the report. */
export function toUserReport(user: GithubUser, now: Date): UserReport {
  const repositories = user.repositories.nodes.map(toRepository);
  const languages = aggregateLanguages(
    user.repositories.nodes.map((repository) =>
      (repository.languages?.edges ?? []).map(({ size, node }) => ({
        name: node.name,
        color: node.color,
        bytes: size,
      })),
    ),
  );
  const summary = summarizeRepositories(repositories);

  return {
    profile: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      company: user.company,
      location: user.location,
      websiteUrl: user.websiteUrl,
      twitterUsername: user.twitterUsername,
      htmlUrl: user.url,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
    },
    stats: {
      repositories: user.repositories.totalCount,
      forkedRepositories: user.forks.totalCount,
      totalStars: summary.totalStars,
      totalForks: summary.totalForks,
    },
    languages,
    repositories,
    repositoriesTruncated: user.repositories.totalCount > repositories.length,
    contributionYears: [...user.contributionsCollection.contributionYears].sort((a, b) => b - a),
    insights: {
      topLanguage: languages.find((language) => language.name !== OTHER_LANGUAGE)?.name ?? null,
      mostStarredRepository: summary.mostStarred,
      averageStarsPerRepository:
        repositories.length > 0 ? Math.round((summary.totalStars / repositories.length) * 10) / 10 : 0,
      accountAgeYears: wholeYearsBetween(user.createdAt, now),
      lastPushedAt: summary.lastPushedAt,
      archivedRepositories: summary.archived,
    },
    generatedAt: now.toISOString(),
  };
}

function toRepository(repository: GithubRepository): Repository {
  return {
    name: repository.name,
    description: repository.description,
    url: repository.url,
    homepageUrl: repository.homepageUrl || null,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
    isArchived: repository.isArchived,
    primaryLanguage: repository.primaryLanguage,
    topics: repository.repositoryTopics.nodes.map(({ topic }) => topic.name),
    license: repository.licenseInfo?.spdxId ?? null,
    createdAt: repository.createdAt,
    pushedAt: repository.pushedAt,
  };
}

const LEVELS: Record<ContributionLevel, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function toContributions(collection: GithubContributions, period: ContributionPeriod): Contributions {
  const days = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .filter((day) => period.kind === 'rolling' || day.date.startsWith(`${period.year}-`))
    .map((day) => ({ date: day.date, count: day.contributionCount, level: LEVELS[day.contributionLevel] }));

  const first = days[0];
  const last = days.at(-1);
  if (!first || !last) throw upstreamError('GitHub returned an empty contribution calendar');

  return {
    period: { from: first.date, to: last.date, year: period.kind === 'year' ? period.year : null },
    total: collection.contributionCalendar.totalContributions,
    restricted: collection.restrictedContributionsCount,
    breakdown: {
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      reviews: collection.totalPullRequestReviewContributions,
      repositories: collection.totalRepositoryContributions,
    },
    days,
    monthly: monthlyTotals(days),
    weekdays: weekdayTotals(days),
    streaks: computeStreaks(days),
    bestDay: findBestDay(days),
    activeDays: countActiveDays(days),
  };
}
