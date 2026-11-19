'use client';

import { HistoryIcon } from 'lucide-react';
import Link from 'next/link';
import { useRecentSearches } from '../model/recent-searches';

export function RecentSearches() {
  const recent = useRecentSearches();
  if (recent.length === 0) return null;

  return (
    <nav aria-label="Recent searches" className="flex flex-wrap items-center gap-2 text-sm">
      <HistoryIcon aria-hidden className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">Recent:</span>
      {recent.map((username) => (
        <Link
          key={username}
          href={`/u/${username}`}
          className="rounded-full border px-3 py-1 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {username}
        </Link>
      ))}
    </nav>
  );
}
