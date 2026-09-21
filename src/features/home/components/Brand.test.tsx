import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import Brand from './Brand'

describe('Brand', () => {
  afterEach(cleanup)

  it('renders the brand mark with the reference indigo gradient', () => {
    render(<Brand />)

    const brand = screen.getByRole('link', { name: 'MailFlow AI' })
    expect(brand).toHaveAttribute('href', '/')

    const mark = brand.querySelector('span')
    expect(mark).toHaveClass('bg-gradient-to-br', 'from-primary', 'to-indigo-600')
    expect(mark?.querySelector('svg')).toHaveAttribute('stroke-width', '2.5')
    expect(mark?.querySelector('svg')).toHaveClass('text-primary-foreground')
  })
})
