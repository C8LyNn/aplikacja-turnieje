# WEB-005 / A20 / R23F — PG16_A50_DIAGNOSTIC_HANDOFF

**Recipient:** A50 Independent Test Execution / QA Infrastructure; A60 independent verifier, A00 owner.  
**Reference:** C01 [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) exact `fa3261b2c9510e110ac9eba21726812d3401a525`, [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73), old CI [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`.  
**A20 status:** `HANDOFF_PREPARED / PG16_EXECUTION_NOT_AUTHORIZED`. Do not execute anything by reading this file.

## 1. Agreed known-good baseline vs unknown first failure

- A50 real Windows 11 DB-free R23E-R2 suite **426/426 PASS, 0 FAIL, 0 SKIP**, **36/36 actual command exits 0**, 25 native TAP logs; Node 22.23.3, pnpm 10.34.7, `BuildTypes` and `ApiTypecheck` exit 0. A60 independently verified 36/36 raw log SHA256 and issued [`DBFREE_QA_ACCEPTED`](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23E_R2_C01_WINDOWS_DBFREE_INDEPENDENT_ACCEPTANCE.md). Do not reclassify as overall C01 integration.
- Original CI `38736073793`: source/Pack17 atomic correction and many fixtures passed; later `pnpm --filter @workspace/api-server run test:integration` returned exit 1. Fetched GH job log from job 116425579970 (~424K raw characters) contains `BLOCKED: API integration tests execution failed exit 1; signal none`, last visible TAP subtests are passing and abruptly cut off. **No supported first `not ok` found** in that GitHub job log. PostgreSQL error lines in service cleanup can be expected injected-negative tests and do not by themselves identify the first failed assertion. Never guess a named failing test.
- A20 confirms `run-tests.ts` `da4188446aba4696f97eb7831fee0cc5824d212f` discovers sorted all `*.integration.test.ts` recursively, Node `--test-concurrency=1`, `test:integration` script in package SHA `bf931f87a7b0d5532b949f44c7e091878fe6db52`.
- **Critical full-suite precondition**: `test-database.ts` (SHA `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`) drops/recreates `tm_test_*` schema with 0001–0028; **`replit-schema-catalog-reconciliation.integration.test.ts`** (SHA `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`) creates and force-drops 3 scratch databases `tm_catalog_test_<16hex>_{dev,prod,fresh}`. Both **S1** and **S2** permissions must be owner certified for full run. No create/drop rights on shared cluster.

## 2. Preconditions A50 must demand (cannot self-authorize)

A00 signed and A20 signed and operator signed **same exact physical PG16 target** (new standalone VM/container with independent data directory/system ID), SHA and source/credential scope; separate S1 and S2 destructive test scope. A50 must see and record the three original approval IDs and owner-certified instance fingerprint before any DB command. If S2 not authorized, **do not invoke full `test:integration`**; a separately approved targeted safe file set may be run but it is NOT a reproduced full suite and skipped/not-run files must be inventoried transparently.

Exact env: `NODE_ENV=test`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` (only under S1 GO), `TEST_DATABASE_SCHEMA=tm_test_<new_nonce>`, `TEST_DATABASE_URL=postgresql://<ephemeral>@127.0.0.1:<certified_nondefault_port>/web005_c01_test_<nonce>`. Inherited `DATABASE_URL` must be unset; do not leak URL/credentials. Operator independently verifies URL resolves to attested PID/PGDATA/container and no off-host route; PostgreSQL16, no preexisting data, reviewed role ACLs. If catalogue fixture's temporary CREATEDB role cannot be scoped safely, STOP full suite.

Do not set `SCHEMA_COMPARE_TEST_CONFIRM`, `SCHEMA_COMPARE_TEST_{DEVELOPMENT,PRODUCTION}_DATABASE_URL` or separate `SCHEMA_COMPARE_{DEVELOPMENT,PRODUCTION}_DATABASE_URL`; `lib/db` optional `DROP public` suites are not in this authorization.

## 3. Future command and expected behavior (not executed now)

A50 in a **fresh scratch checkout at exact commit**, after separate E1 prep approval: independently check `git rev-parse HEAD`, `git status --porcelain`, `git ls-files -s qa/pack17/gate-contract.mjs artifacts/api-server/test/test-database.ts artifacts/api-server/test/run-tests.ts artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts`, hash `pnpm-lock.yaml`. Use pinned Node22 + pnpm10 CLI with native process exit captured directly (PowerShell `pnpm.ps1` shim has previously masked child exit). Run `pnpm install --frozen-lockfile` *only in scratch and only if E1 authorized*; TypeScript references `pnpm exec tsc -b lib/db lib/api-zod lib/stage-basket-flow` before typecheck to avoid TS6305.

After verified PG16 physical certificate, authenticated observer-only read-only catalog check, and separate authorized schema/database test resets, A50 may run:
```text
pnpm --filter @workspace/api-server run test:integration
# expands to: node --import tsx ./test/run-tests.ts integration
# test discovery: ALL *.integration.test.ts, Node --test-concurrency=1
```
This is **not** a dry run and **not** permitted by the R23F documentation task. Save actual invocation argv with **redacted** env fingerprint; don't print `TEST_DATABASE_URL` or `DATABASE_URL`. No `--test-name-pattern`, `skip`, disabled fixtures, increased timeouts or assertion edits to force green. Exact first error location and full native exit matter more than green aggregate.

## 4. Evidence capture: mandated separation and integrity

**Local private (never auto-Drive):** full raw stdout/stderr, OS/process/pg logs, secrets if any appear — operator restricted ACL and privacy review before upload.  
**Redacted synced folder:** `G:\Mój dysk\ChatGPT\WEB-005\Raporty\C01_PG16_R23F_<UTC>_<nonce>\`. File set:
- `SOURCE_RECEIPT.json`: exact C01 SHA, observed Git blob SHA list, pnpm lock SHA, actual Node/pnpm binaries/checksums, clean checkout status, test discovery **full file list**, test count.
- `INSTANCE_CERT_REDACTED.json`: actual independent cluster/process+volume identity hash, PG16 version, hostname/port role/DB/schema, network/volume certificate IDs, all 3 approval refs and separate S1/S2 grants, reviewed extension list and pre-run object count; never include DSN or password.
- `API_INTEGRATION_STDOUT.redacted.log` and `API_INTEGRATION_STDERR.redacted.log` (full in order, preserve timestamps; never discard first fail to keep tail).
- `API_INTEGRATION_RECEIPT.json`: command, UTC start/end, true child exit/signal, all TAP headers and six counters, **first genuine `not ok`** or earliest uncaught exception and stack, test filename/case, categorization `INFRA/BOOTSTRAP/ASSERTION/CRASH/UNKNOWN`, number of missing/skip/todo, full-suite file census.
- `DB_SCOPE_BEFORE_AFTER.json`: owned tm_test schema + each of three catalogue scratch DBs, default public and unrelated DB names fingerprinted read-only, evidence that no unrelated DB was modified, cleanup outcome (not imaginary).
- `SHA256SUMS.json`: SHA256 over **actual redacted bytes**; `UPLOAD_RECEIPT.json`: remote Drive file IDs and readback SHA256, or `SYNC_UNVERIFIED`; `ROLLBACK_RECEIPT.json`: exact resource IDs and disposal result.
- `HANDOFF_A60.md`: source/instance refs, concise first-failure evidence, open questions, link to immutable Google Drive receipts.

**TAP validation**: parse every complete TAP process: header + `# tests/pass/fail/cancelled/skipped/todo`; if log truncated or no complete summary, mark **`TAP_INCOMPLETE`** even when process exit 0. For a failure, preserve first `not ok` and associated failureType/error/stack **before** terminal summary. Errors in PostgreSQL logs may be intentional negative fixtures; prioritize Node test result for causal identification. If earliest output already shows connection/permission failure before tests, report `INFRA_BLOCKED`, not app assertion. Any actual `skip` means not all cases executed — record exactly, no synthetic full PASS.

## 5. A60 / A00 next actions

A60 independently verifies exact PR SHA and all source/test binary/input checksums, S1/S2 approvals, actual process exit, redacted vs raw log hashes/complete TAP, first failure attribution and authorized cleanup. A00 determines whether an independently scoped follow-up PR/test fixture change is approved. **Do not authorize C02 or release merely because a first failure was reproduced.** If the true first cause is setup/migration, repair only in disposable harness after separate approved scope; no production migration.

**A50 handoff state:** `DBFREE_QA_ACCEPTED / API_FIRST_NOT_OK_UNKNOWN / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD / SWARM006_HOLD`.
