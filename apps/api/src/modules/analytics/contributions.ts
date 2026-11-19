import { toEpochDay, weekdayOf } from './dates';

export interface DailyCount {
  date: string;
  count: number;
}

export interface Streaks {
  current: number;
  longest: { length: number; from: string; to: string } | null;
}

/**
 * Streaks over days sorted ascending. A gap in dates breaks a streak.
 * The current streak ends on the last day, or on the day before when the last day is still empty —
 * "today" is not over yet, so it should not reset the streak (GitHub-like behaviour).
 */
export function computeStreaks(days: readonly DailyCount[]): Streaks {
  let longest: Streaks['longest'] = null;
  let runStart: string | null = null;
  let runLength = 0;
  let previousDay: number | null = null;

  for (const { date, count } of days) {
    const epochDay = toEpochDay(date);
    const contiguous = previousDay !== null && epochDay === previousDay + 1;
    previousDay = epochDay;

    if (count === 0) {
      runLength = 0;
      continue;
    }
    if (runLength === 0 || !contiguous) {
      runStart = date;
      runLength = 0;
    }
    runLength += 1;
    if (runStart && runLength > (longest?.length ?? 0)) {
      longest = { length: runLength, from: runStart, to: date };
    }
  }

  return { current: currentStreak(days), longest };
}

function currentStreak(days: readonly DailyCount[]): number {
  let index = days.length - 1;
  if (days[index]?.count === 0) index -= 1;

  let streak = 0;
  let expectedDay: number | null = null;
  for (; index >= 0; index--) {
    const day = days[index];
    if (!day || day.count === 0) break;
    const epochDay = toEpochDay(day.date);
    if (expectedDay !== null && epochDay !== expectedDay) break;
    expectedDay = epochDay - 1;
    streak += 1;
  }
  return streak;
}

/** Totals per `YYYY-MM`, in calendar order. */
export function monthlyTotals(days: readonly DailyCount[]): { month: string; count: number }[] {
  const months = new Map<string, number>();
  for (const { date, count } of days) {
    const month = date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + count);
  }
  return [...months].map(([month, count]) => ({ month, count }));
}

/** Totals per weekday, index 0 = Sunday. */
export function weekdayTotals(days: readonly DailyCount[]): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const { date, count } of days) {
    const weekday = weekdayOf(date);
    totals[weekday] = (totals[weekday] ?? 0) + count;
  }
  return totals;
}

/** The busiest day; the earliest one wins a tie. `null` when there are no contributions. */
export function findBestDay(days: readonly DailyCount[]): DailyCount | null {
  let best: DailyCount | null = null;
  for (const day of days) {
    if (day.count > (best?.count ?? 0)) best = { date: day.date, count: day.count };
  }
  return best;
}

export function countActiveDays(days: readonly DailyCount[]): number {
  return days.filter((day) => day.count > 0).length;
}
