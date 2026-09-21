import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@mailflow/ui/components'
import { Moon, Settings, Sun } from '@mailflow/ui/icons'
import { type Theme, ThemeProvider, useTheme } from '@mailflow/ui/theme'
import { type ComponentType, useState } from 'react'

type ThemeSelectorProps = {
  side?: NonNullable<DropdownMenuContentProps['side']>
}

const themeOptions: Array<{
  value: Theme
  label: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; className?: string }>
}> = [
  { value: 'system', label: 'System', icon: Settings },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function ThemeSelectorControl({ side = 'bottom' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const selectedOption = themeOptions.find((option) => option.value === theme) ?? themeOptions[0]
  const SelectedIcon = selectedOption.icon

  function handleThemeChange(value: unknown) {
    setTheme(value as Theme)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label="Theme">
            <SelectedIcon aria-hidden={true} className="size-4" />
            <span>{selectedOption.label}</span>
          </Button>
        }
      />
      <DropdownMenuContent side={side} align="end" aria-label="Theme preference">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {themeOptions.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden={true} className="mr-2 size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ThemeSelector({ side = 'bottom' }: ThemeSelectorProps) {
  return (
    <ThemeProvider>
      <ThemeSelectorControl side={side} />
    </ThemeProvider>
  )
}

export type { ThemeSelectorProps }
export { ThemeSelectorControl, themeOptions }
