# WEB-005 — DEVELOPMENT FIRST / A60 FAST QA MATRIX

**Task:** WEB-005 A60 DEVELOPMENT FIRST — FAST QA · **Date:** 2026-10-18 (Europe/Warsaw) · **Priority:** P0 · **Scope:** compact independent source/test gate, not an operational G0–G5 or release authorization.

**DEFAULT STATES:** `SOURCE_PASS | SOURCE_PARTIAL | SOURCE_FAIL | SOURCE_NOT_REVIEWED`; `TEST_PASS | TEST_FAIL | TEST_NOT_EXECUTED`; `DB_NOT_TESTED | DB_TESTED_WITH_AUTHORIZED_RECEIPT`; `RELEASE_NOT_APPROVED`. Do not collapse axes. **A60 never grants release GO from source/test PASS alone.**

## 1. Current exact-SHA snapshot (no false promotion)

| Candidate / issue | Exact HEAD confirmed by GitHub | A60 fast classification | Next |
|---|---|---|---|
| **Original C01 composite** [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) / [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) | `fa3261b2c9510e110ac9eba21726812d3401a525` OPEN DRAFT | `SOURCE_HISTORICAL_PASS_WITH_CONDITIONS / DBFREE_426_OF_426_HISTORICAL_PASS / DB_NOT_TESTED / RELEASE_NOT_APPROVED`. Prior native Windows DB-free receipt includes BuildTypes and API Typecheck PASS, frontend five groups PASS; CI full API integration exit 1 first failing case UNKNOWN. | Preserve unmodified SHA for forensic CI root cause, do not run unsafe API integration outside authorized PG16. |
| **Corrective Variant B** [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) / [A22 #99](https://github.com/C8LyNn/aplikacja-turnieje/issues/99) | `8b1b708d4b24cd94de4d15b2beed516b21da711a` OPEN DRAFT, base **exact C01** | `SOURCE_PARTIAL / SOURCE_P0_BLOCKED / TEST_NOT_EXECUTED / DB_NOT_TESTED / RELEASE_NOT_APPROVED`. New source fixes exist, but three **current SHA** code defects B01/B02/B03 remain. CI runs at this SHA: **none returned**, source-only PR explicitly uses skip-CI. | A50 correct the three source defects, publish NEW exact SHA; A22/A31/A60 independent targeted diff QA; only then select safe non-DB tests. |
| **C02 next composite** [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) | **NO C02 PR / NO exact C02 commit found** | `SOURCE_NOT_AVAILABLE / TEST_NOT_EXECUTED / DB_NOT_TESTED / RELEASE_NOT_APPROVED` | A10/A40 issue exact inclusion DAG and source-only candidate after owner authorization; preserve C01 incident and Replit drift. |
| **Basket CAS UI** [PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) / [#74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74) | `a4119b29a78b72d400947d8dd5bd100c59d6444e` OPEN DRAFT | `SOURCE_REVIEW_REQUIRED / TEST_NOT_EXECUTED_FOR_THIS_SHA / DB_NOT_TESTED / RELEASE_NOT_APPROVED`; six frontend-only paths, seven newly authored regressions, author says **35 total not run**. | Verify retained quarantined unsaved draft on GET 401/403, no unauthorized view/replay, no cross-principal restoration or save; CAS feature remains OFF. |
| **UI font** [PR #69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) | `1bc087384542b16bb82bc9ab58ec48780fc0e972` OPEN DRAFT | `SOURCE_PASS_WITH_CONDITIONS / BROWSER_NOT_TESTED / RELEASE_NOT_APPROVED`; one CSS path only. Prior A60 source check: dead Valve Pulp `@font-face` removed; fallback retained; CI blocked upstream Pack19. | Run screenshot/font/network regression only on isolated preview with exact CSS SHA; do not replace local Replit hunk blindly. |
| **UI route/static 404 probe** [PR #78](https://github.com/C8LyNn/aplikacja-turnieje/pull/78) / [#70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70) | `11e8d5d0bea679515a807f002724926113bdafc1` OPEN DRAFT | `SOURCE_TEST_ARTIFACT_ONLY / AUTHOR_REPORTED_SYNTHETIC_13_OF_13_PASS / LIVE_NOT_TESTED / RELEASE_NOT_APPROVED`; one `scripts/qa/r23d-static-route-probe.mjs` path, no route fix. | When authorized safe preview exists: missing .ttf/.wasm/.js should 404 (not SPA HTML200); preserve portfolio, stream/Animated Effects, SPA deep links, game bytes. |

**Important exact-SHA separation:** PR89 new B SHA is **NOT** the old C01 and **does not resolve old CI exit 1**. Old DB-free 426/426 cannot be assigned to PR89 or C02. No C02 full test or frontend live test is claimed.

## 2. Independent FAST SOURCE checks actually completed in this task

| Probe | Read-only evidence / result |
|---|---|
| **PR89 base/head** | GitHub direct PR and compare: base `fa3261b2c9510e110ac9eba21726812d3401a525`, current head `8b1b708d4b24cd94de4d15b2beed516b21da711a`; compare **ahead 44, behind 0**. |
| **PR89 changed files / preservation** | GitHub comparison lists **17 changed paths** (test fixtures/helpers under `artifacts/api-server/test/`, `qa/web005/r23h-r5/`, and `docs/web-005/agent-reports/A50/`). **0 changed source paths for games, stream, product frontend, auth/admin API, migrations, lockfile or CI**. This is DIFF-SCOPE PASS, **not** deployed-file or runtime parity. |
| **PR89 full integration discovery source** | Immutable recursive Git tree `8b1b708d4b24cd94de4d15b2beed516b21da711a`, `truncated=false`, **36** `artifacts/api-server/test/**/*.integration.test.ts` blob entries; Drizzle fixture present. **SOURCE_MANIFEST_PASS; not 36 test PASS.** |
| **B01 — S1 CASCADE guard** | Actual `pg16-test-ownership.ts` current blob `c853349a48304a474413eeb6b452f37c02cdceea`, around lines 315–320: `pg_depend` joined only to `pg_class` for both referenced and dependent object class; other dependencies (constraints/views/rules) may be missed. **SOURCE_FAIL/P0**; [A22 #99](https://github.com/C8LyNn/aplikacja-turnieje/issues/99), [A31 follow-up #88](https://github.com/C8LyNn/aplikacja-turnieje/issues/88). |
| **B02 — catalog slot state** | Actual `replit-schema-catalog-reconciliation.integration.test.ts` current blob `8ee1d3a109a8d075ff3d5344672c29772746f098`, around lines 541–550: after one DROP fails, calls hold on **all other slots with receipts**, including earlier successfully completed ones; can overwrite terminal provenance. **SOURCE_FAIL/P0**. |
| **B03 — Drizzle before-push error** | Actual `drizzle-schema-diff.integration.test.ts` current blob `14dc46b9caf1bc7173837e727c6d3cf042768604`: ordinal and binary/config/lock checks at lines 178–193 happen **before** catch setting `drizzlePushOutcomeUncertain=true` at line 227; after() may run owned teardown even when a guard emitted HOLD. **SOURCE_FAIL/P0**. |
| **Source/test command inventory** | Exact original C01 `package.json` blob `07929726f77b63bf375af4eb3ad4c70482cc7e14`, API manifest `bf931f87a7b0d5532b949f44c7e091878fe6db52`, frontend manifest `c2b79c7bc1cc7eb57958d6ee0a5202f78679c4a8` directly read. **Commands below are source-grounded, not executed.** |
| **Native tool availability** | Read-only local probe: **Node v22.16.0 and Git v2.47.3**, **pnpm absent**, **no working copy/.git for `aplikacja-turnieje`**. Direct GitHub raw fetch from local shell failed DNS. No safe exact-SHA installed dependency graph to execute native suites. **TEST_NOT_EXECUTED** here; do not synthesize PASS. |

## 3. Routine 4-step FAST QA path (apply for EVERY new candidate SHA)

**F0 — Capture exact scope (always):** request PR/branch, base SHA, HEAD SHA, merge-base, file-path+blob diff, lock/toolchain and 1-line change intent. Re-read HEAD immediately before final acceptance. If SHA moves, old tests/reviews are **stale**. Assert protected paths: no games (Core Clash / Unity WebGL / Evolution Runner / randomizers), animated stream/OBS output, protected Steam/admin/auth route/secret/roles or migration changes outside explicitly authorized scope. Only approve independently reviewed allowlisted hunks; cannot infer actual Replit state from GitHub.

**F1 — Source/security smoke (minutes, no SQL):** check syntax/format/type contract and diff-specific source invariants, versioned 36-entrypoint manifest if API tests change. C01 B requires B01–B03 fail-first regression plan. Frontend Basket CAS requires 401/403 draft quarantine, cross-principal cache invalidation and feature-OFF; routing requires no missing-asset SPA fallback and unmodified stream/game bundles. P0 changes ⇒ BLOCK SOURCE before promoting test claims.

**F2 — Execute only SAFE *DB-FREE* tests on an exact-SHA **disposable checkout**, after verifying scripts and no DB/network/destructive side effects:** commands by scope:
- `pnpm run typecheck:libs` (libraries; may write TS incremental outputs — disposable tree only).
- `pnpm --filter @workspace/api-server run typecheck` (API plus test TS; only if dependencies/pinned lock installed without changing production).
- `pnpm --filter @workspace/api-server run test:unit` (unit/front utility mix; verify newly added test files are truly unit and no database use before invocation).
- `pnpm --filter @workspace/tournament-manager run typecheck` and `pnpm --filter @workspace/tournament-manager run test` (frontend; verify runner `test/run-tests.mjs` first).
- `pnpm --filter @workspace/tournament-manager run build` **ONLY in an approved disposable preview checkout**: its script calls `stage-animated-effects.mjs` and writes/removes generated stream staging. Never run on live or protected folders.
- For independent `.mjs` tools not importing effects, `node --check <exact-path>` on pinned checked-out file is a static syntax gate. No blanket automatic invocation of `npm install`, `pnpm install`, `pnpm test`, `pnpm run build` or CI; review actual effects and obtain scope as necessary.

**MANDATORY DENY:** root `pnpm test` dispatches API package `test` and in turn **`test:integration`**. API `pnpm --filter @workspace/api-server run test:integration` executes PG16 database-changing fixtures. **NEVER RUN these in FAST DB-FREE mode**. Full 36-entrypoint PG16, Drizzle `--force`, Docker/SQL/migrations and any actual G0–G5 require distinct separate signed approvals; no routine QA escalation. No paid/manual GitHub CI dispatch without A00 authorization.

**F3 — Evidence + gate label:** record exact commit SHA, command argv/cwd, Node/pnpm versions, test-file inventory, positive/negative counts, `exit_code`, stderr/stdout raw SHA256, skipped/filtered count and runner provenance. If runner/env unavailable, explicit `TEST_NOT_EXECUTED` and reason. Re-assert forbidden-path invariants and emit four independent labels (SOURCE, TEST, DB, RELEASE). Any changed migration/admin/auth/permission/PG guard gets a separate targeted security/SQL source review rather than a full PG16 program for unrelated UI.

## 4. Fast per-change routing and escalation

| Change type | Minimum quick QA | Escalation only when |
|---|---|---|
| C01 source-hardening (PR89) | exact SHA, targeted B01/B02/B03 independent source diff review, locked launcher, new fixture regression definitions | Actual DB mutation, role/DSN/Drizzle changes require A22/A31 source security; PG16 tests only under separate G0–G5 |
| C02 draft composite | exact include/exclude DAG, changed-file provenance and collision resolution, DB-free typecheck+unit+frontend | First original C01 CI failed case diagnosed/owner approves new integration scope; any new DB path separately |
| Basket CAS/UI | feature-off, 401/403 quarantined draft, authorized save/ETag, 412/428 paths, cross-principal no-leak; frontend suite/typecheck | New server schema/role/API permission or activation |
| Font/static routes | exact CSS/router diff, synthetic 404/200+MIME and disposable browser smoke, portfolio/stream/game asset hashes | Any Replit/live routing or stream/game binary change requires separate owner parity/deploy gate |
| Game, stream or global admin changes | **STOP** outside requested scope; no inherited release/candidate merge | Explicit new owner scope, independent artifact parity, separate authorized QA |
| Docs only | SHA, links/provenance and source claim boundary | If docs assert an unavailable test/run result, classify FAIL_EVIDENCE |

## 5. Critically relevant OPEN issues and shortest next actions

| Priority | Concrete blocker | Owner | Next action |
|---|---|---|---|
| **P0** | PR89 B01 incomplete cross-class S1 CASCADE dependency graph | A50 + A22 + A31 | Broaden fail-closed dependency proof or eliminate unsafe CASCADE; new SHA + negative source QA |
| **P0** | PR89 B02 catalog previously successful DROP states overwritten | A50 + A22 | Preserve per-slot immutable terminal result, write targeted sequence regression |
| **P0** | PR89 B03 Drizzle preflight HOLD still allows subsequent teardown | A50 + A22 + A31 | Mark terminal uncertain state before first possible preflight error, prove after() never DROP after guard HOLD |
| **P0 dependency** | C02 has no current SHA/PR; original C01 API CI first failure unresolved | A50 + A40 + A10 + A00 | Capture first causal TAP on separately approved future PG16; continue unrelated frontend fixes DB-free in parallel |
| **P1 UX/ownership** | CAS 401/403 new tests not independently run; live routing not verified; Replit checkpoint drift | A110 / A120 / A40 | Publish exact-SHA targeted frontend logs + browser/evidence on safe preview, protect games/stream/admin |

**REPORT NOW:** `C01_B_SOURCE_FAIL_P0 / C02_NOT_CREATED / UI_PARTIAL_QA / DB_NOT_TESTED / RELEASE_NOT_APPROVED / SWARM006_HOLD`.

**No release GO from this matrix.** Evidence-only QA; no source/test/CI/PG16/production operations undertaken in this A60 report. Published doc is an actionable fast-triage protocol, not a substitute for real TAP and verified owner authorization.
