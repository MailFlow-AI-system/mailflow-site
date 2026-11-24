import { z } from 'zod'
import { workspaceLoginUrl } from '@/shared/config/workspaceUrl'

const verifiedResponse = z.object({
  status: z.literal(true),
  user: z.object({ emailVerified: z.literal(true) }),
  loginUrl: z.string().optional(),
})

export function isVerifiedResponse(payload: unknown) {
  return verifiedResponse.safeParse(payload).success
}

/**
 * Returns Core's login URL only when it is exactly `/login` on a single-label workspace
 * subdomain of the configured base origin. The bare base host is rejected: there is no
 * generic web app outside workspace subdomains.
 */
export function verifiedLoginUrl(payload: unknown, workspaceBaseOrigin: string) {
  const result = verifiedResponse.safeParse(payload)
  if (!result.success || !result.data.loginUrl) return null
  try {
    const base = new URL(workspaceBaseOrigin)
    const destination = new URL(result.data.loginUrl, base)
    const suffix = `.${base.hostname}`
    if (!destination.hostname.endsWith(suffix)) return null
    const slug = destination.hostname.slice(0, -suffix.length)
    return destination.href === workspaceLoginUrl(base.origin, slug) ? destination.href : null
  } catch {
    return null
  }
}
