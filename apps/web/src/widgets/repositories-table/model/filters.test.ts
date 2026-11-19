import { describe, expect, it } from 'vitest';
import {
  applyRepositoryFilters,
  DEFAULT_FILTERS,
  filterRepositories,
  languageOptions,
  parseRepositoryFilters,
} from './filters';
import { makeRepository } from '@/shared/test';

const ts = { name: 'TypeScript', color: '#3178c6' };
const go = { name: 'Go', color: '#00ADD8' };
const repositories = [
  makeRepository({ name: 'alpha', stars: 5, forks: 9, primaryLanguage: ts, pushedAt: '2024-01-01T00:00:00Z' }),
  makeRepository({ name: 'beta', stars: 50, forks: 1, primaryLanguage: go, description: 'Fast CLI', pushedAt: null }),
  makeRepository({
    name: 'Gamma',
    stars: 5,
    forks: 0,
    primaryLanguage: ts,
    topics: ['react'],
    pushedAt: '2025-06-01T00:00:00Z',
  }),
];
const names = (list: { name: string }[]) => list.map((repository) => repository.name);

describe('filterRepositories', () => {
  it('sorts by stars and breaks ties by name', () => {
    expect(names(filterRepositories(repositories, DEFAULT_FILTERS))).toEqual(['beta', 'alpha', 'Gamma']);
  });

  it.each([
    ['forks', ['alpha', 'beta', 'Gamma']],
    ['pushed', ['Gamma', 'alpha', 'beta']],
    ['name', ['alpha', 'beta', 'Gamma']],
  ] as const)('sorts by %s', (sort, expected) => {
    expect(names(filterRepositories(repositories, { ...DEFAULT_FILTERS, sort }))).toEqual(expected);
  });

  it('searches name, description and topics case-insensitively', () => {
    expect(names(filterRepositories(repositories, { ...DEFAULT_FILTERS, query: 'cli' }))).toEqual(['beta']);
    expect(names(filterRepositories(repositories, { ...DEFAULT_FILTERS, query: 'REACT' }))).toEqual(['Gamma']);
  });

  it('filters by primary language', () => {
    expect(names(filterRepositories(repositories, { ...DEFAULT_FILTERS, language: 'TypeScript' }))).toEqual([
      'alpha',
      'Gamma',
    ]);
  });
});

describe('URL state', () => {
  it('parses filters and falls back to defaults for unknown values', () => {
    expect(parseRepositoryFilters(new URLSearchParams('q=cli&lang=Go&sort=forks'))).toEqual({
      query: 'cli',
      language: 'Go',
      sort: 'forks',
    });
    expect(parseRepositoryFilters(new URLSearchParams('sort=popularity'))).toEqual(DEFAULT_FILTERS);
  });

  it('writes only non-default values and keeps unrelated parameters', () => {
    const next = applyRepositoryFilters(new URLSearchParams('year=2025&q=old'), {
      query: ' ',
      language: 'Go',
      sort: 'stars',
    });
    expect(next.toString()).toBe('year=2025&lang=Go');
  });
});

describe('languageOptions', () => {
  it('counts primary languages, most common first', () => {
    expect(languageOptions(repositories)).toEqual([
      { name: 'TypeScript', count: 2 },
      { name: 'Go', count: 1 },
    ]);
  });
});
