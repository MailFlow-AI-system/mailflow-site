import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SignupForm from './SignupForm'

const apiUrl = 'https://api.mailflow.example.test'
const webAppUrl = 'https://web.mailflow.example.test'
const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  window.sessionStorage.clear()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('requires workspace fields and sends the product contract with an idempotency key', async () => {
  const redirect = vi.fn()
  fetchMock
    .mockResolvedValueOnce(Response.json({ status: 'verification-pending' }, { status: 202 }))
    .mockResolvedValueOnce(
      Response.json({
        status: true,
        token: null,
        user: { emailVerified: true },
        loginUrl: 'https://maya-team.web.mailflow.example.test/login',
      }),
    )
  render(
    <SignupForm apiUrl={apiUrl} webAppUrl={webAppUrl} onboardingEnabled onRedirect={redirect} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByText('Enter your workspace name.')).toBeVisible()
  expect(screen.getByText('Choose a workspace subdomain.')).toBeVisible()
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Maya' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maya@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'synthetic-password' } })
  fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: ' Maya Team ' } })
  fireEvent.change(screen.getByLabelText('Workspace subdomain'), {
    target: { value: ' Maya-Team ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible()
  expect(fetchMock).toHaveBeenCalledWith(
    `${apiUrl}/api/v1/onboarding/signup`,
    expect.objectContaining({
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': expect.any(String) },
      body: JSON.stringify({
        name: 'Maya',
        email: 'maya@example.com',
        password: 'synthetic-password',
        workspaceName: 'Maya Team',
        workspaceSlug: 'maya-team',
      }),
    }),
  )
  expect(window.sessionStorage.getItem('mailflow.signup.pendingEmail')).toBe('maya@example.com')
  expect(JSON.stringify(window.sessionStorage)).not.toContain('synthetic-password')
  expect(redirect).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))
  await waitFor(() =>
    expect(redirect).toHaveBeenCalledWith('https://maya-team.web.mailflow.example.test/login'),
  )
})
