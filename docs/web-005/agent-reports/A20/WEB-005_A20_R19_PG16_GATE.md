# WEB-005 — A20 R19 · PG16 Isolated Test Gate / Historical Ledger

**Task:** WEB-005-T021-A20-R19 · **Role:** A20 PostgreSQL Migration Reconciliation · **Mode:** SOURCE/SAFE ONLY · **Wave:** R19.1 (2026-10-14, Europe/Warsaw) · **Recipients:** A00 authorization, A50 execution, A60 independent QA.
**Disposition:** `P05_SOURCE_ACCEPTED_OFFLINE_ONLY / REVIEW_ONLY / ready_for_sql:false / PG16_NOT_EXECUTED / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.

This is a **nonmutating preflight and conditional test contract**, not a PG16 connection or SQL execution receipt. No A20 PostgreSQL, Docker/psql, schema reset, API test, merge, deployment or SWARM-006 action was performed.

## 1. Exact source and independent QA

- Repository: `C8LyNn/aplikacja-turnieje`; release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (branch compare IDENTICAL).
- P05 PR38 OPEN DRAFT/UNMERGED, exact HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, old R18 HEAD **identical**; exactly seven new files under `lib/db/migration-ledger-validator/`. R19: six local Git blob identities matched, remote PR file list 7/7 present, manifest source Git blob SHA 14/14 matched, editor snapshots 9/9 exact strings matched at pinned commit. Manifest status `PROPOSAL_ONLY_NOT_APPROVED`, not certified by owner.
- Offline R19 Node v22.16.0: `node --test validate.test.mjs` **37/37 PASS / exit 0**, author-authored `node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs` **22/22 PASS / exit 0**, and `node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json` **STOP/exit 2** with `MANIFEST_PIN_MISMATCH`, `SOURCES_MISSING`, `ready_for_sql:false`. Positively modeled histories yield at most `REVIEW_ONLY`; absence of SQL GO is intentional.
- Independent [A60 R18 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), Git blob `656a8850a6358e5b4b2517220a5fc55f99dc014f` and [R18 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json) give P05 `SOURCE_ACCEPTED_OFFLINE_ONLY` for exact unchanged SHA. **No PG16/runtime/full release acceptance.**
- [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md) states **zero native application tests**, no verified full repo checkout/pnpm or dedicated PG16. A20 offline count is not A50 application count.
- Historical collision: release original 0030 `controlled_correction_operations` / 0031 `atomic_correction_receipts`, editor original 0030 `steam_catalog_abstract_world` / 0031 `steam_catalog_pagination_indexes` (proposed canonical 0032/0033 for editor). Release 0031 source has top-level `BEGIN; COMMIT;` wrapper. Catalog objects alone or numeric `0030/0031` receipts do **not** prove exact source application/lineage. Do not run migration runner, rewrite SQL/ledger, automatically adopt or certify historical receipts.

## 2. Pre-connection owner certificate — hard prerequisite

A00/owner supplies **one signed, nonsecret authorization and independently verified disposable target receipt**, explicitly **CATALOG_READ_ONLY** first, containing:

1. Approval reference, named owner/approver, expiry, named A50 executor, permitted operations (catalog `SELECT` only) and a statement that **no reset/DDL/data mutation is authorized** by this approval.
2. Dedicated and physically isolated PostgreSQL **16** cluster/VM/container ID, immutable image digest/build, exact host/socket/IPv4/IPv6 + port + DB, proof this is *not* shared/prod/staging/Replit and contains no real customer/user backup.
3. Dedicated observer principal with no superuser, createdb, createrole, replication or bypassrls privileges, no DB/schema CREATE; exact username and secure credential delivery out-of-band. No passwords/tokens/DSN in GitHub, logs or chat.
4. Unique `TEST_DATABASE_SCHEMA=tm_test_*` (exact `^tm_test_[a-z0-9_]+$`) test-only owner/scope and expected catalog/fixture profile; test-looking names or `search_path` **do not establish isolation**.
5. Explicit `TEST_DATABASE_URL` for future integration tests must point only to the independently attested dedicated database; **NO fallback to `DATABASE_URL`**, any existing application DSN, SSH/reverse proxy with unresolved backing destination or automatic default credentials.
6. If an executor subsequently needs mutating reset/integration test, a **separate second written consent** must identify exact disposable DB/schema, `DROP/CREATE` boundary, feature test, checkout SHA, rollback/disposal process and test-only executor role. The R19 document contains **no such consent**.

Missing/ambiguous certificate, wrong host/db/role, unexpected cluster version, shared/prod reachability, weak privilege boundary, leaked secret, unsupported fixture, or any request to `DROP public`: `STOP BEFORE CONNECTION`.

**Owner one actionable decision:** provide A50 a trusted approved PC/VM with full per-PR checkout + Node22/pnpm10 and this separately certified disposable PG16 target. Sign catalog-only scope; authorize limited test reset only later as a distinct decision.

## 3. Copyable owner-approved *read-only* PG16 preflight (NOT EXECUTED)

Reuse existing **unchanged** R15 catalog SQL:
[WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql), Git blob `27e90e01a1c373e51c0128680b476acad2df7c45`.

It uses `BEGIN READ ONLY`, transaction-local timeouts, `SELECT` only against `pg_catalog` plus `ROLLBACK`. Verifies DB/host/user/PG version, test-schema relations/columns, constraints (incl. `convalidated`), FK/index/triggers/functions, and migration-ledger table **existence**. It does **not** read ledger rows or customer table data. Static source check only: **NOT EXECUTED** on PG16.

Commands for a **future** owner-approved Windows A50 executor **only** (the placeholders must come from the signed certificate; neither this repo nor connector can provide them):

~~~powershell
# HARD GATE: signed physical-isolation certificate checked out-of-band first.
$ErrorActionPreference = 'Stop'
$approvedHost = '<OWNER-APPROVED-HOST>'
$approvedPort = <OWNER-APPROVED-INTEGER-PORT>
$approvedDatabase = '<OWNER-APPROVED-DISPOSABLE-DB>'
$approvedObserver = '<OWNER-APPROVED-READONLY-ROLE>'
$approvedSchema = 'tm_test_a50_r19'
if ($approvedSchema -cnotmatch '^tm_test_[a-z0-9_]+$') { throw 'STOP: forbidden schema' }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw 'STOP: psql missing' }
# Password requested interactively; never use DATABASE_URL or any default DSN.
psql -X -W -v ON_ERROR_STOP=1 -h $approvedHost -p $approvedPort -U $approvedObserver -d $approvedDatabase -v schema=$approvedSchema -f 'docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql'
if ($LASTEXITCODE -ne 0) { throw "STOP: read-only catalog exit $LASTEXITCODE" }
# Owner compares masked output with the independently signed host+DB+role+schema receipt.
~~~

A matching query output alone cannot prove dedicated physical isolation; verify against signed owner certificate. Preserve nonsecret command, version, exact test SHA/fixture, exit, sanitized catalog evidence+digest. No `TEST_DATABASE_RESET` in catalog-only phase.

## 4. Fixture separation and dangerous code exclusion

Release source `artifacts/api-server/test/test-database.ts`, Git blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`: `getSafeTestDatabaseConfig` requires explicit test-looking `TEST_DATABASE_URL`, `TEST_DATABASE_SCHEMA=tm_test_*`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; `resetTestSchema()` actually performs `DROP SCHEMA IF EXISTS "<schema>" CASCADE`, rebuild and selected source SQL `public.` rewrite. Its default fixture is `0001–0028`, NOT release `0001–0031`. Files `0029/0030/0031` require separately approved fixture setup/receipt and explicit source/wrapper reconciliation; do not assert F2 fixture from F1.

- F0: certified empty disposable PG16; catalog read only, API tests blocked.
- F1: intentionally reset disposable `tm_test_*`, baseline through 0028; requires separate explicit **reset GO**, not inferred from env vars.
- F2: exact verified release 0001–0031 in disposable DB, only after separate owner-approved fixture plan, migration transaction contract and source receipts.
- F3/F4: editor/mixed/partial lineage, require exact provenance and checksum; orphan/unknown/ambiguous receipt => STOP.

**Exclude** opt-in `lib/db/test/tournament-routing-persistence-v2-deployment.test.mjs` and `lib/db/test/schema-catalog-comparison.integration.test.mjs` from common preflight because they can `DROP SCHEMA public CASCADE`. Do not run generic reset runners on any shared target. No production migrations or ledger writes.

## 5. Exact PR-specific PG16 test matrix — AUTHORING CONTRACT, NOT_EXECUTED

The tests below are **mutating integration suites**. A50 can only execute them after a *different* written owner reset/test GO on independently verified dedicated PG16, per-PR full checkout, Node22, pnpm10, frozen dependencies, uniquely approved `tm_test_*` schema, explicit securely injected test DB URL and required fixture signatures. Pin `git rev-parse HEAD` before each suite. **Never combine PR patches in WEB-005.**

| PR / exact independently observed HEAD | API integration test file under `artifacts/api-server/test/` | Required outcome |
|---|---|---|
| **#41** `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `stage-basket-route-execution.integration.test.ts` | Backup B1: valid QP/QPE/approved OP `sourceBasketPosition`, route receipts and import; corrupted/swap/missing position => 400 `INVALID_BACKUP_V3` **before clone**, unchanged clone-root and child counts; legacy nullable position separately asserted |
| **#42** `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `revert-match.integration.test.ts` | Global roster `delete_player`/`restore_player` stale queued X vs newer Y: **409 `UNDO_ACTION_CHANGED`**, zero roster/action-log writes; valid latest Undo => success; verify same-transaction lock and deterministic order |
| #39 `16053ee132756ca05b6f2cd1f0cabae823905387` | `match-revision.integration.test.ts` | Match revision, conflict/retry, trigger and history invariants |
| #44 `2f0187b7242681c394c09058b5ef647667206bd6` | `session-revocation-race.integration.test.ts` | Correct session revocation lock/race and zero unauthorized side effects |
| #45 `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | `round-robin-terminal-reopen.integration.test.ts` | RR terminal/reopen, match lifecycle and histories |
| #46 `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `tournament-delete-revocation.integration.test.ts` | Guarded delete, dependent FK/child cleanup and revocation |
| #48 `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | `stage-basket-route-execution.integration.test.ts` | B3A MVCC `REPEATABLE READ` export coherent under concurrent writes, distinct SHA from #41 |
| #49 `99298b81501c3e7764d653604923522a19b9f05c` | `auth-organizer-revocation-r12.integration.test.ts` | Organizer auth revocation and private state leakage negative |
| #51 `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | `revert-match.integration.test.ts` | malformed Undo fail-closed/zero writes, distinct SHA from #42 |

Suggested **future** command for *ONE* exact checkout (NOT executed by A20):

~~~powershell
node --version; pnpm --version
git rev-parse HEAD # must match precisely the selected 40-char PR SHA
pnpm install --frozen-lockfile
# Only owner injects TEST_DATABASE_URL pointing at certified disposable PG16;
# owner separately approves TEST_DATABASE_SCHEMA and reset scope, then alone enables:
# TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
Push-Location artifacts/api-server
node --import tsx --test --test-concurrency=1 ./test/<EXACT-TEST-FILENAME>.ts
$testExit = $LASTEXITCODE
Pop-Location
if ($testExit -ne 0) { throw "STOP: app integration exit $testExit" }
~~~

Never use an authored test or R15/R18 PLAN-only preflight as a runtime PASS. Any missing dependency/fixture/F2 SQL evidence = BLOCKED. Capture per-SHA TAP+exit, isolated database identity, fixture profile, expected/actual negative and post-test catalog; A60 independently reviews, author cannot self-certify.

## 6. Final GO/STOP and HQ decision

**A20 SOURCE QA** ready: unchanged P05 37/37 Node and 22/22 A20 negatives, 14/14 SQL blob identities, 9/9 editor snapshots. **A50 physical native tests** remain zero; no owner-certified dedicated PG16. Independent A60 R18 P05 `SOURCE_ACCEPTED_OFFLINE_ONLY`. Policies around Backup B2/revision/legacy and historical ledger adoption are `POLICY_OPEN`; A20 does not select them.

**A00 concrete action:** assign A50 an authorized trusted full checkout executor + physically identified isolated PG16 test database; sign `CATALOG_READ_ONLY` scope and a nonprivileged observer first. No mutating reset until separate written GO. If runtime debt is to be carried forward, A00/HQ may request explicit `HANDOFF_WITH_RUNTIME_TEST_DEBT` only after independent source/38-case/owner policy closure, with SWARM-006 later requiring hard release tests; this A20 document does not approve or launch a handoff.

**Hard STOP:** shared/prod PG16, existing data, SQL DDL/receipt adoption, auto-migration, merge/rebase/cherry-pick, paid CI rerun, staging/live, or starting SWARM-006. **Final:** `WEB-005-T021-A20-R19 / PG16_NOT_EXECUTED / P05_REVIEW_ONLY / SQL_STOP / SWARM006_HOLD`.
