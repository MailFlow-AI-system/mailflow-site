import { Button, Input } from '@mailflow/ui/components'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'

import type { VerificationRequestValues } from '../schemas/emailVerificationSchema'

type VerificationRequestFormProps = {
  form: UseFormReturn<VerificationRequestValues>
  onSubmit: SubmitHandler<VerificationRequestValues>
  onBack: () => void
}

export function VerificationRequestForm({ form, onSubmit, onBack }: VerificationRequestFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = form

  return (
    <form
      aria-label="Request email verification"
      className="grid gap-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-card-foreground">Verify an existing account</h2>
        <p className="text-sm text-muted-foreground">
          Enter the email address you used. If it can be verified, a new code will arrive shortly.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="verification-request-email">
          Email
        </label>
        <Input
          autoComplete="email"
          autoCapitalize="none"
          id="verification-request-email"
          required
          type="email"
          aria-describedby={errors.email ? 'verification-request-email-error' : undefined}
          aria-invalid={errors.email ? true : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p
            className="text-sm text-destructive"
            id="verification-request-email-error"
            role="alert"
          >
            {errors.email.message}
          </p>
        )}
        {errors.root?.server && (
          <p className="text-sm text-destructive" role="alert">
            {errors.root.server.message}
          </p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending code…' : 'Send verification code'}
      </Button>
      <Button className="w-full" type="button" variant="ghost" onClick={onBack}>
        Back to sign up
      </Button>
    </form>
  )
}
