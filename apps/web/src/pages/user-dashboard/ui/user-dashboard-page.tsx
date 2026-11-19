import { USERNAME_PATTERN } from '@gitscope/shared';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ActivitySkeleton } from '@/widgets/contribution-activity';
import { InsightsPanel } from '@/widgets/insights-panel';
import { LanguagesBreakdown } from '@/widgets/languages-breakdown';
import { ProfileHeader } from '@/widgets/profile-header';
import { RepositoriesTable } from '@/widgets/repositories-table';
import { StatsOverview } from '@/widgets/stats-overview';
import { getUserReport } from '../api/load';
import { parseYearParam } from '../lib/year-param';
import { ContributionsSection } from './contributions-section';
import { DashboardError } from './dashboard-error';

interface UserDashboardPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function UserDashboardPage({ params, searchParams }: UserDashboardPageProps) {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(username)) notFound();

  const result = await getUserReport(username);
  if (!result.ok) {
    if (result.error.code === 'USER_NOT_FOUND') notFound();
    return <DashboardError error={result.error} username={username} />;
  }

  const report = result.data;
  const { year } = await searchParams;
  const initialYear = parseYearParam(year, report.contributionYears);
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <ProfileHeader profile={report.profile} />
      <StatsOverview report={report} />
      <Suspense fallback={<ActivitySkeleton />}>
        <ContributionsSection
          login={report.profile.login}
          years={report.contributionYears}
          initialYear={initialYear}
          now={now.toISOString()}
        />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <LanguagesBreakdown languages={report.languages} repositoryCount={report.repositories.length} />
        <InsightsPanel insights={report.insights} profile={report.profile} now={now} />
      </div>
      <RepositoriesTable
        repositories={report.repositories}
        totalCount={report.stats.repositories}
        truncated={report.repositoriesTruncated}
        now={now.toISOString()}
      />
    </div>
  );
}
