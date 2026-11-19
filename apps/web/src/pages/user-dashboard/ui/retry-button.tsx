'use client';

import { RotateCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/shared/ui/button';

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={isPending} onClick={() => startTransition(() => router.refresh())}>
      <RotateCwIcon aria-hidden className={isPending ? 'size-4 animate-spin' : 'size-4'} />
      Try again
    </Button>
  );
}
