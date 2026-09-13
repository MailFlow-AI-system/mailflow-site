# MailFlow Site

MailFlow Site is the public website for MailFlow. It will host landing pages,
product information, pricing, legal content, and other public marketing
experiences. This repository currently contains the executable Astro foundation
and one public foundation-status slice.

## Requirements

- Node.js `24.20.0`
- Bun `1.4.1`

The expected Node.js version is recorded in `.node-version`; the Bun version is
recorded in `package.json`.

## Local setup

Install the locked dependencies, create local environment configuration, and
start the development server:

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

The site is available at `http://127.0.0.1:4321`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Astro development server |
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
| `bun run check` | Run lint, format, typecheck, unit tests, and build |

Install the local Chromium browser and Linux dependencies before the first E2E
run when needed:

```bash
bunx playwright install --with-deps chromium
```

## Environment and security

`SITE_URL` is public site configuration used to build canonical URLs. Local
defaults are documented in `.env.example`; `.env` is ignored and must not be
committed. Never place passwords, API keys, tokens, or other secrets in public
environment variables, source files, fixtures, browser tests, or logs.

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

The `CI Required` workflow runs for pull requests targeting and pushes to
`development`, `staging`, or `main`. It uses Ubuntu 24.04, verifies the pinned
Node.js and Bun versions, installs with `bun install --frozen-lockfile`, runs
`bun run check`, installs Chromium, and runs `bun run test:e2e` with
`SITE_URL=https://mailflow.example.test`. Superseded pull-request runs are
cancelled. CI does not deploy or use secrets.

## Initialization boundary

Real landing-page content, signup and API integration, deployment, and an SSR
adapter are outside this initialization. Add each only through an approved
feature or platform decision.
