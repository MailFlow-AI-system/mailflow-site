import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function waitForHydration(page: Page) {
  await expect(page.locator('astro-island')).toHaveCount(2)
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

for (const theme of ['light', 'dark'] as const) {
  test(`passes Axe ${theme} theme checks`, { tag: axeTags.map((tag) => `@${tag}`) }, async ({
    page,
  }) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('mailflow-theme', selectedTheme)
    }, theme)
    await page.goto('/')
    await waitForHydration(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const results = await new AxeBuilder({ page }).withTags(axeTags).analyze()
    expect(results.violations).toEqual([])
  })

  test(`passes Axe ${theme} checks with the first FAQ expanded`, {
    tag: axeTags.map((tag) => `@${tag}`),
  }, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('mailflow-theme', selectedTheme)
    }, theme)
    await page.goto('/')
    await waitForHydration(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const trigger = page.getByRole('button', {
      name: 'Do I need to switch my current email provider?',
      exact: true,
    })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const results = await new AxeBuilder({ page }).withTags(axeTags).analyze()
    expect(results.violations).toEqual([])
  })

  test(
    `passes Axe ${theme} checks with mobile navigation and theme menu open`,
    { tag: axeTags.map((tag) => `@${tag}`) },
    async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'Mobile Chrome',
        'Mobile sheet and theme menu are covered by Mobile Chrome',
      )

      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem('mailflow-theme', selectedTheme)
      }, theme)
      await page.goto('/')
      await waitForHydration(page)

      await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Mobile navigation', exact: true })
      await expect(dialog).toBeVisible()
      await dialog.locator('button[aria-label="Theme"]').click()
      await expect(page.getByRole('menuitemradio', { name: 'System', exact: true })).toBeVisible()

      const results = await new AxeBuilder({ page }).withTags(axeTags).analyze()
      expect(results.violations).toEqual([])
    },
  )
}
