import { cn } from 'cn';

/** GitHub linguist colour; languages without one (and "Other") use the neutral axis grey. */
export function LanguageDot({ color, className }: { color: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-full', !color && 'bg-chart-axis', className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
