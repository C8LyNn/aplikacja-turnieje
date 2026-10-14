# WEB-005 / A20 / R15.1 — SAFE PG16 RUNBOOK

**Task:** WEB-005-T021-A20-R10 · **Mode:** SOURCE-ONLY / TEST SAFETY · **Owner:** A20 · **For:** A50 test executor, A60 independent QA, A00 authorization.  
**Date:** 2026-10-14 Europe/Warsaw · **Status:** SOURCE_CONFIRMED / PHYSICAL PG16 NOT_EXECUTED / REVIEW_ONLY / SQL_STOP.
**Warning:** This document is a FUTURE execution contract, not an authorization. A20 did not access PostgreSQL, run any SQL, provision a container, or authorize test reset.

## A. Source pins and historical ledger

- Repository: C8LyNn/aplikacja-turnieje.
- Release ref: release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.
- P05 PR38: feat/web-005/t021-migration-ledger-validator @ 2d36864f4d2f1c838073f387fd3c8efb3378c43b, OPEN DRAFT, 7 new validator files, no modified existing SQL.
- Proposal manifest: lib/db/migration-ledger-validator/manifest.proposal.json; status PROPOSAL_ONLY_NOT_APPROVED; 14 canonical logical migrations 0027–0040, source Git SHA 14/14 matched, editor snapshots 9/9 matched.
- Historical collision: release 0030=controlled_correction_operations and editor 0030=steam_catalog_abstract_world (proposal canonical 0032); release 0031=atomic_correction_receipts and editor 0031=steam_catalog_pagination_indexes (proposal canonical 0033). An ordinal number alone is NOT an applied receipt.
- Release 0031_atomic_correction_receipts.sql has top-level BEGIN/COMMIT. No approved transactional wrapper/rewrite or adoption exists.
- Validator's only decisions: STOP or REVIEW_ONLY; ready_for_sql=false always. Catalog presence, a passing offline suite or legacy app_schema_migrations cannot change this. A00/owner approval + A60 independent QA + a distinct future migration plan would all be needed before SQL execution (outside R15).

## B. Hard preflight STOP before even a connection

A50 must first receive an **out-of-band owner/A00 authorization** naming an independently isolated, disposable PostgreSQL16 instance. Require an environment receipt with fields:

1. Permission reference and named approver, date, allowed operation: READ-ONLY CATALOG ONLY; separate explicit permission is required for any RESET/DDL/integration execution.
2. Exact server/cluster owner, instance/container ID, source image tag AND digest, host (or approved Unix socket), port, database name and expected PostgreSQL major=16; explicitly attest zero shared/prod/staging/Replit connectivity.
3. Dedicated database and test-only role with no superuser/createdb/createrole/replication/bypassrls; observer must have no CREATE on database or test schema. The executor is another role only after separately approved reset scope.
4. Allowed disposable schema string matching ^tm_test_[a-z0-9_]+$; exact schema owner, allowed lifecycle and proof no other projects/users rely on it. Name ending with test alone is not isolation proof.
5. Test-only credential injection method with NO secret values in logs/URL metadata/chat; never use real backups or user data. Observer should be prompted for password or securely injected at runtime.
6. Fixture profile identity F0/F1/F2/F3/F4 and exact approved source SHA, including SQL transformation/checksum if a future test-only renderer is separately authorized.
7. Proof that connection variables are explicit and no fallback to DATABASE_URL, pooled Replit or any shared DB is possible.

**Missing any field or unexpected DB/role/host/catalog:** STOP. Do not run psql, migrations, test bootstrap, resetTestSchema, drizzle push, schema catalog comparison, or feature integration tests.

## C. Optional LOCAL WINDOWS / DOCKER owner-provisioning example — NOT EXECUTED

Only an authorized OWNER may run the following in a newly dedicated local Docker Desktop environment. This creates a **fresh nonproduction PG16 cluster**, not an existing database. Nothing here grants A50 permission to run SQL/DDL. If no Docker, the owner can provide an equivalent approved runner with an independent Postgres cluster and the same identity evidence.

~~~powershell
# OWNER-ONLY after written approval; Docker Desktop running; verify no name/port collision.
docker version
docker ps --all --filter name=web005-a50-pg16-r15
$secure = Read-Host "New disposable-only PostgreSQL password" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $env:POSTGRES_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
docker run --detach --name web005-a50-pg16-r15 --publish 127.0.0.1:55432:5432 --env POSTGRES_DB=web005_a50_test --env POSTGRES_USER=web005_fixture_admin --env POSTGRES_PASSWORD postgres:16
Remove-Item Env:POSTGRES_PASSWORD
docker inspect --format '{{.Id}} {{.Image}} {{json .NetworkSettings.Ports}}' web005-a50-pg16-r15
~~~

- Container-local setup admin is privileged: it MUST NOT be handed to A50 as the read-only catalog observer. Owner must separately provision a nonprivileged observer plus, only when approved, an isolated executor role. The Docker engine may store env metadata: use a disposable secret NEVER reused anywhere else, restrict Docker access, and do not publish raw inspect output with environment variables.
- Bind is loopback 127.0.0.1 only. Stop and remove this disposable container only on owner instruction; do not point any existing container, volume, port or database at these commands.
- Record the immutable image digest, actual container ID, network/port mapping, schema and approval in the owner receipt. Tag postgres:16 may float; a future reproduction must pin digest.
- A new container includes no tm_test_* fixture and NO migration-application authorization. Owner provisioning of a test schema/role is separate scope. A20 created none.

## D. Nonmutating CATALOG read, only after B passes

File published alongside this runbook:
docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql

For an approved local instance and a test-only nonprivileged observer, obtain an interactive password from the owner. Example after verifying allowed host/DB/port:

~~~powershell
$env:TEST_DATABASE_SCHEMA = 'tm_test_a50_r15'
# Do not set TEST_DATABASE_RESET for this phase. Do not copy DATABASE_URL.
psql -X -W -h 127.0.0.1 -p 55432 -U web005_a50_observer -d web005_a50_test -v ON_ERROR_STOP=1 -v schema=$env:TEST_DATABASE_SCHEMA -f 'docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql'
if ($LASTEXITCODE -ne 0) { throw 'PG16 CATALOG PREFLIGHT FAILED — STOP' }
~~~

This uses only catalog SELECT statements in BEGIN READ ONLY plus transaction-local timeouts and ROLLBACK. It reports server/role/schema identity, column/constraint/index/trigger/function signatures and legacy ledger *presence*, without copying user rows or rewriting anything. The script cannot prove physical isolation by itself; compare the result to the independently supplied owner receipt **before** allowing subsequent test setup. Stop if role has DDL privileges, schema/host/DB differs, server is not PG16, or necessary objects are missing. Record normalized sorted pg_catalog evidence and SHA-256 of the nonsecret output alongside Git HEAD and exit code.

No test acceptance without exact expected **catalog fingerprint**: supported tables, FK/PK/CHECK convalidated, trigger enabled status (esp. matches_increment_revision and compat stage sync), indexes validity, function signatures, optional pg_trgm, and explicit fixture revision. If F0 empty schema was approved, missing objects are EXPECTED but API tests remain BLOCKED.

## E. Existing test bootstrap is DESTRUCTIVE, not a preflight

Verified release source: artifacts/api-server/test/test-database.ts:
- getSafeTestDatabaseConfig insists on Node test context, explicit TEST_DATABASE_URL, test-looking DB name, schema regex, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA. These string guards are necessary but NOT evidence of physical isolation.
- resetTestSchema does DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE, CREATE SCHEMA, and migration bootstrap 0001–0028. It rewrites occurrences of public. to a test schema plus selected information_schema references and removes specified source transaction wrappers.
- resetTestSchema is NOT a FULL release 0001–0031 fixture: 0029 Steam catalog, 0030 correction operations and 0031 atomic correction receipts are not applied by its default bootstrap.
- artifacts/api-server/test/tournament-atomic-correction-postgresql.integration.test.ts adds 0030/0031 in its own setup after that reset, using test-only rendering and explicit removal of BEGIN/COMMIT. This does not approve a production runner or evidence correct historical adoption.
- The helper uses pool.query across manual transaction boundaries; an executor must verify one pinned client/connection for transaction-sensitive fault injection. Static concern, not an executed bug report.
- DO NOT run lib/db/test/tournament-routing-persistence-v2-deployment.test.mjs or lib/db/test/schema-catalog-comparison.integration.test.mjs as a generic preflight: their opt-in paths DROP SCHEMA public CASCADE. These require a wholly separate disposable DB with explicit approval, if ever used.

Fixture profiles:
- F0: newly created isolated cluster/database, no feature schema yet — READ ONLY observation only.
- F1: isolated resetTestSchema bootstrap 0001–0028 — many API tests can use it AFTER an explicit scoped reset GO.
- F2: verified release 0001–0031 including exact SQL source identities, receipt/correct catalog — NOT created by default; requires a separate owner-approved fixture builder.
- F3: editor 0030/31 plus descendants — do not confuse with release corrections.
- F4: mixed/partial lineage — ambiguous, unknown receipt, catalog drift or checksum mismatch -> STOP.
Only source-path existence is SOURCE_CONFIRMED; fixture completeness is NOT_EXECUTED until observed by A50.

## F. API test matrix for A50 — commands are NOT executed

**Hard gate before all commands below:** A00/owner gives *separate, explicit permission* for bounded destructive reset on a certified disposable instance, executor-specific DB role, test URL and unique tm_test_* schema. The following tests themselves mutate data and reset test schemas. Do not run them in R15 merely because this runbook exists.

On a full authorized checkout with Node 22 and pnpm 10:

~~~powershell
node --version
pnpm --version
git rev-parse HEAD
pnpm install --frozen-lockfile
# EACH PR: separately check out the exact HEAD SHA below, no composite/cherry-pick.
# Set TEST_DATABASE_URL from owner-approved test-only secret mechanism.
# Set TEST_DATABASE_SCHEMA to the approved unique tm_test_* schema for THIS test.
# Only AFTER separate reset GO: TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA.
cd artifacts/api-server
node --import tsx --test --test-concurrency=1 ./test/<EXACT_TEST_FILENAME>.ts
~~~

Each PR test uses its OWN exact checkout, never a result from a different PR or the release baseline. For each run capture git rev-parse HEAD, Node/pnpm/PG16 versions, masked DB identity, fixture profile, command, exit, TAP/log and post-run catalog diff; stop if any mismatch or skipped required tests. Tests that require a feature table/column not present in F1 must be BLOCKED until the corresponding fixture is explicitly constructed, not silently patched at runtime.

| PR / exact HEAD SHA | Source test filename (under artifacts/api-server/test/) | Required catalog signature |
|---|---|---|
| #39 16053ee132756ca05b6f2cd1f0cabae823905387 | match-revision.integration.test.ts | tournaments, matches.revision, matches_increment_revision, result_history, action_log |
| #41 e847cb705296a48ab5c68ece96776cd0e0bbb417 | stage-basket-route-execution.integration.test.ts | qualification_proposals/entries, approved output, stage_basket_route_executions/entries |
| #42 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | revert-match.integration.test.ts | matches, result_history, action_log, stage_participants, stage lifecycle |
| #44 2f0187b7242681c394c09058b5ef647667206bd6 | session-revocation-race.integration.test.ts | tournaments, support_sessions, deadlock bans, match game picks |
| #45 a7a87bc019731191dbfa44bee6939e3fa25e27f4 | round-robin-terminal-reopen.integration.test.ts | players, stage_participants, tournament_stages, matches, result_history |
| #46 7f60849e389a7ed35fdd39dd5493c4c4c267d860 | tournament-delete-revocation.integration.test.ts | tournaments, child FKs, result_history, action_log, support_sessions |
| #48 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3 | stage-basket-route-execution.integration.test.ts | complete Backup V3 readset, routing executions, QP/QPE/output, routes; 2-connection REPEATABLE READ snapshot |
| #49 99298b81501c3e7764d653604923522a19b9f05c | auth-organizer-revocation-r12.integration.test.ts | tournaments, support_sessions and auth columns/constraints |
| #51 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | revert-match.integration.test.ts | matches, result_history, action_log; malformed Undo -> fail-closed/zero writes |

Source filenames above are verified from respective PR file lists. API tests/real PostgreSQL were NOT executed by A20.

## G. Negative outcomes / A60 independent verification

Negative conditions must yield STOP and zero DB mutation: missing approved manifest SHA-256 pin (MANIFEST_PIN_MISMATCH), unknown ledger entry, orphan logical dependency, mismatched Git blob/source SHA, missing/inconsistent receipt, ambiguous release/editor 0030/0031, wrong branch lineage, missing match revision trigger, missing critical FK/constraint/index, invalid role/host/DB/schema, PG version !=16, unexpected populated public schema, unauthorized reset scope, source SQL wrapper mismatch or legacy ledger adopted without owner approval.

On synthetically valid data the validator may return REVIEW_ONLY but ALWAYS ready_for_sql:false. A60 must independently review the exact PR38 SHA, fixture and test evidence; author tests alone never confer SOURCE_ACCEPTED or RELEASE GO.

## H. Final decision and deliverables

- A20 R15 offline validation: 37/37 node --test, 22/22 supplementary local author harness, negative CLI exit 2 STOP; details in A20 R15 HANDOFF. No physical PG access performed.
- A50: catalog-read scope remains BLOCKED until explicit owner identity/authorization certificate; API reset/test cases further require separate approval and a disposable fixture.
- A00 one concrete unblock decision: **authorize/provision one named disposable PG16 cluster/database + observer identity; approve READ-ONLY CATALOG ONLY first**. Feature SQL/migration/reset remains STOP pending subsequent distinct decision.
- A60: pin review to PR38 exact SHA and reconcile supported/missing receipts; no author self-acceptance.
- SWARM-006 HOLD; no application code change, no SQL, no merge, no deployment.

**Final status:** REVIEW_ONLY / PHYSICAL_PG16_NOT_EXECUTED / SQL_STOP / RELEASE_NO_GO.
