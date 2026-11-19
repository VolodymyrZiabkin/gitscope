'use client';

import type { Repository } from '@gitscope/shared';
import { ArchiveIcon, GitForkIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import { LanguageDot } from '@/entities/repository';
import { DEFAULT_FILTERS, filterRepositories, languageOptions } from '../model/filters';
import { useRepositoryFilters } from '../model/use-repository-filters';
import { formatCompact, formatRelative, pluralize } from '@/shared/lib';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { RepositoryFiltersBar } from './repository-filters';

const PAGE_SIZE = 20;

interface RepositoriesTableProps {
  repositories: Repository[];
  totalCount: number;
  truncated: boolean;
  /** Server time — relative dates render identically on the server and during hydration. */
  now: string;
}

export function RepositoriesTable({ repositories, totalCount, truncated, now }: RepositoriesTableProps) {
  const { filters, update } = useRepositoryFilters();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const languages = languageOptions(repositories);
  const filtered = filterRepositories(repositories, filters);
  const shown = filtered.slice(0, visible);

  function changeFilters(patch: Parameters<typeof update>[0]) {
    update(patch);
    setVisible(PAGE_SIZE);
  }

  return (
    <section aria-labelledby="repositories-title" className="flex flex-col gap-4">
      <SectionHeading
        id="repositories-title"
        title="Repositories"
        description={
          truncated
            ? `The ${repositories.length} most starred of ${formatCompact(totalCount)} owned repositories`
            : pluralize(totalCount, 'owned repository', 'owned repositories')
        }
      />
      {repositories.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No public repositories of their own yet.
        </p>
      ) : (
        <>
          <RepositoryFiltersBar filters={filters} languages={languages} onChange={changeFilters} />
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full pl-4">Repository</TableHead>
                  <TableHead className="hidden min-w-36 md:table-cell">Language</TableHead>
                  <TableHead className="min-w-20 text-right">Stars</TableHead>
                  <TableHead className="hidden min-w-20 text-right sm:table-cell">Forks</TableHead>
                  <TableHead className="hidden min-w-32 pr-4 text-right lg:table-cell">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((repository) => (
                  <TableRow key={repository.name}>
                    <TableCell className="max-w-0 min-w-48 pl-4 whitespace-normal">
                      <div className="flex items-center gap-2">
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {repository.name}
                        </a>
                        {repository.isArchived ? (
                          <Badge variant="outline" className="gap-1">
                            <ArchiveIcon aria-hidden className="size-3" />
                            Archived
                          </Badge>
                        ) : null}
                      </div>
                      {repository.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{repository.description}</p>
                      ) : null}
                      {repository.topics.length > 0 ? (
                        <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
                          {repository.topics.slice(0, 4).map((topic) => (
                            <Badge key={topic} variant="secondary" className="font-normal">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {repository.primaryLanguage ? (
                        <span className="flex items-center gap-1.5">
                          <LanguageDot color={repository.primaryLanguage.color} />
                          {repository.primaryLanguage.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <StarIcon aria-hidden className="size-3.5 text-muted-foreground" />
                        {formatCompact(repository.stars)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <GitForkIcon aria-hidden className="size-3.5 text-muted-foreground" />
                        {formatCompact(repository.forks)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden pr-4 text-right text-muted-foreground lg:table-cell">
                      {repository.pushedAt ? formatRelative(repository.pushedAt, new Date(now)) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
                No repositories match these filters.
                <Button variant="outline" size="sm" onClick={() => changeFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
          {filtered.length > visible ? (
            <Button variant="outline" className="self-center" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              Show more ({filtered.length - visible} left)
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
