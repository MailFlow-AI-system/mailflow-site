# Brand assets

The editable sources are `public/favicon.svg` and `public/social/mailflow-og.svg`.
They reuse the existing `Brand.tsx` Sparkles icon from `@mailflow/ui/icons`, its
stroke weight, and the dark-theme violet-to-indigo gradient. The social image
uses the landing page's existing headline and description. No generated imagery
or external font downloads are required.

After editing the SVG sources, regenerate the committed PNG files:

```bash
bun scripts/renderBrandAssets.mjs
```

The script uses Sharp, already installed by Astro. It validates the dimensions
and size of each output. This is an authoring command; site builds serve the
committed images without rerendering them. SVG text uses the system's Arial or
DejaVu Sans fallback, so text rasterization can vary between authoring machines.

## Listening

SEO metadata and crawler URLs use the build-time `SITE_URL` configuration. The
landing page is the only sitemap entry. Signup remains crawlable so search
engines can read its `noindex` directive; blocking it in `robots.txt` would hide
that directive. Structured data describes only the existing brand and website,
without unverified reviews, pricing, business addresses, or product capabilities.
