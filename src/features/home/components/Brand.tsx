import { Sparkles } from '@mailflow/ui/icons'

export default function Brand() {
  return (
    <a className="flex items-center gap-2 font-semibold tracking-tight" href="/">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20">
        <Sparkles aria-hidden={true} className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="text-lg">MailFlow AI</span>
    </a>
  )
}
