'use client';

import { TriangleAlertIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';

/** Unexpected failures only — expected API errors are rendered as states by the pages themselves. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="rounded-full bg-muted p-3">
        <TriangleAlertIcon aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred.{error.digest ? ` Reference: ${error.digest}.` : ''}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
