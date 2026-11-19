'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '@/shared/api';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The API caches for 10 minutes; refetching sooner would only return the same data.
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Retrying "not found", validation or rate-limit errors cannot succeed and burns quota.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // A fresh client per server render keeps users isolated; the browser reuses one client across navigations.
  if (isServer) return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
