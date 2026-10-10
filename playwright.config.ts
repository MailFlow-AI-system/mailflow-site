import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/onboarding/**',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL: 'http://127.0.0.1:4328',
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
    command: 'bun run build && bun run astro -- preview --host 127.0.0.1 --port 4328 --ignore-lock',
    env: {
      ASTRO_PREVIEW_BACKGROUND: '0',
      SITE_URL: 'https://mailflow.example.test',
      PUBLIC_API_URL: 'http://localhost:8080',
      PUBLIC_WEB_URL: 'http://localhost:3000',
    },
    url: 'http://127.0.0.1:4328',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
