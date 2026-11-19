import { expect, test } from '@playwright/test';

test('searching a user opens a shareable dashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'GitHub username' }).fill('https://github.com/gaearon');
  await page.getByRole('button', { name: 'Analyze' }).click();

  await expect(page).toHaveURL('/u/gaearon');
  await expect(page.getByRole('heading', { level: 1, name: 'dan' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Key numbers' })).toContainText('Stars earned');
  await expect(page.getByRole('group', { name: /contribution calendar/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Repositories' })).toBeVisible();
  await expect(page).toHaveTitle(/dan \(@gaearon\) · GitScope/);
});

test('switching the year updates the activity and the URL without a full reload', async ({ page }) => {
  await page.goto('/u/gaearon');
  const activity = page.getByRole('region', { name: 'Contribution activity' });
  await expect(activity).toContainText('in the last 12 months');

  await page.getByRole('combobox', { name: 'Contribution period' }).click();
  await page.getByRole('option', { name: '2025' }).click();

  await expect(activity).toContainText('in 2025');
  await expect(page).toHaveURL('/u/gaearon?year=2025');

  // The year in a shared link is restored on the server.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Contribution activity' })).toContainText('in 2025');
});

test('the heatmap is keyboard accessible', async ({ page }) => {
  await page.goto('/u/torvalds');
  const calendar = page.getByRole('group', { name: /contribution calendar/i });
  await calendar.focus();
  await page.keyboard.press('ArrowLeft');

  await expect(page.getByText(/contributions? on \w+day, /)).toBeAttached();
});

test('repository filters are reflected in the URL', async ({ page }) => {
  await page.goto('/u/sindresorhus');
  await page.getByRole('searchbox', { name: 'Find a repository' }).fill('awesome');

  await expect(page).toHaveURL(/\?q=awesome/);
  await expect(page.getByRole('link', { name: 'awesome', exact: true })).toBeVisible();
});

test('an unknown user gets a helpful not-found page', async ({ page }) => {
  await page.goto('/u/this-user-is-not-recorded');
  await expect(page.getByRole('heading', { name: 'No GitHub user here' })).toBeVisible();
  // Streaming already started (loading skeleton), so Next.js marks the page as not indexable.
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test('two users can be compared', async ({ page }) => {
  await page.goto('/u/gaearon');
  await page.getByRole('link', { name: 'Compare' }).click();
  await page.getByRole('textbox', { name: 'Second GitHub username' }).fill('torvalds');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();

  await expect(page).toHaveURL('/compare?users=gaearon,torvalds');
  await expect(page.getByRole('table', { name: 'Profile' })).toContainText('Stars earned');
  await expect(page.getByRole('table', { name: 'Activity in the last 12 months' })).toBeVisible();
});

test('profile links come with an Open Graph image', async ({ page, request }) => {
  await page.goto('/u/gaearon');
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(image).toBeTruthy();

  const response = await request.get(new URL(image ?? '').pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');
});

test('the API proxy only exposes known routes', async ({ request }) => {
  expect((await request.get('/api/health')).status()).toBe(200);
  const response = await request.get('/api/docs/json');
  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
});
