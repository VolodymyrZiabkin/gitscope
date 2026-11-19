import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { contributionsQuery } from '@/entities/contribution';
import { ContributionActivity } from './contribution-activity';
import { makeContributions, renderWithProviders, server } from '@/shared/test';

const NOW = '2026-11-19T12:00:00Z';
const rolling = makeContributions('2025-11-20', [1, 2, 3]);
const year2025 = makeContributions('2025-01-01', [10, 20, 30, 40], 2025);

function hydratedClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(contributionsQuery.key('octo', null), rolling);
  return queryClient;
}

describe('ContributionActivity', () => {
  beforeEach(() => window.history.replaceState(null, '', '/u/octo'));

  it('renders server-provided data without a request', () => {
    renderWithProviders(
      <ContributionActivity login="octo" years={[2026, 2025]} initialYear={null} now={NOW} />,
      hydratedClient(),
    );

    expect(screen.getByText('6 contributions in the last 12 months')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /contribution calendar/i })).toBeInTheDocument();
  });

  it('loads another year on the client and mirrors it in the URL', async () => {
    let requests = 0;
    server.use(
      http.get('*/api/users/octo/contributions', ({ request }) => {
        requests += 1;
        expect(new URL(request.url).searchParams.get('year')).toBe('2025');
        return HttpResponse.json(year2025);
      }),
    );
    renderWithProviders(
      <ContributionActivity login="octo" years={[2026, 2025]} initialYear={null} now={NOW} />,
      hydratedClient(),
    );

    await userEvent.click(screen.getByRole('combobox', { name: /contribution period/i }));
    await userEvent.click(await screen.findByRole('option', { name: '2025' }));

    expect(await screen.findByText('100 contributions in 2025')).toBeInTheDocument();
    expect(window.location.search).toBe('?year=2025');
    expect(requests).toBe(1);
    // A past year has no "current streak" — active days are shown instead.
    expect(screen.getByText('Active days')).toBeInTheDocument();
  });

  it('shows a retryable error when the calendar cannot be loaded', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/users/octo/contributions', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { type: 'about:blank', title: 'Bad Gateway', status: 502, code: 'UPSTREAM_ERROR' },
              { status: 502 },
            )
          : HttpResponse.json(rolling);
      }),
    );
    renderWithProviders(<ContributionActivity login="octo" years={[2026]} initialYear={null} now={NOW} />);

    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('6 contributions in the last 12 months')).toBeInTheDocument());
  });
});
