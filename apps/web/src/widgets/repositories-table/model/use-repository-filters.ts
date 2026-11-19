'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { applyRepositoryFilters, parseRepositoryFilters, type RepositoryFilters } from './filters';

/**
 * Filter state mirrored into the URL with `history.replaceState`: links stay shareable, while Next.js does not
 * re-render the server page — filtering happens on data the client already has.
 */
export function useRepositoryFilters() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<RepositoryFilters>(() =>
    parseRepositoryFilters(new URLSearchParams(searchParams?.toString())),
  );

  function update(patch: Partial<RepositoryFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const url = new URL(window.location.href);
    url.search = applyRepositoryFilters(url.searchParams, next).toString();
    window.history.replaceState(window.history.state, '', url);
  }

  return { filters, update };
}
