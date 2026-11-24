import { describe, expect, it } from 'vitest'
import { isWorkspaceSlug, workspaceHost, workspaceLoginUrl } from './workspaceUrl'

describe('workspaceLoginUrl', () => {
  it.each([
    ['https://mailflow-ai.online', 'acme', 'https://acme.mailflow-ai.online/login'],
    ['https://staging.mailflow-ai.online', 'acme', 'https://acme.staging.mailflow-ai.online/login'],
    ['https://dev.mailflow-ai.online/', 'a-1', 'https://a-1.dev.mailflow-ai.online/login'],
    ['http://localhost:3000', 'acme', 'http://acme.localhost:3000/login'],
  ])('builds the login URL for %s and %s', (base, slug, expected) => {
    expect(workspaceLoginUrl(base, slug)).toBe(expected)
  })

  it.each(['', 'Acme', '-acme', 'acme-', 'ac--me', 'ac.me', 'a b', 'a'.repeat(64)])(
    'rejects the invalid slug %j',
    (slug) => {
      expect(isWorkspaceSlug(slug)).toBe(false)
      expect(workspaceLoginUrl('https://mailflow-ai.online', slug)).toBeNull()
    },
  )

  it('accepts a slug of exactly 63 characters', () => {
    expect(isWorkspaceSlug('a'.repeat(63))).toBe(true)
  })

  it('returns null for an invalid base origin', () => {
    expect(workspaceLoginUrl('not a url', 'acme')).toBeNull()
  })
})

describe('workspaceHost', () => {
  it('returns the host shown after the workspace subdomain', () => {
    expect(workspaceHost('https://mailflow-ai.online')).toBe('mailflow-ai.online')
    expect(workspaceHost('http://localhost:3000')).toBe('localhost:3000')
  })
})
