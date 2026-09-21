import type { Plan } from '../types/Plan'

export const plans: Plan[] = [
  {
    name: 'Starter',
    description: 'Perfect for freelancers and small teams.',
    price: 'R$ 97',
    period: '/month',
    features: [
      'Up to 5,000 contacts',
      '3 users',
      'Basic automations',
      'AI-powered templates',
      'Email support',
    ],
    cta: 'Start for free',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For teams ready to scale with data.',
    price: 'R$ 247',
    period: '/month',
    features: [
      'Up to 50,000 contacts',
      '10 users',
      'Advanced automations',
      'Full analytics',
      'Priority support',
      'API access',
    ],
    cta: 'Start for free',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Security, SLA, and complete control for large companies.',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited contacts',
      'Unlimited users',
      'SSO and advanced permissions',
      'Dedicated infrastructure',
      'Success manager',
      'Custom contracts',
    ],
    cta: 'Talk to sales',
    popular: false,
  },
]
