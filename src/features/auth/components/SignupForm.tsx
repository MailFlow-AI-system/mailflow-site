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
import { type SignupValues, signupSchema } from '../schemas/signupSchema'
import { EmailVerificationForm } from './EmailVerificationForm'
import { SignupDetailsForm } from './SignupDetailsForm'
import { VerificationRequestForm } from './VerificationRequestForm'

type SignupFormProps = {
  apiUrl: string
  webAppUrl: string
  onRedirect?: (url: string) => void
}

export default function SignupForm({ apiUrl, webAppUrl, onRedirect }: SignupFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
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
    />
  )
}
