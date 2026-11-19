import { USERNAME_PATTERN } from '@gitscope/shared';

/** `?users=a,b` → two slots; invalid or missing entries become empty strings (prefill for the form). */
export function parseUsersParam(value: string | string[] | undefined): [string, string] {
  const raw = typeof value === 'string' ? value.split(',').map((item) => item.trim()) : [];
  const valid = raw.map((item) => (USERNAME_PATTERN.test(item) ? item : ''));
  return [valid[0] ?? '', valid[1] ?? ''];
}
