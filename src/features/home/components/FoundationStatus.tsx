import { Button } from '@mailflow/ui/button'
import { ArrowRight } from '@mailflow/ui/icons'

export default function FoundationStatus() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">MailFlow site foundation</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            The technical foundation is ready for future MailFlow content.
          </p>
        </div>

        <section
          aria-labelledby="design-system-heading"
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <h2 id="design-system-heading" className="text-lg font-semibold">
            Shared design system
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Buttons, typography, and theme tokens are provided by the shared MailFlow UI package.
          </p>

          <form className="mt-6 flex max-w-md flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button type="button" className="w-fit">
              Primary action
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
