# WEB-005 / A20 / R17 — PG16 Physical Unblock and Ledger Gate

**Task:** WEB-005-T021-A20-R12 · **Mode:** SOURCE-ONLY · **Date:** 2026-10-14 (Europe/Warsaw) · **Owner:** A20, recipient A00/A50/A60.
**Verdict:** `SOURCE_CONFIRMED / OFFLINE_ONLY / PG16_NOT_EXECUTED / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO`.

## 1. R16 recovery honesty

Central R17 instructions and current GitHub readback show no A20 R16 report at `docs/web-005/agent-reports/A20/WEB-005_A20_R16_HANDOFF.md` or `WEB-005_A20_R16_PG16_PREFLIGHT.md`; no A20-named documentation branch was found. No R16-specific artifacts are visible in the A20 thread's working directory or conversation. **R16_ARTIFACTS_UNAVAILABLE**, not `PATCH_COMPLETE`, `FAIL`, or retroactive runtime PASS. R15 material remains published; R17 verification is new and separately identified.

## 2. Source identity and code-only decision

- P05 PR #38 OPEN DRAFT/UNMERGED; HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, release BASE `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; exactly 7 new files limited to `lib/db/migration-ledger-validator/`; no application SQL changed.
- R17 locally verified 6 local files against exact Git blobs, Node v22.16.0: `node --test validate.test.mjs` 37/37 PASS, exit 0; separate A20-only `node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs` 22/22 PASS, exit 0; fail-closed CLI with no manifest SHA pin/source proof => decision STOP and exit 2. These are **not PG16 tests** and the supplementary harness is not part of PR38.
- A60 R15 independent document: `docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md`, P05 `SOURCE_ACCEPTED_OFFLINE_ONLY` on this exact HEAD; **no full PG16/native app source+runtime acceptance**. A50 R15 `WEB-005_A50_R15_RECEIPT.md`: zero application tests, no approved PG16 or full checkout/pnpm here.
- Proposal manifest status: `PROPOSAL_ONLY_NOT_APPROVED`. Git source identity 14/14 confirmed in R15; release/editor collision rechecked in R17:
  - release 0030 `controlled_correction_operations`, source Git blob `50aa71ae0199806de3aaf3c57700d2739f2c42bc`;
  - release 0031 `atomic_correction_receipts`, blob `d44601f4b6477dc9366fc7a65475a0eede1c34c1`, contains embedded top-level BEGIN/COMMIT;
  - editor 0030 `steam_catalog_abstract_world`, blob `a6d4ce679136b016dc6eed0e490e3e54060ada22`, canonical proposal 0032;
  - editor 0031 `steam_catalog_pagination_indexes`, blob `b813547b834febe8e7398d1b2cfe204b84dd1ed5`, canonical proposal 0033.
  `0030`/`0031` numeric ledger alone never establishes executed source or provenance. Orphan checksums, missing history, wrong source lineage, adoption without A00 approval -> STOP. `REVIEW_ONLY` always `ready_for_sql:false`; neither receipt rewriting nor SQL runner is authorized.

## 3. Exactly one owner/A00 physical-environment unblock action

**Owner decision requested:** provision/approve a **new, dedicated, disposable PostgreSQL 16 cluster** accessible to the authorized A50 executor and attest out-of-band:
1. Approval ID, scope `READ_ONLY_CATALOG_PRECHECK`, approver/expiry, execution owner; no implicit reset GO.
2. Exact host/IP/port, DB name, cluster/container ID, PostgreSQL major=16, immutable image digest/build, physical/project isolation attestation; **not** shared, staging, production, Replit, or customer backup.
3. Read-only observer login with no `SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS`, no DB/schema CREATE privileges; secret supplied securely outside docs/terminal log.
4. Test schema `tm_test_*` name and owner (can be absent in empty-F0 receipt); expected initial fixture F0/F1/F2, catalog source fingerprint and independent target allowlist; `public` not an authorized reset target.
5. Separate future consent **if and only if** mutating integration tests are later approved: `TEST_DATABASE_URL` explicit dedicated DB (no `DATABASE_URL` fallback), `TEST_DATABASE_SCHEMA=tm_test_*`, exact DROP/RESET scope, test-only executor role, prior disposable snapshot/retention decision. This R17 document provides NO such consent.

**STOP before connecting** when any required identity, approval, role, isolation evidence or test DSN is missing. Tool/connector presence is not PC access. An apparently test-named database or a `search_path` setting is NOT proof of physical isolation.

Non-mutating source already published R15 and usable *only after approval*:
`docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql`.
It performs `BEGIN READ ONLY`, catalog `SELECT`, transaction-local timeouts and `ROLLBACK` and inspects PG major/version/endpoint, DB/role, schema, relations, constraints, FK, indexes, triggers and functions. This SQL file has **NOT EXECUTED** on any DB by A20.

**Owner-only local Windows/Docker option (not run)**: create a fresh dedicated local Docker PG16 cluster with loopback-bound port, disposable credentials, recorded container ID and pinned image digest; provide A50 a separate observer role. Exact setup example and secrets warning:
`docs/web-005/agent-reports/A20/WEB-005_A20_R15_SAFE_PG16_RUNBOOK.md`.
Do not execute its Docker/database provisioning steps without owner approval. No live TEST_DATABASE_URL was available to A20.

## 4. Destructive helper and fixture realities — SOURCE_CONFIRMED, NOT_EXECUTED

Release `artifacts/api-server/test/test-database.ts`: `getSafeTestDatabaseConfig` checks Node test context, test-looking URL, test schema regex and `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; `resetTestSchema` actually executes `DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE` then rebuilds to migration **0028**. Existing test-only renderer rewrites selected `public.` names. None of these string checks proves physical host isolation. NEVER call resetTestSchema in the read-only phase.

Release 0029 Steam catalog / 0030 correction table / 0031 correction receipt are NOT part of default reset, so PG tests requiring F2 cannot be called PASS from F1. Distinguish:
- `F0_EMPTY`: approved observer only, empty fixture;
- `F1_BASE_0001_0028`: dedicated test-only setup after separate reset GO;
- `F2_RELEASE_0001_0031`: needs distinct migration fixture build/approval; `R31` wrapper contract must be reviewed, not automatically executed;
- `F3_EDITOR`, `F4_MIXED`: historical identity/graph evidence, invalid/ambiguous => STOP.
- Existing opt-in `lib/db/test/tournament-routing-persistence-v2-deployment.test.mjs` and `lib/db/test/schema-catalog-comparison.integration.test.mjs` can `DROP SCHEMA public CASCADE`; **exclude** from common DB preflight.

## 5. A50 exact, isolated, target-feature test contracts — NOT_EXECUTED

All commands here are **for a future authorized executor**, not an R17 GO. Must have actual full repository checkout, Node22, pnpm10, frozen deps, exact branch HEAD, dedicated DB and separate scoped reset permission; record command, full SHA, fixture, database host fingerprint (without secret), version, output/exit. No cross-PR composite build or switching to baseline mid-test.

**P08 PR41** `e847cb705296a48ab5c68ece96776cd0e0bbb417`: `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`. Required reproducible positive: QP/QPE/approved output OP with *exact* `sourceBasketPosition` parity across export/preclone check/restore; route receipts and remapped players unchanged. Required negative: mutate one position while leaving IDs, rank, route count valid, expect `BackupV3ValidationError` before clone and zero DB clone/write; repeat orphan QP, wrong QPE source-basket position and output-position duplicate. Position parity is independently A60 SOURCE_BLOCKED on the currently pinned old PR41 head; no R16 fix appeared yet. Required real tables: `qualification_proposals`, `qualification_proposal_entries`, `stage_basket_output_players`, `stage_basket_route_executions`, `stage_basket_route_entries`, baskets, stages, players; FK/CHECK and `route_id` uniqueness enabled.

**P09 PR42** `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`: `artifacts/api-server/test/revert-match.integration.test.ts`. Positive: latest roster `delete_player` / `restore_player` undo returns correct state and auditable action. Negatives: stale queued roster undo when newer undoable event Y commits must return 409 `UNDO_ACTION_CHANGED`, zero tournament/roster/action-log writes and no earlier action marked undone. Use barrier to deterministically interleave Y before X lock; also test revert_match LIFO and same-timestamp ID ordering. A60 R15 says `SOURCE_BLOCKED_GLOBAL_UNDO_LIFO` at this exact PR42 head; do not assume roster path has fix just because `lockLatestUndoableAction` exists for generic Undo. Required `action_log`, `players`, `matches`, `result_history`, stage participants + reversible action schema/consistency.

**Other draft API PG tracks** (own exact HEAD, dedicated per-test tm_test_* fixture and separate owner GO):
- PR39 `16053ee132756ca05b6f2cd1f0cabae823905387`: `match-revision.integration.test.ts`.
- PR44 `2f0187b7242681c394c09058b5ef647667206bd6`: `session-revocation-race.integration.test.ts`.
- PR45 `a7a87bc019731191dbfa44bee6939e3fa25e27f4`: `round-robin-terminal-reopen.integration.test.ts`.
- PR46 `7f60849e389a7ed35fdd39dd5493c4c4c267d860`: `tournament-delete-revocation.integration.test.ts`.
- PR48 `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`: `stage-basket-route-execution.integration.test.ts` (own checkout; PR41 same filename ≠ interchangeable).
- PR49 `99298b81501c3e7764d653604923522a19b9f05c`: `auth-organizer-revocation-r12.integration.test.ts`.
- PR51 `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a`: `revert-match.integration.test.ts` (own checkout; PR42 same filename ≠ interchangeable).

Sample *after* owner setup and explicit separate isolated-reset permission, working directory repo root:

~~~powershell
node --version
pnpm --version
git rev-parse HEAD  # must equal the ONE PR's pinned 40-hex SHA
pnpm install --frozen-lockfile
# Inject TEST_DATABASE_URL via secure owner-controlled mechanism (NEVER from DATABASE_URL fallback)
# Owner separately selects per-test unique TEST_DATABASE_SCHEMA tm_test_* and explicitly permits its DROP/CREATE.
# Only if written reset GO: TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
Push-Location artifacts/api-server
node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
# On SEPARATE PR42 exact checkout: node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
Pop-Location
if ($LASTEXITCODE -ne 0) { throw 'TEST GATE FAIL — no broader GO' }
~~~

Owner must explicitly scope mutable tests; never execute them in R17 or with unknown DB. If the test requires nonexistent relation/trigger or F2 history, mark BLOCKED, not PASS.

## 6. A60 oracle, safety and final stop

Recheck PR38 exact HEAD and R17 offline receipts independently; GitHub PR38 formal review list empty, but R15 signed A60 independent report has **P05 SOURCE_ACCEPTED_OFFLINE_ONLY**. Exclude SQL/DB acceptance from this. For P08 position-negative and P09 roster LIFO, demand: wrong provenance => refusal before insert; stale Undo => 409 and zero DB changes; matching positive remains usable; exact independent revision HEAD and matching test environment.

Hard STOP: no runner, migration adoption, prod SQL, shared DB, Replit, existing `public` reset, staging/live, merge, cross-PR composite branch, SWARM-006 interim dispatch or future conditional tasks without new GO.

**Owner one actionable decision:** assign/provide A50 a trusted test host with full pinned checkout + Node22/pnpm10 and a **separately owner-certified physically dedicated disposable PG16**, authorize only READ-ONLY CATALOG first. Independent reset/integration approval comes later.

**Final:** `A20_R17_SOURCE_ONLY / P05_OFFLINE_ACCEPTED_NOT_PG / R16_ARTIFACTS_UNAVAILABLE / A50_ENV_BLOCKED / SQL_STOP / RELEASE_NO_GO`.
