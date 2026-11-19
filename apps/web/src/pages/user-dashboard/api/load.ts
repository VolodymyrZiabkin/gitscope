import 'server-only';
import { contributionsSchema, userReportSchema } from '@gitscope/shared';
import { cache } from 'react';
import { contributionsQuery } from '@/entities/contribution';
import { serverApiFetch } from '@/shared/server-api';

/** `cache` dedupes the call between generateMetadata and the page within one request. */
export const getUserReport = cache((username: string) =>
  serverApiFetch(`/users/${encodeURIComponent(username)}`, userReportSchema),
);

export const getContributions = (login: string, year: number | null) =>
  serverApiFetch(contributionsQuery.path(login, year), contributionsSchema);
