import { z } from 'zod';

const count = z.int().nonnegative();

export const languageSchema = z.object({
  name: z.string(),
  /** Hex colour assigned by GitHub linguist, `null` for rare languages. */
  color: z.string().nullable(),
});

export const profileSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.url(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  twitterUsername: z.string().nullable(),
  htmlUrl: z.url(),
  createdAt: z.iso.datetime(),
  followers: count,
  following: count,
});

export const repositorySchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  url: z.url(),
  homepageUrl: z.string().nullable(),
  stars: count,
  forks: count,
  isArchived: z.boolean(),
  primaryLanguage: languageSchema.nullable(),
  topics: z.array(z.string()),
  license: z.string().nullable(),
  createdAt: z.iso.datetime(),
  /** `null` for empty repositories. */
  pushedAt: z.iso.datetime().nullable(),
});

export const languageStatSchema = languageSchema.extend({
  bytes: count,
  /** Share of all bytes, 0..1. */
  share: z.number().min(0).max(1),
});

export const userStatsSchema = z.object({
  /** Public, owned, non-fork repositories. */
  repositories: count,
  forkedRepositories: count,
  totalStars: count,
  totalForks: count,
});

export const userInsightsSchema = z.object({
  topLanguage: z.string().nullable(),
  mostStarredRepository: z.object({ name: z.string(), stars: count }).nullable(),
  averageStarsPerRepository: z.number().nonnegative(),
  accountAgeYears: count,
  lastPushedAt: z.iso.datetime().nullable(),
  archivedRepositories: count,
});

export const userReportSchema = z.object({
  profile: profileSchema,
  stats: userStatsSchema,
  languages: z.array(languageStatSchema),
  repositories: z.array(repositorySchema),
  /** `true` when the user owns more repositories than the API analyses. */
  repositoriesTruncated: z.boolean(),
  /** Years with contributions, newest first — options for the heatmap year switch. */
  contributionYears: z.array(z.int()),
  insights: userInsightsSchema,
  generatedAt: z.iso.datetime(),
});

export type Language = z.infer<typeof languageSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Repository = z.infer<typeof repositorySchema>;
export type LanguageStat = z.infer<typeof languageStatSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
export type UserInsights = z.infer<typeof userInsightsSchema>;
export type UserReport = z.infer<typeof userReportSchema>;
