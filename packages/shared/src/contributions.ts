import { z } from 'zod';

const count = z.int().nonnegative();

/** The first year GitHub has contribution data for. */
export const MIN_CONTRIBUTION_YEAR = 2008;

export const contributionDaySchema = z.object({
  /** Calendar date `YYYY-MM-DD` as reported by GitHub — not a timestamp. */
  date: z.iso.date(),
  count,
  /** Intensity bucket used by GitHub: 0 (none) … 4 (highest quartile). */
  level: z.int().min(0).max(4),
});

export const contributionsSchema = z.object({
  period: z.object({
    from: z.iso.date(),
    to: z.iso.date(),
    /** `null` for the rolling last year. */
    year: z.int().nullable(),
  }),
  total: count,
  /** Contributions to private repositories, visible only as a number. */
  restricted: count,
  breakdown: z.object({
    commits: count,
    pullRequests: count,
    issues: count,
    reviews: count,
    repositories: count,
  }),
  days: z.array(contributionDaySchema),
  monthly: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), count })),
  /** Totals per weekday, index 0 = Sunday. */
  weekdays: z.array(count).length(7),
  streaks: z.object({
    /** Ends on the last day of the period, or the day before if that day is still empty. */
    current: count,
    longest: z.object({ length: count, from: z.iso.date(), to: z.iso.date() }).nullable(),
  }),
  bestDay: z.object({ date: z.iso.date(), count }).nullable(),
  activeDays: count,
});

export const contributionsQuerySchema = z.object({
  year: z.coerce.number().int().min(MIN_CONTRIBUTION_YEAR).optional(),
});

export type ContributionDay = z.infer<typeof contributionDaySchema>;
export type Contributions = z.infer<typeof contributionsSchema>;
