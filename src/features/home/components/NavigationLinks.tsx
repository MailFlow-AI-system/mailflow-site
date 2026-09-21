import { navigationLinks } from '../constants/navigationLinks'

export default function NavigationLinks({
  className = '',
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Primary navigation" className={className}>
      {navigationLinks.map(({ href, label }) => (
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
