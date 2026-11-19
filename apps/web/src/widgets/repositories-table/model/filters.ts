import type { Repository } from '@gitscope/shared';

export const SORT_OPTIONS = [
  { value: 'stars', label: 'Most stars' },
  { value: 'forks', label: 'Most forks' },
  { value: 'pushed', label: 'Recently pushed' },
  { value: 'name', label: 'Name' },
] as const;

export type RepositorySort = (typeof SORT_OPTIONS)[number]['value'];

export interface RepositoryFilters {
  query: string;
  language: string | null;
  sort: RepositorySort;
}

export const DEFAULT_FILTERS: RepositoryFilters = { query: '', language: null, sort: 'stars' };

const isSort = (value: string | null): value is RepositorySort => SORT_OPTIONS.some((option) => option.value === value);

/** URL → filters. Unknown values fall back to defaults instead of breaking the page. */
export function parseRepositoryFilters(params: URLSearchParams): RepositoryFilters {
  const sort = params.get('sort');
  return {
    query: params.get('q')?.slice(0, 100) ?? '',
    language: params.get('lang') || null,
    sort: isSort(sort) ? sort : DEFAULT_FILTERS.sort,
  };
}

/** Filters → URL, keeping unrelated parameters (e.g. `year`) and omitting defaults for clean links. */
export function applyRepositoryFilters(params: URLSearchParams, filters: RepositoryFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null, fallback: string | null) => {
    if (value && value !== fallback) next.set(key, value);
    else next.delete(key);
  };
  set('q', filters.query.trim(), '');
  set('lang', filters.language, null);
  set('sort', filters.sort, DEFAULT_FILTERS.sort);
  return next;
}

const COMPARATORS: Record<RepositorySort, (a: Repository, b: Repository) => number> = {
  stars: (a, b) => b.stars - a.stars,
  forks: (a, b) => b.forks - a.forks,
  pushed: (a, b) => Date.parse(b.pushedAt ?? '1970-01-01') - Date.parse(a.pushedAt ?? '1970-01-01'),
  name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
};

/** Case-insensitive search over name, description and topics, then language filter, then a stable sort. */
export function filterRepositories(repositories: readonly Repository[], filters: RepositoryFilters): Repository[] {
  const query = filters.query.trim().toLowerCase();
  return repositories
    .filter((repository) => {
      if (filters.language && repository.primaryLanguage?.name !== filters.language) return false;
      if (!query) return true;
      return [repository.name, repository.description ?? '', ...repository.topics].some((text) =>
        text.toLowerCase().includes(query),
      );
    })
    .sort((a, b) => COMPARATORS[filters.sort](a, b) || a.name.localeCompare(b.name));
}

/** Primary languages with repository counts, most common first — options for the language filter. */
export function languageOptions(repositories: readonly Repository[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const repository of repositories) {
    const name = repository.primaryLanguage?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
