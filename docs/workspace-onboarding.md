# Workspace onboarding — Site integration (phase 2)

Branch `feat/workspace-onboarding` is based on Site development `be3798c` and consumes
the companion Core branch stacked on workspace foundation. Coordinate Core/Site delivery;
this does not complete workspace switching/persistence (phases 3–6).

## UI and behavior

With `PUBLIC_WORKSPACE_ONBOARDING_ENABLED=true`, signup adds workspace name and subdomain
fields and calls `POST /api/v1/onboarding/signup` with a UUID idempotency key. Name/DNS label
shape are checked locally; Core owns reserved names and uniqueness. Existing details →
verification → login composition and OTP/resend recovery are retained. No automatic login.

The request/key live only in memory to retry an uncertain response; passwords are never
persisted in browser storage. Only the pending email is saved in sessionStorage to restore
verification after refresh. After successful verification, the response's login URL must
match the configured Web origin or a single DNS-label subdomain, with the same scheme/port
and exact `/login` path: foreign redirects, credentials, query/hash and nested hosts fail closed.

With the flag false, the existing signup endpoint/body remain available. There is no DS
release or dependency upgrade: `@mailflow/ui#v0.3.0` Inputs/Buttons and existing Site tokens,
labels, spacing and form styles are reused. Product orchestration/types/utils remain in
`src/features/auth`; field presentation is separate from the flow/client.

The read-only Lovable reference `/home/p4van772000/mentoria/mailflow-ai-suite/src` has no
matching signup/onboarding screen (searched routes/components and signup/verification
terms). The existing Site signup card is the visual baseline; **Lovable signup parity is
not claimed**. Browser checks cover desktop/mobile, light/dark, keyboard-accessible inputs,
Axe and horizontal overflow. Local screenshot artifacts are under ignored `test-results/`;
Astro's development toolbar is not a shipped UI element.

## Rollout — manual steps, not performed here

1. Merge foundation and compatible Core onboarding changes; apply its migrations with an
   owner, run API/worker with restricted roles, and configure approved email delivery.
2. Confirm environment-specific Web tenant base, permitted origins, trusted proxy behavior,
   DNS/TLS/Workers coverage and session strategy. Core and Site must agree on the Web base.
   Do not assume a base origin alone permits tenant login; continuation is a phase-3 gate.
3. Enable the Core onboarding endpoint and queue worker first, keeping legacy signup open.
4. Build/redeploy Site with `PUBLIC_WORKSPACE_ONBOARDING_ENABLED=true` and matching API/Web
   public URLs. Astro static builds bake these values in: runtime secret changes alone
   do not update the browser bundle.
5. Validate real mailbox OTP/welcome delivery and actual tenant login in an authorized
   acceptance environment; only then close legacy signup with Core's separate cutover flag.
6. Rollback the consumer and legacy cutover in a coordinated order; keep the queue drain
   running for already committed jobs. Do not reset accounts, schemas or tenant data.

No DNS/deploy/secret changes or live provider sends were performed in these tests.
Core's `docs/workspace-onboarding.md` describes flags, migration order and failure recovery.

## Checks and real cross-repository browser flow

Use Node 24 / Bun 1.4.1 and set `SITE_URL`, `PUBLIC_API_URL`, `PUBLIC_WEB_URL` as
documented in `.env.example` (local values or the approved environment configuration).
Standard checks do not activate onboarding unless its build-time flag is supplied:

```sh
bun run check
bun run test:e2e -- --reporter=line
```

The separate suite requires the compatible Core checkout, phase-1 Web checkout and an
isolated PostgreSQL owner URL. It intentionally fails when mandatory fixtures are missing:

```sh
MAILFLOW_ONBOARDING_CORE_DIR='/absolute/path/mailflow-core-onboarding' \
MAILFLOW_ONBOARDING_WEB_DIR='/absolute/path/mailflow-web-foundation' \
MAILFLOW_WORKSPACE_TEST_DATABASE_URL='<isolated-owner-url>' \
bun run test:e2e:onboarding -- --reporter=line
```

It starts Core on loopback 8082, Site on 4329 and Web on 3001; Chromium resolves only
synthetic `*.workspace.test` hosts locally. Actual Site/Core/Web signup, refresh, resend,
verification, login and workspace selection display are exercised at desktop/mobile.
Database/auth are real; email delivery is a capturing provider double. The harness permits
only exact fixture origins and assigns isolated synthetic client IPs for test scenarios.
This is not live Resend acceptance, deployed wildcard origin support or production session
topology proof. Default E2E excludes this suite to preserve independent Site regression runs.

### Recorded local evidence (2026-10-05)

- Lint, format, Astro typecheck (zero errors/warnings/hints), 49 tests and an
  onboarding-enabled static build passed. Wrangler development/staging/production
  **dry-runs** passed; nothing was deployed.
- Default regression suite: 37 passed, seven pre-existing breakpoint/project skips.
  Mobile-only menus and desktop-only hover/visual checks run in their applicable
  project; these are not missing onboarding tests.
- Real cross-repo onboarding suite: two passed, zero skips, desktop/mobile and
  light/dark Axe checks. Refresh, resend, verification without a session, explicit
  login and the authorized workspace label were exercised.
- Live Resend inbox delivery and deployed tenant/cookie topology remain unverified;
  the captures are synthetic provider evidence, not email-provider acceptance.
