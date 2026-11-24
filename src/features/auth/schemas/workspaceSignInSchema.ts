import { z } from 'zod'
import { workspaceSlugField } from './signupSchema'

export const workspaceSignInSchema = z.object({
  workspaceSlug: workspaceSlugField('Enter your workspace subdomain.'),
})

export type WorkspaceSignInValues = z.infer<typeof workspaceSignInSchema>
