# WEB-005 A90 / WAVE R10 — B1 QA Support and B2/B3 Next Patch Plan

**TASK:** WEB-005-T060-A90-R3  
**Agent:** A90 — Backup V3 Integrity & Restore  
**Wave:** R10.1, 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE-ONLY / QA SUPPORT, **NO NEW CODE GO**  
**Coordinator:** A00 Implementation Lead; A50 executes safe test evidence; A60 performs independent QA.  
**Deliverable:** WEB-005_A90_R10_B1_QA_B2_B3_PLAN.md

## 1. GitHub pin and evidence disposition

| Target | Exact SHA / state | Evidence |
|---|---|---|
| Release baseline | 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7, PR32 OPEN not merged | GitHub PR metadata |
| P08 / B1 PR41 | e847cb705296a48ab5c68ece96776cd0e0bbb417, OPEN DRAFT, not merged | GitHub PR metadata |
| B1 test-first commit | f72d399ca4d107c48e6b1f0389d2ae6c04a9ace7 | R9 GitHub history/handoff |
| B1 implementation commit | 748ef76d0a39358f2194cb78b39e1c88e4ce8daf | R9 GitHub history/handoff |
| B1 R9 report commit | e847cb705296a48ab5c68ece96776cd0e0bbb417 | Distinct from implementation commit |
| P09 / T040 PR42 | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b, OPEN DRAFT | Dependency only; no ownership |
| GitHub review for PR41 | No submitted GitHub reviews, no review threads/comments when checked | Not equivalent to proof of no off-GitHub review |
| CI on PR41 SHA | run 38585495598, correction-qa FAILURE, job 115926270437, Pack19 source-contract mismatch | Real CI negative evidence but **not** Backup V3 test result |
| Isolated Backup V3 PG16 test | NOT_EXECUTED by A90, A50/A60 acceptance not provided | Cannot assert runtime PASS |

**CI detail:** Pack19 node source-contract.test.mjs failed at case "transaction is explicitly read-only and snapshot isolation": expected regex isolationLevel:"repeatable read",readOnly:true did not match inspected route implementation. Prior SE safety and selected tests passed; later CI gates skipped. This is a separate pack-level blocker; no evidence attributes it to B1. Do not relabel this B1 failure or B1 PASS.

**Report branch:** docs/web-005/a90-r10-b1-qa-b2-b3-handoff (independent documentation branch from release). No modifications to PR41 HEAD, source code, DB, deployments, or other owners' branches in R10.

## 2. P08 B1 actual source review

Reviewed:
- artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts (PR41)
- artifacts/api-server/src/application/backups/backup-v3.ts (PR41 and release baseline)
- artifacts/api-server/test/stage-basket-route-execution.integration.test.ts (PR41)
- docs/web-005/WEB-005_A90_R9_HANDOFF.md (PR41)
- lib/api-zod generated BackupV3 types; schema/tables from release
- artifacts/api-server/src/application/stages/stage-basket-qualification.ts and stage-basket-route-execution.ts (release)
- artifacts/api-server/src/application/matches/complete-match.ts and revert-match.ts (release)

**SOURCE_CONFIRMED:** B1 validator compares approved qualification proposal entries to approved materialized outputs as multisets of (basket,player,rank), checks stage membership and output basket ownership; route execution maps to configured source/target, approved proposal revision, entries and output rows with exact set/count parity and duplicate target arrival detection. The import invokes it via validateBackupV3 **before** opening the transaction that clones tournament rows. Five source lookup silent skips have been replaced with typed errors; on a late exception the existing import transaction should roll back (STATIC_INFERRED until tested).

**Important boundaries:**
- Positive legacy backups with absent QP/route data intentionally remain legal; an unexecuted route does not need an arrival receipt.
- Existing route-execute service requires executed source output count to equal its output basket qualifierCount. B1 enforces count on receipts, but not on an unexecuted approved proposal (POLICY-BACKUP underfill).
- R9 test suite introduced **one table-driven test with 12 corruption variants**; it does not constitute 12 independently executed runtime test results.
- The new table-driven test checks cloned *tournament* row count before/after; because committed clone child records depend on a tournament root this is a useful guard, but A60 should additionally query child-table counts and inject a late DB fault for stronger rollback proof.
- The new test's positive portion directly calls validateBackupV3; the *pre-existing* §22 integration test covers actual approved-route export→import→reload and idempotent route execution. Both must run and pass at exact SHA.
- Cross-stage output basket and route topology cases exist. Explicit cross-tournament identity is not serialized in V3; verify isolation via stage/player/basket referents and restored tournament ID rather than inventing a serialized tournamentId field.
- Do not claim SOURCE_ACCEPTED: A60 has not signed exact-SHA acceptance. PR41 remains PATCH_PROPOSED, runtime NOT_EXECUTED.

### B1 invariants/acceptance matrix

| ID | Required result | Status |
|---|---|---|
| B1-QP1 | Approved proposal entries == output materialization (basket,player,rank, count) | PATCH_PROPOSED |
| B1-QP2 | Every QPE/OP basket is owned by source stage, output type, player belongs to source stage | PATCH_PROPOSED |
| B1-QP3 | No duplicate proposal for source stage, player, placement rank, basket position | PATCH_PROPOSED |
| B1-QP4 | Pending proposal may not contain materialized output | PATCH_PROPOSED |
| B1-RT1 | Execution receipt matches configured route source/target and approved proposal revision | PATCH_PROPOSED |
| B1-RT2 | Entries == source output rows (player, sourceFinalRank), no omissions/extras/duplicates | PATCH_PROPOSED |
| B1-RT3 | Each target-stage player appears in at most one routed arrival | PATCH_PROPOSED |
| B1-RT4 | Missing remap/output/proposal lookup throws typed error, no silent continue | PATCH_PROPOSED |
| B1-AT1 | Invalid V3 input rejects HTTP 400 INVALID_BACKUP_V3 *before* clone INSERT | NOT_EXECUTED |
| B1-AT2 | Late controlled failure rolls back every cloned table, no orphan rows | NOT_EXECUTED |
| B1-OK1 | Valid approval+route restores and re-executes idempotently | NOT_EXECUTED |
| B1-LG1 | Valid legacy V3 without QP/route data continues to import | NOT_EXECUTED |
| B1-LG2 | Approved unexecuted route stays legal without retroactive underfill policy | POLICY_OPEN edge / positive test required |

### Twelve existing corrupted V3 variants in the PR41 test
| Test | Mutation | Expected outcome |
|---|---|---|
| 01 | Remove one materialized approved output | 400 INVALID_BACKUP_V3, zero clone |
| 02 | Replace an approved output player | same |
| 03 | Change approved output finalRank | same |
| 04 | Move approved output to target input basket | same |
| 05 | Remove the source qualification proposal | same |
| 06 | Mark a materialized proposal pending (with approval fields cleared) | same |
| 07 | Mismatch execution sourceProposalRevision | same |
| 08 | Remove one arrival entry | same |
| 09 | Swap execution target to source output basket | same |
| 10 | Swap an entry source basket to target input basket | same |
| 11 | Add extra arrival player absent from approved outputs | same |
| 12 | Duplicate an arrival | same |

All 12 outcomes are **expected** but not yet proven by runtime execution. Tests must be connected to actual PG16 test app; separate no-execution evidence from failures.

### A50 reproducible commands — execution conditional on A50 isolation preflight

From repo root at the **exact PR41 commit**, Node22 / pnpm10 / locked dependencies:

~~~bash
git rev-parse HEAD
pnpm --filter @workspace/api-server typecheck
# ONLY after A50 verifies physically isolated PG16 and authorizes tm_test_a90_b1:
export TEST_DATABASE_URL="postgresql://<redacted>@<isolated-host>/<dedicated-test-database>"
export TEST_DATABASE_SCHEMA="tm_test_a90_b1"
export TEST_DATABASE_RESET="DROP_TM_TEST_SCHEMA"
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

Important: source test-database.ts uses DROP SCHEMA CASCADE. Shell placeholders are illustrative, **not runnable credentials**; never use production/shared TEST_DATABASE_URL. Record real command, timestamp, test database isolation proof (no secret), exact SHA, exit code, TAP pass/fail/skip counts, and before/after DB row counts. Repeat at PR41 HEAD if it changes. Do not use paid CI as workaround without GO.

### Supplemental QA cases requested for A50/A60
- A90-B1-X01: validated positive approved but *unexecuted* route, expected import succeeds without invented routing receipt.
- A90-B1-X02: legacy V3 without stageBaskets/qualificationProposals/routeExecutions, expected valid import.
- A90-B1-X03: inject controlled late failure after a clone root insert (isolated DB/test stub), expected transaction exception + zero committed cloned root/children; error code check separately (currently import catch may translate to BACKUP_IMPORT_ROLLED_BACK rather than INVALID_BACKUP_V3).
- A90-B1-X04: mismatched stage participant source membership, expected 400 and no clone.
- A90-B1-X05: identical player routed through two source routes into same target stage, expected 400 and no clone.
- A90-B1-X06: no missing/extra children across qualification_proposals, qualification_proposal_entries, stage_basket_output_players, stage_basket_route_executions, stage_basket_route_entries on valid round-trip.
- A90-B1-X07: no false positive on legal historical approved-underfill case without executed route, pending owner policy.
- A90-B1-X08: serialized receipt with invalid target basket type or impossible stage relationship, expected 400.
- A90-B1-X09: duplicate proposal per stage, expected 400.
- A90-B1-X10: build/typecheck at exact SHA and separate codegen-contract review if generated schemas are touched in later patches.

**Status distinction:** semantic pre-clone rejection -> 400 INVALID_BACKUP_V3; unexpected DB failure inside import transaction -> 400 BACKUP_IMPORT_ROLLED_BACK per current route catch. Both require zero committed clone rows. Do not conflate error codes.

## 3. Future small PR B2 — Match/Result History + Undo provenance

**Candidate:** T060-B2-P1, FUTURE ONLY; separate branch/draft PR only after A00 GO and A60 acceptance of B1. No code in R10. Prefer a small pure validator + focused tests; do not extend to repair of existing records.

**SOURCE_CONFIRMED:** V3 validateBackupV3 checks individual history row shape, stage/player references and (matchBackupId,revision) uniqueness; it does NOT require latest resultHistory snapshot for a completed match to equal that match. The revert-match service explicitly checks stage, round, match number, players, winner, scores, bestOf, result type/reason, completedAt. Completed matches without history and mismatched latest history can therefore restore before later revert hits RESULT_HISTORY_NOT_FOUND/HISTORY_INCONSISTENT (runtime inference). Match record export omits matches.revision although DB has it. History revision is an incrementing **completion history sequence**, distinct from match state revision; never compare them for equality. Imported match revisions get server default and may increment when nextMatchId is subsequently populated; the match revision policy for portability is not decided.

**SOURCE_CONFIRMED:** actionLog exported in createdAt DESC ordering; importer inserts in array order into a table with new sequence IDs, potentially reversing numeric-ID tie-break order. ActionLog stored matchBackupId and undoPayload.matchId are remapped independently, with fallback to original unmapped numeric IDs for unknown keys. parseUndoPayload returns null for malformed JSON; exported canUndo is computed from raw non-null payload while re-exported undoPayload may be null. All require test-only provenance checks; avoid changing global Undo behavior owned by A70/T040.

**B2 narrow validation candidate (no automatic policy change):**
1. For clearly documented, modern V3 snapshots representing completed matches, require latest history equality with current match on the revert-match comparison tuple; history must exist if accepted source semantics guarantee it.
2. For all history: referents must resolve to the same match/stage, revisions strictly increasing within a match and duplicate-free (but gaps policy OPEN).
3. For active match_result_submitted action, require payload.type == revert_match, the payload matchId resolves to the same action.matchBackupId; active completion action count <= 1 per match; validate all recognized match/player ID keys before clone and remap, reject orphaned non-null recognized references (compatibility classification first).
4. Preserve completion and action order, including deterministic tie-breaking; decide whether portable export needs explicit stable action ordering metadata.
5. Keep distinct failure contracts for semantic invalid backup versus late transactional DB mapping failure.
6. Scope V2 validation to nonbreaking shared helper only after explicit legacy compatibility decision; do not globally reject historic backups merely for missing new metadata.

**B2 minimal test-first fixtures:** completed match with exact history (positive); absent latest history (negative modern), different score/winner/completedAt/players/round/stage (negatives); earlier history differs but latest matches (positive), completed match with 2 historic revisions (positive); two active completion actions (negative), non-matching payload.matchId or unresolvable player/match IDs (negative), already undone action (positive); equal action.createdAt order / new IDs (regression); restore then direct revert succeeds without HISTORY_INCONSISTENT on supported modern fixture (A70 consulted); legacy V2 and old V3 known-valid samples (non-destructive positive compatibility checks, no user backups).

**POLICY-BACKUP-REVISION:** owner/HQ must choose among preserving match state revision via new optional export field, deterministic portable rebasing, or a versioned strict/legacy mode. No arbitrary revision rewrite now. Action ordering with timestamp ties, missing history in legal old V2/V3, canUndo/null payload legacy and history gaps also POLICY OPEN. A70 retains direct revert CAS/Undo ownership; B2 validates imported provenance but does not implement runtime CAS.

**Potential files (not touched):** backup-v3.ts, new backup-v3-history-integrity.ts, focused backup integration test; OpenAPI/types only if owner approves new portable revision field. No changes to revert-match.ts, routes/tournaments.ts, migrations.

## 4. Future small PR B3 — Coherent MVCC export / legacy V2-V3 parity

**Candidate:** T060-B3-P1, FUTURE ONLY, separate branch/draft PR after B2 acceptance and independent GO. No code in R10.

**SOURCE_CONFIRMED:** exportBackupV3 currently loads tournament and many related tables through separate db calls (including Promise.all), then later qualification proposals, output rows, route executions+entries, routing plan and routing execution snapshots. There is no encompassing read-only repeatable-read transaction. A concurrent result or stage transition may therefore create a file with mixed pre/post-commit versions (STATIC_INFERRED, NOT_RUNTIME_REPRODUCED). Export HTTP responds directly with assembled object and does not run the import validator on it.

**Enabler:** routing-plan-persistence.ts already exports loadCompiledRoutingPlanV2InTransaction(tx, lookup); use this within the same read snapshot instead of nested independent db.transaction, avoiding the need for a broad routing refactor. The helper itself performs sequential DB reads.

**B3 narrow implementation design:**
1. In exportBackupV3 open **one** Drizzle db.transaction with { isolationLevel: "repeatable read", readOnly: true } (verify exact DB adapter options in unit/typecheck).
2. Read tournament, stages, matches, history, QP, QPE, OP, route receipts/entries, game picks/bans and persisted routing plan/execution all through the same tx; never use a global db call or independently opened transaction within that snapshot.
3. Derive returned export from these frozen rows only; optionally validate produced V3 before returning, but specify controlled export failure type distinct from import's 400; do not silently return incoherent backup.
4. Preserve documented export structure, stable ordering, absent optional fields for legacy, and separate V2 import path. Do not retrofit unapproved new V3 required fields.
5. Stage/round/policy/version trigger parity depends on A20/T020 schema readiness. No DDL under A90.
6. Introduce an injection barrier test at read boundaries (tournament header read, then concurrent writer commits result/stage) with two valid serial states. Assert complete export equals either state A or state B, never a hybrid; produced file must pass validateBackupV3 and restore on isolated PG16.
7. Add concurrency variant: source QP approved, route executed during export; assertions require OP/receipt/entries to agree and no split-state graph.
8. Preserve existing intentional user-visible 404/403 outcomes for missing tournament/access rights; do not silently convert export errors into valid-looking null files.

**B3 test-first fixtures:** SW-01/02 and SW-12/13 (source handoff), concurrent complete-match while export, concurrent stage start while export, concurrent proposal approve/route execute, routing-plan version snapshot, absent V3 optional arrays, legacy V2 import/new V3 export after restore, old V3 no basket authority with stable defaults, trigger-driven round/policy metadata snapshots; all with safe isolated PG16 and no real user backups.

**POLICY-BACKUP-LEGACY:** decide acceptable historical V2/V3 subsets, whether a new strict V3 subversion/metadata is permitted, and whether secrets/credential rotation fields belong in backup export (do NOT introduce secret export). Avoid rejecting historical backups for merely missing newly-introduced optional evidence. A20 owns schema and migration trigger reconciliation.

## 5. Coordination and next gates

| Receiver | Deliverable / expectation |
|---|---|
| A50 | Run B1 focused PG16 test on exact PR41 head, negative/positive 12+10 cases and injected late rollback; record exit/TAP/DB counters. DO NOT run without dedicated isolated/test-DB approval. |
| A60 | Independently review PR41 exact SHA, determine SOURCE_ACCEPTED or defects; check legal historical cases, zero write evidence and distinct 400 codes; await runtime evidence for RUNTIME_VERIFIED. |
| A20 | Confirm source migration model and trigger/revision applicability; no adoption/execution SQL; report 0030/0031 known ledger uncertainty. |
| A70/T040 | Compare completed-match/latest-history/Undo assumptions and actionLog replay, no A90 code changes to revert or routes. |
| A10 | P08 = PR41 SHA e847cb..., internal buffer, DRAFT, QA pending; B2/B3 are only future entries without fictitious PR or SHA. |
| A00 | Keep B1 review/PG gate; sequence separate B2 then B3 after GO, get POLICY-BACKUP owner decisions, keep SWARM-006 HOLD. |

**Open owner/HQ decisions:** portable matches.revision semantics; old V2/V3 completed-match history tolerance; tie-break actionLog ordering; approved-underfill without execution; old backups with legacy secret/metadata omissions; eventual versioning of strict validation. No decisions made by A90 in R10.

**GO/STOP:** source-only scope delivered; **B1 PATCH_PROPOSED and PG16 BLOCKED / NOT_EXECUTED**; **B2/B3 NOT_AUTHORIZED** for source-code modification. **MERGE / MIGRATION / DEPLOY / SWARM-006: NOT AUTHORIZED.** Overall WEB-005 RELEASE NO-GO.

**Concrete next action:** A50 verifies isolated PG16 preflight and tests PR41 HEAD; A60 reviews exact head and runtime evidence; A00 decides whether to grant narrow B2 GO, only after B1 acceptance.
