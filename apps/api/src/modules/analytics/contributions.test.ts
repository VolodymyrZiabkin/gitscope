import { describe, expect, it } from 'vitest';
import {
  computeStreaks,
  countActiveDays,
  findBestDay,
  monthlyTotals,
  weekdayTotals,
  type DailyCount,
} from './contributions';

/** Consecutive days starting at `from`. */
function days(from: string, counts: number[]): DailyCount[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  return counts.map((count, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count,
  }));
}

describe('computeStreaks', () => {
  it('is empty without contributions', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: null });
    expect(computeStreaks(days('2026-01-01', [0, 0, 0]))).toEqual({ current: 0, longest: null });
  });

  it('finds the longest and the current streak', () => {
    expect(computeStreaks(days('2026-01-01', [1, 1, 0, 2, 3, 1]))).toEqual({
      current: 3,
      longest: { length: 3, from: '2026-01-04', to: '2026-01-06' },
    });
  });

  it('keeps the earliest streak when two are equally long', () => {
    expect(computeStreaks(days('2026-01-01', [1, 1, 0, 1, 1, 0, 0])).longest).toEqual({
      length: 2,
      from: '2026-01-01',
      to: '2026-01-02',
    });
  });

  it('does not reset the current streak because today is still empty', () => {
    expect(computeStreaks(days('2026-01-01', [1, 1, 1, 0])).current).toBe(3);
    expect(computeStreaks(days('2026-01-01', [1, 1, 0, 0])).current).toBe(0);
  });

  it('continues across a year boundary and a leap day', () => {
    expect(computeStreaks(days('2023-12-30', [1, 1, 1])).longest).toEqual({
      length: 3,
      from: '2023-12-30',
      to: '2024-01-01',
    });
    expect(computeStreaks(days('2024-02-28', [1, 1, 1])).longest?.to).toBe('2024-03-01');
  });

  it('breaks a streak on a gap in dates', () => {
    const withGap = [
      { date: '2026-01-01', count: 1 },
      { date: '2026-01-02', count: 1 },
      { date: '2026-01-04', count: 1 },
    ];
    expect(computeStreaks(withGap)).toEqual({
      current: 1,
      longest: { length: 2, from: '2026-01-01', to: '2026-01-02' },
    });
  });
});

describe('monthlyTotals', () => {
  it('groups by month in calendar order', () => {
    expect(monthlyTotals(days('2026-01-30', [1, 2, 3, 4]))).toEqual([
      { month: '2026-01', count: 3 },
      { month: '2026-02', count: 7 },
    ]);
  });
});

describe('weekdayTotals', () => {
  it('sums contributions per weekday starting with Sunday', () => {
    // 2026-11-15 is a Sunday.
    expect(weekdayTotals(days('2026-11-15', [1, 2, 3, 4, 5, 6, 7, 10]))).toEqual([11, 2, 3, 4, 5, 6, 7]);
  });
});

describe('findBestDay / countActiveDays', () => {
  it('returns the busiest day, earliest on a tie', () => {
    expect(findBestDay(days('2026-01-01', [2, 5, 1, 5]))).toEqual({ date: '2026-01-02', count: 5 });
    expect(findBestDay(days('2026-01-01', [0, 0]))).toBeNull();
  });

  it('counts days with at least one contribution', () => {
    expect(countActiveDays(days('2026-01-01', [0, 3, 0, 1]))).toBe(2);
  });
});
