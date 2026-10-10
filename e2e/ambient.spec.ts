import { expect, test } from '@playwright/test'

test('hero and closing background move only while visible and respect reduced motion', async ({
  page,
}) => {
  await page.goto('/')
  const backgrounds = page.locator('[data-ambient-orbit]')
  await expect(backgrounds).toHaveCount(2)
  const hero = backgrounds.first()
  const closing = backgrounds.last()
  const runningCount = (background: typeof hero) =>
    background.evaluate(
      (el) =>
        el.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running')
          .length,
    )
  await expect.poll(() => runningCount(hero)).toBeGreaterThan(0)
  await expect.poll(() => runningCount(closing)).toBe(0)
  const animatedTransform = () =>
    hero.evaluate((el) => {
      const animation = el.getAnimations({ subtree: true })[0]
      const target = (animation?.effect as KeyframeEffect | null)?.target
      return target ? getComputedStyle(target).transform : null
    })
  const before = await animatedTransform()
  expect(before).not.toBeNull()
  await expect.poll(animatedTransform).not.toBe(before)
  await page.locator('#final-cta').scrollIntoViewIfNeeded()
  await expect.poll(() => runningCount(closing)).toBeGreaterThan(0)
  await expect.poll(() => runningCount(hero)).toBe(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => runningCount(closing)).toBe(0)
  await expect(page.getByRole('heading', { name: "Make space for what's next." })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(() => runningCount(closing)).toBeGreaterThan(0)
})

test('preview settles for interaction and onboarding steps finish their entrance', async ({
  page,
}) => {
  await page.goto('/')
  const preview = page.locator('[data-section-motion="preview"]')
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('data-motion-ready', 'true')
  const search = page.getByLabel('Search sample messages')
  await search.fill('milestones')
  await expect(preview).toHaveAttribute('data-motion-state', 'settled')
  await expect(page.getByRole('button', { name: /Open message from Avery/ })).toBeVisible()
  const frame = page.locator('[data-preview-frame]')
  const transform = await frame.evaluate((el) => getComputedStyle(el).transform)
  await page.mouse.wheel(0, 80)
  await expect(search).toBeFocused()
  await expect.poll(() => frame.evaluate((el) => getComputedStyle(el).transform)).toBe(transform)
  await page.getByRole('button', { name: /Open message from Avery/ }).click()
  await expect(page.getByRole('heading', { name: 'Q4 launch outline' })).toBeVisible()
  const onboarding = page.locator('[data-section-motion="onboarding"]')
  await onboarding.scrollIntoViewIfNeeded()
  await expect(onboarding).toHaveAttribute('data-motion-ready', 'true')
  await onboarding.evaluate((el) => {
    scrollTo(0, el.getBoundingClientRect().bottom + scrollY - innerHeight * 0.3)
  })
  await expect(onboarding).toHaveAttribute('data-motion-progress', '100')
  for (const step of await page.locator('[data-onboarding-step]').all()) {
    await expect.poll(() => step.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1)
    await expect
      .poll(() => step.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42))
      .toBe(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => innerWidth),
  )
})

test('section content stays still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const kind of ['preview', 'onboarding']) {
    const section = page.locator(`[data-section-motion="${kind}"]`)
    await section.scrollIntoViewIfNeeded()
    await expect(section).toHaveAttribute('data-motion-state', 'reduced')
    await expect(section.locator('h2').first()).toBeVisible()
    const transforms = await section
      .locator('[data-preview-frame], [data-onboarding-step]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).transform))
    expect(transforms.every((transform) => transform === 'none')).toBe(true)
  }
})

test('the tilted preview keeps its mobile gutter throughout arrival', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'Desktop Chrome')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const preview = page.locator('[data-section-motion="preview"]')
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('data-motion-ready', 'true')
  const frame = page.locator('[data-preview-frame]')
  await frame.evaluate((el) => {
    scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.98)
  })
  await expect
    .poll(() => frame.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m23))
    .toBeGreaterThan(0.04)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
