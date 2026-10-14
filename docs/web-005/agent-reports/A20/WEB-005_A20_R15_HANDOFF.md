# WEB-005_A20_R15_HANDOFF — Historical Ledger / PG16 Test Safety

**AGENT:** A20 — PostgreSQL Migration Reconciliation
**TASK:** WEB-005-T021-A20-R10
**WAVE:** R15.1 / 2026-10-14, Europe/Warsaw
**MODE:** SOURCE-ONLY / TEST SAFETY; no code lane, SQL, DDL, DB connection, merge or deployment.
**COORDINATOR:** WEB-005/A00
**DECISION:** REVIEW_ONLY / SQL_STOP / PHYSICAL_PG16_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD
**R15 central instructions:** docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md, Git blob e6950cbff7e521ed9b3ff774e7787e8d598a966d.

## 1. Exact GitHub source facts (rechecked R15)

Repository: C8LyNn/aplikacja-turnieje.
Release branch: release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 (comparison against pinned SHA = identical).
P05 pull request: https://github.com/C8LyNn/aplikacja-turnieje/pull/38
Branch: feat/web-005/t021-migration-ledger-validator
HEAD: 2d36864f4d2f1c838073f387fd3c8efb3378c43b (comparison = identical).
PR status: OPEN, DRAFT, UNMERGED. Exactly 7 new files, ALL in lib/db/migration-ledger-validator/:

- README.md — Git blob d68102bf577b6e78216032efb0cd996097cf34d8
- manifest.proposal.json — 28f493263a2cbfb919db1f99b220058175b46ba0
- source-snapshots.editor.json — d73453363928c31bd452c1fa30ac726613708e17
- synthetic-fixtures.json — 55ba08be665b12158205473fabe16901d7926667
- synthetic-history.json — f7898bdec530e91ec5215f464e1461512c4233be
- validate.mjs — 430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e
- validate.test.mjs — 96c3d6b5d3f7ff9c10c154de0dc7c04374f61917

GitHub 7/7 blob identities match prior SHA pins; local testable six source files also matched git hash-object. Editor snapshots file was verified separately against source content: 9/9 exact content matches editor source commit 28da3ef94f3b30f90c1b3b70a88ab7f61462d99c. Manifest contains 14 migrations canonical 0027–0040, 14/14 source Git blob SHA match; STATUS = PROPOSAL_ONLY_NOT_APPROVED.

Historical numbering collision remains unresolved:
- 0030 release -> controlled_correction_operations vs 0030 editor -> steam_catalog_abstract_world (proposal 0032).
- 0031 release -> atomic_correction_receipts vs 0031 editor -> steam_catalog_pagination_indexes (proposal 0033).
- Release 0031 still contains source BEGIN/COMMIT; no approved transactional wrapper/SQL transform or historical adoption plan.
Number, row count, table presence or IF NOT EXISTS is not proof of previously executed migration; cannot infer release/editor lineage from ordinal.

Other checked API PR HEADs, all OPEN DRAFT and unmerged on release base:
#39 16053ee132756ca05b6f2cd1f0cabae823905387;
#41 e847cb705296a48ab5c68ece96776cd0e0bbb417;
#42 1ae0ccb801f4177052bff1ec7041e55b8c992c8b;
#44 2f0187b7242681c394c09058b5ef647667206bd6;
#45 a7a87bc019731191dbfa44bee6939e3fa25e27f4;
#46 7f60849e389a7ed35fdd39dd5493c4c4c267d860;
#48 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3;
#49 99298b81501c3e7764d653604923522a19b9f05c;
#51 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a.

## 2. Tests actually run by A20 in R15 (offline ONLY)

Platform available in this A20 runtime: Node.js v22.16.0. No authenticated disposable PostgreSQL16/TEST_DATABASE_URL, PG16 server, psql or Docker available here. No remote DB connection attempted.

~~~bash
cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node --test validate.test.mjs
# EXIT 0: 37 tests PASS, 0 FAIL, 0 SKIPPED, 4 suites

node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs
# EXIT 0: 22 supplemental PASS, 0 FAIL; A20-authored harness outside PR38

cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json
# EXPECTED EXIT 2: decision=STOP, ready_for_sql=false,
# MANIFEST_PIN_MISMATCH and SOURCES_MISSING
~~~

37/37 and 22/22 are LOCAL OFFLINE RUNTIME_VERIFIED, NOT actual PostgreSQL/API runtime tests. The supplementary harness is NOT committed in P05 and is not independent A60 QA; A60 must reproduce/critique separately.

Supplementary checks include clean, release, editor, mixed simulated history -> REVIEW_ONLY; orphan release R31, orphan editor E36, missing editor midchain, ambiguous original 0030/0031, no ledger, unknown/duplicate ledger, checksum drift, self-declared historical adoption, missing real pg_catalog fingerprint, graph cycles/unknown dependencies/duplicate canonical numbers -> STOP or invalid manifest. All outputs have ready_for_sql=false; positive synthetic fixtures never yield SQL GO.

Existing PR38 GitHub Actions: run 38569859562 ("Tournament correction safety CI") completed FAILURE at preceding Pack19 expected readOnly:true vs actual Drizzle accessMode:"read only"; later mandatory CI steps skipped. The source-contract fix is already PR35, not integrated here. This is neither a validator-specific feature failure nor full CI acceptance; no manual CI rerun requested/executed by A20.

**Independent A60 acceptance:** NOT_VERIFIED. GitHub PR38 returned no recorded submitted review, which does not rule out a separate QA report. No self-acceptance.

## 3. R15 published test-safety deliverables

- **Safe owner/A50 PG16 runbook:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_SAFE_PG16_RUNBOOK.md
- **Nonmutating catalog inspection source (NOT_EXECUTED):** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql
- This report: https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_HANDOFF.md

Runbook provides owner-only conditional local Windows/Docker setup, independent host/cluster fingerprint, PG16 major version and DB/role/schema guards, nonprivileged observer, separate future executor, approval boundary, prohibited shared resets, per-PR exact SHA/test filename matrix, fixture profiles and STOP criteria.

The SQL file uses only explicit BEGIN READ ONLY; SET LOCAL timeouts; pg_catalog SELECT; ROLLBACK. It does not apply migrations, read user/application row contents, modify ledger, reset anything or authorize connection itself. OWNER/A00 must certify identity/permissions out of band before A50 is allowed to run it. Authenticated execution in this A20 environment: NOT_EXECUTED.

## 4. Exact reset & fixture boundary (SOURCE_CONFIRMED)

artifacts/api-server/test/test-database.ts in release:
- Requires NODE_TEST_CONTEXT, explicit TEST_DATABASE_URL, test-looking DB name, TEST_DATABASE_SCHEMA matching tm_test_* and TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA for integration reset.
- resetTestSchema performs DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE and CREATE SCHEMA, applies/replays baseline migration SQL, normalizes selected public. references in a TEST renderer, currently through 0028.
- This is a MUTATING test helper, never a safe catalog-only preflight; string checks do NOT guarantee isolated physical server or dedicated database.
- Default F1 0001–0028 does NOT equal target release F2 0001–0031: 0029 Steam catalog and 0030/0031 correction operations/receipts are absent by default.
- The separate tournament-atomic-correction-postgresql.integration.test.ts adds 0030/0031 to a test schema by its own render/transaction handling; this is not approval of a production migration runner.
- lib/db/test/tournament-routing-persistence-v2-deployment.test.mjs and lib/db/test/schema-catalog-comparison.integration.test.mjs have opt-in paths that DROP SCHEMA public CASCADE. Strictly EXCLUDE from general preflight and any shared test DB.

Profiles: F0 empty isolated DB, F1 default 0001–0028, F2 full release 0001–0031 (NOT built), F3 editor historical, F4 mixed/partial/unknown (STOP until owner-approved provenance). Never silently replace one profile with another.

## 5. A50 exact integration matrix (future only, NOT EXECUTED)

Each requires owner/A00 distinct RESET approval, dedicated disposable database, pinned exact PR checkout, frozen dependencies, confirmed separate test-only schema and explicitly supplied test URL. All commands are in the runbook, and all require actual exit/TAP/log receipts:

| PR | Exact test file under artifacts/api-server/test |
|---|---|
| #39 | match-revision.integration.test.ts |
| #41 | stage-basket-route-execution.integration.test.ts |
| #42 | revert-match.integration.test.ts |
| #44 | session-revocation-race.integration.test.ts |
| #45 | round-robin-terminal-reopen.integration.test.ts |
| #46 | tournament-delete-revocation.integration.test.ts |
| #48 | stage-basket-route-execution.integration.test.ts |
| #49 | auth-organizer-revocation-r12.integration.test.ts |
| #51 | revert-match.integration.test.ts |

Do not compose/change multiple PRs in WEB-005. For PR41 and PR48 the test filename overlaps: each must run on its own exact independent source SHA. For PR42/51 the revert fixture likewise overlaps. Reject tests that lack a dependency fixture, are skipped, access shared data, or run against a different commit.

## 6. GO/STOP, ownership, blockers and next steps

| Area | R15 evidence / decision |
|---|---|
| PR38 source/blobs | SOURCE_CONFIRMED 7/7 |
| Manifest SQL / editor | SOURCE_CONFIRMED 14/14 Git object SHA, editor snapshot 9/9 |
| Validator offline Node | RUNTIME_VERIFIED 37/37, exit 0 |
| Supplemental offline negatives | RUNTIME_VERIFIED 22/22, exit 0; A20-authored only |
| Validator CLI fail-closed | RUNTIME_VERIFIED STOP, exit 2 |
| Independent A60 exact-SHA signoff | NOT_VERIFIED / PENDING |
| Physical PostgreSQL16/actual catalog | BLOCKED / NOT_EXECUTED |
| API tests against PG16 | NOT_EXECUTED |
| Manifest owner approval / release-editor adopted receipts | POLICY_OPEN / STOP |
| Transaction wrapper for 0031 / migration runner | STOP / NOT_AUTHORIZED |
| Production SQL / DDL / reset / merge / deployment | HARD STOP |
| Transfer to SWARM-006 | HOLD until formal complete WEB005 closeout |

**One concrete owner/A00 unblock decision:** Approve/provision an independently identified, disposable PG16 cluster with EXACT host/container identity, port, database, read-only TEST role, tm_test_* scope and an owner-signed permission limited first to NONMUTATING CATALOG READ. A50 then reports actual identity and read-only catalog results with exit codes; a future isolated reset/test run requires a SEPARATE authorization. No real SQL execution or migration grant follows from this report.

**A60 handoff:** Recheck exact PR38 Git blob, unknown ledger, duplicate/partial/orphan checksum, ambiguous source-original 0030/0031 and lack of catalog fingerprint; evaluate reproducible offline tests, and keep acceptance separate from author assertions.

**A00 handoff:** Accept only evidence recorded here, register published direct URLs and blockers; P05 stays INTERNAL_BUFFER/REVIEW_ONLY. No cross-thread messaging is inferred solely from this GitHub file.

**Files modified by A20 in R15:** these documentation-only files in docs/web-005/agent-reports/A20 on the central documentation branch. No edits to application, migration SQL, runner or PR38 HEAD; no new implementation PR.

**FINAL:** WEB-005-T021-A20-R10 / SOURCE_CONFIRMED / OFFLINE_59_PASS / A60_PENDING / PHYSICAL_PG16_NOT_EXECUTED / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD.
