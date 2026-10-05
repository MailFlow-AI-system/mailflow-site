import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .toLowerCase()
    .pipe(z.email({ error: 'Enter a valid email address.' })),
  password: z
    .string()
    .min(8, 'Use at least 8 characters for your password.')
    .max(128, 'Use 128 characters or fewer for your password.'),
  workspaceName: z.string().optional(),
  workspaceSlug: z.string().optional(),
})

export function createSignupSchema(onboardingEnabled: boolean) {
  return onboardingEnabled
    ? signupSchema.extend({
        workspaceName: z.string().trim().min(1, 'Enter your workspace name.').max(120),
        workspaceSlug: z
          .string()
          .trim()
          .toLowerCase()
          .min(1, 'Choose a workspace subdomain.')
          .max(63)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letters, numbers and single hyphens.'),
      })
    : signupSchema
}
