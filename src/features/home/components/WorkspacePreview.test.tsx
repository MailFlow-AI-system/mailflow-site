import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WorkspacePreview from './WorkspacePreview'

describe('WorkspacePreview', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders an illustrative inbox with three sample messages in the initial view', () => {
    render(<WorkspacePreview />)

    expect(
      screen.getByRole('region', { name: 'Interactive preview · Sample messages' }),
    ).toHaveAttribute('id', 'workspace-preview')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Illustrative preview. Nothing is sent or saved.',
    )
    expect(screen.getByRole('button', { name: /Avery Chen.*Q4 launch outline/i })).toBeVisible()
    expect(
      screen.getByRole('button', { name: /Mina Patel.*Research interview notes/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /Jordan Lee.*Invoice for October/i })).toBeVisible()
  })

  it('filters sample messages by sender, subject, and body, then shows an empty state', () => {
    render(<WorkspacePreview />)
    const search = screen.getByRole('searchbox', { name: 'Search sample messages' })

    fireEvent.change(search, { target: { value: 'avery chen' } })
    expect(screen.getByRole('button', { name: /Avery Chen.*Q4 launch outline/i })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /Mina Patel.*Research interview notes/i }),
    ).toBeNull()

    fireEvent.change(search, { target: { value: 'research interview' } })
    expect(
      screen.getByRole('button', { name: /Mina Patel.*Research interview notes/i }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: /Avery Chen.*Q4 launch outline/i })).toBeNull()

    fireEvent.change(search, { target: { value: 'onboarding themes' } })
    expect(
      screen.getByRole('button', { name: /Mina Patel.*Research interview notes/i }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: /Jordan Lee.*Invoice for October/i })).toBeNull()

    fireEvent.change(search, { target: { value: 'no matching message' } })
    expect(screen.getByText('No sample messages match your search.')).toBeVisible()
  })

  it('opens a selected message and restores focus to its inbox control when closed', () => {
    render(<WorkspacePreview />)
    const message = screen.getByRole('button', { name: /Avery Chen.*Q4 launch outline/i })

    fireEvent.click(message)

    expect(screen.getByRole('heading', { name: 'Q4 launch outline' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Back to inbox' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Back to inbox' }))

    expect(message).toHaveFocus()
  })

  it('keeps reply drafting local and restores focus when the draft closes', () => {
    const fetchSpy = vi.fn()
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('fetch', fetchSpy)
    render(<WorkspacePreview />)
    fireEvent.click(screen.getByRole('button', { name: /Avery Chen.*Q4 launch outline/i }))

    const replyButton = screen.getByRole('button', { name: 'Draft a reply' })
    fireEvent.click(replyButton)

    const reply = screen.getByRole('textbox', { name: 'Reply to Avery Chen' })
    expect(reply).toHaveFocus()
    fireEvent.change(reply, { target: { value: 'Thanks, I will review the outline.' } })
    expect(reply).toHaveValue('Thanks, I will review the outline.')
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(setItemSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close draft' }))

    expect(screen.getByRole('button', { name: 'Draft a reply' })).toHaveFocus()
    expect(screen.queryByRole('textbox', { name: 'Reply to Avery Chen' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Illustrative preview. Nothing is sent or saved.',
    )
  })
})
