# WEB-005 / A20 / R23F — PG16_EXECUTION_AND_ROLLBACK_PLAN

**State: PREPARED, NOT AUTHORIZED OR EXECUTED.** Applies only to [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) exact `fa3261b2c9510e110ac9eba21726812d3401a525`. Written GO must be issued by **A00/HQ + A20 + Windows host operator** and renewed if target/source/scope changes. [Isolation contract](./PG16_ISOLATION_CONTRACT.md) and [preflight checklist](./PG16_PREFLIGHT_CHECKLIST.md) control all subsequent actions.

## A. Owner-only staged execution graph

| Phase | State / precondition | Owner/operator procedure once explicitly approved | Deliverable / abort |
|---|---|---|---|
| E0 source dry review | **Allowed now (docs only)** | GitHub inspect exact PR HEAD, guard, test discovery and package scripts, workflow job #116425579970; scrutinize `CREATE DATABASE` fixture and test schema drops; pin hashes | A20 documentary review only |
| E1 isolated source tools | **Future A00 + operator approval** for new scratch checkout, no DB | New disposable clone from **exact commit**; verify full 40hex `git rev-parse HEAD`, pristine `git status --porcelain`; verify lock/Guard/test-helper blobs; pinned local Node22/pnpm10, frozen lock install, `BuildTypes` before Typecheck if included | Source manifest + local package footprints, real tool exits; no game source edits |
| E2 physical PG creation | **Future triple written GO** for one new PG16; data/host owner certificate | Operator creates new disposable VM/container/PGDATA on nonshared host/loopback nondefault port with no remote DB routes. Strictly *new* resources, separate from system installed PG; image digest, container PID, port and PGDATA verified independently. Operator establishes short-lived role(s), creates dedicated test DB and records independent cluster ID out-of-band. **Not performed now** | Signed `ISOLATION_CERT.json`, inventory of exclusively owned resources, block if any preexisting data |
| E3 read-only handshake | **Future separately signed catalog GO**, no reset | Observer without CREATE reads endpoint/PG16/version/roles/approved DB+schema and catalog; record fingerprints and grants, compare independent E2 certificate. No application data rows, no public/live metadata | Redacted `CATALOG_PREFLIGHT.json`, read-only exit, discrepancy STOP |
| E4 reset / fixture activation | **Separate written S1 authorization** for named `tm_test_<nonce>` and `TEST_DATABASE_RESET`; **S2** for three DBs | Fresh disposable empty schema baseline screenshot/inventory; snapshot/VM checkpoint of **empty test cluster** before helper; allow `test-database.ts` to drop/create only owned tm_test schema and apply 0001–0028. Full suite needs additional **CREATE/DROP DATABASE** authority for `tm_catalog_test_<16hex>_{dev,prod,fresh}`, which test creates and drops; if no S2, STOP full suite | Two exact destructive scope receipts; no mutation outside these resources |
| E5 first-failure diagnostics | **Bounded command signed by A00**; A50 executor; no silent changes | From root, after source+PG gates, run exact `pnpm --filter @workspace/api-server run test:integration` **with Node22/pnpm10 and isolated env**, if (and only if) both S1+S2 are signed. That script runs `node --import tsx ./test/run-tests.ts integration`; discovery sorts all `*.integration.test.ts` and Node `--test-concurrency=1`. If S2 not signed, NO full run: any targeted suite must have *separate exact-file authorization* and status `PARTIAL_DIAGNOSTIC_ONLY`, never `CI_FAILURE_REPRODUCED`. Do not add `--test-name-pattern`/skip or modify assertions. | Raw local stdout, stderr, exit; redacted logs, full TAP and first failure. If environment fails before TAP mark `INFRA_OR_RUNNER_BLOCKER`, not test FAIL. |
| E6 independent QA | After A50 evidence | A60 verifies exact code SHA, true process exit, first not-ok/exception, source/test list completeness, PG16 physical certificate, scope, no skip/no unexpected DB operations and rollback receipts. A00 chooses whether any *new* narrowly scoped source correction PR is allowed | `C01_ROOT_CAUSE_CONFIRMED` **only from evidence**, else `C01_STILL_BLOCKED` |
| E7 cleanup | Separate owner authorized disposal scope | Capture evidence **first**. After permitted tests, stop Node pools, verify no foreign sessions, remove only resources that match E2 inventory and per-run ownership marker; for S2 no leftover three fixture DBs. Operator deletes only owned scratch VM/container/volume and test schema. Remove local isolated checkout only after evidence remote-verification/retention approved. **Never** run wildcard cleanup, `docker system prune`, host PG service stop or directory purge based on name alone. | Timestamped post-cleanup process/port/volume/cluster records; snapshot restore if needed |
| E8 handoff | Prior QA and owner signature | A50 links redacted Drive evidence + hash + QA; A60 independent verdict; A00 decides C01/C02/release. C02 does not open itself. | `C02_HOLD` until separate explicit GO |

## B. Exact source and command chain (READ-ONLY SPECIFICATION, DO NOT RUN YET)

- `git rev-parse HEAD` expected `fa3261b2c9510e110ac9eba21726812d3401a525`; reject branch name only or SHA substring.
- `node --version` 22.x; `pnpm --version` 10.x; Windows evidence had Node22.23.3, pnpm10.34.7; use verified binaries and avoid PowerShell pnpm shim swallowing true exit.
- `pnpm install --frozen-lockfile` only in own scratch AFTER separate E1 authorization; previous DB-free A50 wrapper already ran this, *do not rerun as part of current docs-only task*.
- Build declarations if required: `pnpm exec tsc -b lib/db lib/api-zod lib/stage-basket-flow` then `pnpm --filter @workspace/api-server run typecheck`, and record real native status.
- Source guard: `qa/pack17/gate-contract.mjs`, blob `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`; resets are **intentional** only with `NODE_ENV=test,TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA,TEST_DATABASE_URL=<dedicated PG URI>,TEST_DATABASE_SCHEMA=tm_test_<nonce>`. Parent `DATABASE_URL` must be absent and locally injected by test helper, not inherited from production.
- **First diagnosis command:** `pnpm --filter @workspace/api-server run test:integration`, package script `node --import tsx ./test/run-tests.ts integration`. It can create/drop multiple databases via special catalogue test; no unreviewed full run.
- **Excluded from initial scope:** `node qa/pack17/run-gates.mjs --full` (needs *different* separate GO), `pnpm --filter @workspace/db run test:schema-catalog-comparison:integration` (can drop `public`), `pnpm --filter @workspace/db run push`, schema migration scripts, game builds and unrelated frontend/browser suites.

### Mandatory environment normalization

A50/operator must guarantee spawned processes get **only** approved test settings. Parent env cannot carry `DATABASE_URL`, `SCHEMA_COMPARE_PRODUCTION_DATABASE_URL`, `SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL`, `SCHEMA_COMPARE_TEST_{DEVELOPMENT,PRODUCTION}_DATABASE_URL`, `PGSERVICE` or inherited libpq credentials. `TEST_DATABASE_URL` is supplied in ephemeral secured local env, never printed. If application database module loads before test helper sets `DATABASE_URL`, investigate as infrastructure ordering failure, do **not** add prod fallback.

Node process must use the same nondefault-loopback endpoint the operator certified. Note `test-database.ts` may add `options=-c search_path=<schema>`, which must be compared against approved schema. TypeScript compilation and DB integration are distinct: earlier A50 confirmed missing declarations TS6305 when BuildTypes omitted, so record environment bootstrap separately; do not misclassify as API integration behavior.

## C. Evidence format and first-failure classifier

**Per command receipt** (redacted to approved metadata): `task_id,command_id,argv_without_secrets,source_sha,source_git_blob_checks,test_file,utc_start,utc_end,elapsed_ms,OS/node/pnpm/psql/PG_major,container/cluster_evidence_id,instance_id_hash,db_name,schema_name,approved_ops,exit_code,signal,stdout_raw_local_path,stderr_raw_local_path,stdout_redacted_sha256,stderr_redacted_sha256,tap_summary,tap_header_count,tests/pass/fail/skipped/todo/cancelled,first_not_ok_line,first_error_stack_excerpt,classification,cleanup_evidence,approval_urls,drive_receipt_id,sync_verified`. Collect original unaltered raw logs only in private local workspace, sanitized copies in Drive; don't expose passwords, DSNs, player/organizer data, session tokens or connection logs.

**Classifier (must document confidence and alternatives):**
- `PRECONNECT_INFRA`: PG16 not listening, wrong port/host, DSN/certificate mismatch, refused or privilege error *before test assertions*. Exit 1 is not app bug.
- `BOOTSTRAP_OR_MIGRATION`: schema/fixture SQL fails under approved test instance, setup error or missing extension; distinguish from source mismatch; no partial success claim.
- `TEST_ASSERTION`: first named `not ok <index> - <case>` and complete stack/TAP, correct environment proven.
- `RUNNER_TAP_TRUNCATED`: full stderr/stdout unavailable or TAP cut off; original GitHub log had this limitation near `BLOCKED: API integration tests execution failed exit 1`; no invented failing case.
- `RUNTIME_CRASH`: uncaught exception/process signal/OOM/timeouts; preserve first causal trace and exit, not last teardown error.
- `UNKNOWN`: insufficient evidence; default if cause cannot be proved.

**Original run facts:** [GitHub Actions run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job ID `116425579970`, static-and-database release gates step 16 FAIL. Pack17 source+PG atomic correction progressed; tail shows `BLOCKED: API integration tests execution failed exit 1; signal none`, while last visible TAP contains passing subtests and terminates mid-stream. The genuine first named API assertion from this job is **not recoverable from the fetched log**. Expected future product of E5 is to capture it, not assume its identity.

## D. Restore, rollback and evidence retention

**Before reset:** operator records new cluster empty state, 3-way signoff and deterministic checkpoint (VM snapshot or disposable volume image after test DB creation but before tests), exact resource IDs/ownership and desired baseline. An empty disposable cluster need not copy production data: bringing production data into sandbox is forbidden. No destructive tests if any user data or preexisting schemas discovered.

**During run:** first violation -> stop scheduling further steps, capture native process exit/logs, OS/container PID+PG logs without secrets and list current sessions. If a setup transaction partially applied DDL, do **NOT** attempt manual SQL repair/migration in the current phase. Use approved disposable snapshot restore or dispose/recreate only newly owned cluster under separately authorized operator scope. The source version remains immutable.

**After run:** test helper may delete owned schemas/databases automatically; independent inventory verifies all expected `tm_test_<nonce>` and catalogue DBs removed, no other DB/schema affected; if residuals exist, operator-only cleanup under the exact signed manifest. Physical DB volume may be destroyed only if creation marker+system identifier match. Prevent cleanup if evidence still needed or target identity drifted; `CLEANUP_BLOCKED` is safer than guessed deletion.

**Local/Drive evidence:** `G:\Mój dysk\ChatGPT\WEB-005\Raporty\C01_PG16_R23F_<UTC>_<nonce>\`. Redacted files and manifest written atomically; verify remote existence by actual Drive API read+hash, not just local presence. Drive unavailable -> preserve redacted local spool and mark `CLOUD_SYNC_UNVERIFIED`. Never sync raw logs until privacy reviewed. No claims of Drive write performed by A20 in R23F.

**Actual rollback R23F:** NONE (no instance, test, migration or filesystem change). **Future rollback is operator-only, scoped to resources created after the signed E2 certificate.**

**Disposition:** `EXECUTION_PLAN_PREPARED / C01_FIRST_FAILURE_UNKNOWN / S1_SCHEMA_RESET_GO_PENDING / S2_THREE_DATABASE_DROP_GO_PENDING / C02_HOLD`.
