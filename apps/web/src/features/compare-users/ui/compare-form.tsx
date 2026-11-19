'use client';

import { ArrowLeftRightIcon, LoaderCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { parseSearchInput } from '@/shared/lib';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function CompareForm({ initial }: { initial: [string, string] }) {
  const router = useRouter();
  const [first, setFirst] = useState(initial[0]);
  const [second, setSecond] = useState(initial[1]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const a = parseSearchInput(first);
    const b = parseSearchInput(second);
    if (!a.ok || !b.ok) {
      setError(!a.ok ? `First user: ${a.error}` : !b.ok ? `Second user: ${b.error}` : null);
      return;
    }
    if (a.username.toLowerCase() === b.username.toLowerCase()) {
      setError('Pick two different users');
      return;
    }
    setError(null);
    startTransition(() => router.push(`/compare?users=${a.username},${b.username}`));
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Compare two GitHub users" className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={first}
          onChange={(event) => setFirst(event.target.value)}
          placeholder="First username"
          aria-label="First GitHub username"
          autoComplete="off"
          className="h-9 sm:flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Swap users"
          className="self-center"
          onClick={() => {
            setFirst(second);
            setSecond(first);
          }}
        >
          <ArrowLeftRightIcon className="size-4" />
        </Button>
        <Input
          value={second}
          onChange={(event) => setSecond(event.target.value)}
          placeholder="Second username"
          aria-label="Second GitHub username"
          autoComplete="off"
          className="h-9 sm:flex-1"
        />
        <Button type="submit" disabled={isPending} className="h-9">
          {isPending ? <LoaderCircleIcon aria-hidden className="size-4 animate-spin" /> : null}
          Compare
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
