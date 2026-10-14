# WEB-005 / A90 / WAVE R11 — T060-B3A Consistent Export Snapshot

**Date:** 2026-10-14, Europe/Warsaw  
**AGENT:** A90 — Backup V3 Integrity & Restore  
**TASK:** WEB-005-T060-A90-B3A-R4 (P0 data integrity, L1)  
**AUTHORIZATION:** GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR; no merge, SQL/migration, production/staging, paid manual CI or SWARM-006 dispatch.  
**SOURCE BASE:** release/tournament-ops-20261013-01 @ **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**  
**PR:** [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), **OPEN DRAFT, NOT MERGED**  
**B3A IMPLEMENTATION HEAD:** **68991b393f87ded797b8578a0972bee47b8375a8**  
**BRANCH:** fix/web-005/t060-b3a-consistent-v3-export-r11  
**SEPARATE REPORT BRANCH:** docs/web-005/a90-r11-b3a-snapshot-handoff — does not alter PR #48.

## 1. Exact source changes and invariant

**Finding:** A51-F020 = A50-F026 (one root cause). Baseline exportBackupV3() independently queries tournament, multiple table batches, qualification proposals, materialized output, route receipts/entries and compiled routing plan; the previous helper itself opened a distinct transaction. A concurrent commit between reads could produce a torn Backup V3 document. Evidence: **SOURCE_CONFIRMED** original code; torn result behavior before test is **STATIC_INFERRED**, not runtime reproduced.

**Changed files (PR48 only):**
1. artifacts/api-server/src/application/backups/backup-v3.ts — **+39 / -34 lines** from pinned base.
2. artifacts/api-server/test/stage-basket-route-execution.integration.test.ts — **+101 lines**, two deterministic new cases.

**Implementation:**
- Open one \`db.transaction(async tx => ..., { isolationLevel: "repeatable read", readOnly: true })\`, *before* selecting tournament root and close only after assembling the entire V3 return object.
- Use **tx** for tournament, stages, players, groups, matches, result_history, action_log, baskets, qualification proposals/entries/materialized outputs, route executions/entries, game picks/bans, game config, routing executions and nested stage/match ID subqueries.
- Replace the exporter’s parallel \`Promise.all\` query dispatch with ordered sequential awaits on the same pinned PostgreSQL transaction/client. Keep original query \`orderBy\` clauses and V3 serializer mapping intact.
- Use pre-existing \`loadCompiledRoutingPlanV2InTransaction(tx, { tournamentId })\` rather than the helper which opened another transaction. If plan is absent, retain the existing \`ROUTING_PLAN_NOT_FOUND\` handling; all other plan errors still propagate.
- A deliberately narrow optional \`afterTournamentRead\` callback exists only as an **internal deterministic test seam**. The real HTTP GET export calls \`exportBackupV3(id)\` without it. No HTTP-accessible new feature or payload property.
- If any read/helper fails, the read-only transaction aborts and **no partial V3 object is returned**; there is no export-side DB mutation or rollback of committed writer data to perform. Export failure HTTP mapping is unchanged (not asserted as a new 409/400 contract).
- No B1 validation changes, no B2 history/revision/Undo changes, no V2 import or schema/legacy policy changes.

## 2. Test-first commits and deterministic race barrier

| Source commit | Evidence |
|---|---|
| bff56604c1901f7b4613caef7c2c32456cbadda3 | First test-only commit (**RED definition**, not an executed failing test): race barrier after root read, second transaction changes tournament name, planned target stage name and source match note, commits, export resumes |
| 83d9eb9ad95484f7c1411c0e043859ae535308dc | Implementation of a single read-only REPEATABLE READ tx |
| 79ed19a6254a0d5a19aabb238fa750144ade3acb | Additional regression barrier: approval and route execution committed while export awaits |
| 68991b393f87ded797b8578a0972bee47b8375a8 | Final whitespace-minimized source patch with explicit empty-tuple type hint (prior formatting commit not retained in final diff) |

**B3A-RACE-01 / root, stage, match:** the exporter issues first SELECT for root in transaction E and suspends at afterTournamentRead. Concurrent writer W uses another pooled transaction to atomically UPDATE tournament.name, planned target stage.name, completed source match.note and COMMIT. Resume E: assert all three export fields remain their pre-W values. Then start new export E2: assert all three equal post-W values. This proves same-snapshot state, not post/pre hybrid if executed.

**B3A-RACE-02 / approved QP and route receipt:** E snapshots root before approval, suspends. W via real HTTP generates and approves QP and executes basket route, each commit completed before E resumes. E must show neither \`qualificationProposals\` nor \`routeExecutions\` (pre-commit snapshot); fresh E2 must show one approved proposal with two materialized outputs and one route execution with two entries. Test uses the project's existing deterministic fixture \`buildRouteFixture({qualifierCount:2})\`.

**B3A-POSITIVE-03:** existing §22 test in the same file performs real Phase 3 V3 export → import → reload → idempotent re-execute; it is required as unchanged positive compatibility regression.

**Pre/post metadata:** No produced backup JSON SHA-256 hashes are available because no test ran. A50 should hash *canonical JSON snapshot fields* from E, W and E2 and record before/after test evidence, rather than incorrectly claiming existing hashes. ExportedAt differs across exports and should be excluded from logical snapshot parity hashes.

**Fail-closed / negative expectations:** neither race may expose a torn mixture of pre/post-commit records, return partial success on routing helper error, change DB records on the exporter side, or silently drop route receipts. B3A does **not** itself validate independently corrupted source data; any initial source corruption is B1/DB invariants or follow-up QA.

## 3. Execution status and reproducible A50 acceptance

**A90 environment actually observed:** Node v22.16.0 available in local container; **pnpm not installed**; no mounted local repository checkout; TEST_DATABASE_URL unset. No confirmed authorized physically isolated PostgreSQL16. Therefore no local \`tsc\` project typecheck, integration PG16 execution or HTTP/transaction trace could be performed safely. **NOT_EXECUTED; no exit-code PASS/FAIL; no fabricated pre/post hashes.**

A50: check out **exact PR #48 HEAD**, verify Node22, pnpm10, frozen dependencies, private physically isolated PG16 and authorization BEFORE using \`test-database.ts\` (contains \`DROP SCHEMA IF EXISTS "tm_test_*" CASCADE\`). Run the following **only on an authorized disposable PostgreSQL16 test DB**:

~~~bash
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck

# A50 must inject the REAL, separately verified test-only URL without logging its credentials.
export TEST_DATABASE_URL="<A50_APPROVED_ISOLATED_TEST_ONLY_PG16_URL>"
export TEST_DATABASE_SCHEMA="tm_test_a90_b3a"
export TEST_DATABASE_RESET="DROP_TM_TEST_SCHEMA"

pnpm --filter @workspace/api-server exec node --import tsx \
  --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

The above is an **acceptance recipe, not a command that A90 ran**. A50 should report exact command, UTC timestamp, checkout SHA, physical isolation check, exit codes, TAP counts, prior/after snapshot hashes excluding exportedAt, DB writer commit observed and no leaked DB credentials.

A60 must independently inspect actual PR #48 HEAD/source diff, confirm the complete exporter and nested routing loader use the same tx handle, verify \`REPEATABLE READ READ ONLY\` is emitted by the installed Drizzle PG driver, and analyze two race traces. A60 must verify existing legal old V3 export contract without assuming that B1 PR #41 is merged. **AUTHOR PATCH_PROPOSED ≠ SOURCE_ACCEPTED ≠ RUNTIME_VERIFIED.**

## 4. Risk assessment, dependencies and policy

| Concern | Source disposition / owner |
|---|---|
| PR41 / P08 B1 qualification output integrity | **OPEN DRAFT / frozen / independent** at e847cb705296a48ab5c68ece96776cd0e0bbb417; A90 B3A branch does not include its commits. Future integration may conflict in backup-v3.ts. **A00 sequences**. |
| B2 latest result_history/current-match and undoPayload ID parity | FUTURE / NO CODE GO; needs A70 history/Undo consult and portable revision owner policy. |
| B3 remainder V2/V3 legacy portability + old backup acceptance | FUTURE / NO CODE GO; no new strict validation, credentials, format/schema in B3A. |
| A20/T020/T021 migrations, triggers, historical version ledger | Schema readiness for isolated test belongs to A20/A50; no DDL in this PR. |
| A50 test runner and PG16 | **BLOCKED** pending physically verified test-only PG16; no production/shared DB and no billing of paid CI. |
| A60 independent QA | **PENDING** exact-SHA signoff; author cannot self-approve. |
| Pack19 source-regex CI blocker | Separate ownership; PR48 does not edit Pack19; stale/unrelated checks are not B3A verification. |
| Throughput/timeout | Full serial read-only tx retains a PG connection across reads and may increase export latency; assess on isolated DB before acceptance. |
| Runtime error code | No new export error policy or success fallback; route handler behavior unchanged. |
| SWARM-006 | **HOLD** until WEB-005 globally closes. |

**POLICY_OPEN:** portable matches.revision, legacy V2/V3 compatibility and historical secrets; none selected. **No simulated production corruption** claimed.

## 5. Formal R11 disposition / handoff to A00

**AGENT / TASK:** A90 / WEB-005-T060-A90-B3A-R4.  
**BASE / HEAD / PR:** release 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 → 68991b393f87ded797b8578a0972bee47b8375a8 / [PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) **DRAFT OPEN**.  
**ACTUAL CHANGES:** exporter and one PG16 integration test file; nothing else in code branch. Report is on a distinct documentation-only branch.  
**TEST EVIDENCE:** two deterministic test definitions and existing positive round-trip, **NOT_EXECUTED** in A90 environment; no TAP, HTTP, CI or typecheck PASS, no pre/post result hashes.  
**FINDING:** SOURCE_CONFIRMED export split-snapshot risk, PATCH_PROPOSED one-tx remedy, NOT_RUNTIME_VERIFIED.  
**NEXT:** A50 isolated PG16/typecheck run at exact SHA, A60 independent review, A00 decides PR48 acceptance and later B1/PR48 integration order.  
**MERGE / DDL / RELEASE / SWARM-006:** **NOT AUTHORIZED**.  
**PROJECT RELEASE GATE:** **NO-GO**.
