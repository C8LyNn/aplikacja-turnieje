# WEB-005 / A90 / R13 — Backup B2 owner policy + B1/B3A source QA

**TASK:** \`WEB-005-T060-A90-R6\` · **WAVE:** R13.1 (2026-10-14, Europe/Warsaw) · **MODE:** SOURCE ONLY.  
**AUTHOR:** A90 — Backup V3 Integrity & Restore. **Decision owner:** A00 + global HQ/owner; A90 does **not** select a backward-incompatible policy.  
**RELEASE BASE:** \`release/tournament-ops-20261013-01\` — \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**OUTPUT BRANCH:** \`docs/web-005/a90-r13-b2-owner-policy-qa\`, documentation only.  
**NO-GO:** application source, SQL/DDL/migration, any PR41/48 amendment, cross-PR merge/rebase/cherry-pick, production/live/staging, real user backups, paid manual CI, shared-db mutation, SWARM-006.

## 1. Verified live GitHub state — no implied QA acceptance

| Candidate | Exact HEAD | Base, files, state |
|---|---|---|
| **P08 / B1** — [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | Base release \`1fdc401d...\`. **OPEN DRAFT / unmerged**. 4 changed paths: \`backup-v3-flow-integrity.ts\` (+168), \`backup-v3.ts\` (+18/-5), \`stage-basket-route-execution.integration.test.ts\` (+75), \`WEB-005_A90_R9_HANDOFF.md\` (+63). |
| **R11 / B3A** — [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | Same base. **OPEN DRAFT / unmerged**. 2 changed paths: \`backup-v3.ts\` (+39/-34), \`stage-basket-route-execution.integration.test.ts\` (+101). |
| **P01 / Pack19** — [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Separate unmerged draft fix of obsolete source-contract regex; not part of #41/#48. |
| **A70 history/Undo** — [PR #51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | Separate malformed persisted Undo payload fix; ownership is A70/T040. |

**CI evidence at exact SHA:** PR41 run [38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598) → job \`115926270437\` **FAIL** at "Pack 19 snapshot consistency tests", 9 later steps skipped. PR48 run [38596228642](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38596228642) → job \`115963545435\` **FAIL** at same Pack19 step, 9 later steps skipped. Known source matcher expects \`readOnly:true\` although PostgreSQL/Drizzle uses \`accessMode:"read only"\`. Isolated PR35 addresses this upstream gate; **do not duplicate or merge #35 in A90**. These runs contain no B1/B3A targeted PG16 PASS or target-feature FAIL.

**Review evidence:** both #41 and #48 had **zero recorded GitHub review submissions** when checked. Their conversation comments carry A90 R10–R12 author handoffs, not independent A60 acceptance. A50/A60 R12 report names could not be retrieved on release at \`docs/web-005/WEB-005_A50_R12_HANDOFF.md\` or \`WEB-005_A60_R12_HANDOFF.md\` (GitHub NOT_FOUND); code search and branch queries did not identify published exact-head reports. This is an *evidence-scope limitation*, **not proof** that agents never performed private/off-repo work. Until signed exact-SHA evidence is accessible, status remains **PATCH_PROPOSED**, PG16 **NOT_VERIFIED IN AVAILABLE EVIDENCE**, A60 **PENDING/NOT_EVIDENCED**.

**Actual A90 R13 commands/execution:** GitHub file/PR/diff/review/CI read operations and creation of two docs files; **no app runtime tests**, no typecheck/PG16/HTTP, no command exit codes to report, no fabricated PASS, no user or DB data read.

## 2. B1 exact-source QA contract — PR41

**SOURCE_CONFIRMED:** B1 validator runs before \`importBackupV3\` clone transaction; validates QP/QPE/approved OP as multiset parity, source stage ownership/membership, duplicate ranks/positions/players, pending output prohibition; executed route topology, receipt proposal revision, OP↔route receipt player/rank multiset, source basket capacity on **executed** route, and duplicate arrival player/target stage. Import loop changes five silent missing/remap paths to typed exceptions inside the clone transaction. **The prior B1 author wrote 12 negative fixtures**; no corresponding A50 PG16 run with exit=0 is established.

| QA gate | Test input / action | Mandatory actual evidence on #41 |
|---|---|---|
| B1-POS-1 | Valid exported approved proposal, two OPs, executed source→target route, import into new tournament; re-export and idempotent re-route | HTTP success, correct restored QP/OP/receipt, cloned rows and stage participants, no accidental re-execution |
| B1-POS-2 | Old legal V3 with omitted newer Phase 2/3 runtime collections; old configuration / unexecuted route | Import succeeds under documented legacy semantics; never retroactively apply executed-route qualifierCount to unexecuted route |
| B1-NEG-01–12 | Each of the twelve existing malformed QP/OP/receipt cases (missing OP, wrong player/rank/basket, missing/invalid source proposal, pending OP, stale proposal revision, missing/extra/duplicate arrival, wrong route/source/target) | For each: \`400 INVALID_BACKUP_V3\`; pre-clone validation; **before/after no new root or dependent clone rows** |
| B1-NEG-13 | QPE references player outside source stage or output from wrong source stage | Reject before clone; type + relation evidence |
| B1-NEG-14 | Two valid receipts duplicate the same player's arrival into one target stage | Reject before clone; zero clone |
| B1-ROLLBACK-01 | Inject a genuinely late DB/ID-mapping failure after root/stage creation, before clone transaction commit, on an approved disposable DB | Full transaction rollback over cloned root, stages, matches, history, action, baskets, proposal/output and route rows; do not conflate preclone \`INVALID_BACKUP_V3\` with late typed rollback |
| B1-LEGACY-01 | Older legal V3 sparse history, no QP/receipt extensions, unknown/nullable Undo provenance | Compatible import remains allowed, pending distinct B2 legacy policy |

**Classification:** B1 code \`PATCH_PROPOSED\` / source invariants \`SOURCE_CONFIRMED\`; runtime outcomes \`NOT_EXECUTED\` by A90, A50 external proof unavailable. B1 is independent of B3A and B2.

## 3. B3A exact-source QA contract — PR48

**SOURCE_CONFIRMED:** exporter now wraps root, stages, matches, resultHistory, baskets, proposals/outputs/route executions+entries and routing plan in **one** \`db.transaction(async tx, {isolationLevel:"repeatable read",accessMode:"read only"})\`; related queries are sequential on same \`tx\`, including \`loadCompiledRoutingPlanV2InTransaction(tx,...)\` rather than separate nested plan transaction. An optional \`afterTournamentRead\` callback is an internal test barrier; GET endpoint must call exporter without an untrusted callback. The valid V3 JSON projection is intentionally unchanged.

| QA gate | Two-connection race or regression | Mandatory evidence on #48 |
|---|---|---|
| B3A-RACE-01 (authored) | Export root SELECT → barrier → independent writer transaction updates tournament name, target stage name and source match note → commits → export resumes | Original export **entirely precommit**, later fresh export **entirely postcommit**, no torn fields; two distinct PG client/session IDs |
| B3A-RACE-02 (authored) | Root snapshot → writer approves QP, materializes OP, executes route → commits before export resumes | Snapshot omits *all* new QP/OP/receipt; fresh export contains coherent approved source/receipt set |
| B3A-RACE-03 (supplement) | Writer commits latest completed match/result_history together while exporter paused | Latest match tuple+history from same snapshot; no old match/new history |
| B3A-RACE-04 (supplement) | Writer commits stage status/roster/routing receipts together | No cross-generation stage/route membership mix |
| B3A-NEG-01 | Routing-plan lookup throws an error **other than** expected \`ROUTING_PLAN_NOT_FOUND\` | No partial valid-looking V3 payload returned; typed failure propagated |
| B3A-POS-01 | Existing legal Phase 3 export → import → reload → route idempotence, empty-plan legacy export, unknown tournament ID | Legacy parity and error/null behavior unchanged |
| B3A-DB-01 | PG16 introspection while exporter runs | Real \`transaction_isolation='repeatable read'\`, \`transaction_read_only=on\`; same transaction/client for all helper reads |

**Important limitation:** PR48 contains **two** authored barrier tests; history-specific and stage-status race are **not present in PR48** as independent cases. Treat them as A50/A60 supplemental gate proposals, not completed tests or authorization to amend this PR. A50 must verify test fixture isn't blocked by schema triggers and writer truly commits on a second client, not on the read-only client. Route/receipt source may be internally invalid under B1 if both are not yet integrated; coordinate expected independent V3 result without assuming composite checkout.

**Classification:** \`SOURCE_CONFIRMED\` transaction structure; actual race/driver verification \`NOT_EXECUTED\` by A90, \`RUNTIME_VERIFIED\` only after A50 evidence; A60 independent source review outstanding. Export read-only failure means no partial exported file; unlike B1 there are no exporter-side clone DB writes requiring rollback.

## 4. B2 facts: safe checks versus compatibility decisions

These observations are from release source and generated V3 public types, not new policy:
1. \`TournamentBackupV3MatchesItem\` serializes match status, round, players, score, winner, bestOf, result type/reason and completedAt, **but not database \`matches.revision\`**. \`TournamentBackupV3ResultHistoryItem.revision\` is the *result completion history sequence* and must NOT be forced equal to the match row's *CAS/state revision*.
2. V3 result-history validator already checks the referenced match/stage, positive unique \`(matchBackupId, revision)\`, player/stage membership, dates, and individually valid played/walkover/bye/no-contest records. It does **not** require the most recent history entry for every completed match or compare that entry with the current completed match tuple.
3. \`revertMatch.historyMatchesCurrentResult\` compares: tournament/stage (via related IDs), round, matchNumber, player1/player2, score1/score2, winnerId, bestOf, resultType, resultReason and **completedAt** (instant equivalence). A V3 restore that passes existing import validation can still fail later revert due to a mismatched/missing history record; this consequence is **STATIC_INFERRED** absent real repro.
4. \`TournamentBackupV3ActionLogItem\` has \`matchBackupId\`, \`stageBackupId\`, \`actionType\`, \`canUndo\`, \`isUndone\`, \`undoPayload\` generic object/null, \`createdAt\`. **No original action ID or portable tie-breaker**. Import assigns new action IDs.
5. \`remapUndoPayload\` recognizes numeric \`playerId/player1Id/player2Id/winnerId\` and \`matchId/prevFeaturedMatchId\`, with \`map.get(oldId) ?? oldId\` fallback. A missed mapping may retain an orphan or accidentally collide with another clone numeric ID. This is **SOURCE_CONFIRMED fallback / STATIC_INFERRED consequence**. Action log outer \`matchBackupId\` is validated, but nested recognized IDs and completion payload pairing are not universally checked.
6. Export sorts action log by \`createdAt DESC\`; equal timestamps are not a portable total order without original IDs. Import inserts in array order and assigns fresh IDs. Historical global LIFO/active completion action provenance needs coordination with **A70**, not A90's unilateral choice.
7. Existing Phase 3 test fixture inserts completed match rows directly, without an explicit \`resultHistory\` INSERT in the fixture. A20/A50 must check relevant PG triggers before assuming all valid preexisting exports have completion history. Merely missing history is not automatic proof of corruption in the legacy V3 corpus.

**Policy classes:**

| B2 invariant / treatment | Pure static in existing V3 (already safe/contracted) | New rejection needs POLICY-BACKUP |
|---|---|---|
| Unique known match IDs, stage references, dates, positive unique history revisions | Already validated; preserve, no duplicate validator | — |
| Completed match tuple **equals latest available result-history tuple** | Deterministically comparable; diagnostics possible without changing import | **YES** if any mismatch would turn a formerly importable V3 into hard failure |
| Every completed match has at least one history row | Missingness detectable, diagnostic only | **YES**, specifically legacy V3 sparse/no-history policy |
| Every history revision is contiguous, starts at 1, matches row CAS revision | No; don't silently infer it | **YES**, plus A20 DB trigger/CAS schema proof |
| \`actionLog.matchBackupId\` and \`stageBackupId\` resolve | Already validated | — |
| Recognized nested \`undoPayload\` IDs map to existing exported players/matches and action outer ID | Detectable; diagnostics/test-first possible | **YES** for universal rejection of old/unknown Undo payloads |
| Current active \`match_result_submitted\` action has \`revert_match\` payload and points at same current match/completion | Diagnostic/provenance checks possible; compare with A70 | **YES** to make a mandatory strict rule for all old V3 |
| Equal-timestamp completion action order, multiple active actions | Ambiguity observable | **YES** for reject/choose tie-break or serializable original ID |
| Backward-compatible old V2/V3 import without Undo/revision provenance | Existing acceptance contract should remain until owner decision | **YES** for any restriction or version discriminator |

**Status:** \`POLICY_OPEN\` for any strict-profile transition, portable match revision mapping and old V2/V3 compatibility. No new B2 validator has been implemented in R13.

## 5. Owner/HQ decision brief — exact approvals requested

**D1 — Compatibility classification (highest priority):** Choose how to recognize a backup with reliable modern provenance: explicit optional version/capability marker; verified export provenance; another signed mechanism. **Do not equate \`schemaVersion === 3\` with strict**. Define policy for legacy V2 and earlier/sparse V3: accept unchanged, accept with warnings, restricted Undo postrestore, or explicit unsupported format (would require conscious product decision and rollout). **Default until decision: preserve current acceptance; do not reject historically valid backups.**

**D2 — Completed result ↔ history:** In strict-profile V3, will owner require one or more \`resultHistory\` entries for every completed match, and \`MAX(history.revision)\` tuple match? What about undone results, walkovers/byes/no-contest, previously imported historical sparse backups, and completion date precision? State whether mismatches are \`INVALID_BACKUP_V3\` preclone or restore-with-warning.

**D3 — Revision portability:** Is DB \`matches.revision\` (CAS) recomputed/defaulted on import or preserved via a new optional portable field? Is it safe to rebase against current DB schema? **No equality with \`resultHistory.revision\`**. A20 must confirm trigger and DDL migration history first. Choose monotonic/contiguity expectations only if supported by the real historical producer.

**D4 — Action provenance and Undo:** Which action types require a typed \`undoPayload\`, and whether \`match_result_submitted\` must have \`{type:"revert_match",matchId:...}\` and tie it to current match? Must valid old Undo actions remain importable but disabled, or cause import rejection? Who owns old action ID/tie-break extension, and action \`createdAt\` ties? A70 owns global Undo/LIFO and CAS expectations.

**D5 — ID remap behavior:** On recognized nested player/match keys missing from the backup ID mapping, choose strict preclone reject for modern-profile backups versus legacy safe degradation (e.g. disable unsafe Undo while preserving data) with explicit diagnostics. Never silently assert that \`?? originalId\` is a successful remap.

**D6 — Rejection/rollback contract:** For strict-profile violations, require \`400 INVALID_BACKUP_V3\` **before** cloning; for a late error, typed failure and full transactional rollback over all clone tables. Legacy acceptance evidence must be preserved alongside negative tests. A00 records D1–D6 in DECISIONS / POLICY-BACKUP and issues separate GO before a B2 patch.

**Recommended non-policy implementation posture:** Continue current legacy import behavior until D1–D6 are answered; use detection-only diagnostics to quantify legacy cases if separately authorized. This is not a decision to allow unsafe Undo; A70 can fail closed at execution time where already authorized.

## 6. Future B2 one-patch, test-first design (NO GO IN R13)

**Candidate:** \`WEB-005-T060-B2-PROVENANCE-VALIDATION\`, a *single new isolated draft PR* **only after** owner/HQ approves D1–D6 and A00 grants explicit source-code GO. This is a plan, not a pending automated action. Begin from pinned release baseline as instructed by future wave; **do not cherry-pick PR41 or #48**, record shared-file conflicts for SWARM-006. No DB schema changes or V2 importer rearchitecture in the proposed patch unless separately authorized.

**Planned minimal files:** one small, pure validation module (e.g. \`application/backups/backup-v3-history-integrity.ts\`), a minimal call site in \`application/backups/backup-v3.ts\` *before clone* conditioned on owner-approved provenance marker, and a targeted integration/contract test file. Keep unchanged V3 mapping and B1/B3A semantics except explicit strict-mode marker handling. If owner requires new portable fields/DDL, **STOP** this "small patch" and split into a new reviewed design—no speculative schema.

**Implementation phase/order:** Commit 1 **RED test definitions**, including explicit legacy positives; Commit 2 pure validation/remap semantics under approved marker; Commit 3 only type-correct minimal integration and handoff. No claim of executed RED/green without actual run. Fail closed only for cases in owner-approved strict profile; no self-invented automatic migration of existing backups.

| ID | Controlled synthetic backup fixture | Expected, pending D1–D6 |
|---|---|---|
| B2-P01 | Strict modern completed match and equal latest history tuple | Accept; preserve all fields/remap IDs |
| B2-P02 | Multiple history revisions, earlier historical result differs but max revision equals current match | Accept; do not reject valid earlier history |
| B2-N01 | Strict modern latest history differs in result score/winner/type/reason/bestOf/player1/player2/round/matchNumber/completedAt | \`INVALID_BACKUP_V3\` preclone; no clone rows |
| B2-N02 | Strict modern completed match has no history | Reject only if D2 requires it; legacy sparse counterpart **must still be accepted** |
| B2-P03 | Two distinct DB match-state revisions but same legitimate resultHistory revision count | No equality assumption; portable match CAS policy D3 |
| B2-N03 | Duplicate/zero/nonexistent revision or orphan match in history | Existing validator rejects; regression and typed errors |
| B2-P04 | Strict action completion payload old match ID correctly remaps to new match | Import then A70 direct revert/Undo preserves target and invariants |
| B2-N04 | Action outer match ID is valid but nested \`undoPayload.matchId\` is absent/orphan/wrong match | Strict-profile preclone rejection or D5-approved degrade; no original-ID reuse |
| B2-N05 | Recognized Undo player ID missing from exported players; possible clone numeric collision | Typed strict failure, no cross-tournament ID confusion |
| B2-N06 | Two active completion actions for one current result; equal timestamp without portable action ordering | Owner D4 action-order semantics; reject ambiguous strict or explicit tie-break metadata |
| B2-L01 | Old legal V3 with sparse/no history, unknown object/null payload, no strict marker | Legacy acceptance unchanged, or explicit owner-approved warning/degraded Undo behavior |
| B2-L02 | Older V2 import with no new V3 provenance fields | Positive unchanged V2 path; never route through new strict V3 gate |
| B2-RB01 | Forced late mapping/DB exception after clone insert | Full rollback; zero root/stage/match/history/action/receipt/qualification cloned rows |
| B2-P05 | Strict export→import→export logical invariants + one supported Undo/revert | A50 PG16 HTTP+DB evidence, A60 exact SHA sign-off; no guessed PASS |

**Test acceptance:** physically isolated, explicitly approved disposable PG16 with \`TEST_DATABASE_URL\`, \`TEST_DATABASE_SCHEMA=tm_test_*\`, known destructive \`DROP SCHEMA\` scope, Node22/pnpm10 verified; A50 records real commands, exit code, TAP counts, actor isolation, negative HTTP and clone-count checks. A60 independent review on exact HEAD. Neither writer's fixture definitions nor Pack19 pre-gate CI error make B2 pass.

**Rollback/reversibility:** pure preclone strict validation must leave zero committed rows when rejected; transaction errors must roll back all clone-owned tables, including action_log and qualification routes. Release of a stricter acceptance contract requires owner-approved compatibility messaging and a supported recovery path; no silent data loss.

## 7. R13 closeout / handoff matrix

- **A90 SOURCE-ONLY WORK:** completed GitHub source/evidence reconciliation and owner brief. No app code changed. Two documentation-only files created on independent branch.
- **PR41 B1:** \`PATCH_PROPOSED\`, no demonstrated A50 PG16 result or A60 exact-SHA verdict in accessible sources.
- **PR48 B3A:** \`PATCH_PROPOSED\`, two source-authored races, no demonstrated physical PG16 barrier result or independent A60 exact-SHA verdict in accessible sources.
- **B2:** \`SOURCE_CONFIRMED\` schema/provenance gaps; actual runtime consequence \`STATIC_INFERRED\`; strict portable revisions/history acceptance \`POLICY_OPEN\` with A00/HQ.
- **A50 → A60:** preserve exact-SHA per-packet test/QA priority; need physical test DB and approvals, no unsupported PASS.
- **A20:** ledger/match revision schema/trigger history is a required dependency, not A90 migration.
- **A70:** current completion provenance, malformed Undo, LIFO and action ordering need A70 confirmation and owner policy; #51 remains independent.
- **A10/A00:** keep candidate B1/B3A and future B2 in **INTERNAL_BUFFER** with conflicts; no integrated composite SHA, no SWARM-006 handoff.
- **MERGE / RELEASE / DEPLOY:** NOT AUTHORIZED. **WEB-005 RELEASE_NO_GO / SWARM006_FINAL_HANDOFF_DEFERRED.**
