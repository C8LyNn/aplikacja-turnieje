# WEB-005 — A40 / DEVELOPMENT FIRST — COMPOSITE C02 DB-FREE SOURCE QA HANDOFF

**Issue:** [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) · **Agent:** A40 CI Pack Recovery/Source Integration · **Priority:** P0 · **Date:** 2026-10-18 Europe/Warsaw  
**User authorization:** controlled *development-first* source integration, only safe non-PG16 candidate packages; never protected merge, SQL, game changes, Replit live changes, paid CI dispatch or deployment.

**Verdict: `COMPOSITE_C02_SOURCE_CREATED / INDEPENDENT_QA_PENDING / C01_API_INTEGRATION_BLOCKED / RELEASE_NO_GO / SWARM006_HOLD`.** The new C02 commit is real and disposable; this does **not** assert a fixed C01 API integration exit 1 or qualified Backup importer.

## 1. Exact GitHub identities / DRAFT PR

| Identity | Verified |
|---|---|
| [**C02 DRAFT PR #101**](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | OPEN/DRAFT/UNMERGED; PR **base is C01 disposable branch**, not protected release/main/develop |
| [**C02 branch**](https://github.com/C8LyNn/aplikacja-turnieje/tree/integration/web-005/c02-dbfree-pure-source-20261018) | `integration/web-005/c02-dbfree-pure-source-20261018` |
| **`COMPOSITE_C02_SHA`** | `a5bfd07b822c223fd995604dc2e228935ab81498` |
| **C02 Git tree** | `6765cdf516b02cfd850bf8c7fc04bc93e6abda6a` |
| [**Parent C01 PR #60**](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` |
| Parent C01 tree | `c19fff1d6b8538dee731ea0daad75bfe568714c3` |
| Historic C01 release parent | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| [**Full 5-file immutable blob + DAG JSON manifest**](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_C02_DB_FREE_SOURCE_MANIFEST.json) | Source PR exact SHA → Git blob SHA → C02 path, excluded list and STOP gates |

**Git readback:** C02 parent array contains **exactly C01**, compare C01...C02 has `ahead=1 behind=0`, **5 ADDED paths** and zero modifications/deletions, all five exact blob SHAs independently read back at the new composite HEAD. The **two inherited** strict/raw validator blobs were also fetched at C02 and equal the C01 source blob. No conflicts, manual hunk patches, cherry-picks, merge, rebase, dependency changes, test deletion, or route/API/DB edits. C01's exact original 14-file delta is preserved in history.

## 2. Selected safe source scope, 5/5 original files

### PR #64 / P28 action-local pure source (3 files)

**SOURCE HEAD:** `7837e412626e88761c70f1a2ceeb822d7ed101e1`, source base historic release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

- `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts` → `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c`
- `artifacts/api-server/test/backup-v3-action-provenance.test.ts` → `f65d0be0fec76a7daca2331e5bbd6d6fdbf79a6c`
- `docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md` → `308c6a57363a99358803f6b81b9696423ce0e934`

[A60 independent PR64 source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR64_A70_SOURCE_QA.md): PASS WITH CONDITIONS **isolated pure-source only**, not wired, 18 authored tests NOT independently native-executed in that review.

### PR #66 / P29 raw preclone adapter pure source (2 files)

**SOURCE HEAD:** `7490c974b7c84404559fd590bd09817a71c2134f`, **source base C01 exact SHA**, so only the two child-added paths were transferred — C01's 14 files were **NOT reapplied**.

- `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` → `c02ca0aa877017456142f081eff9e9f877522ca2`
- `artifacts/api-server/test/backup-preclone-adapter.test.ts` → `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d`

[A60 independent PR66 source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR66_A90_SOURCE_QA.md): PASS WITH CONDITIONS **pure adapter SOURCE ONLY**, NOT_WIRED; test ports are stubs, issuer/import/HTTP/rollback not implemented; source-branch CI inherited C01 API integration exit 1.

**Inherited C01 prereqs checked directly at C02**: strict-policy blob `595c68b87a5361623bef6293519ed668e9d4e493`, profile-gate blob `518526d8d9ff2cef368261788e12c9f8290754f5`.

## 3. Dependency/collision DAG and hard exclusions

~~~text
Historic base 1fdc... -> C01 PR60 fa3261... -> C02 PR101 a5bfd07...
                                     |                 | PR64 (3 files)
                                     |                 + PR66 (2 files)
                              PR56 strict-policy ------> PR66 static import
                              PR58 profile-gate -------> PR66 static import
PR64 action-local validator .. (callback compatibility NOT WIRED) ..> PR66
Issue #73 first failing API integration unknown --HARD BLOCK--> Full C02 QA/acceptance
A60 exact C02 SHA review --------------HARD BLOCK--> Source acceptance
Real Replit preservation manifest ------HARD STOP----> Any live deployment
~~~

**All five new paths are disjoint from each other, C01's 14 changed paths, and no game files were touched.** A10 prior R23D DAG still has **15 unresolved historic overlapping-packet pairs** outside this safe selection. No manual conflict resolution or false closure.

**Explicit exclusions:**
- **PR61** `8c26778c94cd6c96987f3986b651066024f10d4a`: two-stage Swiss PG integration test includes `resetTestSchema` / `dropTestSchema`. Requires A00+A20 written physically isolated PG16 approval. Not in DB-free C02.
- **PR63** `a4119b29a78b72d400947d8dd5bd100c59d6444e`: new CAS client SHA since prior A60 security review; not enablement-ready / backend D1–D5 absent; no frontend inclusion.
- **PR67** `880824f18b8913602955578dfd76eeac7976e32a`: intentionally RED future ingress security contracts; no source-qualified real importer. Keep separate; no skips or false green.
- **PR69** `1bc087384542b16bb82bc9ab58ec48780fc0e972`: CSS from **different newer release** `1db3734b8988940acc6be8b992420a58fc39624a` and local Replit lineage. Excluded wholesale, including game assets/rewrites.

**Security boundary:** PR64 is a standalone strict action-local validator. PR66 imports two C01 modules but obtains `validateActionLocalV3` via a supplied port; C02 copies the modules unchanged and **does not wire PR64 to PR66**. Both cannot authenticate the issuer or authorize import; `authenticated:false`, `importAuthorized:false`, historical Undo/Revert/CAS capability flags false. **Source co-presence is not proven callback/schema compatibility.**

## 4. Tests / provenance / exit codes

### A40 executed source integrity and static guards (not native application tests)

1. GitHub live PR/head/base/draft readback; C01 parent and C02 commit Git tree verified: **5 changed files, 1 parent, 0 conflicts, all 7 relevant Git blobs equal expected source** — source-identity checks PASS, not runtime.
2. **15/15 static checks PASS**, executed over exact C02 GitHub source strings in a separate code evaluation: import/fail-closed flags, strict/parsed C01 module imports, explicit absent PR64 callback wiring, no obvious SQL or DB-client imports, exact test module paths. **STATIC_SOURCE_INSPECTION only, no CLI process/TAP/exit code; not proof of TypeScript compile or semantic importer safety.**
3. Local available host shell preflight: `node -v` = v22.16.0 exit 0; `git --version` = 2.47.3 exit 0. Full monorepo checkout and `pnpm` **unavailable**; read-only `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` **failed DNS** (`Could not resolve host: github.com`) — no local clone. Therefore **A40 local targeted `node --test`, native TAP, API typecheck/build exit = NOT_EXECUTED / N/A**, never zero.
4. [**Automatic GitHub PR101 CI run 39125456595**](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125456595), job `117669533771`, triggered by publishing the DRAFT PR and **not manually rerun/dispatched**. Latest observed status **IN_PROGRESS**: SE safety and all eight Pack 19–26 steps `success`; `Static and database release gates` IN_PROGRESS. A00/A50/A60 must inspect its **final** conclusion and exact logs before claiming overall pass. The pre-existing CI workflow may automatically execute an isolated PG16 gate, but **A40 did NOT manually start or authorize any SQL/PG16 reset**.
5. **Inherited C01 failure NOT WAIVED:** automatic [C01 Actions 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) `API integration tests execution failed exit 1`, exact first integration failure still UNKNOWN per [A60 issue73](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23D_ISSUE73_C01_FIRST_FAILURE_TRIAGE.md). A50 posted [R23E DB-free 426/426 pass](https://github.com/C8LyNn/aplikacja-turnieje/issues/75#issuecomment-6226977057) from owner Windows11 C01; **DB-free green is distinct evidence**, cannot retroactively qualify C01 API integration.

### A50 next non-destructive exact-SHA commands (not executed by A40)

In an owner-approved **clean complete C02 checkout**, record `git rev-parse HEAD` and confirm `a5bfd07b822c223fd995604dc2e228935ab81498`, then Node22/pnpm10 and `pnpm install --frozen-lockfile` only with the normal owner dependency-install consent. Run **only DB-free named source/units**:

~~~powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/backup-v3-action-provenance.test.ts ./test/backup-preclone-adapter.test.ts
if ($LASTEXITCODE -ne 0) { throw 'STOP: C02 pure Backup source tests failed' }
pnpm --filter @workspace/api-server run typecheck
if ($LASTEXITCODE -ne 0) { throw 'STOP: C02 API typecheck failed' }
node --test --test-reporter=tap qa/pack17/gate-contract.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'STOP: Pack17 pure helper failed' }
~~~

**Do not manually run** `qa/pack17/run-gates.mjs --full`, any SQL/migration/reset/PG16 script, ingress security PG tests, Swiss stage caller DB tests, or manually paid workflow without separate owner+A20 approval. Automated CI on the DRAFT is separate evidence to record by actual job.

## 5. Replit/live preservation and rollback

C02 starts from **historical C01**, not from newer GitHub release `1db3734b8988940acc6be8b992420a58fc39624a`, and not from Replit's **local-only published** checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`. R23D reports **140 differing paths** (90 local-only + 50 blob differences) without a verified per-path preservation manifest; A40 did not enumerate or mutate them. No action touched Replit workspace, CSS, portfolio, Animated Effects, static routing, games, HTML, loaders, minigame assets, lockfile, API routes, Steam/catalog or database migrations.

**Rollback**: close DRAFT PR101 and delete *only* `integration/web-005/c02-dbfree-pure-source-20261018` if owner orders; exact Git parent C01 remains `fa3261b2...`. No live restore needed because there was no deploy. C01 and every source PR remain unmodified. There is **no authority** to merge C02 into main/develop/release or publish Replit.

## 6. Decision / A00 handoff

**`COMPOSITE_C02_SOURCE_CREATED / EXACT_5_BLOB_TRANSFER_VERIFIED / STATIC_15_OF_15_PASS / LOCAL_NATIVE_NOT_EXECUTED / AUTOMATIC_CI_PENDING_AT_REPORT / A60_C02_INDEPENDENT_QA_PENDING / C01_API_INTEGRATION_EXIT_1_UNRESOLVED / RELEASE_NO_GO / SWARM006_HOLD`.**

A50: capture **actual** targeted pure Node exit/TAP on the exact new C02 SHA and first C01 API integration failure in an approved environment. A60: independent source/interop review of this new commit; preserve all STOP gates. A10: append exact new PR101 source manifest and unchanged historical conflict DAG. A00: decide future expansion only after evidence; no release or protected merge authorized.
