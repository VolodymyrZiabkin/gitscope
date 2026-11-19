import { contributionsSchema } from '@gitscope/shared';
import { queryOptions } from '@tanstack/react-query';
import { browserApiFetch } from '@/shared/api';

/** One cache contract for the server prefetch and the client query — both must build the same key. */
export const contributionsQuery = {
  key: (login: string, year: number | null) => ['contributions', login.toLowerCase(), year ?? 'rolling'] as const,
  path: (login: string, year: number | null) =>
    `/users/${encodeURIComponent(login)}/contributions${year === null ? '' : `?year=${year}`}`,
  options: (login: string, year: number | null) =>
    queryOptions({
      queryKey: contributionsQuery.key(login, year),
      queryFn: ({ signal }) => browserApiFetch(contributionsQuery.path(login, year), contributionsSchema, signal),
      // Part of the contract, not a client default: data hydrated from the server must not be refetched on mount.
      staleTime: 5 * 60_000,
    }),
};
