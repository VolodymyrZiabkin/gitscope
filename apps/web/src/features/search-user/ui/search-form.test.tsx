import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchForm } from './search-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('SearchForm', () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it('opens the dashboard for a pasted profile URL and remembers the search', async () => {
    render(<SearchForm />);
    await userEvent.type(
      screen.getByRole('textbox', { name: /github username/i }),
      'https://github.com/gaearon{Enter}',
    );

    expect(push).toHaveBeenCalledWith('/u/gaearon');
    expect(JSON.parse(window.localStorage.getItem('gitscope:recent-searches') ?? '[]')).toEqual(['gaearon']);
  });

  it('explains an invalid username instead of navigating', async () => {
    render(<SearchForm />);
    const input = screen.getByRole('textbox', { name: /github username/i });
    await userEvent.type(input, 'not a user{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent(/letters, digits and single hyphens/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(push).not.toHaveBeenCalled();
  });

  it('focuses the search when "/" is pressed elsewhere on the page', async () => {
    render(<SearchForm />);
    await userEvent.keyboard('/');
    expect(screen.getByRole('textbox', { name: /github username/i })).toHaveFocus();
  });
});
