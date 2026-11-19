import { defineConfig, devices } from '@playwright/test';

const API_PORT = 4200;
const WEB_PORT = 3200;

/**
 * End-to-end tests against the production build of the web app and the API in fixture mode
 * (recorded GitHub data) — no token and no network access to GitHub needed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    // Locally `PLAYWRIGHT_CHANNEL=chrome` reuses the installed Chrome instead of downloading Chromium.
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'pnpm --filter @gitscope/api exec tsx src/server.ts',
      url: `http://localhost:${API_PORT}/health`,
      env: { PORT: String(API_PORT), GITHUB_TOKEN: '', LOG_LEVEL: 'warn', NODE_ENV: 'test' },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @gitscope/web build && pnpm --filter @gitscope/web start --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}` },
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
