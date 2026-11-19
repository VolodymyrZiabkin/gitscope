import { describe, expect, it } from 'vitest';
import {
  formatAxisTick,
  formatCompact,
  formatDate,
  formatMonthYear,
  formatRelative,
  formatWeekday,
  pluralize,
} from './format';

describe('format', () => {
  it('keeps small numbers exact and compacts large ones', () => {
    expect(formatCompact(9_999)).toBe('9,999');
    expect(formatCompact(45_512)).toBe('45.5K');
    expect(formatCompact(2_340_000)).toBe('2.3M');
    expect(formatAxisTick(1_950)).toBe('2K');
  });

  it('formats calendar dates without shifting them into the local time zone', () => {
    expect(formatDate('2026-03-01')).toBe('Mar 1, 2026');
    expect(formatMonthYear('2026-12')).toBe('Dec 2026');
  });

  it('names weekdays with Sunday as 0', () => {
    expect(formatWeekday(0)).toBe('Sunday');
    expect(formatWeekday(6)).toBe('Saturday');
  });

  it('pluralizes English nouns', () => {
    expect(pluralize(1, 'day')).toBe('1 day');
    expect(pluralize(1200, 'repository', 'repositories')).toBe('1,200 repositories');
  });

  it('describes time relative to a given now', () => {
    const now = new Date('2026-11-19T12:00:00Z');
    expect(formatRelative('2026-11-16T12:00:00Z', now)).toBe('3 days ago');
    expect(formatRelative('2023-11-01T00:00:00Z', now)).toBe('3 years ago');
    expect(formatRelative('2026-11-19T11:59:30Z', now)).toBe('just now');
  });
});
