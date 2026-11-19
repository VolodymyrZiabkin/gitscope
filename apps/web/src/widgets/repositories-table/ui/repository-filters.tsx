'use client';

import { SearchIcon } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { SORT_OPTIONS, type RepositoryFilters } from '../model/filters';

const ALL_LANGUAGES = '__all__';

interface RepositoryFiltersBarProps {
  filters: RepositoryFilters;
  languages: { name: string; count: number }[];
  onChange: (patch: Partial<RepositoryFilters>) => void;
}

export function RepositoryFiltersBar({ filters, languages, onChange }: RepositoryFiltersBarProps) {
  const languageItems = [
    { value: ALL_LANGUAGES, label: 'All languages' },
    ...languages.map(({ name, count }) => ({ value: name, label: `${name} (${count})` })),
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder="Find a repository…"
          aria-label="Find a repository"
          className="h-8 pl-8"
        />
      </div>
      <div className="flex gap-2">
        <Select
          items={languageItems}
          value={filters.language ?? ALL_LANGUAGES}
          onValueChange={(value) => onChange({ language: !value || value === ALL_LANGUAGES ? null : value })}
        >
          <SelectTrigger aria-label="Language" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={SORT_OPTIONS}
          value={filters.sort}
          onValueChange={(value) => {
            if (value) onChange({ sort: value });
          }}
        >
          <SelectTrigger aria-label="Sort by" className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
