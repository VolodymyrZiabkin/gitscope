import type { UserReport } from '@gitscope/shared';
import { BookMarkedIcon, GitForkIcon, StarIcon, UsersIcon } from 'lucide-react';
import { formatCompact, formatInteger, pluralize } from '@/shared/lib';
import { StatTile } from '@/shared/ui/stat-tile';

export function StatsOverview({ report }: { report: UserReport }) {
  const { stats, profile, repositoriesTruncated } = report;
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={StarIcon}
        label="Stars earned"
        value={formatCompact(stats.totalStars)}
        hint={repositoriesTruncated ? 'Across the top 300 repositories' : 'Across owned repositories'}
      />
      <StatTile
        icon={UsersIcon}
        label="Followers"
        value={formatCompact(profile.followers)}
        hint={`Following ${formatInteger(profile.following)}`}
      />
      <StatTile
        icon={BookMarkedIcon}
        label="Repositories"
        value={formatCompact(stats.repositories)}
        hint={
          stats.forkedRepositories > 0 ? `Plus ${pluralize(stats.forkedRepositories, 'fork')}` : 'Public, not forks'
        }
      />
      <StatTile
        icon={GitForkIcon}
        label="Forks received"
        value={formatCompact(stats.totalForks)}
        hint="Other people building on this work"
      />
    </section>
  );
}
