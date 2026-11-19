import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { siteConfig } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { GithubIcon } from '@/shared/ui/github-icon';
import { Logo } from '@/shared/ui/logo';
import { HeaderSearch } from './header-search';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          aria-label="GitScope home"
        >
          <Logo />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>
        {/* On phones the logo leads back to the full-size search on the home page. */}
        <div className="hidden flex-1 justify-center sm:flex">
          <HeaderSearch />
        </div>
        <div className="flex-1 sm:hidden" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer" aria-label="Source code on GitHub" />
            }
          >
            <GithubIcon className="size-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
