import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { DeliveryCapture, OnboardingFixtures } from './types'

test('real signup, refresh, resend, OTP and login bootstrap the new workspace', async ({
  page,
  context,
}, testInfo) => {
  const fixtures = (await (
    await fetch('http://127.0.0.1:8082/__fixture')
  ).json()) as OnboardingFixtures
  const scenario = fixtures.scenarios.find((value) => value.project === testInfo.project.name)
  if (!scenario) throw new Error('Missing isolated browser scenario')
  const loginUrl = `http://${scenario.slug}.workspace.test:3001/login`
  const password = 'synthetic-browser-password-123'
  const deliveries = async () =>
    (await (
      await fetch('http://127.0.0.1:8082/__delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: scenario.email }),
      })
    ).json()) as DeliveryCapture
  await page.goto('/signup')
  // SSR fields are visible before the React island is interactive. Wait on a
  // real interaction, not a fixed delay, before entering browser test values.
  await expect
    .poll(async () => {
      await page.getByRole('button', { name: 'Show password', exact: true }).click()
      return page.getByLabel('Password', { exact: true }).getAttribute('type')
    })
    .toBe('text')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await expect(page.getByLabel('Workspace name')).toBeVisible()
  await page.getByLabel('Workspace name').fill(scenario.name)
  await page.getByLabel('Workspace subdomain').fill(scenario.slug)
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('onboarding-dark.png'), fullPage: true })
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
  })
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('onboarding-light.png'), fullPage: true })
  await page.getByLabel('Name', { exact: true }).fill('Browser User')
  await page.getByLabel('Email', { exact: true }).fill(scenario.email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  const signup = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/onboarding/signup') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  expect((await signup).status()).toBe(202)
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
  expect((await context.cookies()).some((cookie) => cookie.name.includes('session'))).toBe(false)
  const blocked = await fetch('http://127.0.0.1:8082/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: new URL(loginUrl).origin },
    body: JSON.stringify({ email: scenario.email, password }),
  })
  expect(blocked.ok).toBe(false)
  await deliveries()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
  await page.getByRole('button', { name: 'Resend code', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('a new code will arrive shortly')
  const capture = await deliveries()
  const otp = [...capture.messages].reverse().find((message) => message.kind === 'verification-otp')
  if (otp?.kind !== 'verification-otp') throw new Error('Verification delivery was not captured')
  await page.getByLabel('6-digit code').fill(otp.otp)
  await page.getByRole('button', { name: 'Verify email', exact: true }).click()
  await expect(page).toHaveURL(loginUrl, { timeout: 20000 })
  expect((await context.cookies()).some((cookie) => cookie.name.includes('session'))).toBe(false)
  const welcome = (await deliveries()).messages.find(
    (message) => message.kind === 'verified-welcome',
  )
  expect(welcome).toMatchObject({ kind: 'verified-welcome', loginUrl })
  await expect
    .poll(async () => {
      await page.getByRole('button', { name: 'Show password', exact: true }).click()
      return page.getByLabel('Password', { exact: true }).getAttribute('type')
    })
    .toBe('text')
  await page.getByLabel('Email', { exact: true }).fill(scenario.email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(`http://${scenario.slug}.workspace.test:3001/inbox`, {
    timeout: 20000,
  })
  if (testInfo.project.name === 'Mobile Chrome')
    await page.getByRole('button', { name: 'Alternar barra lateral' }).click()
  await expect(page.getByRole('combobox', { name: `Workspace: ${scenario.name}` })).toBeVisible({
    timeout: 15000,
  })
})
