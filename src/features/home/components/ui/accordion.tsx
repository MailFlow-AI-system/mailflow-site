import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronRight } from '@mailflow/ui/icons'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/utils'

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={
        typeof className === 'function'
          ? (state) => cn('flex flex-col', className(state))
          : cn('flex flex-col', className)
      }
      {...props}
    />
  )
}

const AccordionItem = forwardRef<HTMLDivElement, AccordionPrimitive.Item.Props>(
  ({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={
        typeof className === 'function'
          ? (state) => cn('border-b last:border-b-0', className(state))
          : cn('border-b last:border-b-0', className)
      }
      {...props}
    />
  ),
)
AccordionItem.displayName = 'AccordionItem'

const AccordionHeader = forwardRef<HTMLHeadingElement, AccordionPrimitive.Header.Props>(
  ({ className, ...props }, ref) => (
    <AccordionPrimitive.Header
      ref={ref}
      data-slot="accordion-header"
      className={
        typeof className === 'function'
          ? (state) => cn('flex', className(state))
          : cn('flex', className)
      }
      {...props}
    />
  ),
)
AccordionHeader.displayName = 'AccordionHeader'

const AccordionTrigger = forwardRef<HTMLElement, AccordionPrimitive.Trigger.Props>(
  ({ children, className, ...props }, ref) => (
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={
        typeof className === 'function'
          ? (state) =>
              cn(
                'flex w-full flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&[data-panel-open]>svg]:rotate-90',
                className(state),
              )
          : cn(
              'flex w-full flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&[data-panel-open]>svg]:rotate-90',
              className,
            )
      }
      {...props}
    >
      {children}
      <ChevronRight
        aria-hidden="true"
        className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform"
      />
    </AccordionPrimitive.Trigger>
  ),
)
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = forwardRef<HTMLDivElement, AccordionPrimitive.Panel.Props>(
  ({ children, className, ...props }, ref) => (
    <AccordionPrimitive.Panel
      ref={ref}
      data-slot="accordion-content"
      className={
        typeof className === 'function'
          ? (state) =>
              cn('overflow-hidden text-sm text-muted-foreground data-[open]:pt-3', className(state))
          : cn('overflow-hidden text-sm text-muted-foreground data-[open]:pt-3', className)
      }
      {...props}
    >
      {children}
    </AccordionPrimitive.Panel>
  ),
)
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger }
