import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { faqItems } from '../constants/faqItems'
import Faq from './Faq'

describe('Faq', () => {
  it('presents the FAQ copy and reveals the provider answer', () => {
    render(<Faq />)

    expect(screen.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
    expect(screen.getByText('Still have questions? Our team is ready to help.')).toBeVisible()

    const expectControlledPanels = () => {
      for (const { question } of faqItems) {
        const trigger = screen.getByRole('button', { name: question })
        const panelId = trigger.getAttribute('aria-controls')

        expect(panelId).toBeTruthy()
        expect(panelId ? document.getElementById(panelId) : null).toBeInTheDocument()
      }
    }

    expectControlledPanels()

    for (const { answer, question } of faqItems) {
      fireEvent.click(screen.getByRole('button', { name: question }))
      if (typeof answer !== 'string') {
        throw new Error(`FAQ item "${question}" is missing an answer`)
      }
      expect(screen.getByText(answer)).toBeVisible()
    }

    expectControlledPanels()
  })
})
