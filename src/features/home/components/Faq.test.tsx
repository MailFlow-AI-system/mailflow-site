import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Faq from './Faq'

describe('Faq', () => {
  it('presents the FAQ copy and reveals the provider answer', () => {
    render(<Faq />)

    expect(screen.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
    expect(screen.getByText('Still have questions? Our team is ready to help.')).toBeVisible()
    expect(document.querySelector('[data-slot="accordion-item"]')).toHaveClass('cursor-pointer')

    const faqCopy = [
      {
        question: 'Do I need to switch my current email provider?',
        answer:
          'No. You connect your existing Gmail, Outlook, or SMTP accounts and manage everything inside MailFlow AI.',
      },
      {
        question: 'Does AI cost extra?',
        answer:
          'The AI assistant is included in the Pro and Enterprise plans. On Starter, you get a generous monthly usage allowance.',
      },
      {
        question: 'Can I import my contact lists?',
        answer:
          'Yes. Import via CSV, API, or direct integrations. MailFlow AI automatically detects fields and duplicates.',
      },
      {
        question: 'Is there a long-term contract?',
        answer: 'No. You can cancel or change plans at any time, with no cancellation fees.',
      },
    ]

    const expectControlledPanels = () => {
      for (const { question } of faqCopy) {
        const trigger = screen.getByRole('button', { name: question })
        const panelId = trigger.getAttribute('aria-controls')

        expect(panelId).toBeTruthy()
        expect(panelId ? document.getElementById(panelId) : null).toBeInTheDocument()
      }
    }

    expectControlledPanels()

    for (const { answer, question } of faqCopy) {
      fireEvent.click(screen.getByRole('button', { name: question }))
      expect(screen.getByText(answer)).toBeVisible()
    }

    expectControlledPanels()
  })
})
