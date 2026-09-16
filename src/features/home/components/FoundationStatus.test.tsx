import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FoundationStatus from './FoundationStatus'

describe('FoundationStatus', () => {
  it('shows the site foundation status to visitors', () => {
    render(<FoundationStatus />)

    expect(screen.getByRole('heading', { name: 'MailFlow site foundation' })).toBeVisible()
    expect(
      screen.getByText('The technical foundation is ready for future MailFlow content.'),
    ).toBeVisible()
  })
})
