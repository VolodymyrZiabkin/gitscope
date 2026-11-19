import { describe, expect, it } from 'vitest';
import { normalizeUsername, usernameSchema } from './username';

describe('usernameSchema', () => {
  it.each(['a', 'torvalds', 'Volodymyr-Ziabkin', 'a1-b2-c3', 'x'.repeat(39)])('accepts %s', (username) => {
    expect(usernameSchema.safeParse(username).success).toBe(true);
  });

  it.each(['', '-start', 'end-', 'double--hyphen', 'under_score', 'with space', 'x'.repeat(40), '../etc'])(
    'rejects %j',
    (username) => {
      expect(usernameSchema.safeParse(username).success).toBe(false);
    },
  );

  it('trims surrounding whitespace', () => {
    expect(usernameSchema.parse('  gaearon ')).toBe('gaearon');
  });
});

describe('normalizeUsername', () => {
  it('lowercases and trims', () => {
    expect(normalizeUsername(' GaeAron ')).toBe('gaearon');
  });
});
