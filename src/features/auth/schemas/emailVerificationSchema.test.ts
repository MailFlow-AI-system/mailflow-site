import { describe, expect, it } from 'vitest'

import { emailVerificationSchema, verificationRequestSchema } from './emailVerificationSchema'

describe('emailVerificationSchema', () => {
  it('accepts exactly six digits', () => {
    expect(emailVerificationSchema.parse({ otp: '123456' })).toEqual({ otp: '123456' })
  })

  it.each(['12345', '1234567', '12a456', ''])('rejects invalid code %j', (otp) => {
    expect(emailVerificationSchema.safeParse({ otp }).success).toBe(false)
  })
})

describe('verificationRequestSchema', () => {
  it('trims and validates the email address', () => {
    expect(verificationRequestSchema.parse({ email: ' maya@example.com ' })).toEqual({
      email: 'maya@example.com',
    })
  })

  it('rejects an invalid email address', () => {
    expect(verificationRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})
