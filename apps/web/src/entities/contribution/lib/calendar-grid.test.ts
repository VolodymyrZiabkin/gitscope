import { describe, expect, it } from 'vitest';
import { buildCalendarGrid } from './calendar-grid';
import { makeContributions } from '@/shared/test';

describe('buildCalendarGrid', () => {
  it('places days in weekday rows, padding the first week', () => {
    // 2026-01-01 is a Thursday (weekday 4).
    const { weeks } = buildCalendarGrid(makeContributions('2026-01-01', [1, 2, 3, 4]).days);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]?.slice(0, 4)).toEqual([null, null, null, null]);
    expect(weeks[0]?.[4]?.date).toBe('2026-01-01');
    expect(weeks[1]?.[0]?.date).toBe('2026-01-04');
  });

  it('labels the week in which each month starts', () => {
    const { months } = buildCalendarGrid(
      makeContributions(
        '2026-01-04',
        Array.from({ length: 70 }, () => 0),
      ).days,
    );
    expect(months.map((month) => month.label)).toEqual(['Jan', 'Feb', 'Mar']);
    expect(months[1]).toEqual({ label: 'Feb', week: 4 });
  });

  it('drops the label of a partial first month that would collide with the next one', () => {
    const { months } = buildCalendarGrid(
      makeContributions(
        '2026-01-28',
        Array.from({ length: 40 }, () => 0),
      ).days,
    );
    expect(months[0]?.label).toBe('Feb');
  });

  it('handles an empty calendar', () => {
    expect(buildCalendarGrid([])).toEqual({ weeks: [], months: [] });
  });
});
