import type { ComponentType } from 'react'

export type Feature = {
  title: string
  description: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; className?: string }>
}
