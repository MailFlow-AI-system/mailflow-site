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
    window.sessionStorage.clear()
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

  it('posts validated signup without cookies and asks for email verification before redirecting', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible()
    expect(screen.getByLabelText('6-digit code')).toBeVisible()
    expect(onRedirect).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem('mailflow.signup.pendingEmail')).toBe('maya@example.com')
    expect(fetchMock).toHaveBeenCalledWith(
      `${props.apiUrl}/api/auth/sign-up/email`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Maya Example',
          email: 'maya@example.com',
          password: 'safe-test-password-123',
        }),
      }),
    )
  })

  it('verifies the email without cookies and redirects to Web login only after confirmation', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({ status: true, token: null, user: { emailVerified: true } }),
      )
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    const code = await screen.findByLabelText('6-digit code')
    fireEvent.change(code, { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith(`${props.webAppUrl}/login`))
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${props.apiUrl}/api/auth/email-otp/verify-email`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maya@example.com', otp: '123456' }),
      }),
    )
    expect(window.sessionStorage.getItem('mailflow.signup.pendingEmail')).toBeNull()
  })

  it('shows a generic error for invalid or expired verification codes', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({ code: 'INVALID_OTP', message: 'Internal detail' }, { status: 400 }),
      )
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    fireEvent.change(await screen.findByLabelText('6-digit code'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'That code is invalid or expired. Request a new one and try again.',
    )
    expect(alert).not.toHaveTextContent('Internal detail')
    expect(onRedirect).not.toHaveBeenCalled()
  })

  it('clears an invalid code error when requesting a resend', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ code: 'INVALID_OTP' }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ success: true }))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    fireEvent.change(await screen.findByLabelText('6-digit code'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is invalid or expired.')

    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'If this email can be verified, a new code will arrive shortly.',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('replaces an invalid code error with the resend error when sending fails', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ code: 'INVALID_OTP' }, { status: 400 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    fireEvent.change(await screen.findByLabelText('6-digit code'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))
    await screen.findByText('That code is invalid or expired. Request a new one and try again.')

    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

    expect(
      await screen.findByText("We couldn't send a verification code. Try again in a moment."),
    ).toBeVisible()
    expect(
      screen.queryByText('That code is invalid or expired. Request a new one and try again.'),
    ).not.toBeInTheDocument()
  })

  it('sanitizes verification codes to six digits before submitting', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({ status: true, token: null, user: { emailVerified: true } }),
      )
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    const code = await screen.findByLabelText('6-digit code')
    fireEvent.change(code, { target: { value: '1a2 3-4567' } })

    expect(code).toHaveValue('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${props.apiUrl}/api/auth/email-otp/verify-email`,
      expect.objectContaining({
        body: JSON.stringify({ email: 'maya@example.com', otp: '123456' }),
      }),
    )
  })

  it('resends a verification code without exposing the account response', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ success: true, message: 'Internal detail' }))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await screen.findByRole('heading', { name: 'Verify your email' })
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'If this email can be verified, a new code will arrive shortly.',
    )
    expect(screen.queryByText('Internal detail')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${props.apiUrl}/api/auth/email-otp/send-verification-otp`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        body: JSON.stringify({ email: 'maya@example.com', type: 'email-verification' }),
      }),
    )
  })

  it('shows a friendly error when a verification code cannot be resent', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await screen.findByRole('heading', { name: 'Verify your email' })
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't send a verification code. Try again in a moment.",
    )
  })

  it.each([429, 503])(
    'does not advance after a %s response to a fresh verification request',
    async (status) => {
      fetchMock.mockResolvedValue(Response.json({ code: 'INTERNAL_DETAIL' }, { status }))
      render(<SignupForm {...props} />)

      fireEvent.click(
        screen.getByRole('button', { name: 'Already have an account and need to verify?' }),
      )
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'maya@example.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "We couldn't send a verification code. Try again in a moment.",
      )
      expect(screen.getByRole('button', { name: 'Send verification code' })).toBeVisible()
      expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
      expect(screen.queryByText('INTERNAL_DETAIL')).not.toBeInTheDocument()
    },
  )

  it.each([429, 503])('shows a generic error after a %s resend response', async (status) => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ code: 'INTERNAL_DETAIL' }, { status }))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await screen.findByRole('heading', { name: 'Verify your email' })
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't send a verification code. Try again in a moment.",
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('INTERNAL_DETAIL')).not.toBeInTheDocument()
  })

  it('lets an unverified user re-enter an email and request a fresh code without exposing account status', async () => {
    fetchMock.mockResolvedValue(Response.json({ success: true }))
    render(<SignupForm {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Already have an account and need to verify?' }),
    )
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'maya@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }))

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'If this email can be verified, a new code will arrive shortly.',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      `${props.apiUrl}/api/auth/email-otp/send-verification-otp`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maya@example.com', type: 'email-verification' }),
      }),
    )
  })

  it('shows a friendly error if the re-entry verification request cannot reach Core', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<SignupForm {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Already have an account and need to verify?' }),
    )
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'maya@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't send a verification code. Try again in a moment.",
    )
    expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
  })

  it('restores the verification step after a page reload', async () => {
    window.sessionStorage.setItem('mailflow.signup.pendingEmail', 'maya@example.com')
    render(<SignupForm {...props} />)

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible()
    expect(screen.getByLabelText('Email')).toHaveValue('maya@example.com')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  it('uses the restored email when verifying after a page reload', async () => {
    window.sessionStorage.setItem('mailflow.signup.pendingEmail', 'maya@example.com')
    fetchMock.mockResolvedValue(
      Response.json({ status: true, token: null, user: { emailVerified: true } }),
    )
    const onRedirect = vi.fn()
    render(<SignupForm {...props} onRedirect={onRedirect} />)

    const code = await screen.findByLabelText('6-digit code')
    fireEvent.change(code, { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith(`${props.webAppUrl}/login`))
    expect(fetchMock).toHaveBeenCalledWith(
      `${props.apiUrl}/api/auth/email-otp/verify-email`,
      expect.objectContaining({
        body: JSON.stringify({ email: 'maya@example.com', otp: '123456' }),
      }),
    )
  })

  it('prefills email re-entry with the address being verified', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))
    render(<SignupForm {...props} />)
    fillSignupForm()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await screen.findByRole('heading', { name: 'Verify your email' })
    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }))

    expect(screen.getByLabelText('Email')).toHaveValue('maya@example.com')
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
