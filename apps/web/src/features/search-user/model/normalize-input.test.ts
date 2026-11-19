import { describe, expect, it } from 'vitest';
import { parseSearchInput } from './normalize-input';

describe('parseSearchInput', () => {
  it.each([
    ['gaearon', 'gaearon'],
    ['  @gaearon ', 'gaearon'],
    ['https://github.com/gaearon', 'gaearon'],
    ['github.com/torvalds?tab=repositories', 'torvalds'],
    ['https://www.github.com/sindresorhus/', 'sindresorhus'],
  ])('reads %j as %s', (input, username) => {
    expect(parseSearchInput(input)).toEqual({ ok: true, username });
  });

  it('asks for input when empty', () => {
    expect(parseSearchInput('   ')).toEqual({ ok: false, error: 'Enter a GitHub username' });
  });

  it.each(['bad--name', 'under_score', 'https://gitlab.com/someone', 'a'.repeat(40)])('rejects %j', (input) => {
    expect(parseSearchInput(input).ok).toBe(false);
  });
});
