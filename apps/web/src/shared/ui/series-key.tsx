import { cn } from 'cn';

/** Identity mark for a data series (a short line key, like in chart legends). Colour is never the only cue. */
export function SeriesKey({ series, className }: { series: 1 | 2; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-0.5 w-3 shrink-0 rounded-full',
        series === 1 ? 'bg-chart-1' : 'bg-chart-2',
        className,
      )}
    />
  );
}
