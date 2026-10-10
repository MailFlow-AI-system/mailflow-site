import { expect, test } from '@playwright/test'

test('cinematic narrative keeps its content and honest calls to action', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Less noise. More flow.')
  await expect(page.locator('article[data-story-chapter]')).toHaveCount(3)
  await expect(
    page.getByRole('link', { name: 'Create your account', exact: true }).first(),
  ).toHaveAttribute('href', '/signup')
  await expect(
    page.getByRole('link', { name: 'Explore the workspace', exact: true }),
  ).toHaveAttribute('href', '#workspace-preview')
  await expect(page.getByText('40%', { exact: true })).toHaveCount(0)
  await expect(page.getByText('2,500+', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Watch demo' })).toHaveCount(0)
})

test('reduced motion preserves the story without a WebGL download', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('#features').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-scene-host] canvas')).toHaveCount(0)
  for (const heading of [
    'Find your focus.',
    'Stay with the conversation.',
    'Make room for your next thought.',
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Explore the workspace', exact: true }).click()
  await expect(page).toHaveURL(/#workspace-preview$/)
})

test('the landing remains readable when JavaScript is disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Less noise. More flow.')
  await expect(
    page.getByRole('link', { name: 'Create your account', exact: true }).first(),
  ).toHaveAttribute('href', '/signup')
  await expect(page.getByRole('heading', { name: 'Find your focus.' })).toBeVisible()
  await expect(page.locator('[data-scene-fallback]')).toBeVisible()
  await context.close()
})

test('an unavailable animation engine leaves the static story usable', async ({ page }) => {
  let engineRequests = 0
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.route('**/cinematicMotion.*.js', (route) => {
    engineRequests += 1
    return route.abort()
  })
  await page.goto('/')
  await page.waitForTimeout(400)
  expect(engineRequests).toBe(0)
  await page.locator('#features').scrollIntoViewIfNeeded()
  await expect.poll(() => engineRequests).toBeGreaterThan(0)
  await expect(page.locator('[data-scene-host] canvas')).toHaveCount(0)
  await expect(page.locator('[data-scene-fallback]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Find your focus.' })).toBeVisible()
  expect(pageErrors).toEqual([])
})

for (const width of [640, 900, 1440]) {
  test(`the ${width}px story stays visible and animates forward and backward`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome')
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const journey = page.locator('[data-cinematic-journey]')
    await journey.scrollIntoViewIfNeeded()
    await expect(journey).toHaveAttribute('data-motion-ready', 'true')
    const host = page.locator('[data-scene-host]')
    await expect(host).toHaveAttribute('data-scene-status', 'ready')
    const initialFrames = Number(await host.getAttribute('data-scene-frames'))
    const initialResizes = await host.getAttribute('data-scene-resizes')
    const seek = (progress: number) =>
      page.evaluate((value) => {
        const root = document.querySelector<HTMLElement>('[data-cinematic-journey]')
        if (!root) throw new Error('Journey is missing')
        const top = root.getBoundingClientRect().top + scrollY
        const start = top - 100
        const end = top + root.offsetHeight - innerHeight
        scrollTo(0, start + (end - start) * value)
      }, progress)
    const opacity = (selector: string) =>
      page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity))
    await seek(0.6)
    await expect.poll(() => opacity('[data-story-reader]')).toBeGreaterThan(0.99)
    await expect.poll(() => opacity('[data-story-editor]')).toBe(0)
    const stage = page.locator('[data-story-stage]')
    await expect.poll(() => stage.evaluate((el) => el.getBoundingClientRect().top)).toBe(86)
    await expect
      .poll(async () => Number(await host.getAttribute('data-scene-frames')))
      .toBeGreaterThan(initialFrames)
    expect(await host.getAttribute('data-scene-resizes')).toBe(initialResizes)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await seek(0.99)
    await expect.poll(() => opacity('[data-story-editor]')).toBeGreaterThan(0.99)
    await expect.poll(() => opacity('[data-story-reader]')).toBe(0)
    await seek(0.6)
    await expect.poll(() => opacity('[data-story-reader]')).toBeGreaterThan(0.99)
    await expect.poll(() => opacity('[data-story-editor]')).toBe(0)
  })
}

test('resizing the panel and changing motion preference rebuilds the scene safely', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'Desktop Chrome')
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto('/')
  const journey = page.locator('[data-cinematic-journey]')
  const host = page.locator('[data-scene-host]')
  await journey.scrollIntoViewIfNeeded()
  await expect(host).toHaveAttribute('data-scene-status', 'ready')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(host.locator('canvas')).toHaveCount(0)
  await expect(page.locator('[data-scene-fallback]')).toBeVisible()
  await page.setViewportSize({ width: 900, height: 900 })
  await journey.scrollIntoViewIfNeeded()
  await expect(host).toHaveAttribute('data-scene-status', 'ready')
  await expect(host.locator('canvas')).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(host.locator('canvas')).toHaveCount(0)
  await expect(page.locator('[data-scene-fallback]')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await journey.scrollIntoViewIfNeeded()
  await expect(host).toHaveAttribute('data-scene-status', 'ready')
  await expect(host.locator('canvas')).toHaveCount(1)
})
