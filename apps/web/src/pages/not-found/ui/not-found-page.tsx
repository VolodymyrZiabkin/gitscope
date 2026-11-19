import { CompassIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="rounded-full bg-muted p-3">
        <CompassIcon aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">This page doesn’t exist. Profiles live at /u/username.</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Search a profile
      </Button>
    </div>
  );
}
