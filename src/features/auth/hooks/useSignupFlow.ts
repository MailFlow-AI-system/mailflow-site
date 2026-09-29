import { useEffect, useMemo, useState } from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import type { SignupFlowClient } from '../clients/signupFlowClient'
import { createSignupFlowClient } from '../clients/signupFlowClient'
import type {
  EmailVerificationValues,
  VerificationRequestValues,
} from '../schemas/emailVerificationSchema'
import type { SignupValues } from '../schemas/signupSchema'

export type SignupStep = 'signup' | 'verify' | 'request-code'

type UseSignupFlowOptions = {
  apiUrl: string
  webAppUrl: string
  onRedirect?: (url: string) => void
  client?: SignupFlowClient
  signupForm: UseFormReturn<SignupValues>
  verificationForm: UseFormReturn<EmailVerificationValues>
  requestCodeForm: UseFormReturn<VerificationRequestValues>
}

const verificationRequestMessage = 'If this email can be verified, a new code will arrive shortly.'
const signupErrorMessage = "We couldn't create your account. Check your details and try again."
const connectionErrorMessage = "We couldn't reach MailFlow. Check your connection and try again."
const sendCodeErrorMessage = "We couldn't send a verification code. Try again in a moment."

export function useSignupFlow({
  apiUrl,
  webAppUrl,
  onRedirect,
  client,
  signupForm,
  verificationForm,
  requestCodeForm,
}: UseSignupFlowOptions) {
  const [step, setStep] = useState<SignupStep>('signup')
  const [notice, setNotice] = useState('')
  const flowClient = useMemo(() => client ?? createSignupFlowClient(apiUrl), [apiUrl, client])
  const pendingEmail = useWatch({ control: requestCodeForm.control, name: 'email' })

  useEffect(() => {
    const savedEmail = flowClient.readPendingEmail()
    if (!savedEmail) return

    requestCodeForm.setValue('email', savedEmail)
    setStep('verify')
  }, [flowClient, requestCodeForm.setValue])

  const redirectToLogin = () => {
    const loginUrl = new URL('/login', webAppUrl).toString()
    if (onRedirect) onRedirect(loginUrl)
    else window.location.assign(loginUrl)
  }

  const submitSignup = async (values: SignupValues) => {
    signupForm.clearErrors('root.server')
    setNotice('')

    try {
      if (!(await flowClient.createAccount(values))) {
        signupForm.setError('root.server', { type: 'server', message: signupErrorMessage })
        return
      }

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
      if (!(await flowClient.verifyEmail(pendingEmail, otp))) {
        verificationForm.setError('root.server', {
          type: 'server',
          message: 'That code is invalid or expired. Request a new one and try again.',
        })
        return
      }

      flowClient.clearPendingEmail()
      redirectToLogin()
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
    redirectToLogin,
    resendVerificationCode,
    startEmailReentry,
    step,
    submitCodeRequest,
    submitSignup,
    submitVerification,
  }
}
