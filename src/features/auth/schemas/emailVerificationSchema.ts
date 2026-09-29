import { z } from 'zod'

export const emailVerificationSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code from your email.'),
})

export const verificationRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: 'Enter a valid email address.' })),
})

export type EmailVerificationValues = z.infer<typeof emailVerificationSchema>
export type VerificationRequestValues = z.infer<typeof verificationRequestSchema>
