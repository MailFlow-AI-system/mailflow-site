import { SITE_URL } from 'astro:env/server'

export const siteConfig = {
  name: 'MailFlow AI',
  title: 'MailFlow AI | A focused email workspace',
  description:
    'Explore a calmer email workspace with MailFlow. Search conversations, read messages, and try the interactive preview before creating your account.',
  url: new URL(SITE_URL),
  socialImage: {
    path: '/social/mailflow-og.png',
    width: 1200,
    height: 630,
    alt: 'MailFlow AI star logo with the words Less noise. More flow. on a dark background.',
  },
}
