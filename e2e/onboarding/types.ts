export type SignupScenario = { project: string; email: string; slug: string; name: string }
export type OnboardingFixtures = { scenarios: SignupScenario[] }
export type DeliveryCapture = {
  messages: (
    | { kind: 'verification-otp'; otp: string }
    | { kind: 'verified-welcome'; loginUrl: string }
  )[]
}
