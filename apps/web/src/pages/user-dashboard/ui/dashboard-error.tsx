import { CloudOffIcon, TimerIcon } from 'lucide-react';
import type { ApiError } from '@/shared/api';
import { pluralize } from '@/shared/lib';
import { RetryButton } from './retry-button';

/** Expected failures render as states — `error.tsx` is reserved for bugs. */
export function DashboardError({ error, username }: { error: ApiError; username: string }) {
  const rateLimited = error.code === 'RATE_LIMITED';
  const Icon = rateLimited ? TimerIcon : CloudOffIcon;
  const minutes = error.retryAfterSeconds ? Math.max(1, Math.ceil(error.retryAfterSeconds / 60)) : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="rounded-full bg-muted p-3">
        <Icon aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {rateLimited ? 'Too many requests right now' : `Couldn’t load @${username}`}
      </h1>
      <p className="text-muted-foreground">
        {rateLimited
          ? `GitHub limits how often data can be fetched.${minutes ? ` Please try again in ${pluralize(minutes, 'minute')}.` : ' Please try again shortly.'}`
          : 'GitHub or the GitScope API did not respond. This is usually temporary.'}
      </p>
      <RetryButton />
    </div>
  );
}
