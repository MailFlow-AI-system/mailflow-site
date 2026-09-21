import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@mailflow/ui/components'
import { ArrowRight, Menu } from '@mailflow/ui/icons'
import { useState } from 'react'

import Brand from './Brand'
import NavigationLinks from './NavigationLinks'
import ThemeSelector from './ThemeSelector'

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
