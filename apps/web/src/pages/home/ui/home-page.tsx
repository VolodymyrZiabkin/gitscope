import { ActivityIcon, CodeXmlIcon, FlameIcon, Share2Icon } from 'lucide-react';
import Link from 'next/link';
import { RecentSearches, SearchForm } from '@/features/search-user';
import { siteConfig } from '@/shared/config';
import { WakeApi } from './wake-api';

const FEATURES = [
  {
    icon: ActivityIcon,
    title: 'Contribution heatmap',
    text: 'A full year of activity, any year since joining, with monthly and weekday breakdowns.',
  },
  {
    icon: CodeXmlIcon,
    title: 'Languages that matter',
    text: 'Weighted by bytes of code across owned repositories, not by repository count.',
  },
  {
    icon: FlameIcon,
    title: 'Streaks and insights',
    text: 'Current and longest streaks, the busiest day, the most starred project and more.',
  },
  {
    icon: Share2Icon,
    title: 'Made to be shared',
    text: 'Every profile has its own link with a rich preview card for LinkedIn, X and Slack.',
  },
] as const;

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 sm:py-24">
      <WakeApi />
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Understand any GitHub profile in seconds
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">{siteConfig.description}</p>
        <SearchForm size="lg" autoFocus className="mt-2" />
        <div className="flex flex-col items-center gap-3">
          <nav aria-label="Example profiles" className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Try:</span>
            {siteConfig.exampleUsers.map((username) => (
              <Link
                key={username}
                href={`/u/${username}`}
                className="rounded-full border bg-card px-3 py-1 font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {username}
              </Link>
            ))}
          </nav>
          <RecentSearches />
        </div>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          Features
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-5">
              <Icon aria-hidden className="size-5 text-primary" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
