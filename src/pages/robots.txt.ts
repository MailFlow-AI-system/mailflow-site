import type { APIRoute } from 'astro'
import { siteConfig } from '@/shared/config/site'

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', siteConfig.url).href}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  )
