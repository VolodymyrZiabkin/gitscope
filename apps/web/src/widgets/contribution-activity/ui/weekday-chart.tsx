import { cn } from 'cn';
import { formatInteger, formatWeekday } from '@/shared/lib';

/**
 * Emphasis form: the story is "which day", so the busiest weekday wears the accent and the rest stay grey.
 * Every bar is directly labelled — no tooltip needed. Rows start on Monday.
 */
export function WeekdayChart({ weekdays }: { weekdays: readonly number[] }) {
  const max = Math.max(0, ...weekdays);
  const busiest = max > 0 ? weekdays.indexOf(max) : -1;
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-medium">
        By weekday
        {busiest >= 0 ? (
          <span className="font-normal text-muted-foreground"> · busiest on {formatWeekday(busiest)}s</span>
        ) : null}
      </figcaption>
      <ul className="flex flex-col gap-2">
        {order.map((weekday) => {
          const count = weekdays[weekday] ?? 0;
          return (
            <li key={weekday} className="grid grid-cols-[2.5rem_1fr_3.5rem] items-center gap-2 text-sm">
              <span className="text-muted-foreground">{formatWeekday(weekday).slice(0, 3)}</span>
              <span className="h-3 overflow-hidden rounded-r-[4px]">
                <span
                  className={cn(
                    'block h-full rounded-r-[4px]',
                    weekday === busiest ? 'bg-chart-1' : 'bg-chart-axis/45',
                  )}
                  style={{ width: max > 0 ? `${Math.max((count / max) * 100, count > 0 ? 2 : 0)}%` : 0 }}
                />
              </span>
              <span className="text-right tabular-nums">{formatInteger(count)}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
