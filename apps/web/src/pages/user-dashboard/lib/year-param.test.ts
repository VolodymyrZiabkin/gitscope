import { describe, expect, it } from 'vitest';
import { parseYearParam } from './year-param';

describe('parseYearParam', () => {
  const years = [2026, 2025, 2024];

  it('accepts a year the user has contributions in', () => {
    expect(parseYearParam('2025', years)).toBe(2025);
  });

  it.each([undefined, '', '2019', '25', '2025abc', ['2025', '2024']])(
    'falls back to the rolling year for %j',
    (value) => {
      expect(parseYearParam(value, years)).toBeNull();
    },
  );
});
