'use client';

import { usePathname } from 'next/navigation';
import { SearchForm } from '@/features/search-user';

/** The home page has its own hero search; everywhere else the header offers a compact one. */
export function HeaderSearch() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <SearchForm className="max-w-md" />;
}
