import { usernameSchema } from '@gitscope/shared';

const GITHUB_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)/i;

/** Accepts "gaearon", "@gaearon" or a pasted profile URL; returns a valid login or an error message. */
export function parseSearchInput(input: string): { ok: true; username: string } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Enter a GitHub username' };

  const candidate = GITHUB_URL.exec(trimmed)?.[1] ?? trimmed.replace(/^@/, '');
  const parsed = usernameSchema.safeParse(candidate);
  return parsed.success
    ? { ok: true, username: parsed.data }
    : { ok: false, error: 'Usernames contain only letters, digits and single hyphens' };
}
