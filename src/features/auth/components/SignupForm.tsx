import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useSignupFlow } from '../hooks/useSignupFlow'
import {
  type EmailVerificationValues,
  emailVerificationSchema,
  type VerificationRequestValues,
  verificationRequestSchema,
} from '../schemas/emailVerificationSchema'
import { createSignupSchema } from '../schemas/signupSchema'
import type { SignupFormProps, SignupValues } from '../types/signup'
import { EmailVerificationForm } from './EmailVerificationForm'
import { SignupDetailsForm } from './SignupDetailsForm'
import { VerificationRequestForm } from './VerificationRequestForm'

export default function SignupForm({
  apiUrl,
  webAppUrl,
  onRedirect,
  onboardingEnabled = false,
}: SignupFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(createSignupSchema(onboardingEnabled)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      ...(onboardingEnabled ? { workspaceName: '', workspaceSlug: '' } : {}),
    },
  })
  const verificationForm = useForm<EmailVerificationValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { otp: '' },
  })
  const requestCodeForm = useForm<VerificationRequestValues>({
    resolver: zodResolver(verificationRequestSchema),
    defaultValues: { email: '' },
  })
  const flow = useSignupFlow({
    apiUrl,
    webAppUrl,
    onRedirect,
    signupForm,
    verificationForm,
    requestCodeForm,
    onboardingEnabled,
  })

  if (flow.step === 'verify') {
    return (
      <EmailVerificationForm
        email={flow.pendingEmail}
        form={verificationForm}
        isSendingCode={requestCodeForm.formState.isSubmitting}
        notice={flow.notice}
        onResend={flow.resendVerificationCode}
        onSignIn={flow.redirectToLogin}
        onSubmit={flow.submitVerification}
        onUseDifferentEmail={flow.startEmailReentry}
        resendError={requestCodeForm.formState.errors.root?.server?.message}
      />
    )
  }

  if (flow.step === 'request-code') {
    return (
      <VerificationRequestForm
        form={requestCodeForm}
        onBack={flow.backToSignup}
        onSubmit={flow.submitCodeRequest}
      />
    )
  }

  return (
    <SignupDetailsForm
      form={signupForm}
      onRequestExistingAccount={flow.startEmailReentry}
      onSubmit={flow.submitSignup}
      onTogglePasswordVisibility={() => setPasswordVisible((visible) => !visible)}
      passwordVisible={passwordVisible}
      onboardingEnabled={onboardingEnabled}
      webAppUrl={webAppUrl}
    />
  )
}
