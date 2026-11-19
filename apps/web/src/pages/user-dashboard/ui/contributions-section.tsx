import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { contributionsQuery } from '@/entities/contribution';
import { ContributionActivity } from '@/widgets/contribution-activity';
import { getContributions } from '../api/load';

interface ContributionsSectionProps {
  login: string;
  years: readonly number[];
  initialYear: number | null;
  now: string;
}

/**
 * Streams in after the profile: fetched on the server and handed to TanStack Query, which owns the data from then
 * on (switching years happens on the client). If the server fetch fails, the client retries on its own.
 */
export async function ContributionsSection({ login, years, initialYear, now }: ContributionsSectionProps) {
  const queryClient = new QueryClient();
  const result = await getContributions(login, initialYear);
  if (result.ok) queryClient.setQueryData(contributionsQuery.key(login, initialYear), result.data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContributionActivity login={login} years={years} initialYear={initialYear} now={now} />
    </HydrationBoundary>
  );
}
