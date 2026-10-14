# WEB-005 / A20 / R20 — PG16 Physical Test Gate and Migration Ledger Stop

**Task:** WEB-005-T021-A20-R20 · **Agent:** A20, PostgreSQL Migration Reconciliation · **Date:** 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE-ONLY / SAFETY; does not authorize PostgreSQL connection or any database writes.  
**Consumers:** A00 for owner approval, A50 for eventual execution, A60 for independent acceptance.  
**Final gate:** `SOURCE_CONFIRMED / P05_SOURCE_ACCEPTED_OFFLINE_ONLY / REVIEW_ONLY / ready_for_sql:false / PG16_NOT_EXECUTED / SQL_STOP / SWARM006_HOLD`.

## 1. Immutable source and historical provenance

- R20 central instructions `docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md`, Git blob `dabf0146a08ef8488400df9268b52210662cbb63`; §0–§2 and A20 only.
- P05 [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) OPEN/DRAFT/UNMERGED; old R19 HEAD **equals** R20 HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`. Release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, release branch compare identical; 7 new files only in `lib/db/migration-ledger-validator/`, no changes to source SQL and no R20 P05 patch.
- Proposal `manifest.proposal.json`, Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`: `PROPOSAL_ONLY_NOT_APPROVED`, 14 canonical identities `0027–0040`. R20 GitHub fetch at pinned source commits: **14/14 original Git blob SHA-1 match**, no mismatches. Editor snapshot `source-snapshots.editor.json` Git blob `d73453363928c31bd452c1fa30ac726613708e17`: **9/9 source content strings exact match** editor commit `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`.
- Historic original `0030` release = `controlled_correction_operations`, original `0031` release = `atomic_correction_receipts`; original `0030` editor = `steam_catalog_abstract_world` (proposed canonical `0032`), original `0031` editor = `steam_catalog_pagination_indexes` (proposed `0033`). Original ordinals alone, source table existence, a legacy `app_schema_migrations` record or an unapproved checksum cannot establish that a specific revision was executed. Release `0031` embeds `BEGIN/COMMIT` — no approved runner/transform/adoption is provided.
- Validator is an **offline source-analysis tool**, not a PostgreSQL migration runner. Positive synthetically modelled histories return at most `REVIEW_ONLY`, negative/ambiguous histories `STOP`, and ALL outcomes `ready_for_sql:false`.
- R20 actual Node v22.16.0: `node --test validate.test.mjs` **37/37 PASS exit 0**, separate A20-authored synthetic harness `22/22 PASS exit 0`; negative CLI missing approved manifest pin/source paths **STOP exit 2** (`MANIFEST_PIN_MISMATCH`, `SOURCES_MISSING`). These are **offline only**, NOT PG16 verification and NOT independent A60 source QA.
- Independent A60 [R18 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) gives P05 `SOURCE_ACCEPTED_OFFLINE_ONLY` on unchanged SHA; R19 **A60 new signed report not verified** on inspected central docs branch. Do not infer new acceptance from agent completion.
- [A50 R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md): **0 native React/API/PG16 tests**. No certified dedicated database or connected full per-PR checkout. R20 A20 has **not attempted any PG16 connection**.

## 2. One concrete A00/owner unblock request

**OWNER/A00 MUST PRODUCE ONE SIGNED, NONSECRET TEST-ENVIRONMENT RECEIPT**, explicitly limited initially to `READ_ONLY_CATALOG_PREFLIGHT`, containing ALL of the following:

1. Named approver, permission ID, expiration, intended A50 operator, and a precise **allowed** operation list (`pg_catalog SELECT ONLY`); no inferred reset/DDL authorization.
2. Independently provisioned, fully disposable and **physically isolated** PG16 cluster/VM/container, owner attestation of no customer/shared/staging/production/Replit backups or network/credential reuse, immutable image digest or installation fingerprint, exact container/VM ID, IP/socket, port, database and PostgreSQL major `16`; resolve any proxy/tunnel identity to the actual cluster.
3. Separate, explicitly named **read-only observer role** with no `SUPERUSER`, `CREATEDB`, `CREATEROLE`, `BYPASSRLS`, `REPLICATION`, `CREATE` on database/schema. Password/DSN must be delivered securely outside public reports and never entered as a CLI argument, copied to GitHub or stored in logs.
4. Dedicated test schema `TEST_DATABASE_SCHEMA=tm_test_<suffix>`, exact regex `^tm_test_[a-z0-9_]+$` and exclusive lifecycle/owner attestation; test-looking names and `search_path` do NOT establish physical isolation. `public` must never be a permitted reset target.
5. An owner-pinned **fixture profile and expected catalog fingerprint**: F0 empty, F1 standard reset through 0028, F2 explicitly built complete release 0001–0031, F3 editor, F4 mixed/ambiguous historical (STOP unless proof). F2 source transaction/wrapper and lineage require separate approval.
6. For later test *only*, `TEST_DATABASE_URL` pointing at exactly that independently certified disposable DB, **never fallback to `DATABASE_URL`** or connected Replit/shared DB; authorized role, host, database and isolation must match preflight. The URL itself must not be printed in the report.
7. A **separate, second written owner GO** naming exact disposable `tm_test_*` target, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, explicitly permitted destructive reset boundary, executor, per-PR exact checkout and disposal/rollback. No reset GO is present in R20. Environment variables alone are NOT written authorization.

**Absence of any evidence => `OWNER_TEST_ENV_NOT_PROVIDED / PG16_NOT_EXECUTED`; STOP before attempting psql/test helper.** A50 must have a real authorized shell/filesystem, complete clean per-SHA checkout, Node22/pnpm10, frozen dependencies, as a *separate* prerequisite to API tests. The GitHub connector is not a shell into the user's PC.

## 3. Physically authorized *nonmutating* identity preflight

Existing unchanged read-only source: [`WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql), Git blob `27e90e01a1c373e51c0128680b476acad2df7c45`.

SQL structure: `BEGIN READ ONLY`, transaction-local `statement_timeout/lock_timeout`, only `SELECT` of PostgreSQL role/server/database/schema/catalog metadata, constraints, FKs, index validity, triggers/functions and legacy ledger *existence*, ending `ROLLBACK`. No application rows, ledger contents, migration scripts or DDL. Source is static-inspected and **NOT_EXECUTED** by A20.

Only **after** independently verifying the signed owner certificate, the following is a prospective A50 Windows command (substitute owner-certified nonsecret identity; never use `DATABASE_URL` as a fallback):

~~~powershell
$ErrorActionPreference = 'Stop'
$approvedHost = '<OWNER_CERTIFIED_HOST>'
$approvedPort = <OWNER_CERTIFIED_INTEGER_PORT>
$approvedDatabase = '<OWNER_CERTIFIED_DISPOSABLE_DB>'
$approvedObserver = '<OWNER_CERTIFIED_READONLY_ROLE>'
$schema = '<OWNER_CERTIFIED_tm_test_suffix>'
if ($schema -cnotmatch '^tm_test_[a-z0-9_]+$') { throw 'STOP: unexpected schema' }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw 'STOP: missing psql' }
# Password prompted interactively (-W). DO NOT use shared application DB URL or reset flags.
psql -X -W -v ON_ERROR_STOP=1 -h $approvedHost -p $approvedPort -U $approvedObserver -d $approvedDatabase -v schema=$schema -f 'docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql'
if ($LASTEXITCODE -ne 0) { throw "STOP: catalog preflight failed, exit $LASTEXITCODE" }
~~~

Before allowing any further task, compare PG16 major, actual endpoint/DB/role, superuser+CREATE privileges, schema and expected catalog/trigger fingerprints against the independently signed certificate. `psql` output **alone cannot certify physical isolation**. Save sanitized exit/command/source SHA and catalog digest without secrets, host/IP if sensitive, user rows or tokens; request A60 independent inspection. **This is NOT a command A20 executed in R20.**

## 4. Destructive bootstrap hazard / fixture compatibility

Existing release `artifacts/api-server/test/test-database.ts` is NOT a nonmutating preflight. Even with guards requiring `TEST_DATABASE_URL`, test-looking DB, `tm_test_*` and `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, `resetTestSchema()` executes `DROP SCHEMA IF EXISTS "<schema>" CASCADE` and replay to **0028**. Default F1 is not complete F2 release `0029–0031`, and raw migration sources contain explicit `public.*`, which `search_path` alone cannot isolate. Selected test renderers rewrite those references, but original production SQL is not therefore authorized for direct replay. Opt-in catalog/deployment tests that `DROP SCHEMA public CASCADE` are **excluded** from this preflight.

Use a separate owner-approved executor/fixture, one disposable DB+unique `tm_test_*` per suite and exact future reset GO, or mark app suites BLOCKED. No R20 reset/DDL or physical cluster access occurred.

## 5. Exact conditional PG16 integration test commands and oracles (NOT_EXECUTED)

Prerequisites: Gate 0 owner identity receipt, Gate 1 read-only catalog acceptance, separately signed Gate 2 exact disposable schema RESET and per-test feature GO, full separate checkout per exact SHA, Node22/pnpm10, `pnpm install --frozen-lockfile`, fixture-sufficient catalog constraints and a test-only injected `TEST_DATABASE_URL` (never shared `DATABASE_URL`). Do not merge PRs, cherry-pick, or transfer a PASS to a different source SHA.

| PR at verified R20 HEAD | API test filename under `artifacts/api-server/test/` | Acceptance oracle after REAL execution |
|---|---|---|
| **#41** `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `stage-basket-route-execution.integration.test.ts` | B1 QP/QPE/approved output OP `sourceBasketPosition` parity; valid export→restore; deliberately corrupted position gives **400 INVALID_BACKUP_V3 before clone**, 0 clone/child writes and rollback; separate legacy-null valid case |
| **#42** `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `revert-match.integration.test.ts` | Global Undo LIFO `delete_player/restore_player`: queued stale X then newer Y commit yields **409 UNDO_ACTION_CHANGED**, 0 roster/action-log writes, Y still undoable, valid latest succeeds |
| #39 `16053ee132756ca05b6f2cd1f0cabae823905387` | `match-revision.integration.test.ts` | revision trigger, conflict/retry, histories |
| #44 `2f0187b7242681c394c09058b5ef647667206bd6` | `session-revocation-race.integration.test.ts` | session revocation interleaving; no unauthorized writes |
| #45 `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | `round-robin-terminal-reopen.integration.test.ts` | valid terminal/reopen and negative history integrity |
| #46 `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `tournament-delete-revocation.integration.test.ts` | authorization, FK/child cleanup and revocation |
| #48 `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | `stage-basket-route-execution.integration.test.ts` | B3A `REPEATABLE READ READ ONLY` snapshot coherence under concurrent mutation; different HEAD from #41 |
| #49 `99298b81501c3e7764d653604923522a19b9f05c` | `auth-organizer-revocation-r12.integration.test.ts` | organizer auth revocation and protected state |
| #51 `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | `revert-match.integration.test.ts` | malformed Undo zero-write fail-closed; different HEAD from #42 |

After owner authorizes Gate 2, A50 on ONE exact pinned checkout only:

~~~powershell
node --version
pnpm --version
git rev-parse HEAD  # MUST match that ONE PR exact 40-digit SHA
pnpm install --frozen-lockfile
# Owner supplies TEST_DATABASE_URL via approved secret injection; never use DATABASE_URL fallback.
# Only owner separately approves TEST_DATABASE_SCHEMA=tm_test_<unique> and
# TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA for THAT disposable target.
Push-Location artifacts/api-server
node --import tsx --test --test-concurrency=1 ./test/<EXACT_TEST_FILENAME>.ts
$exitCode = $LASTEXITCODE
Pop-Location
if ($exitCode -ne 0) { throw "STOP: API test failed exit $exitCode" }
~~~

Record exact source HEAD, nonsecret DB identity+PG major+fixture, invocation, exit, TAP failures/skips and transaction rollback/row counts. A60 independent review must apply to exact HEAD. Tests written but not actually run, missing fixture, skipped tests, earlier CI Pack19 failure, or offline validator PASS = **NOT native runtime PASS**.

## 6. R20 and final-only handoff

A50 [R19 environment receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md) reports `APP_NATIVE_TESTS=0 / ENV_BLOCKED`. A60 R18 formally `HANDOFF_NOT_READY`; new R19 R53/R54 SHA acceptance is **not established** by A20, and owner policy / authentic WEB-004 38-case dispositions are separate A00/A10/A60 gates. A20 author tests must never substitute for those gates.

**One concrete A00/owner action:** authorize/provision A50's single named trusted Windows/Linux executor with full per-SHA checkout **and** a physically isolated disposable PG16 cluster+database with read-only observer, signed nonsecret certificate and `CATALOG_READ_ONLY` scope. A50 can then produce a real preflight receipt; any mutating test requires a later, separately signed Gate 2.

**STOP:** no historical migration SQL/adoption/DDL, shared/production access, reset without written scope, cross-PR merge/cherry-pick, deployment, SWARM-006 activation or final handoff without HQ GO. R20 A20 has no code change permission and makes none.

**FINAL:** `WEB-005-T021-A20-R20 / SOURCE_CONFIRMED / OFFLINE_59_PASS / REVIEW_ONLY / PG16_NOT_EXECUTED / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.
