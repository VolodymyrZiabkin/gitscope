const DAY_MS = 86_400_000;
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Days since the Unix epoch for a `YYYY-MM-DD` calendar date. Pure UTC arithmetic: the result does not depend
 * on the server time zone, so dates from GitHub never shift by a day.
 */
export function toEpochDay(date: string): number {
  const match = CALENDAR_DATE.exec(date);
  if (!match) throw new RangeError(`Not a calendar date: ${date}`);
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS;
}

/** 0 = Sunday … 6 = Saturday, like GitHub's contribution calendar. */
export function weekdayOf(date: string): number {
  return new Date(toEpochDay(date) * DAY_MS).getUTCDay();
}

export function wholeYearsBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso);
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const anniversaryPassed =
    to.getUTCMonth() > from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() >= from.getUTCDate());
  if (!anniversaryPassed) years -= 1;
  return Math.max(0, years);
}
