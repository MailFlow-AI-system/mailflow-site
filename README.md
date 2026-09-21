# MailFlow Site

MailFlow Site is the public website for MailFlow. It will host landing pages,
product information, pricing, legal content, and other public marketing
experiences. This repository currently contains the executable Astro foundation
and one public foundation-status slice.

## Requirements

- Node.js `24.20.0`
- Bun `1.4.1`
- Infisical CLI
- Access to the `MailFlow-AI` project in Infisical

The expected Node.js version is recorded in `.node-version`; the Bun version is
recorded in `package.json`.

## Local setup

Install the locked dependencies:

```bash
bun install --frozen-lockfile
```

Authenticate the Infisical CLI:

```bash
infisical login
```

The committed `.infisical.json` links this repository to `MailFlow-AI`. Development commands read
the `dev` environment and `/mailflow-site` secret path. Run `infisical init` only when the checkout
must be linked to a different project.

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
| `bun run lint` | Run Biome lint checks |
| `bun run lint:fix` | Apply safe Biome fixes |
| `bun run format:check` | Check formatting with Biome |
| `bun run format` | Format files with Biome |
| `bun run typecheck` | Run `astro check` |
| `bun run test` | Run colocated Vitest component tests |
| `bun run test:watch` | Run Vitest in watch mode |
| `bun run test:e2e` | Run the Chromium Playwright smoke test |
| `bun run check:deploy` | Validate development, staging, and production Worker bundles without deploying |
| `bun run check` | Run lint, format, typecheck, unit tests, build, and Worker dry-runs |

Install the local Chromium browser and Linux dependencies before the first E2E
run when needed:

```bash
bunx playwright install --with-deps chromium
```

## Environment and security

Infisical is the secret-delivery boundary for local development. The `/mailflow-site` path currently
contains no secrets; add future secrets there instead of committing them or writing them to `.env`.
The `.infisical.json` file contains project-link metadata only and is safe to commit.

`SITE_URL` is required public site configuration used to build canonical URLs.
Its local value is documented in `.env.example`; `.env` is ignored and must not
be committed. Never place passwords, API keys, tokens, or other secrets in
public environment variables, source files, fixtures, browser tests, or logs.

## Deployment

Cloudflare Workers Static Assets serves the generated `dist/` directory without a
Worker script or Astro server adapter. Wrangler maps the environments to the
existing Workers:

- `wrangler deploy --env development` targets `mailflow-site-development`.
- `wrangler deploy --env staging` targets `mailflow-site-staging`.
- `wrangler deploy --env production` targets `mailflow-site-production`.

Cloudflare Workers Builds owns deployment triggers for `development`, `staging`,
and `main`. GitHub Actions validates changes but does not deploy them. Configure
`SITE_URL` in each Cloudflare build environment after the final domains are set.

## Architecture

The site uses Astro for public page composition and React for components that
need interactive behavior. Features are organized by user-facing capability;
shared code stays capability-neutral.

```text
.
├── e2e/
│   └── foundation.spec.ts
├── src/
│   ├── features/
│   │   └── home/
│   │       └── components/
│   │           ├── FoundationStatus.test.tsx
│   │           └── FoundationStatus.tsx
│   ├── layouts/
│   │   └── SiteLayout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── shared/
│   │   └── config/
│   │       └── site.ts
│   ├── styles/
│   │   └── global.css
│   └── test/
│       └── setup.ts
├── astro.config.mjs
├── playwright.config.ts
└── vitest.config.ts
```

Ownership rules:

- `src/pages/` owns route entrypoints and page-level composition. Keep feature
  behavior in `src/features/` instead of growing route files into application
  modules.
- `src/features/<feature>/` owns UI, content presentation, and behavior for one
  public capability. A feature must not reach into another feature's internals.
- `src/shared/` owns stable technical configuration and genuinely reusable
  primitives. It must not become a dumping ground for feature-specific logic.
- `src/layouts/` owns the document shell, metadata, canonical URL, and slots.
  Layouts do not own landing-page content.
- `src/styles/` owns global imports, resets, and site-wide tokens. Keep
  feature-specific styling close to its feature when it does not belong to the
  global layer.
- `src/test/` owns shared test setup only. Colocated component tests verify
  accessible user-observable behavior; `e2e/` verifies complete browser flows
  through the running site.

Astro renders components without client JavaScript by default. Add the smallest
appropriate React `client:*` directive only when a component needs browser
interactivity; do not hydrate static content. This keeps public pages fast and
keeps ownership of interactivity explicit.

## CI

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
- Production uses the named `production` environment so all Workers follow the
  same explicit environment suffix convention.
- Cloudflare Workers Builds owns CD. A separate GitHub deployment workflow was
  rejected to avoid duplicate deployment ownership and credentials.
