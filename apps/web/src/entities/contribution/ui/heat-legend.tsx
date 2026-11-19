import { cn } from 'cn';

export const HEAT_FILL = ['fill-heat-0', 'fill-heat-1', 'fill-heat-2', 'fill-heat-3', 'fill-heat-4'] as const;
const HEAT_BG = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'] as const;

export function HeatLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)} aria-hidden>
      <span className="mr-1">Less</span>
      {HEAT_BG.map((background) => (
        <span key={background} className={cn('size-[11px] rounded-[2px]', background)} />
      ))}
      <span className="ml-1">More</span>
    </div>
  );
}
