// @ts-check

import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  env: {
    schema: {
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        url: true,
        default: 'http://localhost:4321',
      }),
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
