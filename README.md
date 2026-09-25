# MailFlow Site

MailFlow Site is the public Astro website for MailFlow AI. The current page is a complete static marketing landing page with explicit hydration boundaries for navigation, theme selection, the mobile sheet, and the FAQ accordion.

## Requirements

- Node.js `24.20.0`
- Bun `1.4.1`
- Infisical CLI
- Access to the `MailFlow-AI` project in Infisical for local development

The expected Node.js version is recorded in `.node-version`; the Bun version is recorded in `package.json`.

## Local setup

Install the locked dependencies:

```bash
bun install --frozen-lockfile
```

Authenticate the Infisical CLI:

```bash
infisical login
```

The committed `.infisical.json` links this repository to `MailFlow-AI`. Development commands read the `dev` environment and `/mailflow-site` secret path. Run `infisical init` only when the checkout must be linked to a different project.

Create the local public configuration and start the development server:

```bash
cp .env.example .env
bun run dev
```

The site is available at `http://127.0.0.1:4321`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start Astro with the Infisical `dev` environment |
| `bun run build` | Build the static site into `dist/` |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run Biome checks |
| `bun run lint:fix` | Apply safe Biome fixes |
| `bun run format:check` | Check formatting with Biome |
| `bun run format` | Format files with Biome |
| `bun run typecheck` | Run `astro check` |
| `bun run test` | Run colocated Vitest component tests |
| `bun run test:watch` | Run Vitest in watch mode |
| `bun run test:e2e` | Run the landing-page Playwright suite in Desktop Chrome and Mobile Chrome |
| `bunx playwright test e2e/accessibility.spec.ts` | Run Axe checks for light and dark themes in both browser projects |
| `bun run check:deploy` | Validate development, staging, and production Worker bundles without deploying |
| `bun run check` | Run lint, format, typecheck, unit tests, static build, and Worker dry-runs |

`SITE_URL` is required for commands that build or inspect canonical metadata. For a reproducible local validation run:

```bash
SITE_URL=https://mailflow.example.test bun run check
bun run test:e2e
bunx playwright test e2e/accessibility.spec.ts
```

Install the local Chromium browser and Linux dependencies before the first E2E run when needed:

```bash
bunx playwright install --with-deps chromium
```

## Environment and security

Infisical is the secret-delivery boundary for local development. The `/mailflow-site` path currently contains no secrets; add future secrets there instead of committing them or writing them to `.env`. The `.infisical.json` file contains project-link metadata only and is safe to commit.

`SITE_URL` is public site configuration used to build canonical URLs. Its local value is documented in `.env.example`; `.env` is ignored and must not be committed. Never place passwords, API keys, tokens, or other secrets in public environment variables, source files, fixtures, browser tests, or logs.

## Deployment

Cloudflare Workers Static Assets serves the generated `dist/` directory without a
Worker script or Astro server adapter. Wrangler maps the environments to the
existing Workers:

- `wrangler deploy --env development` targets `mailflow-site-development`.
- `wrangler deploy --env staging` targets `mailflow-site-staging`.
- `wrangler deploy --env production` targets `mailflow-site`.

Cloudflare Workers Builds owns deployment triggers for `development`, `staging`,
and `main`. GitHub Actions validates changes but does not deploy them. Configure
`SITE_URL` in each Cloudflare build environment after the final domains are set.

## Architecture

Astro owns public page composition and static rendering. React owns the small set of interactions that need a browser runtime. The landing page composition is:

```text
Header client:load
main
├── Hero
├── TrustBar
├── Features
├── AiAssistant
├── HowItWorks
├── Metrics
├── Testimonials
├── Pricing
├── Faq client:load
└── FinalCta
Footer
```

Repository layout for the landing page:

```text
.
├── docs/
│   └── landing-page.md
├── e2e/
│   ├── accessibility.spec.ts
│   └── landing.spec.ts
├── src/
│   ├── features/home/components/
│   │   ├── Header.tsx
│   │   ├── Faq.tsx
│   │   ├── Hero.astro
│   │   ├── TrustBar.astro
│   │   ├── Features.astro
│   │   ├── AiAssistant.astro
│   │   ├── HowItWorks.astro
│   │   ├── Metrics.astro
│   │   ├── Testimonials.astro
│   │   ├── Pricing.astro
│   │   ├── FinalCta.astro
│   │   ├── Footer.astro
│   ├── layouts/SiteLayout.astro
│   ├── pages/index.astro
│   ├── shared/config/site.ts
│   ├── styles/global.css
│   └── test/setup.ts
├── astro.config.mjs
├── playwright.config.ts
└── vitest.config.ts
```

Ownership rules:

- `src/pages/` owns route entrypoints and page-level composition. Keep feature behavior in `src/features/` instead of growing route files into application modules.
- `src/features/home/` owns landing-page sections, content presentation, and interaction composition for the home capability. Static sections stay Astro; interactive sections stay React and receive the smallest required `client:*` directive at the route boundary.
- Reusable interaction primitives such as the sheet, accordion, and dropdown menu come from `@mailflow/ui/components`. Keep landing-specific composition in `src/features/home/components/`.
- `src/shared/` owns stable technical configuration and genuinely reusable primitives. It must not become a dumping ground for feature-specific logic.
- `src/layouts/` owns the document shell, metadata, canonical URL, theme bootstrap, and slots. Layouts do not own landing-page content.
- `src/styles/` owns global imports and site-wide styles. Keep feature-specific styling close to its feature when it does not belong in the global layer.
- `src/test/` owns shared test setup only. Colocated component tests verify accessible user-observable behavior; `e2e/` verifies complete browser flows through the running site.

## Design-system integration

The landing page consumes `@mailflow/ui` from design-system SHA `e95368187e345be4ba3e2a4bf4830e60cbbf491e`.

- Import reusable buttons and icons from `@mailflow/ui/components` and `@mailflow/ui/icons`.
- Import `ThemeProvider`, `useTheme`, and `Theme` from `@mailflow/ui/theme`.
- Import the synchronous theme bootstrap from `@mailflow/ui/theme-script` in `SiteLayout.astro`.
- Use shared semantic tokens such as `background`, `foreground`, `muted`, `border`, and `primary` rather than consumer-only color values.
- Keep reusable primitives in the design system; the site only composes them for landing-page interactions.

## Validation coverage

The landing E2E suite covers section order and presence, internal anchors, mobile navigation open/Escape behavior, FAQ open/close behavior, system/light/dark theme selection and persistence, console/page errors, hydration regressions, horizontal overflow, keyboard focus, and inert disabled commercial actions. Axe runs against WCAG 2.0/2.1 A/AA tags for both themes in Desktop Chrome and Mobile Chrome. The suite intentionally avoids raw screenshot snapshots.

The `CI Required` workflow runs for pull requests and pushes targeting
`development`, `staging`, or `main`. It uses Ubuntu 24.04, verifies the pinned
Node.js and Bun versions, installs with `bun install --frozen-lockfile`, runs
`bun run check`, installs Chromium, and runs `bun run test:e2e` with
`SITE_URL=https://mailflow.example.test`. Superseded pull-request runs are
cancelled. CI does not authenticate with Infisical, deploy, or use secrets.

## Initialization boundary

Real landing-page content, signup and API integration, and an SSR adapter are
outside this initialization. Add each only through an approved feature or
platform decision.

## Listening

- The site remains an assets-only Worker because the current Astro output is
  static. A Worker script or server adapter would add runtime complexity without
  supporting a current requirement.
- Production keeps the named `production` environment for explicit deploy
  selection while using the clean `mailflow-site` Worker name.
- Cloudflare Workers Builds owns CD. A separate GitHub deployment workflow was
  rejected to avoid duplicate deployment ownership and credentials.
