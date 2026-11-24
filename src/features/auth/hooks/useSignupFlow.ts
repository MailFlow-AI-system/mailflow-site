import { useEffect, useMemo, useRef, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { signInPath } from '@/shared/config/routes'
import { workspaceLoginUrl } from '@/shared/config/workspaceUrl'
import { createSignupFlowClient } from '../clients/signupFlowClient'
import type {
  EmailVerificationValues,
  VerificationRequestValues,
} from '../schemas/emailVerificationSchema'
import type { SignupStep, SignupValues, UseSignupFlowOptions } from '../types/signup'

const verificationRequestMessage = 'If this email can be verified, a new code will arrive shortly.'
const signupErrorMessage = "We couldn't create your account. Check your details and try again."
const connectionErrorMessage = "We couldn't reach MailFlow. Check your connection and try again."
const sendCodeErrorMessage = "We couldn't send a verification code. Try again in a moment."

export function useSignupFlow({
  apiUrl,
  workspaceBaseOrigin,
  onRedirect,
  client,
  signupForm,
  verificationForm,
  requestCodeForm,
  onboardingEnabled = false,
}: UseSignupFlowOptions) {
  const [step, setStep] = useState<SignupStep>('signup')
  const [notice, setNotice] = useState('')
  const flowClient = useMemo(
    () => client ?? createSignupFlowClient(apiUrl, workspaceBaseOrigin, onboardingEnabled),
    [apiUrl, client, workspaceBaseOrigin, onboardingEnabled],
  )
  // Kept in memory only: a resumed verification (saved email) has no known workspace.
  const signupWorkspace = useRef<{ email: string; slug: string } | null>(null)
  const pendingEmail = useWatch({ control: requestCodeForm.control, name: 'email' })

  useEffect(() => {
    const savedEmail = flowClient.readPendingEmail()
    if (!savedEmail) return

    requestCodeForm.setValue('email', savedEmail)
    setStep('verify')
  }, [flowClient, requestCodeForm.setValue])

  const redirect = (url: string) => {
    if (onRedirect) onRedirect(url)
    else window.location.assign(url)
  }

  const fallbackDestination = (email: string) => {
    const workspace = signupWorkspace.current
    const loginUrl =
      workspace?.email === email ? workspaceLoginUrl(workspaceBaseOrigin, workspace.slug) : null
    return loginUrl ?? signInPath
  }

  const submitSignup = async (values: SignupValues) => {
    signupForm.clearErrors('root.server')
    setNotice('')

    try {
      if (!(await flowClient.createAccount(values))) {
        signupForm.setError('root.server', { type: 'server', message: signupErrorMessage })
        return
      }

      signupWorkspace.current = values.workspaceSlug
        ? { email: values.email, slug: values.workspaceSlug }
        : null
      signupForm.reset()
      requestCodeForm.clearErrors()
      requestCodeForm.setValue('email', values.email)
      verificationForm.reset({ otp: '' })
      flowClient.savePendingEmail(values.email)
      setNotice(verificationRequestMessage)
      setStep('verify')
    } catch {
      signupForm.setError('root.server', { type: 'server', message: connectionErrorMessage })
    }
  }

  const submitVerification = async ({ otp }: EmailVerificationValues) => {
    verificationForm.clearErrors('root.server')
    setNotice('')

    try {
      const verification = await flowClient.verifyEmail(pendingEmail, otp)
      if (!verification) {
        verificationForm.setError('root.server', {
          type: 'server',
          message: 'That code is invalid or expired. Request a new one and try again.',
        })
        return
      }

      flowClient.clearPendingEmail()
      redirect(verification.loginUrl ?? fallbackDestination(pendingEmail))
    } catch {
      verificationForm.setError('root.server', {
        type: 'server',
        message: connectionErrorMessage,
      })
    }
  }

  const submitCodeRequest = async ({ email }: VerificationRequestValues) => {
    requestCodeForm.clearErrors('root.server')
    setNotice('')

    try {
      if (!(await flowClient.requestVerificationCode(email))) {
        requestCodeForm.setError('root.server', {
          type: 'server',
          message: sendCodeErrorMessage,
        })
        return
      }

      requestCodeForm.setValue('email', email)
      verificationForm.reset({ otp: '' })
      flowClient.savePendingEmail(email)
      setNotice(verificationRequestMessage)
      setStep('verify')
    } catch {
      requestCodeForm.setError('root.server', {
        type: 'server',
        message: sendCodeErrorMessage,
      })
    }
  }

  const resendVerificationCode = () => {
    verificationForm.clearErrors('root.server')
    setNotice('')
    requestCodeForm.clearErrors('root.server')
    return requestCodeForm.handleSubmit(submitCodeRequest, () => {
      requestCodeForm.setError('root.server', {
        type: 'server',
        message: sendCodeErrorMessage,
      })
    })()
  }

  const startEmailReentry = () => {
    requestCodeForm.clearErrors()
    requestCodeForm.setValue('email', pendingEmail)
    setNotice('')
    setStep('request-code')
  }

  const backToSignup = () => {
    requestCodeForm.clearErrors()
    setNotice('')
    setStep('signup')
  }

  return {
    backToSignup,
    notice,
    pendingEmail,
    resendVerificationCode,
    startEmailReentry,
    step,
    submitCodeRequest,
    submitSignup,
    submitVerification,
  }
}
