# WEB-005 / A20 — WAVE 4 LOCAL TEST READINESS

**Owner:** A20 — Infrastructure | **Task:** WAVE4-A20-LOCAL-READINESS  
**Mode:** DEVELOPMENT FIRST / DB-FREE TOOLING / NO DEPLOY  
**Source baseline:** \`release/tournament-ops-20261013-01\` at \`1db3734b8988940acc6be8b992420a58fc39624a\`; original composite C01 exact \`fa3261b2c9510e110ac9eba21726812d3401a525\` is **another, unmerged** source tree.  
**Scope:** make the **current selected checkout** easier to verify before anyone launches it. No SQL, Docker, DB service, registry pull, install, test suite or server is automatically started by the new preflight.

## 1. What actually exists in source

- Root \`package.json\` script \`test\` calls the API package \`test\`; that API script chains \`test:unit && test:integration\`. Thus **\`pnpm test\` is not a DB-free command**. Use a named independent test command, never a broad umbrella alias.
- \`artifacts/tournament-manager/package.json\` defines \`dev\` as **animated-effects staging then Vite**. That staging modifies local output; it is **not part of this read-only preflight**.
- \`artifacts/tournament-manager/vite.config.ts\` contains \`host: "0.0.0.0"\` and \`allowedHosts: true\`; plain \`pnpm dev\` may expose the development interface beyond loopback. **Do not launch the local server under unreviewed defaults**. An explicit loopback binding and effective-config check are needed first; Vite source has a local \`PORT\` requirement and \`API_PROXY_TARGET\` pointing to \`127.0.0.1:8080\` by default.
- \`artifacts/api-server/src/index.ts\` runs \`runDeploymentStartup(process.env, ...)\` before starting API; API process startup is **not covered by this source-only readiness check**.
- Workspace uses \`pnpm-lock.yaml\` v9; \`pnpm-workspace.yaml\` states \`minimumReleaseAge: 1440\`, \`autoInstallPeers: false\` and native package constraints. Root manifest **does not declare \`packageManager\`**, so pinning/recording actual \`pnpm --version\` remains an operator reproduction requirement. A20's historical R23H toolchain expectation was Node 22 and pnpm 10; do not treat that as an executed platform measurement.

The source is inspected as a **candidate**. This document does not claim all package scripts are safe in every module; static import side effects and child scripts still require selection-specific review.

## 2. New zero-dependency read-only helper (no install required)

From the exact checkout that an operator wants to evaluate:

\`\`\`powershell
node --version
pnpm --version  # version check only; no installation
git rev-parse HEAD
node scripts/qa/web005-local-readiness.mjs --json
node --test scripts/qa/web005-local-readiness.test.mjs
\`\`\`

Only the first four listed **versions/read/source** commands and the Node synthetic test suite are contemplated. None makes a PG connection or changes the application. \`node --test\` makes and removes only its own synthetic fixtures in the operating system temp directory. No access to \`C:\\Program Files\\PostgreSQL\`, Replit or the production API is needed. **No command in this runbook has been executed on the user's Windows workstation by A20.**

\`web005-local-readiness.mjs\` only reads package manifests, pnpm workspace/lock and Vite source. It checks:

1. Required files and expected workspace package identities.
2. Lockfile v9, emits SHA256 calculated from actual inspected bytes.
3. That default root test script remains DB-integrating (so operators do not accidentally choose it).
4. Node major 22 (warning if different); presence of pnpm installation marker (warning, **not proof** dependencies are correct).
5. Inherited \`DATABASE_URL\`, \`TEST_DATABASE_URL\`, \`PG*\`, \`SCHEMA_COMPARE_*\`, \`REPLIT_*\`, \`NODE_OPTIONS\`, dotenv loaders and local \`.env\` / \`.pgpass\` paths — FAIL before recommending tests. **Never reads or prints variable values or secret file contents**.
6. Vite \`0.0.0.0\` / \`allowedHosts: true\` — WARNING; local web service requires a separately reviewed loopback-only launch path.

An observed \`SOURCE_PREFLIGHT_OK_DB_FREE_ONLY\` means **no hard source/env failures in this tool**, **NOT** dependencies ready, network safe, app working or PG integration permitted. Missing/poisoned source/env returns \`BLOCKED\` and exit code 2. The \`--root=PATH\` option inspects an explicit checkout directory; \`--json\` prints machine-readable results with no passwords.

## 3. Reproducible DB-free progression

1. **A00/operator chooses an isolated working-tree clone/checkout and pins \`git rev-parse HEAD\`.** Do not operate in the Replit live folder or on A40/A140 active branches. Record Node and pnpm versions and the preflight's lock SHA256; no secret env.
2. **Run the source preflight and its unit tests.** If environment variables or local secret files are flagged, STOP that environment; do not print values to a shared report. A source file warning (\`frontend_bind\`, dependency marker) requires follow-up before actual app service start.
3. **Only if separately approved and an offline cache exists**, a local install may be considered with the frozen lock. \`pnpm install --offline --frozen-lockfile\` **changes \`node_modules\`** and may execute package lifecycle scripts; it is NOT a read-only command, NOT performed here, and requires a disposable checkout/cached dependencies/installer review. Never use \`--no-frozen-lockfile\`, lock regeneration or live symlink workaround as an implicit fallback.
4. **Run explicitly reviewed DB-free tests**, not \`pnpm test\`:
   - \`pnpm --filter @workspace/api-server run test:deadlock-game-catalog\`
   - \`pnpm --filter @workspace/api-server run test:marvel\` (screen second group test imports first)
   - \`pnpm --filter @workspace/db run test:schema-catalog-comparison\` (**not** its integration variant)
   - \`node --test lib/db/test/development-reset-config.test.mjs\` (configuration-only, synthetic)
   - \`pnpm run typecheck\` (static compilation, no SQL proof)
5. **Frontend smoke remains separate**: verify a loopback-only effective Vite host/config and stage asset pipeline before authorizing a local UI start. Backend API startup, tournament CRUD workflow and end-to-end testing depend on later DB/test decision; do not fake app readiness from static checks.
6. **Do not run PostgreSQL C01 yet.** Earlier [A20 disposable PG16 draft](https://github.com/C8LyNn/aplikacja-turnieje/pull/128) is an **unexecuted** physical isolation design. The separate source-hardening [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) is draft/unmerged and does not automatically clear S1 \`CASCADE\`, four S2 database creations, two Drizzle \`push --force\`, or failed-CREATE→FORCE DROP. Only A00 and the operator can authorize a bounded local setup/test/cleanup in distinct steps.

## 4. Reproduction limits / known blockers

| Area | Verified source fact or actual limitation | Next owner |
|---|---|---|
| Toolchain | Node major 22 recommended; exact pnpm 10 / dependency-cache parity on Windows unmeasured; no \`packageManager\` pin in root | A00 / Windows operator |
| Frontend | Vite source accepts non-loopback binds and all hosts; package \`dev\` stages effects; direct-load/API proxy behavior not smoke tested | A120 / A140 / operator |
| API | \`start\` calls deployment startup before binding; actual DB identity and API tests unverified | A50 / A60 |
| PG16 | Minimal disposable plan unexecuted; full destructive C01 and unmerged #89 require separate source acceptance | A00 / A20 / A30 / operator |
| Install | Live dependency install or script execution could mutate artifacts; frozen-lock offline cache may be missing | Operator |
| Security | SECURITY-DEFERRED P0/P1 are **OPEN**; source check is not runtime network/credential attestation | A30 / A60 |

**Strict interpretation:** A20 may report \`LOCAL_SOURCE_CHECKS_PASS\` only for a **real source preflight executed against a stated exact checkout**; here only the helper's **synthetic unit tests** are executable without retrieving the private working tree. A GitHub source read does not replace a full Windows app launch. Do not claim local product PASS.

## 5. Acceptance path for the next working version

- **A20 deliverable:** standalone deterministic read-only local preflight + tests + this runbook; one isolated Draft PR, no touched application code or existing agents' files.
- **A60:** run the exact source-pinned preflight on a real project checkout, then DB-free tests with exact command/exit evidence; report app tests independently.
- **A120/A140:** approve a local Vite-only loopback launch without Replit live modifications; address assets/proxy if actually observed.
- **A50:** isolate C01 API first failure without invoking unsafe PG integration.
- **A00 + operator:** approve disposable PG16 setup **separately**, if product E2E readiness requires it. Distinct SQL/bootstrap, test and exact-project cleanup authorization; no merge/deploy.

**Outcome:** \`WAVE4_A20_LOCAL_PREFLIGHT_SOURCE_READY\` upon review, **not** \`PG16_PASS\` or \`APP_INTEGRATED\`. No R23H backlog risk is closed by this document.
