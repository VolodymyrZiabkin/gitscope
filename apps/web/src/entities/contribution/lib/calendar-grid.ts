import type { ContributionDay } from '@gitscope/shared';
import { formatShortMonth } from '@/shared/lib';

export interface CalendarGrid {
  /** Columns of 7 slots (Sunday … Saturday); `null` pads the first and the last week. */
  weeks: (ContributionDay | null)[][];
  /** Month labels placed above the week in which the month starts. */
  months: { label: string; week: number }[];
}

const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** Lays consecutive days out like GitHub: one column per week, weekdays as rows. */
export function buildCalendarGrid(days: readonly ContributionDay[]): CalendarGrid {
  const first = days[0];
  if (!first) return { weeks: [], months: [] };

  const offset = weekdayOf(first.date);
  const weeks: (ContributionDay | null)[][] = [];
  days.forEach((day, index) => {
    const slot = index + offset;
    const week = (weeks[Math.floor(slot / 7)] ??= [null, null, null, null, null, null, null]);
    week[slot % 7] = day;
  });

  const months: CalendarGrid['months'] = [];
  weeks.forEach((week, index) => {
    const firstDay = week.find((day) => day !== null);
    if (!firstDay) return;
    const month = firstDay.date.slice(0, 7);
    if (months.at(-1)?.label !== formatShortMonth(month)) months.push({ label: formatShortMonth(month), week: index });
  });
  // A partial first month leaves too little room for its label — drop it rather than overlap the next one.
  const [firstMonth, secondMonth] = months;
  if (firstMonth && secondMonth && secondMonth.week - firstMonth.week < 3) months.shift();

  return { weeks, months };
}
