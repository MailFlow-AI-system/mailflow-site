export const workspaceSlugMaxLength = 63
export const workspaceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isWorkspaceSlug(slug: string) {
  return slug.length <= workspaceSlugMaxLength && workspaceSlugPattern.test(slug)
}

/** Host shown after the workspace subdomain, e.g. `mailflow-ai.online` or `localhost:3000`. */
export function workspaceHost(baseOrigin: string) {
  return new URL(baseOrigin).host
}

/** Builds `{protocol}//{slug}.{base hostname}[:port]/login`, or null for an invalid slug or base. */
export function workspaceLoginUrl(baseOrigin: string, slug: string) {
  if (!isWorkspaceSlug(slug)) return null
  try {
    const base = new URL(baseOrigin)
    const port = base.port ? `:${base.port}` : ''
    return `${base.protocol}//${slug}.${base.hostname}${port}/login`
  } catch {
    return null
  }
}
