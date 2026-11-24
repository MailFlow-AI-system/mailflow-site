import { expect, it } from 'vitest'
import { isVerifiedResponse, verifiedLoginUrl } from './verifiedLoginUrl'

const base = 'https://mailflow.example.test'
const verified = { status: true, token: null, user: { emailVerified: true } }

it('accepts a login destination on a workspace subdomain of the configured base', () => {
  expect(
    verifiedLoginUrl({ ...verified, loginUrl: 'https://team.mailflow.example.test/login' }, base),
  ).toBe('https://team.mailflow.example.test/login')
  expect(
    verifiedLoginUrl(
      { ...verified, loginUrl: 'http://team.localhost:3000/login' },
      'http://localhost:3000',
    ),
  ).toBe('http://team.localhost:3000/login')
})

it('returns no destination when Core omits the login URL', () => {
  expect(verifiedLoginUrl(verified, base)).toBeNull()
})

it('rejects the bare base host and destinations outside the workspace zone', () => {
  for (const loginUrl of [
    'https://mailflow.example.test/login',
    '/login',
    'https://evil.test/login',
    'https://mailflow.example.test.evil.test/login',
    'https://sub.team.mailflow.example.test/login',
    'https://-team.mailflow.example.test/login',
    'http://team.mailflow.example.test/login',
    'https://team.mailflow.example.test:444/login',
    'https://user@team.mailflow.example.test/login',
    'https://team.mailflow.example.test/login?next=https://evil.test',
    'https://team.mailflow.example.test/login#next',
    'https://team.mailflow.example.test/inbox',
  ]) {
    expect(verifiedLoginUrl({ ...verified, loginUrl }, base), loginUrl).toBeNull()
  }
})

it('ignores responses that do not confirm the email', () => {
  const unverified = {
    status: true,
    user: { emailVerified: false },
    loginUrl: 'https://team.mailflow.example.test/login',
  }
  expect(isVerifiedResponse(unverified)).toBe(false)
  expect(verifiedLoginUrl(unverified, base)).toBeNull()
  expect(isVerifiedResponse(verified)).toBe(true)
  expect(isVerifiedResponse(null)).toBe(false)
})
