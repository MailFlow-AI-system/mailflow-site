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

The site is available at `http://localhost:4321`.

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

`SITE_URL`, `PUBLIC_API_URL`, and `PUBLIC_WEB_URL` are required to build the site. Configure these public values in the Infisical `/mailflow-site` path or `.env`:

```bash
SITE_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:8080
PUBLIC_WEB_URL=http://localhost:3000
```

For reproducible CI validation, use reserved example domains; CI does not call these endpoints:

```bash
SITE_URL=https://mailflow.example.test PUBLIC_API_URL=https://api.mailflow.example.test PUBLIC_WEB_URL=https://web.mailflow.example.test bun run check
bun run test:e2e
bunx playwright test e2e/accessibility.spec.ts
```

Install the local Chromium browser and Linux dependencies before the first E2E run when needed:

```bash
bunx playwright install --with-deps chromium
```

## Environment and security

Infisical is the configuration-delivery boundary for local development. Configure `SITE_URL`, `PUBLIC_API_URL`, and `PUBLIC_WEB_URL` in the `/mailflow-site` path. The `.infisical.json` file contains project-link metadata only and is safe to commit.

`SITE_URL` builds canonical URLs. `PUBLIC_API_URL` selects the public Core API endpoint and `PUBLIC_WEB_URL` selects the Web app destination after signup; these are public URLs and contain no credentials. Their local values are documented in `.env.example`; `.env` is ignored and must not be committed. Never place passwords, API keys, tokens, or other secrets in public environment variables, source files, fixtures, browser tests, or logs.

Local development uses `http://localhost` on separate ports for Site, Core, and Web so the browser can share the host-only auth cookie after login. Signup posts directly to Core without sending or accepting cookies and sends no email.

## Deployment

Cloudflare Workers Static Assets serves the generated `dist/` directory without a
Worker script or Astro server adapter. Wrangler maps the environments to the
existing Workers:

- `wrangler deploy --env development` targets `mailflow-site-development`.
- `wrangler deploy --env staging` targets `mailflow-site-staging`.
- `wrangler deploy --env production` targets `mailflow-site`.

Cloudflare Workers Builds owns deployment triggers for `development`, `staging`,
and `main`. GitHub Actions validates changes but does not deploy them. Configure
`SITE_URL`, `PUBLIC_API_URL`, and `PUBLIC_WEB_URL` in each Cloudflare build environment after the final domains are set.

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
- `src/features/auth/` owns the signup schema and form behavior. The route supplies only its validated public API and Web URLs.
- Reusable primitives such as the button, input, sheet, accordion, and dropdown menu come from `@mailflow/ui/components`. Keep landing and signup composition in `src/features/`.
- `src/shared/` owns stable technical configuration and genuinely reusable primitives. It must not become a dumping ground for feature-specific logic.
- `src/layouts/` owns the document shell, metadata, canonical URL, theme bootstrap, and slots. Layouts do not own landing-page content.
- `src/styles/` owns global imports and site-wide styles. Keep feature-specific styling close to its feature when it does not belong in the global layer.
- `src/test/` owns shared test setup only. Colocated component tests verify accessible user-observable behavior; `e2e/` verifies complete browser flows through the running site.

## Design-system integration

The site consumes `@mailflow/ui` from the design-system `v0.3.0` tag (commit `56cb4a1e606eb73d2c1dc11c455955926aa4c347`).

- Import reusable buttons and icons from `@mailflow/ui/components` and `@mailflow/ui/icons`.
- Import `ThemeProvider`, `useTheme`, and `Theme` from `@mailflow/ui/theme`.
- Import the synchronous theme bootstrap from `@mailflow/ui/theme-script` in `SiteLayout.astro`.
- Use shared semantic tokens such as `background`, `foreground`, `muted`, `border`, and `primary` rather than consumer-only color values.
- Keep reusable primitives in the design system; the site only composes them for landing-page interactions.

## Validation coverage

The E2E suite covers landing section order and presence, internal anchors, active signup links and route, mobile navigation open/Escape behavior, FAQ open/close behavior, system/light/dark theme selection and persistence, console/page errors, hydration regressions, horizontal overflow, keyboard focus, and disabled commercial actions. Axe runs against WCAG 2.0/2.1 A/AA tags for both themes in Desktop Chrome and Mobile Chrome. The suite intentionally avoids raw screenshot snapshots.

The `CI Required` workflow runs for pull requests and pushes targeting
`development`, `staging`, or `main`. It uses Ubuntu 24.04, verifies the pinned
Node.js and Bun versions, installs with `bun install --frozen-lockfile`, runs
`bun run check`, installs Chromium, and runs `bun run test:e2e` with
`SITE_URL=https://mailflow.example.test` and local API/Web fixture URLs.
Superseded pull-request runs are cancelled. CI does not authenticate with
Infisical, deploy, or use secrets.

## Listening

- The site remains an assets-only Worker because the current Astro output is
  static. A Worker script or server adapter would add runtime complexity without
  supporting a current requirement.
- Production keeps the named `production` environment for explicit deploy
  selection while using the clean `mailflow-site` Worker name.
- Cloudflare Workers Builds owns CD. A separate GitHub deployment workflow was
  rejected to avoid duplicate deployment ownership and credentials.
- Signup runs from the static Site against the public Core endpoint. The Site
  remains static, so signup does not add a server proxy or depend on reusing the
  Core cookie in the Web app.
- Signup sends an email OTP and redirects to the configured Web `/login` only
  after verification. It does not sign the user in automatically.
- Core records authentication operation counts and durations for signup,
  sign-in, sign-out, and session checks that reach Core. Site has no browser
  telemetry, so signup failures before a request reaches Core are not counted.
