import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: 'Enter a valid email address.' })),
  password: z
    .string()
    .min(8, 'Use at least 8 characters for your password.')
    .max(128, 'Use 128 characters or fewer for your password.'),
})

export type SignupValues = z.infer<typeof signupSchema>
