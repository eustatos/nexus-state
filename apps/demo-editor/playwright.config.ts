import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Editor Demo E2E tests
 */
export default defineConfig({
  testDir: './e2e/tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  /* Shared settings */
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  /* Configure projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  /* Web server configuration */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
