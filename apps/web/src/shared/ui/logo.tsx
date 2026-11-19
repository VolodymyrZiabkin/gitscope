import { cn } from 'cn';

/** A scope reticle over a contribution cell — "a closer look at GitHub". */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle cx="16" cy="16" r="8.5" fill="none" strokeWidth="2.5" className="stroke-primary-foreground" />
      <path
        d="M16 4.5v5M16 22.5v5M4.5 16h5M22.5 16h5"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-primary-foreground"
      />
      <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" className="fill-primary-foreground" />
    </svg>
  );
}
