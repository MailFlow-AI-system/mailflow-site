import type { SignupValues } from '../schemas/signupSchema'

const pendingEmailStorageKey = 'mailflow.signup.pendingEmail'

export type SignupFlowClient = {
  createAccount(values: SignupValues): Promise<boolean>
  requestVerificationCode(email: string): Promise<boolean>
  verifyEmail(email: string, otp: string): Promise<boolean>
  readPendingEmail(): string
  savePendingEmail(email: string): void
  clearPendingEmail(): void
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

export function createSignupFlowClient(apiUrl: string): SignupFlowClient {
  const post = (path: string, body: unknown) =>
    fetch(new URL(path, apiUrl).toString(), {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  return {
    async createAccount(values) {
      const response = await post('/api/auth/sign-up/email', values)
      return response.ok
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
      return response.ok && isVerifiedEmailResponse(payload)
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
