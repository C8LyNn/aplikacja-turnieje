# WEB-005 / A20 / R23F — PG16_PREFLIGHT_CHECKLIST

**State:** `NOT_EXECUTED / PG16_EXECUTION_NOT_AUTHORIZED`. This is a **future operator checklist**, not a completed runtime certificate. Applies exclusively to PR60 C01 `fa3261b2c9510e110ac9eba21726812d3401a525` and the bounded A50 API integration diagnostic, not C02, games, release or live. Reference [PG16 isolation contract](./PG16_ISOLATION_CONTRACT.md).

## Approval and source verification — hard P0/GO barrier

Every box below must be marked from **actual evidence**, with UTC time, evidence SHA256, named verifier and signed scope; do not pre-check based on this document.

- [ ] **A00/HQ written GO** references exact C01 SHA, new scratch source location, permitted *first* command(s), start/expiry, named A50 executor, test DB server, schema and any CREATE/DROP database rights. No inference from DB-free acceptance.
- [ ] **A20 written DB safety GO** references separately examined physical host/container/PGDATA/port/role/DB/ACL and exact allowed reset set. Architecture drafting alone is not A20 execution approval.
- [ ] **Operator written GO** verifies exclusive custody of one newly created empty disposable PG16 process/container, no preexisting user data, network isolation, operator rollback capability, recovery/contact path.
- [ ] All three independent approvals match the **same** immutable target and have not expired; if any signer missing, STOP `PG16_EXECUTION_NOT_AUTHORIZED`.
- [ ] A50 pins `git rev-parse HEAD` to `fa3261b2c9510e110ac9eba21726812d3401a525`, clean checkout, `git status --porcelain` no tracked/untracked source drift, `pnpm-lock.yaml` SHA256 to the approved A50/A60 reference `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef`; exact source blobs: gate `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`, test helper `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, discovery `dd427fdafa92c089e2edad704079d81945c4b1c1`, API runner `da4188446aba4696f97eb7831fee0cc5824d212f`, catalogue fixture `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`.
- [ ] Pinned Node 22.x and pnpm 10.x; A50 previous 22.23.3 / 10.34.7 are **reference** values, not permission to use any unverified local binary; frozen lock install only in scratch; TypeScript `tsc -b lib/db lib/api-zod lib/stage-basket-flow` before API typecheck if rerun authorized. No global installs/CI reruns.

## Physical isolation certificate (operator provides evidence, A20 verifies)

- [ ] Exact OS, host, immutable VM/container ID and image digest or local postgres binary SHA, running process PID and parent process, listening **loopback** IP/nondefault port, host firewall/network mapping and blocked outbound paths proven by OS/container inspect. A connection-string-looking-safe is insufficient.
- [ ] Newly created **PGDATA** absolute path or Docker volume ID with creation marker, canonical real path (no symlink/junction outside scratch) and file ownership; no mount mapping to Replit/live/backups, not an existing system PostgreSQL service. Container/VM disposal must not reference shared volumes.
- [ ] PG major 16, PostgreSQL build/extension dependencies confirmed; no blanket extension install. `plpgsql` usually installed; `pg_trgm` if editor catalog test later separately authorized only. Server-side identity readback must equal operator's **independent** out-of-band certificate, not supply its own proof.
- [ ] Dedicated database `web005_c01_test_<nonce>` or other explicitly owner-signed name containing `test`, no `prod`, cluster fingerprint, DB owner, expected empty state and rollback snapshot; enforce no extra DB access. Default `public` must not be a reset target for ordinary API fixtures.
- [ ] Unique `TEST_DATABASE_SCHEMA=tm_test_<nonce>` exact case and `^tm_test_[a-z0-9_]+$`, **new/nonexisting** and owned for this run; no reused schema named tm_test_access/pack18 without a new signed per-run exception.
- [ ] Independent credential storage restricted to scratch process only; local test role has no live/shared connection capability; `DATABASE_URL` in parent environment **absent**, as the tests will locally set the derived test URL where needed. Other dangerous variables `SCHEMA_COMPARE_TEST_*`, `SCHEMA_COMPARE_{PRODUCTION,DEVELOPMENT}_DATABASE_URL`, `PGSERVICE`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSFILE`, `PGPASSWORD` audited and cleared if inherited/unrecognized. No credentials or tokens in reports.
- [ ] For schema reset: only `NODE_ENV=test`, `TEST_DATABASE_URL=postgresql://...@LOOPBACK:APPROVED_NONDEFAULT_PORT/APPROVED_TEST_DB`, `TEST_DATABASE_SCHEMA=tm_test_<nonce>`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; set them **only after triple signature**. Confirm `NODE_TEST_CONTEXT` comes from Node test runner, not manually forged.
- [ ] Check exact redacted parsed `TEST_DATABASE_URL` **scheme/host/port/database** against independent port→PID→PGDATA certificate. Reject auth redirect, DSN `service`, `hostaddr`, unreviewed SSL/proxy/Unix socket and an arbitrary URL `options` override, even if string guard accepts it.
- [ ] Boundaries: only approved scratch, dedicated database/owned schema, and explicit allowed child databases; no privileged default `postgres` account, wildcard admin role or foreign schema ownership.

## Source-exact write-scope ledger; choose one of two distinct authorizations

**Scope S1: test helper `test-database.ts`**: `DROP SCHEMA IF EXISTS "tm_test_*" CASCADE`, `CREATE SCHEMA`, apply migr 0001–0028 with selected idempotent replays and transaction boundary normalization, `DROP SCHEMA ... CASCADE` on teardown. Must authorize **schema reset BEFORE test execution**. Aborted migration may leave first SQL statements applied; dedicated sandbox only, preserve pre/post snapshots. Special Pack17 test applies release 0030/0031 on top of 0001–0028; neither editor 0030/0031 nor hypothetical T055 included.

**Scope S2: additional API integration fixture `replit-schema-catalog-reconciliation.integration.test.ts`**: actual `CREATE DATABASE tm_catalog_test_<16hex>_{dev,prod,fresh}` for 3 DBs + `DROP DATABASE IF EXISTS ... WITH (FORCE)`; owns `public` only *inside these newly created scratch DBs*. Must approve **three ephemeral DATABASE objects and CREATEDB role**, in addition to S1. Its built-in guard checks localhost/nondefault port but **does not prove physical isolation**. For S2 owner must attest exclusive cluster and permit exact create/drop scope with no preexisting name collision, no foreign sessions, no network interfaces shared with other databases. If not approved => **full `test:integration` prohibited**; bounded selection cannot claim original run reproduced.

**Out-of-scope:** `lib/db/test/schema-catalog-comparison.integration.test.mjs` optionally resets `public` in two databases when opt-in vars present; explicit **DENY** and do not enable. Likewise `lib/db` destructive reset scripts, `drizzle-kit push`, `pnpm db:push`, new SQL migrations or production `app_schema_migrations` adoption not permitted.

## Runtime preflight and evidence (future owner only)

- [ ] Separately signed **read-only catalogue phase** on certified disposable instance with observer lacking CREATE; optional existing [A20 Phase A 12 SELECTs](./WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql) must be inspected by A50/A60 against exact snapshot; no production metadata access.
- [ ] Catalog output version 16, effective role and grants, target schema/DB, absence of unexpected tables, triggers, active sessions (operator view), approved empty state; match independent certificate. Unknown/ambiguous result => STOP; no attempt to repair by DDL.
- [ ] **Reset phase explicit second GO** (schema S1, database S2) names exact target, resource list and rollback procedure; A20 checks again before flipping `TEST_DATABASE_RESET`. All positive and negative guard probes must be **offline/pure** until GO, no PostgreSQL.
- [ ] Verify report folder `G:\Mój dysk\ChatGPT\WEB-005\Raporty` on Windows, local writable directory existence and enough disk; **no raw secrets** to sync. Operator records Drive file ID + retrieved SHA after actual cloud verification, otherwise `SYNC_UNVERIFIED`.
- [ ] Freeze no-test-modification: no `skip`, .only, .todo, modified assertions, no retry to conceal fail, no artificial test selection. C02 remains HOLD.
- [ ] After signed execution, A50 captures actual first `not ok`/exception, TAP, return code, fixtures and cleanup, redacted logs and SHA; A60 independent exact-SHA review.

## Required STOP codes (first failing wins)

`STOP_NO_TRIPLE_SIGNATURE`, `STOP_SHA_DRIFT`, `STOP_UNCERTIFIED_CLUSTER`, `STOP_NETWORK_OR_DNS_AMBIGUOUS`, `STOP_ROLE_PRIVILEGE`, `STOP_URL_OR_SCHEMA_MISMATCH`, `STOP_PREEXISTING_DATA`, `STOP_RESET_OUT_OF_SCOPE`, `STOP_CATALOG_CREATEDB_NOT_APPROVED`, `STOP_HISTORICAL_LEDGER_UNKNOWN`, `STOP_RUNNER_OR_TEST_LIST_DRIFT`, `STOP_SECRETS_IN_LOG`, `STOP_ROLLBACK_NOT_DEFINED`, `STOP_GO_EXPIRED`.

**Current unchecked runtime status:** no certified cluster, A00/A20/operator approvals absent, therefore **`PG16_EXECUTION_NOT_AUTHORIZED`**. This checklist is complete as a design document; none of its runtime checkboxes is evidence of a performed check.
