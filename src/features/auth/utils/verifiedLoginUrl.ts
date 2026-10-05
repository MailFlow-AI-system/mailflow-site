import { z } from 'zod'

const verifiedResponse = z.object({
  status: z.literal(true),
  user: z.object({ emailVerified: z.literal(true) }),
  loginUrl: z.string().optional(),
})

export function verifiedLoginUrl(
  payload: unknown,
  baseOrigin: string,
  requireDestination: boolean,
) {
  const result = verifiedResponse.safeParse(payload)
  if (!result.success || (requireDestination && !result.data.loginUrl)) return null
  try {
    const base = new URL(baseOrigin)
    const destination = new URL(result.data.loginUrl ?? '/login', base)
    if (
      destination.protocol !== base.protocol ||
      destination.port !== base.port ||
      destination.username ||
      destination.password ||
      destination.pathname !== '/login' ||
      destination.search ||
      destination.hash
    )
      return null
    if (destination.hostname === base.hostname) return destination.href
    const suffix = `.${base.hostname}`
    const slug = destination.hostname.endsWith(suffix)
      ? destination.hostname.slice(0, -suffix.length)
      : ''
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 63 ? destination.href : null
  } catch {
    return null
  }
}
