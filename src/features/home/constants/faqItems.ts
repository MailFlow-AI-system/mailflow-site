import type { FaqItem } from '../types/FaqItem'

export const faqItems: FaqItem[] = [
  {
    question: 'What can I explore in MailFlow today?',
    answer:
      'MailFlow includes an inbox with message search, a message reader, and a composer for preparing drafts. Email sending, scheduling, and AI actions are not available yet.',
  },
  {
    question: 'Is the interactive preview connected to my email?',
    answer:
      'No. The preview uses sample messages. Searches and draft text stay in the page; nothing is sent, saved to your account, or connected to your email provider.',
  },
  {
    question: 'How do I create an account?',
    answer:
      'Choose Create your account, enter your name, email, and password, then verify your email with the code we send you. After verification, you can sign in to your workspace.',
  },
  {
    question: 'Where are my drafts kept?',
    answer:
      'Drafts in the composer are kept in your current browser tab. They are not sent or saved to a mail server. The illustrative preview on this page resets when you reload it.',
  },
]
