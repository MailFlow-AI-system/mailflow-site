import { SITE_URL } from 'astro:env/server'

export const siteConfig = {
  title: 'MailFlow AI | Email, marketing, and AI in one seamless experience',
  description:
    'Bring email, marketing, and AI together in one fast, beautiful platform built for teams that move.',
  url: new URL(SITE_URL),
}
