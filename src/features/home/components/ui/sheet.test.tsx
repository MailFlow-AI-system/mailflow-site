import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet'

describe('Sheet', () => {
  it('opens content from its trigger and closes with Escape', () => {
    render(
      <Sheet>
        <SheetTrigger>Open navigation</SheetTrigger>
        <SheetContent>
          <SheetTitle>Navigation</SheetTitle>
          <p>Primary links</p>
        </SheetContent>
      </Sheet>,
    )

    expect(screen.queryByRole('heading', { name: 'Navigation' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeVisible()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('heading', { name: 'Navigation' })).not.toBeInTheDocument()
  })
})
