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
| `bun run check` | Run lint, format, typecheck, unit tests, and build |

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

## Architecture

The site uses Astro for public page composition and React for components that
need interactive behavior. Features are organized by user-facing capability;
shared code stays capability-neutral.

```text
.
├── e2e/
│   ├── design-system.spec.ts
│   └── foundation.spec.ts
├── src/
│   ├── features/
│   │   └── home/
│   │       └── components/
│   │           ├── FoundationStatus.test.tsx
│   │           ├── FoundationStatus.tsx
│   │           └── ThemeSelector.tsx
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
- `src/styles/` owns global style imports and design-system integration. Shared tokens belong to
  `@mailflow/ui`. Keep
  feature-specific styling close to its feature when it does not belong to the
  global layer.
- `src/test/` owns shared test setup only. Colocated component tests verify
  accessible user-observable behavior; `e2e/` verifies complete browser flows
  through the running site.

Astro renders components without client JavaScript by default. Add the smallest
appropriate React `client:*` directive only when a component needs browser
interactivity; do not hydrate static content. This keeps public pages fast and
keeps ownership of interactivity explicit.

## Shared design system

The site consumes `@mailflow/ui` from the separate MailFlow design-system repository. Consumer
branches pin a reviewed full Git commit SHA; the temporary local tarball used during coordinated
development is not a release dependency. Keep the manifest and `bun.lock` aligned when updating
the pin. The current coordinated review source is
[`@mailflow/ui` PR #1](https://github.com/MailFlow-AI-system/mailflow-design-system/pull/1) at
`b418c12228a125a7be29095dd2f941857528a203`.

Import shared components and icons from their public subpaths:

```tsx
import { Button } from '@mailflow/ui/button'
import { Label } from '@mailflow/ui/label'
import { ArrowRight } from '@mailflow/ui/icons'
```

```bash
bun add '@mailflow/ui@git+https://github.com/MailFlow-AI-system/mailflow-design-system.git#b418c12228a125a7be29095dd2f941857528a203'
```

`src/styles/global.css` imports Tailwind once and then `@mailflow/ui/styles.css`. This makes the
shared color, typography, spacing, radius, shadow, motion, and Inter font tokens available to Astro
pages while leaving page layout ownership in this repository. `astro.config.mjs` compiles the
package source through Vite SSR with `ssr.noExternal`.

`SiteLayout.astro` injects the exported `themeScript` inline in the document head. The server
renders the dark fallback, and the script applies the stored light, dark, or system preference
before first paint. Only `ThemeSelector.tsx` is hydrated with `client:load`; static Button and Label
usage stays server-rendered. The native email input demonstrates Label association without adding
an application-owned Input component. Font and component notices are available at
`/third-party-notices.txt`.

## CI

The `CI Required` workflow runs for every pull request. It uses Ubuntu 24.04,
verifies the pinned Node.js and Bun versions, installs with
`bun install --frozen-lockfile`, runs `bun run check`, installs Chromium, and
runs `bun run test:e2e` with `SITE_URL=https://mailflow.example.test`.
Superseded pull-request runs are cancelled. CI does not authenticate with
Infisical, deploy, or use secrets.

## Initialization boundary

Real landing-page content, signup and API integration, deployment, and an SSR
adapter are outside this initialization. Add each only through an approved
feature or platform decision.

## Listening

The site uses the standalone `@mailflow/ui` package instead of copying components or tokens into
the Astro repository. Tailwind remains application-owned, while the package provides its mappings
and source scan through the shared stylesheet. Static Astro rendering keeps the foundation page
free of unnecessary hydration; the theme selector is the only interactive island required by this
slice. The package is pinned to the coordinated design-system feature commit for review. After
that pull request merges, update the pin to the accepted `development` commit before merging this
consumer pull request.
