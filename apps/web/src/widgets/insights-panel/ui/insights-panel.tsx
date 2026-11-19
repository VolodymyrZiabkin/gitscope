import type { Profile, UserInsights } from '@gitscope/shared';
import { ArchiveIcon, CakeIcon, ClockIcon, CodeXmlIcon, StarIcon, TrendingUpIcon, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatCompact, formatDate, formatRelative, pluralize } from '@/shared/lib';

function Insight({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon aria-hidden className="size-4 text-primary" />
      </span>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{children}</div>
      </div>
    </li>
  );
}

export function InsightsPanel({ insights, profile, now }: { insights: UserInsights; profile: Profile; now: Date }) {
  return (
    <section aria-labelledby="insights-title" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 id="insights-title" className="font-semibold tracking-tight">
        Insights
      </h2>
      <ul className="flex flex-col gap-4">
        <Insight icon={StarIcon} label="Most starred repository">
          {insights.mostStarredRepository ? (
            <a
              href={`${profile.htmlUrl}/${insights.mostStarredRepository.name}`}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {insights.mostStarredRepository.name}{' '}
              <span className="text-muted-foreground">
                · {formatCompact(insights.mostStarredRepository.stars)} stars
              </span>
            </a>
          ) : (
            'No stars yet'
          )}
        </Insight>
        <Insight icon={CodeXmlIcon} label="Top language">
          {insights.topLanguage ?? 'Not enough code to tell'}
        </Insight>
        <Insight icon={TrendingUpIcon} label="Average stars per repository">
          {insights.averageStarsPerRepository.toLocaleString('en')}
        </Insight>
        <Insight icon={ClockIcon} label="Last push">
          {insights.lastPushedAt ? formatRelative(insights.lastPushedAt, now) : 'Never'}
        </Insight>
        <Insight icon={CakeIcon} label="On GitHub for">
          {insights.accountAgeYears > 0 ? pluralize(insights.accountAgeYears, 'year') : 'Less than a year'}{' '}
          <span className="text-muted-foreground">· since {formatDate(profile.createdAt)}</span>
        </Insight>
        {insights.archivedRepositories > 0 ? (
          <Insight icon={ArchiveIcon} label="Archived">
            {pluralize(insights.archivedRepositories, 'repository', 'repositories')}
          </Insight>
        ) : null}
      </ul>
    </section>
  );
}
