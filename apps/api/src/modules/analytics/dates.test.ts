import { afterEach, describe, expect, it } from 'vitest';
import { toEpochDay, weekdayOf, wholeYearsBetween } from './dates';

describe('toEpochDay', () => {
  it('counts days from the Unix epoch', () => {
    expect(toEpochDay('1970-01-01')).toBe(0);
    expect(toEpochDay('1970-01-02')).toBe(1);
  });

  it('handles leap days', () => {
    expect(toEpochDay('2024-03-01') - toEpochDay('2024-02-28')).toBe(2);
    expect(toEpochDay('2025-03-01') - toEpochDay('2025-02-28')).toBe(1);
  });

  it('rejects anything that is not a calendar date', () => {
    expect(() => toEpochDay('2024-1-1')).toThrow(RangeError);
    expect(() => toEpochDay('2024-01-01T00:00:00Z')).toThrow(RangeError);
  });
});

describe('weekdayOf', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('returns 0 for Sunday … 6 for Saturday', () => {
    expect(weekdayOf('2000-01-01')).toBe(6);
    expect(weekdayOf('2024-02-29')).toBe(4);
    expect(weekdayOf('2026-11-15')).toBe(0);
  });

  it('does not depend on the server time zone', () => {
    process.env.TZ = 'Pacific/Kiritimati'; // UTC+14
    expect(weekdayOf('2026-11-15')).toBe(0);
    process.env.TZ = 'Pacific/Pago_Pago'; // UTC-11
    expect(weekdayOf('2026-11-15')).toBe(0);
  });
});

describe('wholeYearsBetween', () => {
  const now = new Date('2026-11-19T12:00:00Z');

  it('counts only completed years', () => {
    expect(wholeYearsBetween('2020-11-19T00:00:00Z', now)).toBe(6);
    expect(wholeYearsBetween('2020-11-20T00:00:00Z', now)).toBe(5);
    expect(wholeYearsBetween('2020-12-01T00:00:00Z', now)).toBe(5);
  });

  it('never goes negative', () => {
    expect(wholeYearsBetween('2026-11-18T00:00:00Z', now)).toBe(0);
    expect(wholeYearsBetween('2027-01-01T00:00:00Z', now)).toBe(0);
  });
});
