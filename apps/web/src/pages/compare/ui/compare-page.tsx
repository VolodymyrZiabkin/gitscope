import type { UserReport } from '@gitscope/shared';
import { UserRoundXIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CompareForm } from '@/features/compare-users';
import { type ApiError } from '@/shared/api';
import { formatCompact, pluralize } from '@/shared/lib';
import { getUserReport } from '@/shared/server-api';
import { CompareRow, CompareTable, CompareTextRow } from '@/shared/ui/compare-table';
import { SeriesKey } from '@/shared/ui/series-key';
import { CompareActivity } from '@/widgets/compare-activity';
import { LanguagesBreakdown } from '@/widgets/languages-breakdown';
import { parseUsersParam } from '../lib/parse-users';

function ProfileSummary({ report, series }: { report: UserReport; series: 1 | 2 }) {
  const { profile } = report;
  return (
    <Link
      href={`/u/${profile.login}`}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
    >
      <Image src={profile.avatarUrl} alt="" width={56} height={56} className="size-14 rounded-full border" />
      <div className="min-w-0">
        <div className="truncate font-semibold">{profile.name ?? profile.login}</div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SeriesKey series={series} />@{profile.login}
        </div>
      </div>
    </Link>
  );
}

function Unavailable({ username, error }: { username: string; error: ApiError }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm">
      <UserRoundXIcon aria-hidden className="size-5 text-muted-foreground" />
      {error.code === 'USER_NOT_FOUND'
        ? `No GitHub user named @${username}.`
        : `@${username} could not be loaded: ${error.message}.`}
    </div>
  );
}

export async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { users } = await searchParams;
  const logins = parseUsersParam(users);
  const ready = logins[0] !== '' && logins[1] !== '';
  const results = ready ? await Promise.all(logins.map((login) => getUserReport(login))) : [];
  const [first, second] = results;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compare developers</h1>
          <p className="text-muted-foreground">Two GitHub profiles side by side: reach, activity and languages.</p>
        </div>
        <CompareForm key={logins.join(',')} initial={logins} />
      </div>

      {first && second ? (
        first.ok && second.ok ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileSummary report={first.data} series={1} />
              <ProfileSummary report={second.data} series={2} />
            </div>
            <CompareTable caption="Profile" logins={[first.data.profile.login, second.data.profile.login]}>
              <CompareRow
                label="Stars earned"
                values={[first.data.stats.totalStars, second.data.stats.totalStars]}
                format={formatCompact}
              />
              <CompareRow
                label="Followers"
                values={[first.data.profile.followers, second.data.profile.followers]}
                format={formatCompact}
              />
              <CompareRow
                label="Repositories"
                values={[first.data.stats.repositories, second.data.stats.repositories]}
                format={formatCompact}
              />
              <CompareRow
                label="Forks received"
                values={[first.data.stats.totalForks, second.data.stats.totalForks]}
                format={formatCompact}
              />
              <CompareRow
                label="Stars per repository"
                values={[first.data.insights.averageStarsPerRepository, second.data.insights.averageStarsPerRepository]}
                format={(value) => value.toLocaleString('en')}
              />
              <CompareRow
                label="On GitHub"
                values={[first.data.insights.accountAgeYears, second.data.insights.accountAgeYears]}
                format={(value) => pluralize(value, 'year')}
              />
              <CompareTextRow
                label="Top language"
                values={[first.data.insights.topLanguage ?? '—', second.data.insights.topLanguage ?? '—']}
              />
            </CompareTable>
            <CompareActivity logins={[first.data.profile.login, second.data.profile.login]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <LanguagesBreakdown
                languages={first.data.languages}
                repositoryCount={first.data.repositories.length}
                title={`Languages · ${first.data.profile.login}`}
              />
              <LanguagesBreakdown
                languages={second.data.languages}
                repositoryCount={second.data.repositories.length}
                title={`Languages · ${second.data.profile.login}`}
              />
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {first.ok ? (
              <ProfileSummary report={first.data} series={1} />
            ) : (
              <Unavailable username={logins[0]} error={first.error} />
            )}
            {second.ok ? (
              <ProfileSummary report={second.data} series={2} />
            ) : (
              <Unavailable username={logins[1]} error={second.error} />
            )}
          </div>
        )
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Enter two usernames to compare them — for example{' '}
          <Link
            href="/compare?users=gaearon,yyx990803"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            gaearon vs yyx990803
          </Link>
          .
        </p>
      )}
    </div>
  );
}
