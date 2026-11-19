import { z } from 'zod';

/** GitHub login rules: 1–39 characters, letters, digits and single inner hyphens. */
export const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const usernameSchema = z.string().trim().regex(USERNAME_PATTERN, 'Not a valid GitHub username');

/** GitHub logins are case-insensitive: use this for cache keys and URLs. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
