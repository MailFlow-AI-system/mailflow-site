import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@mailflow/ui/components'
import { Eye, EyeOff } from '@mailflow/ui/icons'
import { type SubmitEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { type SignupValues, signupSchema } from '../schemas/signupSchema'

type SignupFormProps = {
  apiUrl: string
  webAppUrl: string
  onRedirect?: (url: string) => void
}

type SignupStep = 'signup' | 'verify' | 'request-code'

const pendingEmailStorageKey = 'mailflow.signup.pendingEmail'
const verificationRequestMessage = 'If this email can be verified, a new code will arrive shortly.'

function readPendingEmail() {
  if (typeof window === 'undefined') return ''

  try {
    return window.sessionStorage.getItem(pendingEmailStorageKey) ?? ''
  } catch {
    return ''
  }
}

function isVerifiedEmailResponse(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) return false

  const response = payload as { status?: unknown; user?: unknown }
  if (typeof response.user !== 'object' || response.user === null) return false

  return (
    response.status === true &&
    'emailVerified' in response.user &&
    response.user.emailVerified === true
  )
}

export default function SignupForm({ apiUrl, webAppUrl, onRedirect }: SignupFormProps) {
  const [step, setStep] = useState<SignupStep>('signup')
  const [pendingEmail, setPendingEmail] = useState('')
  const [reentryEmail, setReentryEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [verificationNotice, setVerificationNotice] = useState('')
  const [requestCodeError, setRequestCodeError] = useState('')
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({ resolver: zodResolver(signupSchema) })

  useEffect(() => {
    const savedEmail = readPendingEmail()
    if (!savedEmail) return

    setPendingEmail(savedEmail)
    setReentryEmail(savedEmail)
    setStep('verify')
  }, [])

  const savePendingEmail = (email: string) => {
    setPendingEmail(email)

    try {
      window.sessionStorage.setItem(pendingEmailStorageKey, email)
    } catch {
      // The manual verification entry remains available when storage is disabled.
    }
  }

  const clearSavedEmail = () => {
    try {
      window.sessionStorage.removeItem(pendingEmailStorageKey)
    } catch {
      // Redirecting to login does not depend on browser storage.
    }
  }

  const redirectToLogin = () => {
    const loginUrl = new URL('/login', webAppUrl).toString()
    if (onRedirect) onRedirect(loginUrl)
    else window.location.assign(loginUrl)
  }

  const submitSignup = async (values: SignupValues) => {
    clearErrors('root.server')

    try {
      const response = await fetch(new URL('/api/auth/sign-up/email', apiUrl).toString(), {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        setError('root.server', {
          type: 'server',
          message: "We couldn't create your account. Check your details and try again.",
        })
        return
      }

      reset()
      savePendingEmail(values.email)
      setOtp('')
      setVerificationError('')
      setVerificationNotice(verificationRequestMessage)
      setStep('verify')
    } catch {
      setError('root.server', {
        type: 'server',
        message: "We couldn't reach MailFlow. Check your connection and try again.",
      })
    }
  }

  const sendVerificationOtp = async (email: string) => {
    setIsSendingCode(true)
    try {
      const response = await fetch(
        new URL('/api/auth/email-otp/send-verification-otp', apiUrl).toString(),
        {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type: 'email-verification' }),
        },
      )
      return response.ok
    } catch {
      return false
    } finally {
      setIsSendingCode(false)
    }
  }

  const submitVerification = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setVerificationError('')
    setVerificationNotice('')

    if (!/^\d{6}$/.test(otp)) {
      setVerificationError('Enter the six-digit code from your email.')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch(new URL('/api/auth/email-otp/verify-email', apiUrl).toString(), {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp }),
      })
      const payload = response.ok ? await response.json().catch(() => null) : null

      if (!response.ok || !isVerifiedEmailResponse(payload)) {
        setVerificationError('That code is invalid or expired. Request a new one and try again.')
        return
      }

      clearSavedEmail()
      redirectToLogin()
    } catch {
      setVerificationError("We couldn't reach MailFlow. Check your connection and try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationOtp = async () => {
    setVerificationError('')
    setVerificationNotice('')

    if (await sendVerificationOtp(pendingEmail)) {
      setVerificationNotice(verificationRequestMessage)
    } else {
      setVerificationError("We couldn't send a verification code. Try again in a moment.")
    }
  }

  const submitEmailReentry = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRequestCodeError('')

    const parsedEmail = signupSchema.shape.email.safeParse(reentryEmail)
    if (!parsedEmail.success) {
      setRequestCodeError(parsedEmail.error.issues[0]?.message ?? 'Enter a valid email address.')
      return
    }

    const email = parsedEmail.data
    if (!(await sendVerificationOtp(email))) {
      setRequestCodeError("We couldn't send a verification code. Try again in a moment.")
      return
    }

    savePendingEmail(email)
    setOtp('')
    setVerificationError('')
    setVerificationNotice(verificationRequestMessage)
    setStep('verify')
  }

  if (step === 'verify') {
    return (
      <section aria-labelledby="verification-heading" className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-card-foreground" id="verification-heading">
            Verify your email
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the six-digit code from your email to finish creating your account.
          </p>
        </div>

        <form
          aria-label="Verify your email"
          className="grid gap-5"
          noValidate
          onSubmit={submitVerification}
        >
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="verification-email">
              Email
            </label>
            <Input
              autoComplete="email"
              id="verification-email"
              readOnly
              type="email"
              value={pendingEmail}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="verification-code">
              6-digit code
            </label>
            <Input
              autoComplete="one-time-code"
              autoFocus
              id="verification-code"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              aria-describedby={verificationError ? 'verification-code-error' : undefined}
              aria-invalid={verificationError ? true : undefined}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            {verificationError && (
              <p className="text-sm text-destructive" id="verification-code-error" role="alert">
                {verificationError}
              </p>
            )}
            {verificationNotice && (
              <p className="text-sm text-muted-foreground" role="status">
                {verificationNotice}
              </p>
            )}
          </div>

          <Button className="w-full" disabled={isVerifying} type="submit">
            {isVerifying ? 'Verifying…' : 'Verify email'}
          </Button>
        </form>

        <div className="grid gap-2">
          <Button
            disabled={isSendingCode}
            type="button"
            variant="outline"
            onClick={resendVerificationOtp}
          >
            {isSendingCode ? 'Sending code…' : 'Resend code'}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="ghost"
            onClick={() => {
              setReentryEmail(pendingEmail)
              setRequestCodeError('')
              setStep('request-code')
            }}
          >
            Use a different email
          </Button>
          <Button className="w-full" type="button" variant="ghost" onClick={redirectToLogin}>
            Already verified? Sign in
          </Button>
        </div>
      </section>
    )
  }

  if (step === 'request-code') {
    return (
      <form
        aria-label="Request email verification"
        className="grid gap-5"
        noValidate
        onSubmit={submitEmailReentry}
      >
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-card-foreground">Verify an existing account</h2>
          <p className="text-sm text-muted-foreground">
            Enter the email address you used. If it can be verified, a new code will arrive shortly.
          </p>
        </div>

        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="verification-request-email"
          >
            Email
          </label>
          <Input
            autoComplete="email"
            autoCapitalize="none"
            id="verification-request-email"
            required
            type="email"
            value={reentryEmail}
            aria-describedby={requestCodeError ? 'verification-request-email-error' : undefined}
            aria-invalid={requestCodeError ? true : undefined}
            onChange={(event) => setReentryEmail(event.target.value)}
          />
          {requestCodeError && (
            <p
              className="text-sm text-destructive"
              id="verification-request-email-error"
              role="alert"
            >
              {requestCodeError}
            </p>
          )}
        </div>

        <Button className="w-full" disabled={isSendingCode} type="submit">
          {isSendingCode ? 'Sending code…' : 'Send verification code'}
        </Button>
        <Button className="w-full" type="button" variant="ghost" onClick={() => setStep('signup')}>
          Back to sign up
        </Button>
      </form>
    )
  }

  return (
    <div className="grid gap-4">
      <form
        aria-label="Create your account"
        className="grid gap-5"
        noValidate
        onSubmit={handleSubmit(submitSignup)}
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-name">
            Name
          </label>
          <Input
            autoComplete="name"
            id="signup-name"
            required
            aria-describedby={errors.name ? 'signup-name-error' : undefined}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive" id="signup-name-error">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
            Email
          </label>
          <Input
            autoComplete="email"
            autoCapitalize="none"
            id="signup-email"
            required
            type="email"
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive" id="signup-email-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-password">
            Password
          </label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="pr-10"
              id="signup-password"
              maxLength={128}
              minLength={8}
              required
              type={passwordVisible ? 'text' : 'password'}
              aria-describedby={errors.password ? 'signup-password-error' : undefined}
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            <Button
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible}
              className="absolute top-0 right-0 text-muted-foreground"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive" id="signup-password-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root?.server && (
          <p className="text-sm text-destructive" role="alert">
            {errors.root.server.message}
          </p>
        )}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <Button
        className="w-full"
        type="button"
        variant="ghost"
        onClick={() => setStep('request-code')}
      >
        Already have an account and need to verify?
      </Button>
    </div>
  )
}
