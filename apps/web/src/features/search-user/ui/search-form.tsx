'use client';

import { LoaderCircleIcon, SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react';
import { cn } from 'cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { parseSearchInput } from '@/shared/lib';
import { addRecentSearch } from '../model/recent-searches';

interface SearchFormProps {
  size?: 'default' | 'lg';
  autoFocus?: boolean;
  className?: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export function SearchForm({ size = 'default', autoFocus = false, className }: SearchFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // "/" focuses the search from anywhere, like on GitHub.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseSearchInput(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    addRecentSearch(result.username);
    startTransition(() => router.push(`/u/${result.username}`));
  }

  const large = size === 'lg';

  return (
    <form role="search" onSubmit={onSubmit} noValidate className={cn('w-full', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground',
              large ? 'size-5' : 'size-4',
            )}
          />
          <Input
            ref={inputRef}
            name="username"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Username or profile URL"
            aria-label="GitHub username"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn('pr-10', large ? 'h-12 pl-10 text-base' : 'h-9 pl-9')}
          />
          <kbd
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 font-mono text-xs text-muted-foreground sm:block"
          >
            /
          </kbd>
        </div>
        <Button type="submit" disabled={isPending} className={large ? 'h-12 px-6 text-base' : 'h-9'}>
          {isPending ? <LoaderCircleIcon aria-hidden className="size-4 animate-spin" /> : null}
          Analyze
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
