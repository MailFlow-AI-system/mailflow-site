import { expect, test } from '@playwright/test'
import { faqItems } from '../src/features/home/constants/faqItems'
import { navigationLinks } from '../src/features/home/constants/navigationLinks'

async function waitForHeader(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => document.querySelector('header')?.closest('astro-island')?.hasAttribute('ssr') === false,
  )
}

test('signup actions preserve the account creation route', async ({ page }) => {
  await page.goto('/')
  const actions = page.getByRole('link', { name: 'Create your account', exact: true })
  await expect(actions).toHaveCount(2)
  for (const link of await actions.all()) await expect(link).toHaveAttribute('href', '/signup')
  await actions.first().click()
  await expect(page).toHaveTitle('Get started with MailFlow AI')
  await expect(page.getByRole('form', { name: 'Create your account' })).toBeVisible()
  for (const label of ['Name', 'Email', 'Password'])
    await expect(page.getByLabel(label, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to MailFlow' })).toHaveAttribute('href', '/')
})

test('navigation reaches the narrative, preview, onboarding and FAQ', async ({
  page,
}, testInfo) => {
  for (const link of navigationLinks) {
    await page.goto('/')
    await waitForHeader(page)
    if (testInfo.project.name === 'Mobile Chrome') {
      await page.getByRole('button', { name: 'Open navigation' }).click()
      await page
        .getByRole('dialog', { name: 'Mobile navigation' })
        .getByRole('link', { name: link.label, exact: true })
        .click()
      await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeHidden()
    } else await page.locator('header').getByRole('link', { name: link.label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${link.href}$`))
    await expect(page.locator(link.href)).toBeVisible()
  }
})

test('mobile navigation restores focus after Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome')
  await page.goto('/')
  await waitForHeader(page)
  const trigger = page.getByRole('button', { name: 'Open navigation' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Mobile navigation' })).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('FAQ answers remain keyboard accessible', async ({ page }) => {
  await page.goto('/')
  for (const item of faqItems) {
    const trigger = page.getByRole('button', { name: item.question, exact: true })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    if (!item.answer) throw new Error('FAQ answer is required')
    await expect(page.getByText(item.answer, { exact: true })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  }
})

test('theme selection persists and restores keyboard focus', async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await waitForHeader(page)
  const mobile = testInfo.project.name === 'Mobile Chrome'
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click()
  const theme = page.getByRole('button', { name: 'Theme', exact: true })
  for (const label of ['Light', 'Dark', 'System']) {
    await theme.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      label === 'Dark' ? 'dark' : 'light',
    )
    await expect(theme).toBeFocused()
  }
  if (mobile) await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('interactive preview supports search, reading and a local draft', async ({ page }) => {
  await page.goto('/#workspace-preview')
  const preview = page.locator('#workspace-preview')
  await expect(preview).toBeVisible()
  await page.waitForFunction(
    () =>
      document.querySelector('#workspace-preview')?.closest('astro-island')?.hasAttribute('ssr') ===
      false,
  )
  await page.getByLabel('Search sample messages').fill('milestones')
  await expect(preview.locator('[data-message-id]')).toHaveCount(1)
  await preview.getByRole('button', { name: /Open message from Avery/ }).click()
  await expect(page.getByRole('button', { name: 'Back to inbox' })).toBeFocused()
  await preview.getByRole('button', { name: 'Draft a reply' }).click()
  await page.getByLabel('Reply to Avery Chen').fill('A thoughtful next step.')
  await expect(page.getByLabel('Reply to Avery Chen')).toHaveValue('A thoughtful next step.')
  await preview.getByRole('button', { name: 'Close draft' }).click()
  await expect(preview.getByRole('button', { name: 'Draft a reply' })).toBeFocused()
  await page.getByRole('button', { name: 'Back to inbox' }).click()
  await expect(preview.getByRole('button', { name: /Open message from Avery/ })).toBeFocused()
  await page.getByLabel('Search sample messages').fill('no-match')
  await expect(page.getByText('No sample messages match your search.')).toBeVisible()
})

test('page has no hydration errors, overflow or broken sticky header', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await waitForHeader(page)
  await page.evaluate(() => window.scrollTo(0, 600))
  expect(
    await page
      .locator('header')
      .first()
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
