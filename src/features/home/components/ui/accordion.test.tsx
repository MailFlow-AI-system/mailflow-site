import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

describe('Accordion', () => {
  it('reveals content when its trigger is pressed', () => {
    render(
      <Accordion>
        <AccordionItem value="faq">
          <AccordionTrigger>What is MailFlow?</AccordionTrigger>
          <AccordionContent>Collaborative email management.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )

    expect(screen.queryByText('Collaborative email management.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'What is MailFlow?' }))

    expect(screen.getByText('Collaborative email management.')).toBeVisible()
  })
})
