# WEB-005 / A20 / R18 — Dedicated PG16 Identity and Migration Ledger Gate

**Task:** WEB-005-T021-A20-R18 · **Owner:** A20, PostgreSQL Migration Reconciliation · **For:** A50 (executor), A60 (independent QA), A00 (owner approval).  
**Mode:** SOURCE-ONLY. **Date:** 2026-10-14 Europe/Warsaw.  
**Decision:** `SOURCE_CONFIRMED / PG16_PHYSICAL_NOT_EXECUTED / P05_REVIEW_ONLY / ready_for_sql:false / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.

This is a reproducible **future** owner-authorized preflight contract; A20 has NOT accessed or provisioned any PostgreSQL host, has NOT used database credentials, and has NOT executed any SQL. This R18 wave does not authorize SQL DDL, historical ledger adoption, test fixture reset, migration execution or any composite release.

## 1. Exact source pins and A60 R17 evidence

- P05 migration validator PR38 is OPEN DRAFT, base release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, HEAD **`2d36864f4d2f1c838073f387fd3c8efb3378c43b`**, seven new files only under `lib/db/migration-ledger-validator/`. All seven remote Git blob SHAs were checked in R18 and matched the R17/R15 pins. The 6 mountable files also matched local `git hash-object`.
- Manifest `manifest.proposal.json` Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`, local SHA256 `261efafcb8bebbc9c98631a99c9410e4e6e2751480bd7d6ba7e9c773661dc51b` (this is NOT an independently owner-approved pin). Manifest status `PROPOSAL_ONLY_NOT_APPROVED`; source lineage release `1fdc401...`, editor `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`. 14/14 SQL source Git blobs and 9/9 editor snapshots were verified in prior unchanged R15/R17 baseline; their actual application to PostgreSQL remains unverified.
- Historical collisions: release 0030=controlled_correction_operations vs editor 0030=steam_catalog_abstract_world; release 0031=atomic_correction_receipts vs editor 0031=steam_catalog_pagination_indexes (proposal canonical 0032/0033). Release 0031 contains its own `BEGIN/COMMIT`. Matching an original ordinal/table name is NEVER proof of execution or permission to change a migration receipt.
- Code `validate.mjs` has only `REVIEW_ONLY` or `STOP` and always returns `ready_for_sql:false`; no PG driver, real SQL execution or migration runner. It is **not** the database's canonical ledger.
- R18 A20 offline re-execution: Node.js v22.16.0, `node --test validate.test.mjs` 37/37 PASS exit 0; separate A20-only synthetic negative harness 22/22 PASS exit 0; unpinned CLI exit 2 STOP with `MANIFEST_PIN_MISMATCH` / `SOURCES_MISSING`. These are **author-source offline tests, not actual PostgreSQL/API tests**.
- [A60 R17 independent report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [R17 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json): **P05 SOURCE_ACCEPTED_OFFLINE_ONLY** on unchanged exact HEAD; **PG16_RUNTIME_NOT_EXECUTED**. A50 R17 independently reported **zero native app tests**.

## 2. Owner certificate: mandatory BEFORE any connection

Only A00/owner/HQ may authorize a physical test target, in a written certificate containing ALL of the following, stored without any secret:
1. Approval ID, approver, permitted `CATALOG_READ_ONLY` action, validity window, A50 executor identity; absence => BLOCKED.
2. Exact Docker container ID or dedicated VM/cluster identity, approved host/IPv4/IPv6 or local socket, port, database name and PG major 16, immutable image digest or installation fingerprint. A local tunnel/proxy must be accounted for. Shared/staging/production databases, Replit and customer backups excluded.
3. Independent evidence of a wholly disposable nonproduction cluster and database; `TEST_DATABASE_URL` must explicitly point to THAT dedicated DB without any fallback to `DATABASE_URL`, even when the latter is defined in an unrelated shell.
4. Dedicated observer login with `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`, `rolreplication=false`, `rolbypassrls=false`, no `CREATE` on target database or schema; credentials injected privately, not copied into GitHub/chat/logs.
5. Exactly selected `tm_test_*` schema name (ASCII allowlist `^tm_test_[a-z0-9_]+$`), owned solely by the test owner. Observer can read `pg_catalog` but cannot drop/reset/DDL. Existing `public` is not an approved reset target.
6. Expected fixture profile and source SHA: **F0** empty target, **F1** 0001–0028 default test helper, **F2** full release 0001–0031 with distinct and approved setup, **F3** editor lineage, **F4** historical mixed/partial (no adoption). If F0, absent relations are normal but all app tests remain BLOCKED.
7. Reset request scope **separate from read-only approval**, documented as exact `DROP/CREATE` only for this disposable schema and exact test environment. For R18 reset approval is **NOT PRESENT / NOT EXECUTED**. Reset requires explicit owner/HQ GO; this read-only gate cannot grant it.

Missing host/certificate/role identity, ambiguous DNS endpoint, a test-looking name without out-of-band evidence, mismatched PostgreSQL major, user data in target, unapproved credentials, or unexpected `public` use => **STOP before psql**.

**Do not infer physical access** from a GitHub connection or local presence of source files. In A20's runtime: Node v22.16.0, Git 2.47.3; `pnpm`, `psql`, `docker`, `pwsh` unavailable; no full application Git checkout. PG16 `NOT_EXECUTED`.

## 3. A50 copyable NONMUTATING preflight — ONLY after the certificate

The existing R15 SQL source is reused unchanged; no second validator or migration tool:
[WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql).

Execute **on owner-approved A50 Windows executor only**, against a separately provisioned **observer** role. Replace placeholders from the signed nonsecret certificate; DO NOT paste credentials into shell arguments, report or repo. Command uses direct `psql` connection flags; there is no DATABASE_URL fallback.

~~~powershell
$ErrorActionPreference = 'Stop'
# Only after the signed certificate has been independently compared with this session:
$approvedHost = '<approved-dedicated-host-or-127.0.0.1>'
$approvedPort = <approved-integer-port>
$approvedDb   = '<approved-disposable-db>'
$observerRole = '<approved-nonprivileged-observer>'
$schema = 'tm_test_a50_r18'
if ($schema -notmatch '^tm_test_[a-z0-9_]+$') { throw 'STOP bad schema' }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw 'STOP psql unavailable' }
# NEVER use DATABASE_URL as a source for this connection; no TEST_DATABASE_RESET.
# -W prompts for the disposable observer password without printing it.
psql -X -W -v ON_ERROR_STOP=1 -h $approvedHost -p $approvedPort -U $observerRole -d $approvedDb -v schema=$schema -f 'docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql'
if ($LASTEXITCODE -ne 0) { throw "STOP: catalog query failed with exit $LASTEXITCODE" }
~~~

Do not run the above unless all certificate conditions pass. The SQL file has only `BEGIN READ ONLY`, `SET LOCAL` timeouts, catalog `SELECT`, and `ROLLBACK`: PostgreSQL version, DB/role/host, schema boundaries, table/column/check/FK/index/trigger/function provenance and existence (not contents) of legacy ledger. Source is statically vetted but **the actual command has NOT been run**. Inspect result for approved DB, host, schema, role and absence of DDL privileges; wrong identity or missing required fixture objects => STOP.

Capture sanitized output and SHA-256, `git rev-parse HEAD`, exact fixture, server/role/DB identity and exit. Redact password, full connection URLs, application rows, tokens, and sensitive host addresses from public reports. Do NOT claim that one SQL response proves physical isolation; certificate is independently required.

## 4. Reset hazard and three-tier permission

`artifacts/api-server/test/test-database.ts` (release baseline) uses `getSafeTestDatabaseConfig` with test-looking database name, `TEST_DATABASE_URL`, `tm_test_*`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; `resetTestSchema` executes `DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE` then rebuilds baseline to 0028. **All tests that call this helper are MUTATING, even on test DB** and must be individually authorized AFTER read-only preflight. Test credentials must not be superusers and every test must have its unique preapproved schema. Raw SQL files reference `public.*`, so `search_path` by itself does not confine DDL. Two opt-in catalog/deployment tests can `DROP SCHEMA public CASCADE` and are specifically forbidden under this scope.

Permissions must be staged:
- Gate 0: owner validates dedicated physical cluster/DB and gives catalog-only read permission;
- Gate 1: A50 runs nonmutating inspection and A60 reviews exact signature and output;
- Gate 2: owner separately authorizes specific disposable schema reset + app fixture setup/integration tests. No auto-upgrade from Gate 1 to Gate 2.

For F2 missing migrations 0029–0031, tests must be BLOCKED until an independently approved fixture-build mechanism exists. Source 0031 wrapper removal in existing local test harness does not authorize real migration application.

## 5. A50 per-PR native API commands and expected oracle — NOT_EXECUTED

**Prerequisites for BOTH:** physical PG16 Gate 2 written owner approval, complete per-PR checkout, Node22/pnpm10, frozen deps, explicit `TEST_DATABASE_URL` securely injected, distinct `TEST_DATABASE_SCHEMA` matching the certificate and `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` ONLY for an approved reset, required tables/constraints/triggers present. Do not construct a composite or merge/cherry-pick. Each test mutates its disposable DB: NOT authorized or run by A20.

**PR41 / P08** current head `f03cf3d09988a04ba9c2856e205d21f994ff67f1`: `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`; expected positive QP/QPE/approved output OP `sourceBasketPosition` exact cross-record parity, source basket route receipt/clone consistency; negative one-position corruption must return `400 INVALID_BACKUP_V3` before clone, child/clone root count unchanged. Include null-legacy source position and non-null explicit cases; actual Backup B2 policy remains separate A90/owner. A60 R17 `SOURCE_ACCEPTED_CONDITIONAL` on this HEAD, NO PG16 acceptance.

**PR42 / P09** current R18 HEAD observed `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, previously reviewed R17 `25b09f1a48a85ae882b817118f5d8c23bffbe383`. Source now includes `latestUndoable` inside `undoTournamentRosterAction` and authored deterministic `pg_blocking_pids` regression for both roster `delete_player` and `restore_player`, but **new SHA requires fresh A60 independent exact-SHA verdict**. Expected negative: X selected stale undo, Y commits newer action before X locks => `409 UNDO_ACTION_CHANGED`, no action marked undone and ZERO roster/log modifications; expected positive: lawful latest undo still works and same-timestamp ordering deterministic. No R18 PG16 tests are executed by A20; do not claim runtime PASS or QA signoff.

On two **separate** approved checkout directories (do not substitute branch names; exact 40-hex SHA must match):

~~~powershell
# Owner-provided isolated executor; all PG16 reset permissions and env set out of band.
node --version
pnpm --version
pnpm install --frozen-lockfile
git rev-parse HEAD  # STOP unless exact one of the pinned SHAs above.
Push-Location artifacts/api-server
# P08 / PR41 checkout ONLY:
node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
# P09 / PR42 checkout ONLY, SEPARATE invocations/fixture:
# node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { throw "STOP feature integration test exit $code" }
~~~

Record test command/exit/time/fixtures/DB nonsecret fingerprint and sanitized TAP. A unit or authored test, static read, wrong branch, skipped test, missing fixture or upstream Pack19 FAIL does not confer feature PASS. Consult [A50 R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) for current blocked environment. A60 R17 QA and A00 owner disposition are separate.

## 6. Owner next decision / stop

**One explicit A00 / owner unblocker:** provide A50 a trusted host/VM with full per-PR checkout, Node22/pnpm10 and a physically dedicated disposable PG16 database; sign a **catalog-only** identity/role/host/schema certificate first. Then A50 can execute Gate 1, A60 can inspect, and owner may separately decide Gate 2. Until then: `PHYSICAL_EXECUTOR_BLOCKED`, `PG16_NOT_EXECUTED`.

Unchanged P05 manifest remains `REVIEW_ONLY` / `ready_for_sql:false`. Never run migrations/adopt historical ledger, merge, deploy, use shared DB or invoke SWARM-006. If owner later explicitly approves a final handoff with runtime test debt, that is A00/HQ's policy decision and must preserve downstream SWARM-006 release test STOP until independently completed; A20 does not authorize or dispatch it.
