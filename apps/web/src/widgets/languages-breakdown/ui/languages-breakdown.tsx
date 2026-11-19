import type { LanguageStat } from '@gitscope/shared';
import { LanguageDot } from '@/entities/repository';
import { formatPercent } from '@/shared/lib';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

/**
 * Part-to-whole as one stacked bar (≤ 6 languages + "Other"): close shares are easier to compare by length than
 * by donut angles. Segments are separated by a 2px gap, and the legend carries the names and exact shares.
 */
interface LanguagesBreakdownProps {
  languages: LanguageStat[];
  repositoryCount: number;
  title?: string;
}

export function LanguagesBreakdown({ languages, repositoryCount, title = 'Languages' }: LanguagesBreakdownProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">By bytes of code across {repositoryCount} owned repositories</p>
      </div>
      {languages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No code detected in public repositories yet.</p>
      ) : (
        <>
          <div className="flex h-3 w-full gap-0.5" aria-hidden>
            {languages.map((language) => (
              <Tooltip key={language.name}>
                <TooltipTrigger
                  render={<span />}
                  className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${language.share * 100}%`, backgroundColor: language.color ?? 'var(--chart-axis)' }}
                />
                <TooltipContent>
                  <span className="font-semibold">{formatPercent(language.share)}</span> {language.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {languages.map((language) => (
              <li key={language.name} className="flex items-center gap-2">
                <LanguageDot color={language.color} />
                <span className="truncate">{language.name}</span>
                <span className="ml-auto text-muted-foreground tabular-nums">{formatPercent(language.share)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
