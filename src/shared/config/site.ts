import { SITE_URL } from 'astro:env/server'

export const siteConfig = {
  title: 'MailFlow',
  description: 'Technical foundation for the MailFlow site.',
  url: new URL(SITE_URL),
}
