import { expect, it } from 'vitest'
import { verifiedLoginUrl } from './verifiedLoginUrl'

const base = 'https://web.mailflow.example.test'
const verified = { status: true, token: null, user: { emailVerified: true } }
it('accepts only login destinations within the configured environment after verification', () => {
  expect(
    verifiedLoginUrl(
      { ...verified, loginUrl: 'https://team.web.mailflow.example.test/login' },
      base,
      true,
    ),
  ).toBe('https://team.web.mailflow.example.test/login')
  expect(verifiedLoginUrl(verified, base, false)).toBe(`${base}/login`)
  expect(verifiedLoginUrl(verified, base, true)).toBeNull()
  for (const loginUrl of [
    'https://evil.test/login',
    'https://web.mailflow.example.test.evil.test/login',
    'https://sub.team.web.mailflow.example.test/login',
    'http://team.web.mailflow.example.test/login',
    'https://team.web.mailflow.example.test:444/login',
    'https://user@team.web.mailflow.example.test/login',
    'https://team.web.mailflow.example.test/login?next=https://evil.test',
    'https://team.web.mailflow.example.test/inbox',
  ]) {
    expect(verifiedLoginUrl({ ...verified, loginUrl }, base, true)).toBeNull()
  }
  expect(
    verifiedLoginUrl(
      { status: true, user: { emailVerified: false }, loginUrl: `${base}/login` },
      base,
      true,
    ),
  ).toBeNull()
})
