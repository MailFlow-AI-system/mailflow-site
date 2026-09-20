import { expect, type Locator, type Page, test } from '@playwright/test'

const internalAnchors = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
] as const

const faqItems = [
  {
    question: 'Do I need to switch my current email provider?',
    answer:
      'No. You connect your existing Gmail, Outlook, or SMTP accounts and manage everything inside MailFlow AI.',
  },
  {
    question: 'Does AI cost extra?',
    answer:
      'The AI assistant is included in the Pro and Enterprise plans. On Starter, you get a generous monthly usage allowance.',
  },
  {
    question: 'Can I import my contact lists?',
    answer:
      'Yes. Import via CSV, API, or direct integrations. MailFlow AI automatically detects fields and duplicates.',
  },
  {
    question: 'Is there a long-term contract?',
    answer: 'No. You can cancel or change plans at any time, with no cancellation fees.',
  },
] as const

async function waitForHydration(page: Page) {
  await expect(page.locator('astro-island')).toHaveCount(2)
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

test('renders the landing page sections in the approved order', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  await expect(page).toHaveTitle(
    'MailFlow AI | Email, marketing, and AI in one seamless experience',
  )
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Email, marketing, and AI in one seamless experience',
  )
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()

  const sectionOrder = await page
    .locator('main section')
    .evaluateAll((sections) =>
      sections.map((section) => section.id || section.getAttribute('aria-label')),
    )

  expect(sectionOrder).toEqual([
    null,
    'Trusted companies',
    'features',
    'ai-assistant',
    'how-it-works',
    'metrics',
    'testimonials',
    'pricing',
    'faq',
    'final-cta',
  ])
})

test('navigation links resolve to each internal section', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  for (const [label, href] of internalAnchors) {
    const isMobile = test.info().project.name === 'Mobile Chrome'
    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
      await expect(
        page.getByRole('dialog', { name: 'Mobile navigation', exact: true }),
      ).toBeVisible()
    }

    const links = page.locator(`a[href="${href}"]`)
    await expect(links).not.toHaveCount(0)
    await expect(links.first()).toHaveAttribute('href', href)

    const visibleLink = isMobile
      ? page
          .getByRole('dialog', { name: 'Mobile navigation', exact: true })
          .getByRole('link', { name: label, exact: true })
      : page.locator(`a[href="${href}"]:visible`).first()
    await visibleLink.click()
    await expect(page).toHaveURL(new RegExp(`${href.replace('#', '\\#')}$`))
    await expect(page.locator(href)).toBeVisible()
    await page.goto('/')
    await waitForHydration(page)
    await expect(page.locator(`a[href="${href}"]`)).not.toHaveCount(0)
  }
})

test('keeps commercial and external actions inert until their integrations exist', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await waitForHydration(page)
  const initialUrl = page.url()
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toHaveCount(0)

  await expect(page.getByText('Sign In', { exact: true })).toHaveCount(0)

  const assertDisabled = async (name: string) => {
    const buttons = page.getByRole('button', { name, exact: true })
    await expect(buttons).not.toHaveCount(0)

    for (let index = 0; index < (await buttons.count()); index += 1) {
      await expect(buttons.nth(index)).toBeDisabled()
      await buttons.nth(index).evaluate((button) => (button as HTMLButtonElement).click())
      await expect(page).toHaveURL(initialUrl)
    }
  }

  const backgroundActions =
    testInfo.project.name === 'Mobile Chrome'
      ? ['Talk to sales', 'Start for free', 'Watch demo']
      : ['Sign Up', 'Talk to sales', 'Start for free', 'Watch demo']
  for (const name of backgroundActions) await assertDisabled(name)

  if (testInfo.project.name === 'Mobile Chrome') {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toHaveCount(0)
    await assertDisabled('Sign Up')
    await page.keyboard.press('Escape')
  }

  await expect(page).toHaveURL(initialUrl)
})

test('opens and closes mobile navigation with Escape', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'Mobile Chrome',
    'Mobile navigation is covered by Mobile Chrome',
  )

  await page.goto('/')
  await waitForHydration(page)
  const trigger = page.getByRole('button', { name: 'Open navigation', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Mobile navigation', exact: true })

  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Features', exact: true })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('renders and toggles all FAQ questions and answers', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  const faq = page.locator('#faq')
  await expect(faq.getByRole('button')).toHaveCount(faqItems.length)

  for (const [index, item] of faqItems.entries()) {
    const trigger = faq.getByRole('button', { name: item.question, exact: true })
    const panel = page.locator(`#faq-panel-${index}`)

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText(item.answer)

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()
  }
})

test('renders three testimonial groups with five-star ratings', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  const testimonials = page.locator('#testimonials figure')
  await expect(testimonials).toHaveCount(3)

  for (let index = 0; index < 3; index += 1) {
    const rating = testimonials.nth(index).getByRole('img', { name: '5 out of 5 stars' })
    await expect(rating).toBeVisible()
    await expect(rating.locator('[aria-hidden="true"]')).toHaveCount(5)
  }
})

test('keeps the final Start for free CTA disabled with its arrow icon', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  const cta = page.locator('#final-cta').getByRole('button', {
    name: 'Start for free',
    exact: true,
  })
  await expect(cta).toBeDisabled()
  await expect(cta.locator('svg')).toHaveCount(1)
})

test('applies the reference primary-to-indigo gradients on the CTA and brand marks', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'Desktop Chrome',
    'Reference gradient fills are covered by Desktop Chrome',
  )

  await page.goto('/')
  await waitForHydration(page)

  const backgroundImage = (locator: Locator) =>
    locator.evaluate((element) => getComputedStyle(element).backgroundImage)

  const ctaSurface = page.locator('#final-cta > div').first()
  const headerMark = page.getByRole('banner').locator('a[href="/"] span').first()
  const footerMark = page.locator('footer a[href="/"] span').first()

  await expect(ctaSurface).toHaveClass(/bg-gradient-to-br/)
  await expect(ctaSurface).toHaveClass(/from-primary/)
  await expect(ctaSurface).toHaveClass(/to-indigo-700/)
  await expect.poll(() => backgroundImage(ctaSurface)).toMatch(/linear-gradient/)

  for (const mark of [headerMark, footerMark]) {
    await expect(mark).toHaveClass(/bg-gradient-to-br/)
    await expect(mark).toHaveClass(/from-primary/)
    await expect(mark).toHaveClass(/to-indigo-600/)
    await expect.poll(() => backgroundImage(mark)).toMatch(/linear-gradient/)
    await expect(mark.locator('svg')).toHaveAttribute('stroke-width', '2.5')
  }
})

test('aligns primary glow shadows to the hero inbox, AI section, and Pro card', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'Desktop Chrome',
    'Primary glow shadows are covered by Desktop Chrome',
  )

  await page.goto('/')
  await waitForHydration(page)

  const heroFrame = page.locator('figure[aria-label="MailFlow inbox preview"] .shadow-2xl').first()
  await expect(heroFrame).toHaveClass(/shadow-primary\/10/)
  await expect(heroFrame).not.toHaveClass(/isolate/)
  await expect(heroFrame.locator(':scope > [aria-hidden="true"].blur-2xl')).toHaveCount(0)
  await expect
    .poll(() => heroFrame.evaluate((element) => getComputedStyle(element).boxShadow))
    .toMatch(/oklab\(|oklch\(/)

  const pageWash = page.locator('.min-h-screen > [aria-hidden="true"]').first()
  const pageOrbs = pageWash.locator(':scope > div')
  await expect(pageOrbs).toHaveCount(3)
  await expect(pageOrbs.nth(0)).toHaveClass(/bg-primary\/10/)
  await expect(pageOrbs.nth(1)).toHaveClass(/bg-indigo-500\/10/)
  await expect(pageOrbs.nth(1)).toHaveClass(/-left-1\/4/)
  await expect(pageOrbs.nth(2)).toHaveClass(/bg-violet-500\/10/)
  await expect(pageOrbs.nth(2)).toHaveClass(/-right-1\/4/)

  const aiSection = page.locator('#ai-assistant')
  await expect(aiSection).not.toHaveClass(/isolate/)
  await expect(aiSection.locator(':scope > [aria-hidden="true"]')).toHaveCount(0)
  await expect(page.locator('#ai-assistant figure')).not.toHaveClass(/shadow-primary\/10/)

  const proCard = page.locator('#pricing article').filter({ hasText: 'Most popular' })
  await expect(proCard).toHaveClass(/shadow-xl/)
  await expect(proCard).toHaveClass(/shadow-primary\/10/)
  await expect(proCard).toHaveClass(/ring-primary\/30/)
  await expect(proCard.locator(':scope > [aria-hidden="true"].blur-2xl')).toHaveCount(0)
  await expect
    .poll(() => proCard.evaluate((element) => getComputedStyle(element).boxShadow))
    .toMatch(/oklab\(|oklch\(/)
})

test('verifies the approved hover states', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'Desktop Chrome',
    'Reference hover states are covered by Desktop Chrome',
  )

  await page.goto('/')
  await waitForHydration(page)

  const computedStyle = (locator: ReturnType<typeof page.locator>, property: string) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
  const resetHover = () => page.locator('body').hover({ position: { x: 0, y: 0 } })
  const expectHoverChange = async (locator: ReturnType<typeof page.locator>, property: string) => {
    await resetHover()
    const before = await computedStyle(locator, property)
    await locator.hover()
    await expect.poll(() => computedStyle(locator, property)).not.toBe(before)
  }

  await expectHoverChange(page.locator('header nav a[href="#features"]:visible'), 'color')
  await expectHoverChange(
    page
      .locator('footer span')
      .filter({ hasText: /^Integrations$/ })
      .first(),
    'color',
  )

  const featureCard = page.locator('#features article').first()
  await expectHoverChange(featureCard, 'border-top-color')
  await expectHoverChange(featureCard, 'background-color')
  await expectHoverChange(featureCard.locator(':scope > div').first(), 'background-color')
  await expectHoverChange(page.locator('#metrics dl > div').first(), 'background-color')

  const badges = [
    page.getByText('Now with a built-in AI assistant', { exact: true }).locator('..'),
    page.getByText('+12% opens', { exact: true }),
    page.getByText('suggested by AI', { exact: true }),
    page.getByText('Artificial Intelligence', { exact: true }),
    page.getByText('Most popular', { exact: true }),
  ]
  for (const badge of badges) await expectHoverChange(badge, 'background-color')
})

test('persists light, dark, and system theme choices', async ({ page }) => {
  const isMobile = test.info().project.name === 'Mobile Chrome'
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await waitForHydration(page)
  await page.evaluate(() => localStorage.removeItem('mailflow-theme'))
  await page.reload()
  await waitForHydration(page)

  const themeButton = isMobile
    ? page
        .getByRole('dialog', { name: 'Mobile navigation', exact: true })
        .locator('button[aria-label="Theme"]')
    : page.locator('button[aria-label="Theme"]:visible').first()
  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Mobile navigation', exact: true })).toBeVisible()
  }
  const chooseTheme = async (label: 'Light' | 'Dark' | 'System') => {
    await themeButton.click()
    const option = page.getByRole('menuitemradio', { name: label, exact: true })
    await expect(option).toBeVisible()
    await option.click()
    await expect(themeButton).toHaveAttribute('aria-expanded', 'false')
  }

  await chooseTheme('Light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('mailflow-theme'))).toBe('light')

  await chooseTheme('Dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => localStorage.getItem('mailflow-theme'))).toBe('dark')

  await chooseTheme('System')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('mailflow-theme'))).toBe('system')

  if (isMobile) await page.keyboard.press('Escape')
  await page.reload()
  await waitForHydration(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('closes mobile navigation after an internal anchor click and preserves the hash', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'Mobile Chrome',
    'Mobile anchor behavior is covered by Mobile Chrome',
  )

  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Mobile navigation', exact: true })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('link', { name: 'Features', exact: true }).click()
  await expect(page).toHaveURL(/#features$/)
  await expect(page.locator('#features')).toBeVisible()
  await expect(dialog).toBeHidden()
})

test('has no console, page, hydration, or horizontal overflow errors', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await waitForHydration(page)
  await page.waitForLoadState('networkidle')

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }))

  expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  expect(pageErrors, pageErrors.join('\n')).toEqual([])
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport)
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport)
})

test('keeps theme controls keyboard reachable and restores focus after closing', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await waitForHydration(page)
  const themeButton =
    testInfo.project.name === 'Mobile Chrome'
      ? page
          .getByRole('dialog', { name: 'Mobile navigation', exact: true })
          .locator('button[aria-label="Theme"]')
      : page.locator('button[aria-label="Theme"]:visible').first()
  if (testInfo.project.name === 'Mobile Chrome') {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Mobile navigation', exact: true })).toBeVisible()
  }
  await themeButton.focus()
  await expect(themeButton).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitemradio', { name: 'Light', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(themeButton).toBeFocused()
})
