# WEB-005 — A60 / R23E-R2 — Independent C01 Windows DB-free QA Acceptance

**Task:** WEB-005-A60-R23E-R2-INDEPENDENT-C01-QA · Date: 2026-10-17 · **VERDICT: `DBFREE_QA_ACCEPTED`**, exact PR60 HEAD **fa3261b2c9510e110ac9eba21726812d3401a525**. This is an independent audit of A50's executed Windows evidence, **not an A60 rerun**. **C01 integration HOLD / C02 HOLD / RELEASE_NO_GO / SWARM006_HOLD**.

## Identity and chain of custody

- [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60): independently queried GitHub; HEAD **fa3261b2c9510e110ac9eba21726812d3401a525**, OPEN/DRAFT/UNMERGED, original base 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7. Identical `required_sha` and `observed_sha` in the native receipt; source-has-commit, local mirror clone, local-only fetch and `git checkout --detach` each exit 0, independently read from four GitHub/Drive-pinned logs.
- [A50 R23E-R2 Google Drive evidence folder](https://drive.google.com/drive/folders/13100ypsA_wGYMX0Ooa8NMpognzdYSN9D) (actual folder ID 13100ypsA_wGYMX0Ooa8NMpognzdYSN9D). Independently fetched [NATIVE_RECEIPT.json](https://drive.google.com/file/d/1OZQLu5Kk2AsIzJqFmOfhfWNosR9nfijn/view), [SHA256_PLIKOW.json](https://drive.google.com/file/d/1xvlSsAzbgdWGor7gU61H6LQrWwYqsHpm/view), [STATUS.json](https://drive.google.com/file/d/136vg2pDlXpJ5BwiSMthorBJBpdYnwj-M/view) and the 36 original log streams via authenticated Drive. Manifest has **115 entries**; 36 exact raw `*.log` byte hashes independently recomputed **36/36 match**, and actual raw receipt+status hashes match their manifest values. Other 77 manifest entries were not all independently downloaded; do not report a fictitious 115/115.
- Independently fetched immutable A50 original executor Git blob **95bc02a33db07cef1f9b837a5493813356d490ac** (source-only, destructive PostgreSQL disabled). Independently fetched [R23E-R2 launcher ZIP](https://drive.google.com/file/d/1wMHdS5_6e_LcCobh_qms18JzkJEToVuP/view): SHA256 **8357dbabd02637f767682b2a0320c9901eebfc530686f9daaacb778cc065dd71**, ZIP internal manifest **13/13** file hashes matched. R2 launcher fixes earlier PowerShell ParserError, no game code. Receipt pins generated scratch runner SHA256 `c37b1b4644f879e423df98f48a043c05a78d32bbf10f330dd08534b1a5ce4bea`, but the scratch runner bytes were not uploaded and **A60 did not independently rehash that generated file**. Receipt's pinned frozen lock SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef` is author-attested; logged frozen install truly exited 0, exact lock bytes not independently rehashed from the Windows checkout.
- Windows toolchain in authentic receipt: PowerShell 7.6.7, portable Node **v22.23.3**, portable pnpm **10.34.7**, Git **2.51.0.windows.1**. Isolated scratch checkout under user's LOCALAPPDATA/W5/R23E_261017_015446_204ba0; original git mirror read-only. Full command and exit readback: **36/36 independent log SHA matches and 36/36 `EXIT: 0`, `CLASSIFICATION: COMMAND_PASS`, no launch error**.

## Actual TAP and typecheck — independently counted from raw log bytes

| Executed scope | Direct log receipt | Tests | PASS | FAIL | SKIP | Exit |
|---|---|---:|---:|---:|---:|---:|
| Pack19–26 contracts + units (16 logs) | steps 11–26 | 292 | 292 | 0 | 0 | 0 each |
| Pack17Pure | step 27 | 24 | 24 | 0 | 0 | 0 |
| BackupStrict | step 28 | 14 | 14 | 0 | 0 | 0 |
| BackupProfile | step 29 | 26 | 26 | 0 | 0 | 0 |
| Swiss | step 30 | 13 | 13 | 0 | 0 | 0 |
| Frontend backup-file | step 32 | 4 | 4 | 0 | 0 | 0 |
| Frontend stage-utils | step 33 | 13 | 13 | 0 | 0 | 0 |
| Frontend query-invalidation | step 34 | 8 | 8 | 0 | 0 | 0 |
| Frontend stages-ui | step 35 | 27 | 27 | 0 | 0 | 0 |
| Frontend seeding-ui | step 36 | 5 | 5 | 0 | 0 | 0 |
| **TOTAL 25 separate TAP logs** | | **426** | **426** | **0** | **0** | **all exit 0** |

Each of 25 TAP logs has exactly one full 6-counter summary (`tests,pass,fail,skipped,todo,cancelled`), its numbers equal the receipt and pass == tests, all four non-pass counters zero, **zero `not ok` lines**. This is actually measured A50 Windows execution evidence, not synthetic tests or counts inferred from source files. **11 other non-TAP steps** have actual log exit 0. `BuildTypes`: step 10 command `pnpm exec tsc -b lib/db lib/api-zod lib/stage-basket-flow`, exit **0**. `ApiTypecheck`: step 31 command `pnpm --filter @workspace/api-server run typecheck`, executes tsconfig.json and tsconfig.test.json under tsc with `--noEmit`, exit **0**. BuildTypes and Typecheck are intentionally **not included** in 426.

All five FrontendUnit test sources were independently fetched at **exact PR60 HEAD** and cross-matched to the five Git blob SHA-1 values in the R23E-R2 `FRONTEND_SOURCE_BLOBS.json`. No test group declared by `suites` / 36-step native receipt is missing or skipped; this does **not** mean the repo's entire unit/integration test inventory has run, because the R23E-R2 suite list is a deliberately bounded DB-free selection.

## Non-destructive and product-source scope

Readback of [ZMIANY_NA_DYSKU.txt](https://drive.google.com/file/d/1xXClQ6fcpfpov-aExU_l2xiEdBF5QoZt/view) and [ROLLBACK.txt](https://drive.google.com/file/d/1pw754YiSDhcTzP_aPtQ5bMN1qpTOXHoD/view): newly created isolated clone, locally extracted Node/pnpm, workspace dependencies, generated TypeScript .d.ts/.tsbuildinfo, logs and receipt. `git status` from the disposable isolated checkout shows no tracked modifications after tests in the report. Logs explicitly operate on the new scratch copy and read-only original git mirror; no observed game-code edits, production files, PostgreSQL commands, migrations, resets, Replit/live republish, merges, or paid CI. No independent direct filesystem/OS telemetry from the user's Windows host was available; the assertion of **no changes to unrelated local paths** is limited to the audited command traces and operator filesystem report. Rollback authorized scope is only the newly created R23E scratch directory, after preserving evidence, never source mirror or previously existing files.

## Residual evidence boundaries (DO NOT MISCLASSIFY AS PASS)

- **`database_tests_executed=0`**; **`pack17_full_executed=false`**, `application_qa_complete=false` in receipt. NO PostgreSQL 16 HTTP/API integration/rollback, migration, real Basket CAS, or browser/live QA was executed in this Windows run.
- The historic [GitHub C01 CI run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) **FAILED API integration exit 1**. Its first failing test remains unresolved: never close it using DB-free 426/426. A50 must capture the first named native failing API integration TAP on an A20-approved isolated PG16 host.
- Generated scratch runner and frozen lock SHA256 are consistent with received receipt/provenance, **not independently hashed by A60 from the original Windows scratch bytes**; this limits cryptographic attestation of runtime executables, not independently verified 36 log byte hashes.

## A00 next PG16 gate — explicit preconditions

**STOP until written A00/HQ + A20 + Windows host/operator authorization for the exact disposable physical PostgreSQL 16 target, allowed database, scoped schema and reset.** Require same pinned C01 source SHA; separate fresh scratch worktree; PG16 host/port/database fingerprint (without secrets); A20 confirms this is a physically isolated disposable test instance with no production/shared user data and exclusive control over its schema; record credentials only in local env, never in logs/Drive; capture pre-run state/backup of disposable test schema and rollback/cleanup plan. No migration allocation, no live DDL.

Before executing any schema-altering test helper, enforce actual Pack17 guard `qa/pack17/gate-contract.mjs` blob **eae350a60a684d7b14af3e481baf7bd6c4a2b2fc**: `NODE_ENV=test`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` explicitly approved, `TEST_DATABASE_URL` PostgreSQL protocol with test-named database and no `prod` in target, `TEST_DATABASE_SCHEMA=tm_test_*`; verify **physical isolation separately**, since string-based checks are not sufficient security proof. Require owner-approved specific test command scope for `pnpm --filter @workspace/api-server run test:integration` (sequential via --test-concurrency=1) and only subsequently Pack17 --full if separately authorized. No blanket skips, changed timeouts, `DATABASE_URL` production fallback, unauthorized test selection, overwrite of original mirror, or destructive retries.

Capture separate raw and sanitized stdout/stderr, command line, exact SHA, Node/pnpm/PG16 versions, env fingerprint without secrets, actual process exit, every TAP summary, first real `not ok` and stack, SHA256 receipts, presence/absence of skipped tests, SQL schema mutation scope, no cross-tenant writes, and post-run rollback audit. If the first API failing case is reproduced, isolate its cause and submit **test-first narrowly scoped PR at NEW HEAD** for independent A60 recheck. The next PG16 gate is **NOT_EXECUTED / GO_PENDING**, not conditionally approved by this report.

## Verdict

**`DBFREE_QA_ACCEPTED`** (Windows owner-host A50 evidence only; verified actual 426/426, exact SHA and 36/36 log hashes/exit). **`C01_API_INTEGRATION_HOLD` / `C02_HOLD` / `PG16_NOT_EXECUTED` / `RELEASE_NO_GO` / `SWARM006_HOLD`**. No author code changed, DB accessed or production release operation performed by A60.