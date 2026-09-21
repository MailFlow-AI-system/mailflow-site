import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { navigationLinks } from '../constants/navigationLinks'
import NavigationLinks from './NavigationLinks'

describe('NavigationLinks', () => {
  afterEach(cleanup)

  it('renders the primary navigation links', () => {
    render(<NavigationLinks />)

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()

    for (const { href, label } of navigationLinks) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  it('calls onNavigate when a link is clicked', () => {
    const onNavigate = vi.fn()

    render(<NavigationLinks onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('link', { name: navigationLinks[0].label }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
