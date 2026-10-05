import { z } from 'zod'
import type { SignupFlowClient } from '../types/signup'
import { verifiedLoginUrl } from '../utils/verifiedLoginUrl'

const pendingEmailStorageKey = 'mailflow.signup.pendingEmail'

export function createSignupFlowClient(
  apiUrl: string,
  webAppUrl: string,
  onboardingEnabled = false,
): SignupFlowClient {
  let requestBody = ''
  let signupKey = ''
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(new URL(path, apiUrl).toString(), {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })

  return {
    async createAccount(values) {
      const serialized = JSON.stringify(values)
      if (onboardingEnabled && serialized !== requestBody) {
        requestBody = serialized
        signupKey = crypto.randomUUID()
      }
      const response = await post(
        onboardingEnabled ? '/api/v1/onboarding/signup' : '/api/auth/sign-up/email',
        values,
        onboardingEnabled ? { 'Idempotency-Key': signupKey } : {},
      )
      const committed =
        response.ok &&
        (!onboardingEnabled ||
          z
            .object({ status: z.literal('verification-pending') })
            .safeParse(await response.json().catch(() => null)).success)
      if (committed) {
        requestBody = ''
        signupKey = ''
      }
      return committed
    },
    async requestVerificationCode(email) {
      const response = await post('/api/auth/email-otp/send-verification-otp', {
        email,
        type: 'email-verification',
      })
      return response.ok
    },
    async verifyEmail(email, otp) {
      const response = await post('/api/auth/email-otp/verify-email', { email, otp })
      const payload = response.ok ? await response.json().catch(() => null) : null
      return response.ok ? verifiedLoginUrl(payload, webAppUrl, onboardingEnabled) : null
    },
    readPendingEmail() {
      if (typeof window === 'undefined') return ''

      try {
        return window.sessionStorage.getItem(pendingEmailStorageKey) ?? ''
      } catch {
        return ''
      }
    },
    savePendingEmail(email) {
      try {
        window.sessionStorage.setItem(pendingEmailStorageKey, email)
      } catch {
        // Manual email verification remains available when storage is disabled.
      }
    },
    clearPendingEmail() {
      try {
        window.sessionStorage.removeItem(pendingEmailStorageKey)
      } catch {
        // Redirecting to login does not depend on browser storage.
      }
    },
  }
}
