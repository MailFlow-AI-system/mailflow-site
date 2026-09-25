import { ChartColumn, Mail, Megaphone, Shield, Sparkles, Workflow } from '@mailflow/ui/icons'

import type { Feature } from '../types/Feature'

export const features: Feature[] = [
  {
    title: 'Unified inbox',
    description:
      'Bring all your emails together in one place. Smart filters, quick replies, and automatic labels keep you in control.',
    icon: Mail,
  },
  {
    title: 'Campaigns that convert',
    description:
      'Create, personalize, and send campaigns in minutes. Advanced segmentation, professional templates, and real-time metrics.',
    icon: Megaphone,
  },
  {
    title: 'Visual automations',
    description:
      'Build customer journeys on an intuitive canvas. Connect triggers, conditions, and actions without writing code.',
    icon: Workflow,
  },
  {
    title: 'Built-in AI assistant',
    description:
      'Write emails, summarize conversations, generate campaign ideas, and get recommendations based on your account data.',
    icon: Sparkles,
  },
  {
    title: 'Real-time analytics',
    description:
      'Track opens, clicks, conversions, and revenue. Clean, exportable dashboards make results easy to share.',
    icon: ChartColumn,
  },
  {
    title: 'Security and compliance',
    description:
      'Authentication, granular permissions, and encryption keep your data protected and compliant with LGPD and GDPR.',
    icon: Shield,
  },
]
