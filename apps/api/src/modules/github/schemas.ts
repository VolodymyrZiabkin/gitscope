import { z } from 'zod';

// Zod schemas for the parts of the GitHub GraphQL API we query. Upstream data is never trusted blindly.

const count = z.int().nonnegative();
const language = z.object({ name: z.string(), color: z.string().nullable() });

export const rateLimitSchema = z.object({
  limit: count,
  remaining: count,
  cost: count,
  resetAt: z.iso.datetime(),
});

export const githubRepositorySchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  url: z.url(),
  homepageUrl: z.string().nullable(),
  stargazerCount: count,
  forkCount: count,
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
  pushedAt: z.iso.datetime().nullable(),
  primaryLanguage: language.nullable(),
  languages: z.object({ edges: z.array(z.object({ size: count, node: language })) }).nullable(),
  repositoryTopics: z.object({ nodes: z.array(z.object({ topic: z.object({ name: z.string() }) })) }),
  licenseInfo: z.object({ spdxId: z.string().nullable(), name: z.string() }).nullable(),
});

export const repositoryPageSchema = z.object({
  totalCount: count,
  pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
  nodes: z.array(githubRepositorySchema),
});

export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.url(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  twitterUsername: z.string().nullable(),
  url: z.url(),
  createdAt: z.iso.datetime(),
  followers: z.object({ totalCount: count }),
  following: z.object({ totalCount: count }),
  repositories: repositoryPageSchema,
  forks: z.object({ totalCount: count }),
  contributionsCollection: z.object({ contributionYears: z.array(z.int()) }),
});

export const contributionLevelSchema = z.enum([
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
]);

export const githubContributionsSchema = z.object({
  totalCommitContributions: count,
  totalPullRequestContributions: count,
  totalIssueContributions: count,
  totalPullRequestReviewContributions: count,
  totalRepositoryContributions: count,
  restrictedContributionsCount: count,
  contributionCalendar: z.object({
    totalContributions: count,
    weeks: z.array(
      z.object({
        contributionDays: z.array(
          z.object({
            date: z.iso.date(),
            contributionCount: count,
            contributionLevel: contributionLevelSchema,
          }),
        ),
      }),
    ),
  }),
});

/** Query results: `user` is `null` when the login does not exist (or belongs to an organization). */
export const userQueryDataSchema = z.object({ rateLimit: rateLimitSchema, user: githubUserSchema.nullable() });
export const repositoryPageQueryDataSchema = z.object({
  rateLimit: rateLimitSchema,
  user: z.object({ repositories: repositoryPageSchema }).nullable(),
});
export const contributionsQueryDataSchema = z.object({
  rateLimit: rateLimitSchema,
  user: z.object({ contributionsCollection: githubContributionsSchema }).nullable(),
});

export const graphqlEnvelopeSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ type: z.string().optional(), message: z.string() })).optional(),
});

export type RateLimit = z.infer<typeof rateLimitSchema>;
export type GithubRepository = z.infer<typeof githubRepositorySchema>;
export type GithubUser = z.infer<typeof githubUserSchema>;
export type GithubContributions = z.infer<typeof githubContributionsSchema>;
export type ContributionLevel = z.infer<typeof contributionLevelSchema>;
