import { expect, test } from '@playwright/test';

test('the dashboard fits a phone screen', async ({ page }) => {
  await page.goto('/u/torvalds');
  await expect(page.getByRole('heading', { level: 1, name: 'Linus Torvalds' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
