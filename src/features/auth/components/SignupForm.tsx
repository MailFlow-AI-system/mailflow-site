import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@mailflow/ui/components'
import { Eye, EyeOff } from '@mailflow/ui/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { type SignupValues, signupSchema } from '../schemas/signupSchema'

type SignupFormProps = {
  apiUrl: string
  webAppUrl: string
  onRedirect?: (url: string) => void
}

export default function SignupForm({ apiUrl, webAppUrl, onRedirect }: SignupFormProps) {
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({ resolver: zodResolver(signupSchema) })
  const [passwordVisible, setPasswordVisible] = useState(false)

  const submitSignup = async (values: SignupValues) => {
    clearErrors('root.server')

    try {
      const response = await fetch(new URL('/api/auth/sign-up/email', apiUrl).toString(), {
        method: 'POST',
        credentials: 'include',
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

      const appUrl = new URL('/app', webAppUrl).toString()
      if (onRedirect) onRedirect(appUrl)
      else window.location.assign(appUrl)
    } catch {
      setError('root.server', {
        type: 'server',
        message: "We couldn't reach MailFlow. Check your connection and try again.",
      })
    }
  }

  return (
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
  )
}
