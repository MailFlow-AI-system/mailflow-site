import { getViteConfig } from 'astro/config'
import { defineConfig } from 'vitest/config'

export default defineConfig(
  getViteConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
)
