# WEB-005 — A90 R14 / B2 POLICY GATE

**AGENT / ROLE:** A90 — Backup V3 Integrity & Restore  
**TASK / WAVE:** `WEB-005-T060-A90-R7` / R14.1 / 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE-ONLY / BACKUP QA SUPPORT. **Decision owner:** A00 and owner/HQ, not A90.  
**BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**DOCS BRANCH:** `docs/web-005/a90-r14-b2-policy-gate` (separate, based on exact release).  
**R14 STOP:** No V3 source code/SQL/DDL/real imports/migrations, source PR amendments, composite branch, merge/cherry-pick/rebase, deploy, paid manual CI or SWARM-006.

## 1. Evidence register — exact GitHub SHA and boundaries

| Object | Exact SHA / evidence | Classification |
|---|---|---|
| B1 / [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `e847cb705296a48ab5c68ece96776cd0e0bbb417`; base `1fdc401...`; OPEN DRAFT / unmerged | `PATCH_PROPOSED`, independent A60 acceptance **not established** |
| B3A / [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`; same base; OPEN DRAFT / unmerged | `PATCH_PROPOSED`, PG16 MVCC result **not established** |
| Pack19 dependency / [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c`; OPEN DRAFT / unmerged | independent source fix of obsolete Pack19 matcher, **not included** in B1/B3A |
| A70/T040 history / [PR #51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` at R13; R14 source patch not modified by A90 | separate Undo semantics and dependency |

**Exact files in PR41:** `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` (+168); `artifacts/api-server/src/application/backups/backup-v3.ts` (+18/-5); `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` (+75); `docs/web-005/WEB-005_A90_R9_HANDOFF.md` (+63). Four changes on release baseline, verified via compare.  
**Exact files in PR48:** `artifacts/api-server/src/application/backups/backup-v3.ts` (+39/-34) and `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` (+101). Two changes on release baseline, verified via compare.

**CI:** Exact #41 head run [38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598), job `115926270437`, `FAIL`; #48 head run [38596228642](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38596228642), job `115963545435`, `FAIL`. **Readback of actual job logs**: test "transaction is explicitly read-only and snapshot isolation" in `qa/pack19/source-contract.test.mjs` expects regex `/isolationLevel:"repeatable read",readOnly:true/`, whereas source contains `accessMode:"read only"`. Each job skipped the downstream "Static and database release gates" step and eight other subsequent steps. **This is a failed old Pack19 source regex, neither Backup V3 runtime PASS nor B1/B3A feature FAIL.** PR35 is the separate correction; do not duplicate or merge.

**Independent acceptance evidence:** GitHub #41 and #48 currently show **0 submitted review events** and 0 review threads. The A50/A60 R14 handoff filenames were not present on the central control branch at check time; branch-name searches for A50/A60 did not surface reports. This does **not establish absence of off-branch or private work**. It means that **no verifiable A50 physical PG16 test + A60 exact-head signed verdict was found among consulted evidence**. Retain `NOT_EXECUTED` for A90 and `NOT_EVIDENCED` for other agents' external tests, not universal `NEVER_RUN`.

## 2. B1 — preclone import and portable Phase2/3 receipts

**SOURCE_CONFIRMED** at PR41: pure `validateBackupV3FlowIntegrity` validates source stage players, output basket type/ownership, QP→QPE→approved output tuple/multiplicity parity; rejects duplicate proposal/rank/player/position; permits configured route not yet executed; for executed route verifies configured topology, approved proposal revision, source output→route arrival player/rank multiset parity, executed qualifierCount and duplicate target-stage arrivals. The validation is invoked prior to opening the clone transaction. Some previously permissive import restore mappings now throw typed `BackupV3ValidationError` inside the transaction.

**Required A50 positive/negative checks (on PR41 exact SHA, separate from #48):**

| ID | Fixture/event | Expected and proof |
|---|---|---|
| B1-P1 | Synthetic valid approved source QP/QPE/OP and 2-player executed route | Export→HTTP import→reload; correct QP, OP, route entries and participants; second route execution remains idempotent |
| B1-P2 | Legal older V3 with no optional explicit basket/proposal/route extension | Accepted without introducing new mandatory Phase2/3 fields |
| B1-P3 | Approved but unexecuted route, legal historical underfill where prior policy permits | No invented executed-route capacity rejection |
| B1-N01–N12 | **All twelve existing authored corruption variants**: missing/mismatched OP; wrong player/rank/basket; absent QP; pending QP with OP; stale source revision; incomplete/wrong/extra/duplicate receipt entries | Each: validator typed `BackupV3ValidationError`, HTTP `400 INVALID_BACKUP_V3`, **zero committed clone root and all dependent rows** |
| B1-N13 | QPE player foreign to source stage, duplicate stage arrival through two routes | Preclone rejection / no new clone rows |
| B1-RB1 | Controlled late failure **after inserting a clone root** but before transaction COMMIT | All cloned tournament, stage, match, history, action, QP/output and route rows rolled back. Preclone 400 is **not** proof of late rollback |
| B1-L1 | Historic lawful snapshot with no recent QP/OP/receipt, sparse result history and nullable/unknown old action payload | Do not silently tighten B2 policy; any changed acceptance needs owner approval |

**Evidence state:** 12 tests are SOURCE-authored, not executed by A90. A50 must supply actual command, exit code, environment and redacted zero-row evidence; A60 must sign off the exact SHA.

## 3. B3A — exporter snapshot and concurrency boundary

**SOURCE_CONFIRMED** at PR48: `exportBackupV3` starts `db.transaction(...,{isolationLevel:"repeatable read",accessMode:"read only"})`, executes root and subsequent matches/history/stages/roster/baskets/QP/output/receipts through the same `tx`, and calls `loadCompiledRoutingPlanV2InTransaction(tx,...)`. The internal optional `afterTournamentRead` hook is used to orchestrate tests; it is not an HTTP request parameter. The serializer remains schemaVersion 3.

| ID | Deterministic two-connection test | Required runtime check |
|---|---|---|
| B3A-1 | Export E reads root → writer W changes tournament name, target stage name, source match note and commits → E resumes; export E2 later | E contains **all old** values; E2 contains **all new** values; no hybrid snapshot |
| B3A-2 | E reads root → W approves QP, materializes OP and executes route → E resumes; E2 later | E has **none** of W's later QP/receipt, E2 has complete matching approval/output/receipt; no torn state |
| B3A-3 (extra proposal) | E root barrier → W atomically writes match result + `result_history` → E2 | E consistent old match+history; E2 consistent new pair. **Not in PR48 authored tests**, do not represent as PASS |
| B3A-4 (extra proposal) | W changes stage state + route memberships inside a single commit | Old/new cohort consistency; no mixed approval/route generation |
| B3A-5 | Real PG16 session introspection; route helper and HTTP endpoint | `transaction_isolation=repeatable read`, `transaction_read_only=on`, all exporter SELECTs on one tx/client and writer on a separate connection; no leaked test callback from HTTP |
| B3A-P1 | Legal existing Phase3 V3 export→restore→route re-execution | Previous positive/legacy behavior and idempotence unchanged |

**Failure semantics:** exporter error should not return a partially successful valid-looking V3; unlike import, exporter has no clone rows to roll back. The GitHub CI failure above does not run these PG16 cases.

## 4. B2 — SOURCE facts vs unknowns and owner policy

### 4.1 SOURCE_CONFIRMED (current baseline/generated contract)

1. `TournamentBackupV3MatchesItem` serializes status, players, round, matchNumber, bestOf, scores, resultType/reason, winner and completedAt, **but no database `matches.revision`**. This match-row CAS/state revision differs from `TournamentBackupV3ResultHistoryItem.revision` (positive per-match completed-result sequence). **Never equate these counters**.
2. Existing `validateBackupV3` checks positive unique `(matchBackupId, history.revision)`, correct match/stage ownership, result-specific shape, referenced players/stage membership and timestamps. It currently does **not** require a nonempty history for every completed match, or that latest history tuple equals current match tuple.
3. `revertMatch.historyMatchesCurrentResult` compares tournament+stage (DB IDs), round, match number, both players, scores, winner, bestOf, result type/reason and instant `completedAt`. A later `HISTORY_INCONSISTENT` for mismatch on restored data is **STATIC_INFERRED**, not R14-reproduced.
4. `TournamentBackupV3ActionLogItem` contains outer `matchBackupId`, `stageBackupId`, `actionType`, `canUndo`, `isUndone`, generic object/null `undoPayload`, and `createdAt`. Its original DB action `id` is **not serialized**. Export ordering by `createdAt DESC` is not a strict total ordering for equal timestamps after clone assigns new action IDs. Any promise of deterministic Undo/LIFO across tied timestamps is policy-dependent (A70).
5. `remapUndoPayload` remaps recognized **numeric** `playerId/player1Id/player2Id/winnerId` and `matchId/prevFeaturedMatchId` recursively. It uses `Map.get(oldId) ?? oldId` for missing mappings; "unchanged ID" is not proof of valid mapping and could point to the wrong cloned numeric ID (**STATIC_INFERRED** possible consequence). Validator already rejects invalid *outer* `actionLog.matchBackupId`; nested recognized references are a distinct unclosed risk.
6. **Important type distinction absent from previous policy shorthand:** generated `TournamentBackupV3` has **required** `resultHistory: []` and **required** `actionLog: []` *properties*, though their arrays may be empty. `TournamentBackupV3ActionLogItem.undoPayload` is nullable. Phase2/3 `qualificationProposals` and `routeExecutions` are optional. Consequently (a) valid V3 with **empty** actionLog, (b) a log entry with **null** payload, and (c) malformed V3 **omitting the actionLog property** must be separate fixtures. Whether some historical producer omitted a now-required field is a **compatibility investigation / owner question**, not something A90 may assume legal. V2 has a distinct importer path.
7. The Phase3 synthetic fixture inserts completed matches without explicitly writing `result_history`; A20/A50 must examine actual PG trigger behaviour on isolated DB before inferring all historic valid snapshots have a history row. No automatic blanket rejection of history-sparse V3 before owner signoff.

### 4.2 Deterministic source diagnostics vs owner-controlled rejection

| Check | Safely observable without changing import acceptance | New strict reject / semantic choice |
|---|---|---|
| Current outer match/stage/action references; unique history revision >0; dates and result shape | Already enforced; preserve | No policy necessary to preserve existing rule |
| For each completed match, newest history by **max history revision** has identical revert tuple | Pure diagnosis `HISTORY_LATEST_MISMATCH`; don't rewrite | Owner must decide whether all completed matches **must** have history and whether mismatch is preclone 400 for modern only |
| History revision order/gaps, match state revision portability | Diagnose but no `matches.revision === history.revision` inference | D3: preserve vs regenerate CAS revision; explicit marker/version and migration contract |
| Completion `actionLog` outer match/stage identity and nested recognized `undoPayload.matchId` validity | Pure diagnostic for missing/foreign ID and current completion mismatch | D4/D5: typed payload profile and rejection vs accepted legacy with disabled unsafe Undo |
| Multiple active completion actions, createdAt ties, no saved original action ID | Diagnose ambiguous order | D4: deterministic total order/provenance or strict rejection; A70 global LIFO owner |
| `resultHistory:[]`, `actionLog:[]`, `undoPayload:null` | Distinct valid type-level possibilities | D1/D2/D4: whether importing these is accepted/warning/restricted Undo per profile |
| Truly omitted `actionLog` or `resultHistory` property on V3 JSON | Not valid as generated V3 shape | D1: investigate older real producer/import parser and decide explicit compatibility transform vs existing reject; **do not falsely classify as optional** |

**Status:** Existing referential guard gaps are `SOURCE_CONFIRMED`, their exact cross-clone exploitation is `STATIC_INFERRED` until tests. Blanket strict modern/legacy rejection is `POLICY_OPEN`. No new B2 code permitted in R14.

## 5. Owner/HQ decision ticket — explicit actionable choices (no selection by A90)

**DECISION REQUIRED: `POLICY-BACKUP/B2-PORTABLE-HISTORY`** (A00 routes to HQ; A20/A70 consult; one signed policy before B2 source GO).

| Gate | Explicit owner choice needed | If unresolved |
|---|---|---|
| **D1 — profile/discriminator** | How does importer distinguish modern strict provenance from previously legal old V3? e.g. future optional capability marker with defined legacy fallback; what about V2 and missing properties? | No strict gate in `schemaVersion:3` wholesale |
| **D2 — completion/history** | For strict profile, must every `status=completed` match have history and latest tuple parity? Treatment of walkover/bye/no_contest, reverted histories and timestamps? Legacy `resultHistory:[]` accept/warn/degraded? | Diagnostics only; preserve historical import acceptance |
| **D3 — state revision** | New portable `matches.revision` field vs database default/rebase? Define monotonic CAS semantics and resulting replay/undo effects after A20 schema/trigger verification. | No forced equality to resultHistory revision |
| **D4 — action provenance** | When is active completion action mandatory? Which typed Undo payloads? What is LIFO order for exact `createdAt` ties without portable original ID? Does a legal empty `actionLog:[]` disable Undo only? | No new universal active-log rejection; A70 owns execution guard |
| **D5 — nested ID remap** | Modern profile: reject recognized missing numeric IDs before clone vs warn/degrade legacy unsafe Undo? Unknown historic payload schema treatment? | No silent `?? oldId` implied correctness claim |
| **D6 — error/rollback/compatibility** | Strict corruption → preclone `400 INVALID_BACKUP_V3`; late failure → transaction rollback; legacy-positive catalog, client messaging and restore availability? | B2 source patch HOLD |

**Minimal owner signature requested:** A00 + HQ record D1–D6, accepted strict marker and legacy matrix, explicit behavioural contract, date and version. This is the **single most important unblocker** for B2; no unilateral A90 policy selection.

## 6. A50 future B2 synthetic fixture / test-first matrix (no code GO)

**Purpose:** future B2 implementation verification **after** policy + separate A00 GO; fixture definitions can be prepared now, but **test is NOT_EXECUTED and no future patch created in R14**.

**Fixture construction recipe on disposable PG16 only:** use `buildRouteFixture({qualifierCount:2})` in `stage-basket-route-execution.integration.test.ts`; take `exportBackupV3` of a synthetic tournament. Build a *typed and immutable clone* as `TournamentBackupV3`, assign an existing source match ID from `matches[*].backupId`, and construct history rows with exactly matching `stageBackupId`, round, matchNumber, player1/player2, winner, score1/score2, bestOf, resultType/reason and ISO `completedAt`. Use unique positive `revision` and `recordedAt`. For Undo, use `actionLog[*].matchBackupId` and `undoPayload:{type:"revert_match",matchId:OLD_BACKUP_MATCH_ID}`; create match/player remap context via the eventual clone. Use **invented test records only**, no real production exports. Fixture baseline must be a *validator-valid* V3 document before mutations, or negatives may test unrelated constraints.

**Source reproducibility caution:** the existing helper fixture directly inserts completed match rows; query real generated result history after setup before creating a "strict" baseline. Do not assume trigger inserted rows. For source-only pure-validator fixtures, explicitly insert the synthetic history objects into `resultHistory` with a correct completedAt pair (without mutating shared DB).

| Fixture | Synthetic mutation | Expected if D1–D6 approve strict profile | Legacy expectation |
|---|---|---|---|
| **B2-P01** | Completed match + equal newest history tuple; older revision differs legitimately | Accept; latest `MAX(revision)` parity | Existing valid positive unaffected |
| **B2-N01** | Latest history changes score/winner/result type/reason/players/round/matchNumber/bestOf/completedAt one at a time | Reject strict **before clone**, no root or children | Report diagnostic unless D2 authorizes old-format reject |
| **B2-N02** | Completed match, `resultHistory:[]` | Owner D2 strict reject or defined exception | Old valid sparse V3 preserved per D1 decision |
| **B2-P02** | Match DB CAS revision differs from latest result-history revision (when portable source field exists) | Preserve explicit D3 mapping, never compare counters directly | Do not add new implied revision rule |
| **B2-N03** | Outer match ID valid but Undo `matchId` missing, points to other/unknown match; recognized nested player ID missing | Strict preclone 400 or typed D5-approved handling, no accidental remap collision | Existing legal unknown payload retained/degraded per D4/D5 |
| **B2-P03** | Completion action has matching outer+inner match ID and recognized player IDs, clone assigns new numeric IDs | Remapped payload points to **new match/player IDs**, then A70 revert/Undo works | Valid legacy payload stays compatible |
| **B2-N04** | Two active completion actions for same match, or equal createdAt without total-order token | D4 approved uniqueness/tie-break rule applied deterministically | Never invent old action ordering |
| **B2-L01** | `actionLog:[]` with otherwise legal V3 | Strict allowed/degraded only per D4 | Valid **typed** V3 empty action log imports as before |
| **B2-L02** | Log entry with `undoPayload:null` or unknown legacy object | Strict typed mode per D4; don't assume `canUndo` means a valid payload | Existing legal null/unknown cases stay importable unless owner changes |
| **B2-L03** | **Omitted** `actionLog` JSON property on schema V3 versus V2 document | V3 shape validation outcome documented; not misclassified as optional | Decide old-producer compatibility D1; separate V2 importer untouched |
| **B2-N05** | Duplicate/nonpositive history revision, foreign outer match ID | Existing preclone validators continue to reject | Existing fail-closed invariants unchanged |
| **B2-RB01** | Forced late throw inside clone transaction after root/stages insert, on owned disposable schema | No committed clone rows in tournament, stage, match, history, action, QP/OP/route | Same transaction integrity |
| **B2-P04** | Strict V3 export/import/export + A70 direct revert with supported active completion action | Match/history/action referential parity after new ID mapping, no spurious `HISTORY_INCONSISTENT` | Normal legal old round trip continues |

**A50 test plan / isolation conditions:** Execute B1 and B3A **separately on their exact SHA**; never create a WEB-005 composite branch. Verify Node22, pnpm10, frozen workspace deps, supported TypeScript `@workspace/api-server` typecheck. The repo script is `pnpm --filter @workspace/api-server run typecheck`; focused integration test is `pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts`. **Do not execute integration tests** before A50 validates a physically separate approved PostgreSQL16 test database; the test bootstrap calls `DROP SCHEMA IF EXISTS "<schema>" CASCADE` and migrations. Require `TEST_DATABASE_URL` test-only (no DATABASE_URL fallback), `TEST_DATABASE_SCHEMA=tm_test_*` and `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` in an approved isolated environment. Never print credentials; record redacted isolation proof, checkout SHA, commands, Node/pnpm/PG versions, exit codes, TAP totals, B1 clone row counts and B3A both snapshot cohorts. **These commands have NOT been executed by A90.**

**A60 acceptance specification:** Independently source-review on **exact unchanged HEAD** #41/#48, confirm no internal helper uses a second transaction for B3A, review test typecheck and B1 fail-closed paths, assess legacy sparse data and no fake PASS. For future B2 strict PR only after D1–D6, review each fixture and migration/portable ID contract. Without external test logs, status never advances to `RUNTIME_VERIFIED`.

## 7. Integration collision and closure

PR41 and PR48 both modify **`artifacts/api-server/src/application/backups/backup-v3.ts`** and the **same** `stage-basket-route-execution.integration.test.ts` (different additions). They are independent release-based drafts, neither contains the other. A future B2 file may overlap these. **A00 documents conflicts**; SWARM-006 alone may reconcile after **one final formal WEB005_FINAL_CLOSEOUT**, not in R14. A90 must not preintegrate, rebase or declare acceptance of their combination.

**Owner handoff table:**

| Owner | Specific next action / unblocker |
|---|---|
| **A00 + HQ** | Decide `POLICY-BACKUP/B2-PORTABLE-HISTORY` D1–D6; document version and legacy treatment; only then optionally grant a bounded B2 code GO in a future wave |
| **A50** | Produce physical disposable PG16 proof and actual per-SHA B1 positive+12 negatives+late rollback, B3A 2-connection isolation barriers and supplemental history fixture; upload exit/TAP and state evidence |
| **A60** | Independent exact-SHA review and signed `SOURCE_ACCEPTED/FAIL` per PR, correlate only real A50 runs, explicitly cover legacy acceptance and nested Undo ID semantics |
| **A20** | Check 0028 match state revision migration, 0001–0028 ledger/trigger truth and applicable history triggers, no SQL implementation assumed |
| **A70** | Determine source of valid completion action and `revert_match` payload, global LIFO with equal timestamps, restore-compatible public Direct Revert assumptions |
| **A10** | Track P08/P15 and any future B2 as internal dependencies; **no interim SWARM-006** |

**Safe fallback until decision:** no change to accepted V3 import policy, diagnostic design only. Do **not** certify that restored Undo is safe solely because old records import; this runtime guarantee remains unresolved.

**FINAL R14 A90 state:** `SOURCE-ONLY DELIVERED` when handoff verified; B1/B3A `PATCH_PROPOSED` (PG16/A60 not evidenced); B2 `POLICY_OPEN`; `NOT_EXECUTED` by A90 for runtime/typecheck. **RELEASE_NO_GO; MERGE/DEPLOY/SWARM-006 STOP.**
