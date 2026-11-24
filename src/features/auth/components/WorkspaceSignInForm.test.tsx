import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import WorkspaceSignInForm from './WorkspaceSignInForm'

const workspaceBaseOrigin = 'https://mailflow.example.test'
afterEach(cleanup)

it('shows the workspace host next to the subdomain field', () => {
  render(<WorkspaceSignInForm workspaceBaseOrigin="http://localhost:3000" />)
  expect(screen.getByLabelText('Workspace subdomain')).toBeVisible()
  expect(screen.getByText('.localhost:3000')).toBeVisible()
})

it('navigates to the workspace login page for a valid subdomain', async () => {
  const onNavigate = vi.fn()
  render(<WorkspaceSignInForm workspaceBaseOrigin={workspaceBaseOrigin} onNavigate={onNavigate} />)
  fireEvent.change(screen.getByLabelText('Workspace subdomain'), {
    target: { value: ' Maya-Team ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() =>
    expect(onNavigate).toHaveBeenCalledWith('https://maya-team.mailflow.example.test/login'),
  )
})

it.each([
  ['', 'Enter your workspace subdomain.'],
  ['maya--team', 'Use letters, numbers and single hyphens.'],
  ['maya.team', 'Use letters, numbers and single hyphens.'],
])('shows an inline error for %j without navigating', async (value, message) => {
  const onNavigate = vi.fn()
  render(<WorkspaceSignInForm workspaceBaseOrigin={workspaceBaseOrigin} onNavigate={onNavigate} />)
  fireEvent.change(screen.getByLabelText('Workspace subdomain'), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(await screen.findByText(message)).toBeVisible()
  expect(screen.getByLabelText('Workspace subdomain')).toHaveAttribute('aria-invalid', 'true')
  expect(onNavigate).not.toHaveBeenCalled()
})
