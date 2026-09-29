import { Button, Input } from '@mailflow/ui/components'
import { Controller, type SubmitHandler, type UseFormReturn } from 'react-hook-form'

import type { EmailVerificationValues } from '../schemas/emailVerificationSchema'

type EmailVerificationFormProps = {
  email: string
  form: UseFormReturn<EmailVerificationValues>
  resendError?: string
  notice: string
  isSendingCode: boolean
  onSubmit: SubmitHandler<EmailVerificationValues>
  onResend: () => void
  onUseDifferentEmail: () => void
  onSignIn: () => void
}

export function EmailVerificationForm({
  email,
  form,
  resendError,
  notice,
  isSendingCode,
  onSubmit,
  onResend,
  onUseDifferentEmail,
  onSignIn,
}: EmailVerificationFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
  } = form

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
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="verification-email">
            Email
          </label>
          <Input autoComplete="email" id="verification-email" readOnly type="email" value={email} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="verification-code">
            6-digit code
          </label>
          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <Input
                autoComplete="one-time-code"
                autoFocus
                id="verification-code"
                inputMode="numeric"
                maxLength={6}
                required
                aria-describedby={errors.otp ? 'verification-code-error' : undefined}
                aria-invalid={errors.otp ? true : undefined}
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) =>
                  field.onChange(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
              />
            )}
          />
          {errors.otp && (
            <p className="text-sm text-destructive" id="verification-code-error" role="alert">
              {errors.otp.message}
            </p>
          )}
          {errors.root?.server && (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.server.message}
            </p>
          )}
          {resendError && (
            <p className="text-sm text-destructive" role="alert">
              {resendError}
            </p>
          )}
          {notice && (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <div className="grid gap-2">
        <Button disabled={isSendingCode} type="button" variant="outline" onClick={onResend}>
          {isSendingCode ? 'Sending code…' : 'Resend code'}
        </Button>
        <Button className="w-full" type="button" variant="ghost" onClick={onUseDifferentEmail}>
          Use a different email
        </Button>
        <Button className="w-full" type="button" variant="ghost" onClick={onSignIn}>
          Already verified? Sign in
        </Button>
      </div>
    </section>
  )
}
