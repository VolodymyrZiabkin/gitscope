import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gitscope:recent-searches';
const LIMIT = 5;
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY; // Storage can be disabled (privacy mode) — recent searches are optional.
  }
  // Return the same array for the same string, otherwise useSyncExternalStore re-renders forever.
  if (raw !== cache.raw) {
    let value: string[] = EMPTY;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) value = parsed.filter((item): item is string => typeof item === 'string');
    } catch {
      value = EMPTY;
    }
    cache = { raw, value };
  }
  return cache.value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function addRecentSearch(username: string): void {
  const next = [username, ...read().filter((item) => item.toLowerCase() !== username.toLowerCase())].slice(0, LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

/** Recent searches from localStorage; empty during SSR and the first client render (no hydration mismatch). */
export function useRecentSearches(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
