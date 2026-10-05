import { defineConfig, devices } from '@playwright/test'

const coreDirectory = process.env.MAILFLOW_ONBOARDING_CORE_DIR
const webDirectory = process.env.MAILFLOW_ONBOARDING_WEB_DIR
const database = process.env.MAILFLOW_WORKSPACE_TEST_DATABASE_URL
if (!coreDirectory || !webDirectory || !database)
  throw new Error(
    'Real onboarding browser checks require Core/Web checkouts and the isolated test database',
  )

export default defineConfig({
  timeout: 60000,
  testDir: './e2e/onboarding',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL: 'http://localhost:4329',
    reducedMotion: 'reduce',
    trace: 'off',
    launchOptions: {
      args: ['--host-resolver-rules=MAP *.workspace.test 127.0.0.1, MAP workspace.test 127.0.0.1'],
    },
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'bun run test:onboarding:server',
      cwd: coreDirectory,
      env: { MAILFLOW_WORKSPACE_TEST_DATABASE_URL: database },
      url: 'http://127.0.0.1:8082/__fixture',
      reuseExistingServer: false,
    },
    {
      command: 'bun run astro -- dev --host localhost --port 4329',
      env: {
        ASTRO_DEV_BACKGROUND: '0',
        SITE_URL: 'http://localhost:4329',
        PUBLIC_API_URL: 'http://127.0.0.1:8082',
        PUBLIC_WEB_URL: 'http://workspace.test:3001',
        PUBLIC_WORKSPACE_ONBOARDING_ENABLED: 'true',
      },
      url: 'http://localhost:4329',
      reuseExistingServer: false,
    },
    {
      command: 'bun run vite dev --host 127.0.0.1 --port 3001',
      cwd: webDirectory,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:8082',
        VITE_WORKSPACE_BASE_HOST: 'workspace.test',
      },
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: false,
    },
  ],
})
