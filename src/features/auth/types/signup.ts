import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import type {
  EmailVerificationValues,
  VerificationRequestValues,
} from '../schemas/emailVerificationSchema'
import type { signupSchema } from '../schemas/signupSchema'

export type SignupValues = z.infer<typeof signupSchema>
export type SignupStep = 'signup' | 'verify' | 'request-code'
export type SignupFlowClient = {
  createAccount: (values: SignupValues) => Promise<boolean>
  requestVerificationCode: (email: string) => Promise<boolean>
  verifyEmail: (email: string, otp: string) => Promise<string | null>
  readPendingEmail: () => string
  savePendingEmail: (email: string) => void
  clearPendingEmail: () => void
}
export type SignupFormProps = {
  apiUrl: string
  webAppUrl: string
  onboardingEnabled?: boolean
  onRedirect?: ((url: string) => void) | undefined
}
export type SignupDetailsFormProps = {
  form: UseFormReturn<SignupValues>
  onSubmit: SubmitHandler<SignupValues>
  onRequestExistingAccount: () => void
  passwordVisible: boolean
  onTogglePasswordVisibility: () => void
  onboardingEnabled: boolean
  webAppUrl: string
}
export type SignupWorkspaceFieldsProps = { form: UseFormReturn<SignupValues>; webAppUrl: string }
export type UseSignupFlowOptions = SignupFormProps & {
  client?: SignupFlowClient
  signupForm: UseFormReturn<SignupValues>
  verificationForm: UseFormReturn<EmailVerificationValues>
  requestCodeForm: UseFormReturn<VerificationRequestValues>
}
