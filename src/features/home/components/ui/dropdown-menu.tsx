import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Check, ChevronRight } from '@mailflow/ui/icons'
import * as React from 'react'

import { cn } from '@/shared/lib/utils'

type ClassName<State> = string | ((state: State) => string | undefined) | undefined

function mergeClassName<State>(base: string, className: ClassName<State>) {
  return typeof className === 'function'
    ? (state: State) => cn(base, className(state))
    : cn(base, className)
}

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, MenuPrimitive.Trigger.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.Trigger
      ref={ref}
      data-slot="dropdown-menu-trigger"
      className={mergeClassName('', className)}
      {...props}
    />
  ),
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuPortal = ({ ...props }: MenuPrimitive.Portal.Props) => (
  <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
)
DropdownMenuPortal.displayName = 'DropdownMenuPortal'

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  (
    { align = 'center', alignOffset, children, className, side = 'bottom', sideOffset, ...props },
    ref,
  ) => (
    <DropdownMenuPortal>
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        className="z-50"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          ref={ref}
          data-slot="dropdown-menu-content"
          className={mergeClassName(
            'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-opacity data-[closed]:opacity-0 data-[open]:opacity-100',
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </DropdownMenuPortal>
  ),
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuGroup = React.forwardRef<HTMLDivElement, MenuPrimitive.Group.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.Group
      ref={ref}
      data-slot="dropdown-menu-group"
      className={mergeClassName('', className)}
      {...props}
    />
  ),
)
DropdownMenuGroup.displayName = 'DropdownMenuGroup'

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, MenuPrimitive.GroupLabel.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.GroupLabel
      ref={ref}
      data-slot="dropdown-menu-label"
      className={mergeClassName('px-2 py-1.5 text-sm font-semibold', className)}
      {...props}
    />
  ),
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

const DropdownMenuItem = React.forwardRef<HTMLElement, MenuPrimitive.Item.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      className={mergeClassName(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuCheckboxItem = React.forwardRef<HTMLElement, MenuPrimitive.CheckboxItem.Props>(
  ({ children, className, ...props }, ref) => (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={mergeClassName(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  ),
)
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

const DropdownMenuRadioGroup = React.forwardRef<HTMLDivElement, MenuPrimitive.RadioGroup.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.RadioGroup
      ref={ref}
      data-slot="dropdown-menu-radio-group"
      className={mergeClassName('', className)}
      {...props}
    />
  ),
)
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup'

const DropdownMenuRadioItem = React.forwardRef<HTMLElement, MenuPrimitive.RadioItem.Props>(
  ({ children, className, ...props }, ref) => (
    <MenuPrimitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={mergeClassName(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <span aria-hidden="true" className="size-2 rounded-full bg-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  ),
)
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

const DropdownMenuSub = ({ ...props }: MenuPrimitive.SubmenuRoot.Props) => (
  <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
)
DropdownMenuSub.displayName = 'DropdownMenuSub'

const DropdownMenuSubTrigger = React.forwardRef<HTMLElement, MenuPrimitive.SubmenuTrigger.Props>(
  ({ children, className, ...props }, ref) => (
    <MenuPrimitive.SubmenuTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      className={mergeClassName(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  ),
)
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, MenuPrimitive.Popup.Props>(
  ({ className, ...props }, ref) => (
    <MenuPrimitive.Popup
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      className={mergeClassName(
        'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-opacity data-[closed]:opacity-0 data-[open]:opacity-100',
        className,
      )}
      {...props}
    />
  ),
)
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="dropdown-menu-shortcut"
    className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
    {...props}
  />
)
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>

export type { DropdownMenuContentProps }
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
