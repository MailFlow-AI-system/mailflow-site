import { expect, type Page, test } from '@playwright/test'

test.describe('shared design system foundation', () => {
  async function waitForThemeIsland(page: Page) {
    await expect(page.locator('astro-island')).not.toHaveAttribute('ssr')
  }

  test('applies stored light before any external hydration script can execute', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('mailflow-theme', 'light'))
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'script' ? route.abort() : route.continue(),
    )

    await page.goto('/')

    await expect(page.locator('astro-island')).toHaveAttribute('ssr')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/)
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('light')
  })

  test('bootstraps dark theme before hydration and renders shared controls', async ({ page }) => {
    await page.addInitScript(() => {
      const bootstrapState = {
        classAtDomContentLoaded: '',
      }

      Object.defineProperty(window, '__mailflowThemeBootstrap', {
        configurable: true,
        value: bootstrapState,
      })

      document.addEventListener(
        'DOMContentLoaded',
        () => {
          bootstrapState.classAtDomContentLoaded = document.documentElement.className
        },
        { once: true },
      )
    })

    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const bootstrapClass = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __mailflowThemeBootstrap?: { classAtDomContentLoaded: string }
          }
        ).__mailflowThemeBootstrap?.classAtDomContentLoaded,
    )

    expect(bootstrapClass).toMatch(/(?:^|\s)dark(?:\s|$)/)
    await expect(page.locator('html')).toHaveClass(/(?:^|\s)dark(?:\s|$)/)
    await expect(page.locator('head script[data-mailflow-theme]')).toHaveCount(1)

    await expect(page.getByRole('heading', { name: 'MailFlow site foundation' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()

    const button = page.getByRole('button', { name: 'Primary action' })
    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('data-slot', 'button')
    await page.locator('label[for="email"]').click()
    await expect(page.getByLabel('Email address')).toBeFocused()
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })

  test('persists light and dark preferences across reloads', async ({ page }) => {
    await page.goto('/')
    await waitForThemeIsland(page)

    const theme = page.getByRole('combobox', { name: 'Theme' })
    await expect(theme).toHaveValue('dark')

    await theme.selectOption('light')
    await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
      .toBe('light')

    await page.reload()
    await waitForThemeIsland(page)
    await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('light')
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
      .toBe('light')

    await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark')
    await page.reload()
    await waitForThemeIsland(page)
    await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
    await expect(page.locator('html')).toHaveClass(/(?:^|\s)dark(?:\s|$)/)
  })

  test('resolves system preference and reacts when the preference changes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await waitForThemeIsland(page)

    await page.getByRole('combobox', { name: 'Theme' }).selectOption('system')
    await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
      .toBe('light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveClass(/(?:^|\s)dark(?:\s|$)/)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
      .toBe('dark')
  })

  test('falls back to dark when stored theme value is invalid', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mailflow-theme', 'invalid'))
    await page.goto('/')
    await waitForThemeIsland(page)

    await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
    await expect(page.locator('html')).toHaveClass(/(?:^|\s)dark(?:\s|$)/)
  })
})
