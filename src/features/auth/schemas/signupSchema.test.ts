import { describe, expect, it } from 'vitest'

import { signupSchema } from './signupSchema'

const validSignup = {
  name: ' Maya Example ',
  email: ' maya@example.com ',
  password: 'safe-test-password-123',
}

describe('signupSchema', () => {
  it('trims the name and email while preserving the password', () => {
    expect(signupSchema.parse(validSignup)).toEqual({
      name: 'Maya Example',
      email: 'maya@example.com',
      password: validSignup.password,
    })
  })

  it.each([
    ['name', { ...validSignup, name: '   ' }],
    ['email', { ...validSignup, email: 'not-an-email' }],
    ['password', { ...validSignup, password: 'short' }],
    ['password', { ...validSignup, password: 'x'.repeat(129) }],
  ] as const)('rejects invalid %s values', (field, values) => {
    const result = signupSchema.safeParse(values)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([field])
  })
})
