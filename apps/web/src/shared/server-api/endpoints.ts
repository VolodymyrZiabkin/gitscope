import 'server-only';
import { contributionsSchema, userReportSchema } from '@gitscope/shared';
import { cache } from 'react';
import { serverApiFetch } from './fetch';

/** `cache` dedupes calls within one request (generateMetadata + page, or both users of a comparison). */
export const getUserReport = cache((username: string, options?: { timeoutMs?: number }) =>
  serverApiFetch(`/users/${encodeURIComponent(username)}`, userReportSchema, options),
);

export const getContributions = (path: string) => serverApiFetch(path, contributionsSchema);
