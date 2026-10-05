import { afterEach, expect, it, vi } from 'vitest'
import { createSignupFlowClient } from './signupFlowClient'

afterEach(() => {
  vi.unstubAllGlobals()
})
it('reuses the request key after a lost response and creates another key only for changed input', async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('response lost'))
    .mockResolvedValue(Response.json({ status: 'verification-pending' }, { status: 202 }))
  vi.stubGlobal('fetch', fetcher)
  const client = createSignupFlowClient(
    'https://api.example.test',
    'https://web.example.test',
    true,
  )
  const input = {
    name: 'Maya',
    email: 'maya@example.test',
    password: 'synthetic-password',
    workspaceName: 'Maya',
    workspaceSlug: 'maya',
  }
  await expect(client.createAccount(input)).rejects.toThrow('response lost')
  expect(await client.createAccount(input)).toBe(true)
  expect(fetcher.mock.calls[0]?.[1].headers['Idempotency-Key']).toBe(
    fetcher.mock.calls[1]?.[1].headers['Idempotency-Key'],
  )
  await client.createAccount({ ...input, email: 'other@example.test' })
  expect(fetcher.mock.calls[2]?.[1].headers['Idempotency-Key']).not.toBe(
    fetcher.mock.calls[1]?.[1].headers['Idempotency-Key'],
  )
})
