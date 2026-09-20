import { Button } from '@mailflow/ui/components'
import { ArrowRight, Menu, Sparkles } from '@mailflow/ui/icons'
import { useState } from 'react'

import ThemeSelector from './ThemeSelector'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

const navigationItems = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

function NavigationLinks({
  className = '',
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Primary navigation" className={className}>
      {navigationItems.map(({ href, label }) => (
        <a
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          href={href}
          key={href}
          onClick={onNavigate}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <a className="flex items-center gap-2 font-semibold tracking-tight" href="/">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20">
        <Sparkles aria-hidden={true} className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="text-lg">MailFlow AI</span>
    </a>
  )
}

export default function Header() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Brand />

        <NavigationLinks className="hidden items-center gap-6 md:flex" />

        <div className="hidden items-center gap-3 md:flex">
          <ThemeSelector />
          <Button className="disabled:opacity-100" disabled={true} size="sm">
            Sign Up
            <ArrowRight aria-hidden={true} />
          </Button>
        </div>

        <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
          <SheetTrigger
            render={
              <Button
                aria-label="Open navigation"
                className="md:hidden"
                size="icon"
                variant="ghost"
              />
            }
          >
            <Menu aria-hidden={true} />
          </SheetTrigger>
          <SheetContent aria-label="Mobile navigation" className="w-3/4 max-w-sm">
            <SheetHeader className="pr-8 text-left">
              <SheetTitle>Mobile navigation</SheetTitle>
              <SheetDescription>Explore MailFlow AI.</SheetDescription>
            </SheetHeader>
            <NavigationLinks
              className="flex flex-col gap-5"
              onNavigate={() => setMobileNavigationOpen(false)}
            />
            <div className="mt-auto flex flex-col gap-3">
              <ThemeSelector side="top" />
              <Button className="disabled:opacity-100" disabled={true}>
                Sign Up
                <ArrowRight aria-hidden={true} />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export { navigationItems }
