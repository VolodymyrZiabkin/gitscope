import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from 'cn';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/** A single headline number: label, value (proportional figures), optional context line. */
export function StatTile({ label, value, hint, icon: Icon, className }: StatTileProps) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon aria-hidden className="size-4" /> : null}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
