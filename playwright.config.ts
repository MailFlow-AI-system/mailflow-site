import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL: 'http://[::1]:4328',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'bun run astro -- dev --host ::1 --port 4328',
    env: {
      ASTRO_DEV_BACKGROUND: '0',
      SITE_URL: 'https://mailflow.example.test',
    },
    url: 'http://[::1]:4328',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
