import { expect, test } from '@playwright/test'

test('uses the landing page canonical URL', async ({ page }) => {
  await page.goto('/?utm_source=preview#workspace-preview')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mailflow.example.test/',
  )
})

test('renders search and social metadata without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto('/')

  await expect(page).toHaveTitle(/MailFlow AI.*focused email workspace/i)
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toContain('interactive preview')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow, max-image-preview:large',
  )
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'MailFlow AI',
  )
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://mailflow.example.test/',
  )
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    await page.title(),
  )
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    description ?? '',
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://mailflow.example.test/social/mailflow-og.png',
  )
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /MailFlow/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    await page.title(),
  )
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    'content',
    description ?? '',
  )
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://mailflow.example.test/social/mailflow-og.png',
  )
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
    'content',
    /MailFlow/,
  )
  await context.close()
})

test('describes the real site identity in structured data', async ({ page }) => {
  await page.goto('/')
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
  expect(data['@context']).toBe('https://schema.org')
  expect(data['@graph']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        '@type': 'Organization',
        name: 'MailFlow AI',
        url: 'https://mailflow.example.test/',
        logo: 'https://mailflow.example.test/brand/logo.png',
      }),
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'MailFlow AI',
        url: 'https://mailflow.example.test/',
      }),
    ]),
  )
  expect(JSON.stringify(data)).not.toMatch(
    /\b(?:aggregateRating|review|offers|SearchAction|PostalAddress)\b/,
  )
})

test('keeps signup out of search with its own canonical and metadata', async ({ page }) => {
  await page.goto('/signup?utm_source=landing')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mailflow.example.test/signup/',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://mailflow.example.test/signup/',
  )
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Get started with MailFlow AI',
  )
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
})

test('serves crawlable brand assets and a landing-only sitemap', async ({ page, request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toContain('Sitemap: https://mailflow.example.test/sitemap.xml')
  expect(await robots.text()).not.toContain('Disallow: /signup')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toContain('xml')
  expect(await sitemap.text()).toContain('<loc>https://mailflow.example.test/</loc>')
  expect(await sitemap.text()).not.toContain('signup')

  await page.goto('/')
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg',
  )
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  )
  const favicon = await request.get('/favicon.svg')
  expect(favicon.status()).toBe(200)
  expect(favicon.headers()['content-type']).toContain('image/svg+xml')
  for (const [path, width, height] of [
    ['/social/mailflow-og.png', 1200, 630],
    ['/brand/logo.png', 512, 512],
    ['/apple-touch-icon.png', 180, 180],
    ['/favicon.png', 64, 64],
  ] as const) {
    const asset = await request.get(path)
    expect(asset.status()).toBe(200)
    expect(asset.headers()['content-type']).toContain('image/png')
    const bytes = await asset.body()
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(bytes.readUInt32BE(16)).toBe(width)
    expect(bytes.readUInt32BE(20)).toBe(height)
    expect(bytes.byteLength).toBeLessThan(300_000)
  }
})
