import type { Contributions } from '@gitscope/shared';
import { CalendarCheckIcon, FlameIcon, GitCommitHorizontalIcon, TrophyIcon } from 'lucide-react';
import { formatDate, formatInteger, pluralize } from '@/shared/lib';
import { StatTile } from '@/shared/ui/stat-tile';

/** The current streak only makes sense for a period that ends today. */
export function ActivityStats({ data, isOngoing }: { data: Contributions; isOngoing: boolean }) {
  const { total, restricted, streaks, bestDay, activeDays, days } = data;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={GitCommitHorizontalIcon}
        label="Contributions"
        value={formatInteger(total)}
        hint={
          restricted > 0
            ? `Including ${formatInteger(restricted)} in private repositories`
            : `${formatDate(data.period.from)} – ${formatDate(data.period.to)}`
        }
      />
      {isOngoing ? (
        <StatTile
          icon={FlameIcon}
          label="Current streak"
          value={pluralize(streaks.current, 'day')}
          hint={streaks.current > 0 ? 'Keep it going' : 'No contributions yesterday or today'}
        />
      ) : (
        <StatTile
          icon={CalendarCheckIcon}
          label="Active days"
          value={formatInteger(activeDays)}
          hint={`Out of ${formatInteger(days.length)} days`}
        />
      )}
      <StatTile
        icon={TrophyIcon}
        label="Longest streak"
        value={pluralize(streaks.longest?.length ?? 0, 'day')}
        hint={
          streaks.longest
            ? `${formatDate(streaks.longest.from)} – ${formatDate(streaks.longest.to)}`
            : 'No contributions yet'
        }
      />
      <StatTile
        icon={CalendarCheckIcon}
        label="Best day"
        value={bestDay ? formatInteger(bestDay.count) : '—'}
        hint={bestDay ? formatDate(bestDay.date) : 'No contributions yet'}
      />
    </div>
  );
}
