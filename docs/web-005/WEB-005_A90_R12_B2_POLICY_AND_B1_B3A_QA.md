# WEB-005 — A90 R12: B2 policy & B1/B3A independent QA support

**AGENT / TASK / WAVE:** A90 — Backup V3 Integrity & Restore / \`WEB-005-T060-A90-R5\` / R12.1 (2026-10-14, Europe/Warsaw).  
**MODE:** **SOURCE-ONLY / QA SUPPORT**, no source-code lane.  
**Owner / recipients:** A00 (approval, policy), A50 (physical PG16 tests), A60 (independent QA), A20 (T020/T021 ledger/schema), A70 (T040 history/Undo), A10 (internal package buffer only).  
**Release source base:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**STOP:** no application changes, PR41/48 amendments, SQL/DDL/adoption, merge/cherry-pick, production/staging, shared DB, manual paid CI, SWARM-006.

## 1. Exact live GitHub state and independent evidence

| Item | SHA | GitHub state / code delta |
|---|---|---|
| P08 — [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41), B1 preclone integrity | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | OPEN DRAFT, not merged, **four paths**: \`backup-v3-flow-integrity.ts\` (+168), \`backup-v3.ts\` (+18/-5), \`stage-basket-route-execution.integration.test.ts\` (+75), R9 report (+63) |
| R11 — [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), B3A MVCC export | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | OPEN DRAFT, not merged, **two paths**: \`backup-v3.ts\` (+39/-34), \`stage-basket-route-execution.integration.test.ts\` (+101) |
| P01 — [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35), Pack19 matcher | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | OPEN DRAFT, separate source patch, NOT included in #41/#48 |
| P05 — [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38), migration ledger | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | OPEN DRAFT, A20-owned validator/ledger dependency, not A90 SQL authorization |
| P09 — [PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42), global Undo | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | OPEN DRAFT, A70/T040 dependency, unmerged |

**GitHub review records:** #41 and #48 have **no submitted GitHub reviews or review threads** as checked in R12. This is not a claim that no QA exists in independent handoff files; no exact-SHA signed acceptance was established in the A90 evidence inspected. Both remain \`PATCH_PROPOSED\`, not \`SOURCE_ACCEPTED\` or \`RUNTIME_VERIFIED\`.

**Automatic CI:** #41 SHA: GitHub Actions run \`38585495598\` FAILED on Pack19; #48 SHA: run \`38596228642\` FAILED on Pack19 (job \`115963545435\`). R12 central report confirms the known baseline matcher still expects \`readOnly:true\` while Drizzle/Postgres uses \`accessMode:"read only"\`; isolated #35 addresses that separate mismatch. Subsequent gates skipped. **Neither run establishes B1/B3A PG16 execution or failure**. A90 did not rerun paid CI.

**A90 R12 tests actually run:** **NONE**. No approved disposable physical PostgreSQL16/test-only schema and no verified full local project checkout with pnpm10. **NOT_EXECUTED**; no command exit=0, no TAP logs, no snapshot hashes, no row counts, no synthetic harness PASS claims. All test commands below are A50 instructions, not completed results.

## 2. B1 source review — approved qualifications, receipts, clone boundary

**SOURCE_CONFIRMED at #41:** \`validateBackupV3FlowIntegrity()\` checks approved proposal entries QPE against materialized output OP as counted tuple sets \`(basketId,playerBackupId,placementRank/finalRank)\`, source-stage membership/output basket type, duplicate proposal/player/placement/basket position; route receipt identity/topology, \`sourceProposalRevision\`, source output ↔ receipt arrivals \`(playerBackupId,finalRank/sourceFinalRank)\`, and duplicate target-stage arrival. \`validateBackupV3\` invokes this prior to starting the import transaction. Five previously silent remap/missing lookup paths in the restore loop now throw \`BackupV3ValidationError\`. No B2/legacy format changes were authorized in B1.

**PENDING RUNTIME acceptance:** the 12 table-driven corruptions are *test definitions*, not 12 passing runs. \`400 INVALID_BACKUP_V3\` and no clone rows must be established for every negative test via actual HTTP/PG16, with a verified positive exported approval/route path. The table-driven test currently counts clones with a derived tournament name before/after; A50/A60 should independently inspect clone root plus relevant child-table counts and ensure cleanup without live data. A controlled *late* mapping/DB exception inside clone transaction is **not yet proved** by the 12 preclone cases.

| B1 QA ID | Fixture / mutation | Required evidence |
|---|---|---|
| B1-P01 | Valid approved QP→QPE→OP, executed route receipt (current §22 round-trip and B1 positive) | HTTP export/import success; restored stage memberships/output/receipts; idempotent second route execution |
| B1-N01–12 | Remove OP, alter OP player/rank/basket, remove QP, pending QP+OP, stale revision, missing arrival, wrong target/source, extra/duplicate arrival | For each: typed validator failure, HTTP \`400 INVALID_BACKUP_V3\`, zero committed clone root/children |
| B1-L01 | Legacy V3 without new optional QP/route receipt collections | Valid restore, unchanged semantics; do not infer basket authority or strict new field requirement |
| B1-L02 | Approved proposal without executed route and historical underfill | No new automatic underfill rejection; await \`POLICY-BACKUP\` owner decision if behavior disputed |
| B1-R01 | Inject DB exception **after** cloned tournament root insert but before transaction COMMIT | Typed/controlled import error, transaction rollback; zero committed clone root and children. **Do not conflate** preclone \`INVALID_BACKUP_V3\` with late \`BACKUP_IMPORT_ROLLED_BACK\` |
| B1-N13 | Two independently valid source receipts route same player into one target stage | Reject duplicate target-stage arrival; zero clone |
| B1-N14 | QPE player outside source-stage membership or wrong stage-basket ownership | Reject before first clone INSERT |

**Additional source-only QA cautions:** B1 accepts absent \`qualificationProposals\`/\`routeExecutions\` on legacy V3. The output/proposal consistency check does not impose \`qualifierCount\` on an **unexecuted** route; executed routes use existing capacity semantics. Do not claim any actual legacy import PASS until A50 runs it. A50 should instrument rollback using disposable test DB only; no actual user backup file.

## 3. B3A source review — coherent exporter and two-connection barriers

**SOURCE_CONFIRMED at #48:** exportBackupV3 begins \`db.transaction(async tx => {...}, { isolationLevel: "repeatable read", accessMode: "read only" })\` before tournament root read; exporter queries use the same \`tx\`, including nested match/stage selectors. It sequentially awaits table reads on that transaction handle. It uses \`loadCompiledRoutingPlanV2InTransaction(tx,...)\` rather than the older helper's nested transaction. Serializer mapping, optional V3 arrays and \`orderBy\` expressions were left unchanged. Error in a read/helper should abort export instead of emitting partial V3 (STATIC_INFERRED until runtime).

**Test barrier:** \`afterTournamentRead\` is an optional internal callback in the exported function signature, not an HTTP request parameter; the actual export route must be independently verified to pass only tournament ID. On two-connection PG16, the first SELECT establishes snapshot E before callback. Writer W commits while E waits; E reads same old snapshot, and a fresh later E2 reads W's new state.

| B3A QA ID | Existing or extra test | Expected evidence |
|---|---|---|
| B3A-R01 (existing) | W atomically updates tournament \`name\`, planned target stage \`name\`, source match \`note\` after E root read | E **all old values**; E2 **all new values**; no hybrid |
| B3A-R02 (existing) | W approves qualification and executes route while E waits | E has no later QP or receipt; E2 has complete approved QP, OP and routed receipt entries |
| B3A-P01 (existing) | §22 valid Phase3 export → import → reload → idempotent route | Legacy-positive compatibility test PASS required |
| B3A-R03 (additional) | W commits completed result and history together between root and later reads | \`matches\` + \`resultHistory\` both from one snapshot; no old match/new history |
| B3A-R04 (additional) | W commits stage transition + basket/route state atomically | Stage/qualification/route records all old in E and all new in E2 |
| B3A-F01 (additional) | Routing plan helper throws error other than \`ROUTING_PLAN_NOT_FOUND\` | Export fails deterministically; never emits a syntactically valid-looking incomplete V3 |
| B3A-P02 (additional) | Missing tournament ID; legacy optional V3 routing absent | Preserve \`null\` on missing ID and previously valid legacy export shape |
| B3A-T01 (A50 verify) | Transaction config introspection or driver evidence | Confirm real PostgreSQL16 \`REPEATABLE READ\` and \`transaction_read_only=on\`; no hidden second connection inside routing helper |

**Important contract gap:** the two tests currently committed in PR48 cover *stage+match note* and *QP+route*, but not an independent concurrent **resultHistory** mutation. This is a proposed coverage addition for A50/A60, not a passed assertion nor an authorized R12 code edit. Pool must have at least 2 independent connections; barrier must not deadlock by calling the writer through the exporter transaction handle. No secret/connection URL appears in logs.

**Exporter rollback terminology:** read-only export has no clone writes to roll back; if read fails it should return an error, not a partial valid-looking file. B1's import rollback is a distinct invariant and must not be merged conceptually with B3A read failure.

**Exact-SHA incompatibility gate:** #41 and #48 both change \`application/backups/backup-v3.ts\`, but neither PR includes the other's commits. A00 must record the future conflict/integration order. Do **not** manufacture a combined A90 branch or composite SHA in R12.

## 4. B2 source facts and why aggressive import rejection is unsafe

**SOURCE_CONFIRMED (release baseline + R12 review):**
- The generated V3 match record includes result state and \`completedAt\`, but **does not serialize \`matches.revision\`**. The DB match state revision (CAS/trigger semantics) is not automatically portable. History's \`revision\` is a separate **per-match result completion sequence**; do **not** assert \`matches.revision = MAX(resultHistory.revision)\`.
- \`validateBackupV3\` verifies existing history row references, stage equality, positive unique \`(matchBackupId,revision)\`, dates, player membership and individual played/walkover/bye/no-contest shape. It does **not** require latest history to match the completed match's current state.
- The direct \`revertMatch\` service compares latest history versus match on tournament/stage, round, matchNumber, players, scores, winner, bestOf, resultType, reason, completedAt. Therefore some snapshots accepted by import may later be non-revertible with \`HISTORY_INCONSISTENT\` (STATIC_INFERRED; no R12 runtime repro).
- The V3 \`actionLog\` schema has \`actionType\`, \`stageBackupId\`, \`matchBackupId\`, \`canUndo\`, \`undoPayload: Record<string,unknown>|null\`, \`isUndone\` and \`createdAt\`, **but no portable old action ID or tie-break key**.
- Export orders action logs by \`createdAt DESC\`, import inserts in export-array order assigning new IDs. Tied timestamps can change newest-action precedence depending on DB-generated ID (STATIC_INFERRED). Exact active Undo LIFO semantics belong to A70/T040.
- \`remapUndoPayload\` maps recognised numeric \`playerId/player1Id/player2Id/winnerId\` and \`matchId/prevFeaturedMatchId\` keys, using \`Map.get(...) ?? originalValue\` if the ID is absent. Unknown historically valid payload shapes are not typed by the schema and cannot be rejected indiscriminately without owner policy.
- The existing positive §22 Phase3 fixture directly INSERTs completed matches in \`buildRouteFixture\` but does **not explicitly INSERT resultHistory** in that fixture. A20/A50 must confirm whether DB triggers materialize history for that path before applying any universal "completed match requires history" rule. Regardless, historic V3 compatibility cannot be inferred from a contemporary fixture alone.

**POLICY-BACKUP owner/HQ decisions required:** Match state revision preservation versus rebase/default on restore; admissible older V2/V3 completed matches with no history, gaps or mismatches; action-log equal-timestamp tie-break portability; provenance of legacy \`undoPayload\` types (including malformed or null); whether to add optional explicit provenance metadata/version marker with strict mode and old compatibility fallback. No policy selected by A90 R12.

### Option A — small, policy-safe, nonblocking pure integrity diagnostic (future candidate)

**Purpose:** A side-effect-free analyser \`analyzeBackupV3HistoryProvenance\` produces structured diagnostics **without changing import accept/reject** for historically valid V3. This can be a small test-first PR **only with a future A00 GO**, not R12.

**Proposed narrow behavior:** join \`matches\`, \`resultHistory\`, \`actionLog\` by backup IDs and report: completed match with zero history; latest available history mismatch on exactly the revert service tuple; revision gaps or unsorted input arrays (diagnostics only, not new validity requirements); action with recognisable \`match_result_submitted\` but unexpected \`undoPayload\` shape; unresolved recognised player/match keys that would survive \`?? originalId\`; \`canUndo\` with null payload; timestamp ties where global LIFO is ambiguous. No DB query, no mutation, no new error code, no reject, no inferred match revision equality. Reuse existing validator's already-enforced positive unique history revision and foreign-key references instead of duplicating it.

**Tests / expected:** valid completed match and exact latest history gives empty warning list; mismatch produces stable diagnostic path/code without rejecting; absent history diagnostic only; multiple revisions whose latest matches positive; old V3 with null/unknown payload reports caution instead of failing import; duplicate/foreign references already fail the pre-existing validator. Positive legacy V2/V3 imports must remain allowed where previously allowed. A60 must review diagnostic classification and A70 advise Undo risk.

**Risk:** this option does *not* close the B2 fail-closed import gap by itself; record \`HISTORY_UNVERIFIED\` rather than \`REPAIRED\`. It avoids an unapproved backward-incompatible hard gate and makes provenance measurable.

### Option B — future small strict/legacy B2 validation with explicit owner contract (POLICY OPEN)

**Precondition:** A00 + HQ publish \`POLICY-BACKUP\` decisions and identify *reliable* opt-in strict provenance (e.g. approved optional subversion/explicit exported metadata) versus historically valid older documents. Do **not** infer "modern" from \`schemaVersion:3\` alone.

**Candidate implementation (later GO only):** pure validator checks strict-profile completed match ↔ newest history equality of the actual \`revertMatch\` tuple, existence of history when promised, per-match revision uniqueness/positive and owner-selected gap/order constraints; recognise only approved completion action payload schema; verify \`undoPayload.matchId\` matches \`actionLog.matchBackupId\` and remaps to restored match; enforce active completion action ownership and deterministic global newest order using owner-approved tie-break metadata. Legacy profile uses existing V2/V3 path or explicit compatibility diagnostics; do not backfill, delete or rewrite historic records silently. Optional portable \`matches.revision\` mapping only after separate revision-policy approval, not by equating it to resultHistory counter.

**Tests / expected:** strict positive with one/multiple completed history revisions; latest changed score/winner/round/player/recorded completion date negatives; earlier nonlatest history allowed; orphan old/new match ID in completion undo payload negative; two active completion actions negative if owner says invalid; tied timestamp deterministic ordering; success: restore then A70 direct revert of a supported strict-profile fixture no \`HISTORY_INCONSISTENT\`. Historic valid V2/V3 absence of history and unfamiliar \`undoPayload\` remain accepted in legacy path if owner permits. Injected rejection must happen before clone; every late lookup failure must roll back clone transaction. A50/A60 exact-SHA test gate.

**Risk / blocker:** without owner-approved strict identification, even "latest completed history must match" can reject formerly valid exports that have insufficient provenance. This option **MUST STAY HOLD** until policy; no speculative strict validator PR in R12.

### B2 test-first matrix for A00/A50/A60/A70

| Case | Shape | Option A outcome | Option B strict-profile outcome (only after policy) |
|---|---|---|---|
| H01 | Completed match and identical latest history | no warning | accept |
| H02 | Completed match, no result history | warning | reject only if strict profile promises history; legacy acceptance separate |
| H03 | Latest result differs in score/winner/completedAt | mismatch warning | reject before clone |
| H04 | Earlier history differs, latest matches | no parity warning | accept |
| H05 | Two history revisions with unique positive numbers, sorted vs reordered rows | no rejection; optional ordering diagnostic | owner-defined accepted ordering, no confusion with \`matches.revision\` |
| H06 | History revision nonpositive or duplicate | existing validator rejects | reject (unchanged) |
| H07 | Action payload recognised, old ID equals action.matchBackupId | no warning | remap to created match, permit |
| H08 | Action payload references missing match/player ID, fallback keeps old ID | unresolved-ID diagnostic | reject or typed legacy decision, never silently attach to a different created entity |
| H09 | \`canUndo=true\` with malformed/null/unknown payload | warning | strict reject only for recognized approved action schema; legacy policy |
| H10 | Two actionable completion actions, or exact \`createdAt\` tie | conflict/order warning | owner-approved uniqueness/tie-break expectation |
| H11 | Historic V2/V3 sparse history and unknown payload | diagnostics, import policy unchanged | compatible legacy mode (if owner accepts), no unapproved blanket rejection |
| H12 | Imported strict match then direct revert or Undo | not guaranteed by A | success if strict gate promises it; independent A70 acceptance |
| H13 | Repeat export/import without new data | stable warning categories | stable equality and restore invariants; no invented state revision portability |

## 5. A50/A60 reproducible acceptance, sign-off and release gates

**Required sequence:** A50 must first establish *physically separate, explicitly approved*, disposable PostgreSQL16 instance/credentials/test schema, no production fallback; confirm \`TEST_DATABASE_URL\` points only to this isolated DB, \`TEST_DATABASE_SCHEMA=tm_test_a90_r12\` or similarly designated \`tm_test_*\`, and safe reset scope before calling test harness. The test helper performs schema DROP, so running it against a shared instance is prohibited. A60 subsequently issues independent exact-SHA verdict; neither party may substitute another PR's tests.

Illustrative commands from an isolated checkout of each PR HEAD (not executed by A90):
~~~sh
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
# Only after safe isolated PostgreSQL16 preflight; credentials injected securely, never printed.
TEST_DATABASE_SCHEMA=tm_test_a90_r12 TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
  pnpm --filter @workspace/api-server exec node --import tsx --test \
    --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

\`TEST_DATABASE_URL\` **must be set separately to a real approved isolated test-only value**, not to a placeholder, not a shared \`DATABASE_URL\`. A50 records commit SHA, command, time, Node/pnpm/PG version, DB isolation proof (redacted), exit code, TAP totals, pre/post scoped row counts and B3A logical-state hashes excluding \`exportedAt\`. Caution: the focused file is present on **both** branches but tests differ; repeat separately per exact SHA.

**A60 independent review before declaring any SOURCE_ACCEPTED:** test helper cannot mutate a shared schema; B1 source pipeline includes preclone 400/no clone and late rollback; B3A reads whole export through same client and \`accessMode: "read only"\`; verify routing plan helper doesn't fork a transaction; review record/handoff should explicitly pin SHA, diff, design assumptions, version and remaining uncertainty. A single CI Pack19 red gate remains independent and should not be waived as a successful full regression.

**Go/Stop summary:**
- B1 #41: \`PATCH_PROPOSED\`; PG16/API tests \`NOT_EXECUTED\` by A90 and not externally evidenced; QA pending.
- B3A #48: \`PATCH_PROPOSED\`; MVCC PG16 barrier \`NOT_EXECUTED\` by A90 and not externally evidenced; QA pending.
- B2 Option A: \`SOURCE-ONLY FUTURE CANDIDATE\`; no code GO; does not satisfy fail-closed DoD.
- B2 Option B: \`POLICY_OPEN / HOLD\`; require HQ policy + A00 explicit implementation GO.
- PR41/48 shared path conflict: A00 owner; no composite integration branch here.
- **MERGE, PRODUCTION, DEPLOYMENT, SWARM-006: NOT AUTHORIZED. WEB-005 RELEASE: NO-GO.**

**A00 next action:** Obtain A50 physically isolated PG16 test evidence and A60 independent exact-SHA review on #41 and #48; consult A20 migration/revision triggers and A70 Undo/LIFO compatibility; make a documented \`POLICY-BACKUP\` decision before authorizing a B2 strict-mode source PR. Keep P01/P08/R11 candidates in A10's INTERNAL_BUFFER only.
