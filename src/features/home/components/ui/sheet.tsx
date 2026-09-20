import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from '@mailflow/ui/icons'
import * as React from 'react'

import { cn } from '@/shared/lib/utils'

type ClassName<State> = string | ((state: State) => string | undefined) | undefined

function mergeClassName<State>(base: string, className: ClassName<State>) {
  return typeof className === 'function'
    ? (state: State) => cn(base, className(state))
    : cn(base, className)
}

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, DialogPrimitive.Trigger.Props>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Trigger
      ref={ref}
      data-slot="sheet-trigger"
      className={mergeClassName('', className)}
      {...props}
    />
  ),
)
SheetTrigger.displayName = 'SheetTrigger'

const SheetClose = React.forwardRef<HTMLButtonElement, DialogPrimitive.Close.Props>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Close
      ref={ref}
      data-slot="sheet-close"
      className={mergeClassName('', className)}
      {...props}
    />
  ),
)
SheetClose.displayName = 'SheetClose'

const SheetPortal = ({ ...props }: DialogPrimitive.Portal.Props) => (
  <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
)
SheetPortal.displayName = 'SheetPortal'

const SheetOverlay = React.forwardRef<HTMLDivElement, DialogPrimitive.Backdrop.Props>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Backdrop
      ref={ref}
      data-slot="sheet-overlay"
      className={mergeClassName(
        'fixed inset-0 z-50 bg-foreground/50 transition-opacity data-[closed]:opacity-0 data-[open]:opacity-100',
        className,
      )}
      {...props}
    />
  ),
)
SheetOverlay.displayName = 'SheetOverlay'

type SheetSide = 'top' | 'right' | 'bottom' | 'left'

type SheetContentProps = DialogPrimitive.Popup.Props & {
  side?: SheetSide
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ children, className, side = 'right', ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        ref={ref}
        data-slot="sheet-content"
        data-side={side}
        className={mergeClassName(
          'fixed z-50 flex max-h-screen flex-col gap-4 bg-background p-6 text-foreground shadow-lg outline-none transition-transform data-[closed]:duration-300 data-[open]:duration-500 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:border-b sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="sheet-close"
          className="absolute right-4 top-4 rounded-sm opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X aria-hidden="true" className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  ),
)
SheetContent.displayName = 'SheetContent'

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  ),
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  ),
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<HTMLHeadingElement, DialogPrimitive.Title.Props>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="sheet-title"
      className={mergeClassName('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  ),
)
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<HTMLParagraphElement, DialogPrimitive.Description.Props>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="sheet-description"
      className={mergeClassName('text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
)
SheetDescription.displayName = 'SheetDescription'

export type { SheetContentProps, SheetSide }
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
