import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SignupForm from './SignupForm'

const props = {
  apiUrl: 'https://api.mailflow.example.test',
  webAppUrl: 'https://web.mailflow.example.test',
}

function fillSignupForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Maya Example' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maya@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'safe-test-password-123' },
  })
}

describe('SignupForm', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reveals and hides the password when the visibility control is clicked', () => {
    render(<SignupForm {...props} />)
    const password = screen.getByLabelText('Password')

    expect(password).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('shows accessible field errors without sending invalid details', async () => {
    render(<SignupForm {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter your name.')).toBeVisible()
    expect(screen.getByText('Enter a valid email address.')).toBeVisible()
    expect(screen.getByText('Use at least 8 characters for your password.')).toBeVisible()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts validated credentials with cookies and redirects to the Web app on success', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith(`${props.webAppUrl}/app`))
    expect(fetchMock).toHaveBeenCalledWith(
      `${props.apiUrl}/api/auth/sign-up/email`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Maya Example',
          email: 'maya@example.com',
          password: 'safe-test-password-123',
        }),
      }),
    )
  })

  it('shows a friendly server error without exposing the response body', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', message: 'Internal detail' },
        {
          status: 422,
        },
      ),
    )
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      "We couldn't create your account. Check your details and try again.",
    )
    expect(alert).not.toHaveTextContent('Internal detail')
  })

  it('shows a friendly message when the API cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't reach MailFlow. Check your connection and try again.",
    )
  })
})
