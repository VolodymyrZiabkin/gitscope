function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export const siteConfig = {
  name: 'GitScope',
  description: 'Shareable analytics for any public GitHub profile: activity, languages, streaks and top repositories.',
  url: siteUrl(),
  repositoryUrl: 'https://github.com/VolodymyrZiabkin/gitscope',
  /** Profiles recorded as fixtures — they work even when the API runs without a GitHub token. */
  exampleUsers: ['gaearon', 'sindresorhus', 'torvalds', 'yyx990803'],
} as const;
