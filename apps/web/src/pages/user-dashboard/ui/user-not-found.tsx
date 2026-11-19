import { UserRoundXIcon } from 'lucide-react';
import Link from 'next/link';
import { SearchForm } from '@/features/search-user';
import { siteConfig } from '@/shared/config';

export function UserNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="rounded-full bg-muted p-3">
        <UserRoundXIcon aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">No GitHub user here</h1>
      <p className="text-muted-foreground">
        The username doesn’t exist, or it belongs to an organization — GitScope analyses personal profiles.
      </p>
      <SearchForm className="mt-2" />
      <p className="text-sm text-muted-foreground">
        Or try{' '}
        {siteConfig.exampleUsers.map((user, index) => (
          <span key={user}>
            {index > 0 ? ', ' : ''}
            <Link href={`/u/${user}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {user}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
