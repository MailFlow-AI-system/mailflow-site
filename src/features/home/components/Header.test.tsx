import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import Header from './Header'

describe('Header', () => {
  afterEach(cleanup)

  it('renders the brand mark with the reference indigo gradient', () => {
    render(<Header />)

    const mark = screen.getByRole('link', { name: 'MailFlow AI' }).querySelector('span')
    expect(mark).toHaveClass('bg-gradient-to-br', 'from-primary', 'to-indigo-600')
    expect(mark?.querySelector('svg')).toHaveAttribute('stroke-width', '2.5')
    expect(mark?.querySelector('svg')).toHaveClass('text-primary-foreground')
  })

  it('links Sign In to the workspace sign-in page and Sign Up to the signup page', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/sign-in')
    const signUpLinks = screen.getAllByRole('link', { name: 'Sign Up' })
    expect(signUpLinks.length).toBeGreaterThan(0)
    signUpLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/signup')
    })
  })

  it('offers Sign In in the mobile navigation', () => {
    render(<Header />)

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation' })
    expect(within(dialog).getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/sign-in',
    )
  })

  it('opens the mobile navigation and closes it with Escape', () => {
    render(<Header />)

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    expect(screen.getByRole('dialog', { name: 'Mobile navigation' })).toBeVisible()
    expect(
      within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole('link', {
        name: 'Features',
      }),
    ).toBeVisible()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument()
  })

  it('closes the mobile navigation after selecting an internal link', () => {
    render(<Header />)

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation' })
    const featuresLink = within(dialog).getByRole('link', { name: 'Features' })

    expect(featuresLink).toHaveAttribute('href', '#features')
    fireEvent.click(featuresLink)

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument()
  })
})
