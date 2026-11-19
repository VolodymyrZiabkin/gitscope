const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en');
const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });
// Calendar dates from the API are formatted in UTC so they never shift by a day in the viewer's time zone.
const longDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortMonth = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
const weekdayName = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' });

/** 1,284 → "1.3K"; small numbers stay exact. */
export const formatCompact = (value: number) => (value < 10_000 ? integer.format(value) : compact.format(value));
export const formatInteger = (value: number) => integer.format(value);
/** Axis ticks are always compact so they fit a narrow axis: 1,950 → "2K". */
export const formatAxisTick = (value: number) => compact.format(value);
export const formatPercent = (share: number) => percent.format(share);

/** `YYYY-MM-DD` or an ISO timestamp → "5 Mar 2026". */
export const formatDate = (value: string) =>
  longDate.format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
/** `YYYY-MM` → "Mar 2026". */
export const formatMonthYear = (month: string) => monthYear.format(new Date(`${month}-01T00:00:00Z`));
/** `YYYY-MM` → "Mar". */
export const formatShortMonth = (month: string) => shortMonth.format(new Date(`${month}-01T00:00:00Z`));
/** 0 = Sunday → "Sunday" (1970-01-04 was a Sunday). */
export const formatWeekday = (weekday: number) => weekdayName.format(new Date(Date.UTC(1970, 0, 4 + weekday)));

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatInteger(count)} ${count === 1 ? singular : plural}`;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 days ago". `now` is a parameter so rendering stays deterministic in tests. */
export function formatRelative(iso: string, now: Date): string {
  const seconds = Math.round((Date.parse(iso) - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.trunc(seconds / size), unit);
  }
  return 'just now';
}
