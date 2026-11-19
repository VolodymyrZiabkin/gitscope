import type { Metadata } from 'next';
import { getUserReport, UserDashboardPage } from '@/pages/user-dashboard';
import { formatCompact, pluralize } from '@/shared/lib';

export async function generateMetadata({ params }: PageProps<'/u/[username]'>): Promise<Metadata> {
  const { username } = await params;
  const result = await getUserReport(username);
  if (!result.ok) return { title: `@${username}` };

  const { profile, stats, insights } = result.data;
  const title = profile.name ? `${profile.name} (@${profile.login})` : `@${profile.login}`;
  const description = [
    `${formatCompact(stats.totalStars)} stars`,
    pluralize(stats.repositories, 'repository', 'repositories'),
    insights.topLanguage ? `mostly ${insights.topLanguage}` : null,
    `${formatCompact(profile.followers)} followers`,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title,
    description: `GitHub analytics for ${title}: ${description}.`,
    alternates: { canonical: `/u/${profile.login}` },
    openGraph: { title: `${title} on GitScope`, description, url: `/u/${profile.login}`, type: 'profile' },
  };
}

export default function Page({ params, searchParams }: PageProps<'/u/[username]'>) {
  return <UserDashboardPage params={params} searchParams={searchParams} />;
}
