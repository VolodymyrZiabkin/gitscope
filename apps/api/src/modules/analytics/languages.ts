import type { LanguageStat } from '@gitscope/shared';

export interface RepositoryLanguage {
  name: string;
  color: string | null;
  bytes: number;
}

export const OTHER_LANGUAGE = 'Other';

/**
 * Sums language bytes across repositories and keeps the `limit` biggest languages; the tail is folded into "Other".
 * Bytes (not repository counts) — one huge repository should outweigh ten one-file experiments.
 * The default of 6 (+ "Other") keeps the part-to-whole bar readable: more segments blur together.
 */
export function aggregateLanguages(
  repositories: readonly (readonly RepositoryLanguage[])[],
  limit = 6,
): LanguageStat[] {
  const totals = new Map<string, { color: string | null; bytes: number }>();
  for (const languages of repositories) {
    for (const { name, color, bytes } of languages) {
      const entry = totals.get(name);
      if (entry) entry.bytes += bytes;
      else totals.set(name, { color, bytes });
    }
  }

  const sorted = [...totals]
    .map(([name, { color, bytes }]) => ({ name, color, bytes }))
    .filter((language) => language.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
  const total = sorted.reduce((sum, language) => sum + language.bytes, 0);
  if (total === 0) return [];

  const top = sorted.slice(0, limit);
  const restBytes = sorted.slice(limit).reduce((sum, language) => sum + language.bytes, 0);
  if (restBytes > 0) top.push({ name: OTHER_LANGUAGE, color: null, bytes: restBytes });

  return top.map((language) => ({ ...language, share: round(language.bytes / total, 4) }));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
