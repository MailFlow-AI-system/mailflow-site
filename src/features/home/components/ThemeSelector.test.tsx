import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import ThemeSelector from './ThemeSelector'

describe('ThemeSelector', () => {
  afterEach(() => {
    cleanup()
  })

  it('offers light, dark, and system preferences and applies a selection', () => {
    localStorage.clear()
    render(<ThemeSelector />)

    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    expect(document.querySelector('[data-slot="dropdown-menu-positioner"]')).toHaveAttribute(
      'data-side',
      'bottom',
    )
    expect(screen.getByRole('menuitemradio', { name: /light/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /dark/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /system/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitemradio', { name: /light/i }))

    expect(localStorage.getItem('mailflow-theme')).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(screen.queryByRole('menuitemradio', { name: /light/i })).not.toBeInTheDocument()
  })

  it('positions the menu using the requested side', () => {
    render(<ThemeSelector side="top" />)

    fireEvent.click(screen.getByRole('button', { name: /theme/i }))

    expect(document.querySelector('[data-slot="dropdown-menu-positioner"]')).toHaveAttribute(
      'data-side',
      'top',
    )
  })

  it.each([
    { expectedResolvedTheme: 'dark', value: 'system' },
    { expectedResolvedTheme: 'light', value: 'light' },
    { expectedResolvedTheme: 'dark', value: 'dark' },
  ])('closes after selecting the $value theme', ({ expectedResolvedTheme, value }) => {
    localStorage.clear()
    render(<ThemeSelector />)

    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: new RegExp(value, 'i') }))

    expect(localStorage.getItem('mailflow-theme')).toBe(value)
    expect(document.documentElement).toHaveAttribute('data-theme', expectedResolvedTheme)
    expect(
      screen.queryByRole('menuitemradio', { name: new RegExp(value, 'i') }),
    ).not.toBeInTheDocument()
  })
})
