import { expect, test } from '@playwright/test'

test('uses the landing page canonical URL', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mailflow.example.test/',
  )
})
