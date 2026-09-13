import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL: 'http://[::1]:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev -- --host ::1 --port 4321',
    env: {
      ASTRO_DEV_BACKGROUND: '0',
      SITE_URL: 'https://mailflow.example.test',
    },
    url: 'http://[::1]:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
