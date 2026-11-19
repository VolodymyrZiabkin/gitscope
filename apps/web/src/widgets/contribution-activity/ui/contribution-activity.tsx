'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from 'cn';
import { contributionsQuery, ContributionHeatmap, HeatLegend } from '@/entities/contribution';
import { YearSelect } from './year-select';
import { ApiError } from '@/shared/api';
import { pluralize } from '@/shared/lib';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { ActivitySkeleton } from './activity-skeleton';
import { ActivityStats } from './activity-stats';
import { MonthlyChart } from './monthly-chart';
import { WeekdayChart } from './weekday-chart';

interface ContributionActivityProps {
  login: string;
  /** Years with contributions, newest first. */
  years: readonly number[];
  initialYear: number | null;
  /** Server time, so the server render and hydration agree. */
  now: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
    return error.retryAfterSeconds
      ? `Rate limit reached — try again in ${pluralize(Math.ceil(error.retryAfterSeconds / 60), 'minute')}.`
      : 'Rate limit reached — try again later.';
  }
  return 'The contribution calendar could not be loaded.';
}

/**
 * The year filter scopes everything in this section. Switching years keeps the previous render at reduced opacity
 * (no skeleton flash) and mirrors the choice into the URL without a server round trip.
 */
export function ContributionActivity({ login, years, initialYear, now }: ContributionActivityProps) {
  const [year, setYear] = useState(initialYear);
  const query = useQuery({ ...contributionsQuery.options(login, year), placeholderData: keepPreviousData });
  const currentYear = new Date(now).getUTCFullYear();

  function changeYear(next: number | null) {
    setYear(next);
    const url = new URL(window.location.href);
    if (next === null) url.searchParams.delete('year');
    else url.searchParams.set('year', String(next));
    window.history.replaceState(window.history.state, '', url);
  }

  const data = query.data;
  const periodLabel = year === null ? 'in the last 12 months' : `in ${year}`;

  return (
    <section aria-labelledby="activity-title" className="flex flex-col gap-4">
      <SectionHeading
        id="activity-title"
        title="Contribution activity"
        description={data ? `${pluralize(data.total, 'contribution')} ${periodLabel}` : undefined}
        action={<YearSelect years={years} value={year} onChange={changeYear} />}
      />

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>{errorMessage(query.error)}</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} className="mt-2">
              <RotateCwIcon aria-hidden className="size-3.5" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {data ? (
        <div
          className={cn('flex flex-col gap-4 transition-opacity', query.isPlaceholderData && 'opacity-60')}
          aria-busy={query.isFetching}
        >
          <ActivityStats data={data} isOngoing={year === null || year === currentYear} />
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <ContributionHeatmap
              days={data.days}
              label={`Contribution calendar, ${pluralize(data.total, 'contribution')} ${periodLabel}`}
            />
            <HeatLegend className="self-end" />
          </div>
          <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
            <div className="rounded-xl border bg-card p-4">
              <MonthlyChart monthly={data.monthly} />
            </div>
            <div className="rounded-xl border bg-card p-4">
              <WeekdayChart weekdays={data.weekdays} />
            </div>
          </div>
        </div>
      ) : query.isError ? null : (
        <ActivitySkeleton />
      )}
    </section>
  );
}
