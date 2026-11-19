import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepositoriesTable } from './repositories-table';
import { makeRepository, renderWithProviders } from '@/shared/test';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

const NOW = '2026-11-19T12:00:00Z';
const repositories = Array.from({ length: 25 }, (_, index) =>
  makeRepository({ name: `repo-${index + 1}`, stars: 100 - index, description: index === 7 ? 'A tiny CLI' : null }),
);

function rows() {
  return screen.getAllByRole('row').slice(1); // without the header row
}

describe('RepositoriesTable', () => {
  beforeEach(() => window.history.replaceState(null, '', '/u/octo'));

  it('shows the first page sorted by stars and loads more on demand', async () => {
    renderWithProviders(<RepositoriesTable repositories={repositories} totalCount={25} truncated={false} now={NOW} />);

    expect(rows()).toHaveLength(20);
    expect(within(rows()[0]!).getByRole('link', { name: 'repo-1' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /show more \(5 left\)/i }));
    expect(rows()).toHaveLength(25);
  });

  it('filters by search text and mirrors the filter in the URL', async () => {
    renderWithProviders(<RepositoriesTable repositories={repositories} totalCount={25} truncated={false} now={NOW} />);

    await userEvent.type(screen.getByRole('searchbox', { name: /find a repository/i }), 'cli');

    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'repo-8' })).toBeInTheDocument();
    expect(window.location.search).toBe('?q=cli');
  });

  it('restores filters from a shared link', () => {
    window.history.replaceState(null, '', '/u/octo?q=repo-2&sort=name');
    renderWithProviders(<RepositoriesTable repositories={repositories} totalCount={25} truncated={false} now={NOW} />);

    expect(screen.getByRole('searchbox')).toHaveValue('repo-2');
    expect(rows().map((row) => within(row).getByRole('link').textContent)).toEqual([
      'repo-2',
      'repo-20',
      'repo-21',
      'repo-22',
      'repo-23',
      'repo-24',
      'repo-25',
    ]);
  });

  it('offers to clear filters when nothing matches', async () => {
    renderWithProviders(<RepositoriesTable repositories={repositories} totalCount={25} truncated={false} now={NOW} />);
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByText(/no repositories match/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(rows()).toHaveLength(20);
    expect(window.location.search).toBe('');
  });

  it('explains the empty state', () => {
    renderWithProviders(<RepositoriesTable repositories={[]} totalCount={0} truncated={false} now={NOW} />);
    expect(screen.getByText(/no public repositories of their own yet/i)).toBeInTheDocument();
  });
});
