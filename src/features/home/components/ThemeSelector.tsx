import { Label } from '@mailflow/ui/label'
import { type Theme, ThemeProvider, useTheme } from '@mailflow/ui/theme'

const themeOptions: Array<{ value: Theme; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="border-b bg-background px-8 py-4 text-foreground">
      <div className="mx-auto flex max-w-2xl items-center justify-end gap-2 text-sm">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as Theme)}
          className="rounded border border-input bg-background px-2 py-1 text-foreground"
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function ThemeSelector() {
  return (
    <ThemeProvider>
      <ThemeSelect />
    </ThemeProvider>
  )
}
