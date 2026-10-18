# WEB-005 — A60 / DEVELOPMENT FIRST WAVE 5 — INDEPENDENT C03 QA & INTEGRATION READINESS

**Agent / Task ID:** A60 — Independent QA & Release Gates / `WEB-005-T060-WAVE5-C03-INDEPENDENT-QA`  
**Date:** 2026-10-18 (Europe/Warsaw)  
**STATUS:** `PARTIAL` — exact-SHA C03 SOURCE QA complete, exact-SHA GitHub CI targeted-test evidence verified; local independent full-checkout/native rerun and full runnable product QA NOT AVAILABLE.  
**Integration readiness:** **CONDITIONAL for controlled next DB-free source-only composition; NO for a working/release-ready application**.  
**Final labels:** `C03_SOURCE_PASS / C03_TARGETED_CI_TEST_PASS / C03_WORKFLOW_FAIL / LOCAL_NATIVE_NOT_RUN / DB_NOT_TESTED / RELEASE_NOT_APPROVED / C01_API_FIRST_FAILURE_UNKNOWN / SWARM006_HOLD`.

## 1. Actual source baseline and changed files — independently re-fetched

| Component | Draft PR | Exact immutable SHA observed | Status |
|---|---|---|---|
| C01 original | [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN / DRAFT |
| C02 original | [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | OPEN / DRAFT; base exact C01 |
| **C03 tested** | **[#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134)** | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`** | **OPEN / DRAFT; base exact C02** |
| PR100 source | [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | OPEN / DRAFT; stacked on PR66 |

**C03 changed files (exactly TWO)**, confirmed via GitHub PR file listing and independent C02/C03/PR100 original blob readbacks:
1. `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`: C02 blob `c02ca0aa877017456142f081eff9e9f877522ca2` → C03 blob `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` = **PR100 identical blob**.
2. `artifacts/api-server/test/backup-preclone-adapter.test.ts`: C02 blob `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d` → C03 blob `51b658b1775f88c5d00ff721247ec6ede49feb86` = **PR100 identical blob**.

**SOURCE_SCOPE_PASS:** no changed game/Unity/Core Clash, stream/Animated Effects, live Replit, frontend, organizer/Steam authentication, server admin permissions, API route binding, SQL migration, database schema, package lockfile, Docker config or deployment files. This is a Git *diff-scope* statement, **not** independent live Replit byte-parity evidence. C03 merely replaces exactly PR66's older two files; never replay parent PR66 or C01/C02.

## 2. Actual, inspectable exact-C03 CI and test receipts

**Exact commit** [GitHub Actions run 39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753), job `117691909864` — original decoded 6,334-line log independently inspected.

| Evidence type | Result | Proper interpretation |
|---|---|---|
| Source contract/fail-closed gates | logs show source contracts **12 PASS / 0 FAIL**, fail-closed **24 PASS / 0 FAIL** | Passed earlier gates of same exact-sha job, **not** a release PASS |
| Workspace typecheck | **PASS**, including API, test TS, frontend and scripts (log ~2901–2921) | Typecheck on actual C03 exact CI checkout **TEST PASS** |
| **Backup preclone target tests** | **20/20 named tests PASS** (original 15 + new 5), no `not ok` in target block (log ~3104–3219; new tests `ok 22`–`ok 26`) | **Targeted module TEST PASS on C03**, not borrowed only from PR100 |
| Existing API integration / full workflow | **FAIL, true exit 1**; `BLOCKED: API integration tests execution failed exit 1; signal none` (log ~5075) | **C03_COMPOSITE_TEST_FAIL**, no subsequent frontend/browser/release qualification |
| First failing API test name/cause | **UNKNOWN** from available captured CI output | PG logs include intentional error/constraint fixtures; do NOT assert that they identify the first failing test or that PR100 caused it |

**A60 local execution:** Node `v22.16.0`, Git `v2.47.3`; `pnpm` **NOT INSTALLED**; exact monorepo checkout/dependencies **UNAVAILABLE**; direct `git ls-remote` failed DNS. **No valid local target `pnpm --filter ... test` or frontend build could run.** No fabricated native TAP/exit or working-app screenshot. All genuine test successes above are from GitHub's actual execution on exact C03 SHA, independently read from job logs.

**Historical regression context, NOT Wave5 rerun:** A60 Wave4 executed C02-source Round Robin 4/4, independently authored series result 14/14, RR edge 8/8 = **26/26 DB-free PASS** on exact earlier C02 SHA. At C03 re-read the unchanged critical source blobs:
- RR `round-robin.ts` `589702a7e8fe3e26baf0867286b16e06dae03353`,
- series results `series-result.ts` `3aa22ad7b4b5acb887a5d45e5f338dbd20e63a1a`,
- tournament creation `create-tournament-with-plan.ts` `3d53ab665324e493fbced390091753efa03b8954`,
- roster `tournament-roster.ts` `1a9184d92736b5c2bcca07bb0d3067a0f7b314ce`,
- stage lifecycle `stage-lifecycle.ts` `e344fd4198e081a3a4574d976829665bea71fb6a`.
This is **SOURCE_BLOB_PARITY_PASS** showing no changes in those modules, but **NOT new C03 full-lifecycle execution**. C03 create→players→stages→matches→results, full HTTP/API PG16 integration, bracket UI, Basket CAS and Replit live are **NOT TESTED** by A60 Wave5.

## 3. C03 edge/security/data contract quick review

**SOURCE_PASS_WITH_SCOPE:**
- `validateRawBackupBeforeClone(raw, ports)` accepts only raw JSON string, rejects invalid/hybrid preflight and unknown schema, requires version-specific parser/full semantic port, compares key-order-neutral canonical untouched parsed data, rejects data stripping/mutation.
- New PR100 source checks parser *thenables* and rejects **any** non-`undefined` semantic or action-local callback return (Promise, thenable, false), rather than treating asynchronous validation as completed. Synthetic negative tests are among the five CI-passing new cases.
- Strict legacy V2/V3 stays `LEGACY_COMPAT_RESTRICTED`; modern V3 strict requires its own strict policy + action-local closure; missing dependency and parse/semantic/strict/action errors produce typed denial; result consistently freezes `authenticated:false / importAuthorized:false` and historical Undo/Revert/CAS flags `false`.
- **NOT_WIRED by design**: pure ports can be synthetic/no-op, **not** proof of genuine `validateBackupV3` or archive issuer identity; no cryptographic attestation, importer or production clone. No live import must be enabled from these receipts.

**Nonblocking targeted next negative test:** an injected `async () => { throw Error(...); }` trusted callback returns a rejected Promise even if C03 immediately denies it; no Wave5 evidence addresses asynchronous *unhandled rejection* process behavior. Ask A90/A50 to check this in a synthetic Node harness before wiring (do **not** infer successful exploitation or label P0 without execution evidence). No need to repeat comprehensive PG16 review for this DB-free adapter.

## 4. Additional Wave5 input PRs — independent status and A40 inclusion queue

| Candidate (exact HEAD verified) | Source/test evidence | A60 inclusion decision |
|---|---|---|
| **C03 [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134)** `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | Exact source/PR100 provenance PASS; **20/20 targeted tests + workspace typecheck PASS on C03 CI**, overall API integration FAIL | **YES, CONDITIONAL: keep as canonical BASE for a further *DB-free source-only* candidate.** No merge, release or working application claim. |
| **A90 test-only [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129)** `35449b148aa782139a5327164cb6ed5d6aa3bfdd`, parent exact PR100 | Single synthetic ingress test file. [Actions 39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273) exact SHA: four new W4 cases **4/4 PASS** and workspace typecheck PASS; whole CI still API integration FAIL. Prior W3 14 tests are not separate C03 native receipts. | **CONDITIONAL READY_FOR_TEST_ONLY_COMPOSITION** onto C03: verify A10 path manifest, preserve original adapter blob, rerun combined test on new composite exact SHA. Not a source import/wiring approval. |
| **Swiss [#102→#118→#131](https://github.com/C8LyNn/aplikacja-turnieje/pull/131)** latest child `1d8e8105ea7b601866ee9f7cd607d05bd241372a` | Stacked change; A60 historical #102 4/4, #118 2/2+4/4 DB-free; **#131 exact new-test runtime NOT independently re-run by A60**. A80 owns sporting QA and stage-scope. | **NEEDS EXACT CHILD QA + A10 DAG**; do not paste three copies of `swiss.ts`. |
| **Undo [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104)** `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f`, **roster [#119→#132](https://github.com/C8LyNn/aplikacja-turnieje/pull/132)** latest `fd3726aaa8c16a49b6ecd60e5b5e98782880f38e` | #104 **two C03 older PR64 source/test file collisions**; authored 21 tests require exact execution evidence. #132 separate stage/roster Undo test branch, 6/6 author-run W4 series test reported but no A60 exact-child checkout in Wave5. DB/race/HTTP undone not tested. | **NEEDS FIXED COMPOSITION + TESTS**; A70/A10 own dependencies, no blind overwrite of provenance. |
| **Basket CAS [#63→#130](https://github.com/C8LyNn/aplikacja-turnieje/pull/130)** latest `295783b8d7af907a5adfe3c6a3c1d199e29408e9` | Test-only child, 10 authored tests; target not independently executed, server strong ETag/If-Match/D1–D5 unresolved, feature OFF. | **NO operational inclusion or CAS activation**; A110/A30/backend owner. |
| **SPA [#103→#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120)** latest `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | Historical 12 synthetic HTTP PASS, **4 source/browser SKIP**; PR103 async `exists` can misroute missing font to 200; no live Replit parity. | **NEEDS FIX+REAL PREVIEW** before wiring. A120/A140. |
| **A20 local preflight [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135)** `7ba2419eb2444667e194a832f62fa45261224189` | Three files (pure .mjs + test + runbook). A20 original exact native Node checkout test **NOT RUN**, local operator setup unknown. | **CONDITIONAL READINESS TOOL** for Windows operator; A20 to run precise standalone read-only tests before claiming environment-ready. |
| **C01 diagnostics [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105)** last observed HEAD `7befb8bbfc9d150469e5405859b0e8b4e789f8a6` | A50 reports static exit/flush synthetic 3/3; product API failure unknown. | **DIAGNOSTICS-ONLY**, separate from C03 candidate and no waiver. |

**A10 canonical Wave5 manifest:** not available to A60 at snapshot; this shortlist is PROVISIONAL and **not authority** to include source packages. A40 retains C03 until A10 dependencies and a new exact source/combined QA receipt arrive.

## 5. Minimal delivery plan / next owners

1. **A10 → A40:** pin C03 SHA and exact changed-file provenance, decide test-only #129 inclusion first; reconcile PR104/C03 path collisions and Swiss/Undo stacked chains without double applying parents. No new candidate PR until needed acceptance tests and manifest.
2. **A50:** C01 first failing test still unknown; preserve original real TAP as operator-controlled private evidence or produce a separately approved isolated PG16 run. No skipping integration, treating any PostgreSQL fixture ERROR as first real test failure, or claiming first-failure fix from logging improvement.
3. **A20 + Windows operator:** produce actual isolated checkout and `pnpm`/lock/test matrix, run standalone `node --test scripts/qa/web005-local-readiness.test.mjs` safely, then authorized DB-free workspace typecheck, API pure unit, frontend tests. Do not run root `pnpm test` without reviewing its integrated DB behavior.
4. **A90/A50/A70/A80/A110/A120:** confirm integration-edge regressions for their exact children; A90 assess rejected Promise scenario; A70 Undo history; A80 sporting; A110 401/403/draft/ETag; A120 asset 404/SPA direct-load.
5. **A60:** independent exact new-composite SHA QA once composed; require true exit/TAP, complete no-skips frontend/browser where applicable and evidence of API actual behavior. A00 alone decides working-version/release and later SWARM006 gate.

**Global release acceptance:** **NO**. C03 is source-only/NOT_WIRED, original C01/C02/C03 composite CI API integration exit1; no approved PostgreSQL16 full integration or real frontend/API browser run, no authorized deployment. A140 Replit live, Steam auth, game/stream parity remain protected and UNKNOWN unless physically verified.

## 6. Audit trail / precise local execution statement

- A60 fetched PR metadata, changed-file lists, exact Git blob source/test identities, original PR patch, workflow jobs and decoded real CI logs; no trust in author-declared counts without comparing CI original.
- Local environment probe: `node -v` → v22.16.0; `git --version` → 2.47.3; `pnpm -v` → executable missing; `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` → DNS resolution failure. No pinned checkout; **local application tests NOT_EXECUTED**.
- Independent source-only parity: C03 #134 exactly 2 changed blobs, both equal PR100; critical tournament source blobs equal earlier verified C02. **Not runtime-test PASS**.
- **Changed files by A60:** ONLY this `docs/web-005/agent-reports/A60/WEB005_WAVE5_HANDOFF.md` and `.sha256` on separate existing A60 docs branch; **NO CODE CHANGES / no Draft code PR**. No SQL, migrations, PostgreSQL, Docker, image builds, API integration/manual CI dispatch, live Replit, game/stream/admin edits, protected merge or deploy.
