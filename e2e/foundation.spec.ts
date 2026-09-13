import { expect, test } from '@playwright/test'

test('renders the public site foundation with its canonical URL', async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/')

  await expect(page).toHaveTitle('MailFlow')
  await expect(page.getByRole('heading', { name: 'MailFlow site foundation' })).toBeVisible()
  await expect(
    page.getByText('The technical foundation is ready for future MailFlow content.'),
  ).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mailflow.example.test/',
  )
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
})
