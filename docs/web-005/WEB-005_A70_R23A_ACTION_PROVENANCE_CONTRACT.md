# WEB-005 — A70 R23A / Match action provenance and action-local Undo closure

**Task:** `WEB-005-T040-A70-R23A-ACTION-PROVENANCE` · **Role:** A70 Match Lifecycle & Undo  
**Date:** 2026-10-15 (Europe/Warsaw) · **Mode:** DOMAIN CONTRACT / READ-ONLY  
**Verdict:** **DOMAIN_CONTRACT_READY** (**NOT** BACKUP_B2_IMPLEMENTED; **NOT** QA_PASS).  
**Source base:** release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; PR #56 strict-only isolated HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321` (OPEN DRAFT, UNMERGED; code untouched by A70).  
**Companion rules:** [WEB-005_A70_R23A_ACTION_PROVENANCE_RULES.json](./WEB-005_A70_R23A_ACTION_PROVENANCE_RULES.json).  
**Boundaries:** no code edit, PR56 edit, DB/import integration, source merge, physical SQL, stage/deploy or SWARM-006. R23A authors a *semantic contract*, not a validator patch.

## 0. Evidence ledger — confirmed source vs proposed strict obligations

| Source on exact SHA | Git blob | Authoritative relevant facts |
|---|---|---|
| [`complete-match.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/matches/complete-match.ts) | `fa77dc80c1250766ed73db605f985abc7b2fa591` | L110–171 played/walkover/NC normalization; L310–397 match completion, immutable history sequence, typed `match_result_submitted` plus `{type:"revert_match",matchId}` in one tx |
| [`revert-match.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/matches/revert-match.ts) | `0cb16ad0d82da754bac0553a946a3513db70e1ee` | L100–170 BYE explicitly blocked, historic result parity; L182–189 `completionLogMatches`; L455–496 exactly one active manual completion, optional revision/action guard; L677–695 marks completion undone and appends nonundoable revert audit |
| [`stage-lifecycle.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-lifecycle.ts) | `e344fd4198e081a3a4574d976829665bea71fb6a` | L1324–1336 system BYE inserts completed match history and nonundoable `system_bye_assigned`; L789–796 nonundoable `stage_completed` audit |
| [`routes/tournaments.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts) | `6767e7ac6c4d43cf39faa8a61534bdb92b898e14` | L1534–1571 and L1730–1765 alternative BYE writers; L1311–1340 featured-match `restore_featured`; L2160–2210 eligibility; L2251–2440 Undo-last; L2530–2870 status, BO, cancel/swap Undo shapes |
| [`tournaments.ts` DB schema](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/db/src/schema/tournaments.ts) | `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8` | L813–956 result shape and tournament/stage player FK; L959–1040 history and action foreign keys; `matches.revision` distinct from `result_history.revision` |
| [`backup-v3.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/backups/backup-v3.ts) | `78d86246302fc8840696fd14c05c840304bc9f97` | L67–122 recognized Undo types/keys and dangerous `sourceMap.get(value) ?? value` remap fallback; L545–559 export action IDs OMITTED; L1614–1625 action match/stage checks only; L2237–2257 import remaps actions |
| [PR56 strict validator](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts) | `595c68b87a5361623bef6293519ed668e9d4e493` | L199–283 P23-01 corrected system BYE; L232–281 manual provenance; L287–321 recognized Undo IDs checked for **global backup membership**, not action-local scope |
| [PR56 tests](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/test/backup-v3-strict-policy.test.ts) | `d1242b84c9b2db269ab6864459d8d11656d4fe8c` | L217–347 positive/negative P23-01 BYE fixture declarations; tests are **authored, not independently executed by A70** |
| [Owner B1–B6](./WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md) | `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a` | Strict modern + safe legal V2/V3, history and provenance completeness, portable CAS revision, strict nested ID rejection, late rollback |
| [A30 R22 security peer](./agent-reports/A30/WEB-005_A30_R22_BACKUP_SECURITY_PEER.md) | `382729027013a2e73fc92fcf314dfaefdff42014` | Marker untrusted, Zod stripping risk, foreign ID fallback risk, stage/action-local mismatch threat |
| [A20 R22 DB gate](./agent-reports/A20/WEB-005_A20_R22_T055_B3_DB_GATE.md) | `06d769047dad6e521316825fced61b8c77af008d` | Match state revision trigger/migration 0028 and clone-local CAS identity; no migration or actual DB test authorization |

**Confidence notation:** `SOURCE_CONFIRMED` = actual repo writer/reader behavior; `STRICT_REQUIRED` = semantics to implement/test in future producer/validator/importer; `LEGACY_DEGRADED` = historical compatibility safety policy; `NOT_EXECUTED` = no app runtime evidence. PR56 is an isolated pure module **NOT_WIRED** to export/import/HTTP and must not be mistaken for an integrated fix.

## 1. Canonical entities, identity domains and temporal state

A source *tournament* owns source *stages*, *players*, *matches*, *result_history* rows and *action_log* rows. Every `match.stageId` belongs to that tournament; each nonnull match `player1Id/player2Id/winnerId` belongs to the same tournament **and to that stage's membership**. Its winner is one of its participants. A history row is tied to **that exact match/tournament/stage**, with immutable participant/result snapshot; `resultHistory.revision` is a per-match historical outcome ordinal, **not** the live CAS `matches.revision`. A history row may persist after an Undo, while the match is now pending — do **not** demand last-history parity with a pending current match.

An action owns one `tournamentId`, optionally one `stageId` and/or `matchId`, its `actionType`, source action identity, `isUndone`, optional `undoPayload`, and stable position in the portable total order. A nonnull action match requires the **same tournament and stage**, but matchless tournament-level actions are lawful (`match_featured` may have current match; `match_unfeatured` and `stage_completed` may have `matchId=null`). The actual V3 export omits original action ID and sorts mainly by timestamp; modern strict requires explicit portable `actionOrder`/identity preserving authoritative original `createdAt DESC,id DESC` Undo LIFO — **identical timestamps must not make a random winner**.

**Current active manual completion** means exactly one un-undone action with `actionType=match_result_submitted`, this exact match, `undoPayload.type=revert_match`, `undoPayload.matchId=action.matchId`, nonnull Undo payload, and a typed `completionActions` link to that match's latest result-history event. Older manually completed results may retain history and their now-undone action; zero *active* manual completions is legal for a pending reverted match or completed **system BYE**, NOT for a current strict played/walkover/no_contest result.

**SOURCE CAVEAT:** current DB `action_log` does not store a direct foreign key to `result_history.id/revision`; the strict portable `completionActions[sourceActionIndex,matchBackupId,historyRevision,active]` is a future producer extension. Do not invent a history-action link based just on same match ID, timestamp or position if ambiguous. Fail modern attestation when the producer cannot prove the exact association.

## 2. Valid match-result states (strict modern)

| Match lifecycle/result | Entrants / score / winner / reason | Latest history and action provenance | Undo / Direct Revert |
|---|---|---|---|
| **COMPLETED played** | Two distinct same-stage entrants, nonnull scores satisfying `bestOf`/series winner threshold, winner exactly scored side, `resultReason=null`, `completedAt` | Latest exact parity history + exactly one **active** `match_result_submitted` with `revert_match` Undo bound to this match & history | Can revert under current actor, stage/downstream/history/CAS constraints; never unconditional |
| **COMPLETED walkover** | Two distinct entrants, both scores null, winner is one of them, optional text reason, completed timestamp | Latest parity history + exactly one active **manual** completion | Same guarded Undo/Revert; don't create fake scores |
| **COMPLETED no_contest** | Two distinct entrants, both scores null, **winner=null**, optional text reason; current `completeMatch` rejects NC in SE/DE; Swiss/RR/group-stage may permit | Latest parity history + exactly one active **manual** completion | Guarded Undo/Revert; no artificial winner. Swiss standings champion may differ from match winner |
| **COMPLETED system bye** | Exactly player1 valid, player2 null, winner==player1, scores null, `resultReason=system_bye`, completed timestamp; valid generated BYE stage/round | Latest parity history + **one corresponding nonundoable** `system_bye_assigned`: correct match/stage/tournament, `undoPayload=null,isUndone=false,canUndo=false`; **zero active manual completions** | **NO manual Direct Revert or Undo-last of BYE**; do not synthesize `match_result_submitted` |
| **PENDING / noncompleted** | `resultType/resultReason/score/winner/completedAt=null`; may retain historical result_history after revert | No *active manual completion* tied to an already reverted result; older completion actions/history retained, `match_result_reverted` audit may be present | Only eligible status/swap/BO etc. as genuinely legal; cannot revert nonexistent current result |

The strict modern system-BYE contract retains **P23-01**: `system_bye_assigned` is the actual action written together with its history by `stage-lifecycle.ts` and the stage/Swiss route writers; it is **not** a second optional manual action. A forged `match_result_submitted` on the same completed BYE does **not** cure missing system provenance. For historic legal backups with incompletely captured system audit, route through separately authenticated legacy restrictions (not fabricated completion).

## 3. Typed action ⇄ Undo payload contract and action-local ID closure

**Mandatory multi-layer closure (P0):**
1. **Existence:** each recognized backup ID is well-typed and maps to a declared source entity (unless explicitly nullable).
2. **Tenant:** every referenced player, match, stage belongs to **the action's declared tournament**.
3. **Stage:** match-related `action.stageBackupId` equals **its target match's stage**; match participants/winner and historical snapshot belong to same stage membership, not merely some player in the backup.
4. **Action-local relation:** for target-match Undo, `undoPayload.matchId` must equal **`action.matchBackupId`** and match the appropriate action type/payload `type`, not another valid exported match. For manual completion, the linked `completionActions[sourceActionIndex]` must identify the **same action**, match and exact history revision.
5. **Historical meaning:** a `prev*` ID refers to the **previous state of this action at event time**, possibly different from the current state; validate with typed before/after provenance or a traceable snapshot. Reject inconsistent transitions, do not demand prior value equals current value.
6. **Clone binding:** resolve every recognized source ref through **strict source-ID→new clone-ID maps**, preserving action-local edges. Missing mapping FAILS BEFORE any clone write. Current `map.get(value) ?? value` is NOT acceptable for strict profile. Numeric coincidence with an existing database PK proves nothing.
7. **Replay safety:** source action order and active flag must remain coherent after import. On equal timestamps preserve explicit portable ordinal; global Undo uses **latest eligible un-undone payload** ordered by the canonical source order, and cannot skip a newer unprovable Undo action to mutate an older one.

### Action-specific rules (source types, not speculative action names)

| `actionType` → `undoPayload.type` | Required local relations and legitimate special cases | Strict reject / action state |
|---|---|---|
| `match_result_submitted` → `revert_match` | `action.matchBackupId` and `payload.matchId` identical, correct action stage; exact typed `completionActions` → result-history revision; current active one only when completed played/walkover/NC | Reject action point at other exported match, missing typed history link, BYE disguise, duplicate active completion, or mismatched undone/canUndo |
| `system_bye_assigned` → **null** | Same completed BYE match+stage; `undoPayload=null,isUndone=false,canUndo=false`; exactly one **current** system action for strict modern BYE | Reject wrong/duplicate/missing system action, any payload or manual completion; no synthetic Undo |
| `match_result_reverted` → **null** | Audit-only action after successful direct result Revert OR generic Undo; `matchId` may be null for featured action undo. Only a separately typed provenance edge may identify which prior action it compensates | **Do not interpret actionType alone as proof of reverted manual completion**; never make this Undo-eligible |
| `match_started`/`match_postponed`/`match_restored` → `restore_status` | Action target match = payload match; `prevStatus` legal historical noncompleted match status, with event-specific transition | Reject status payload for unrelated match; no completed result can be undone as a status-only edit |
| `match_cancelled` → `restore_cancelled_match` | Action target match = payload match; `prevStatus` and `prevNote` historical snapshot; cannot cancel completed match | Reject wrong match, impossible old status, mutation bypassing result lifecycle |
| `match_bo_changed` → `restore_best_of` | Target match = payload match, `prevBestOf` positive odd integer, historically changeable pending match | Reject wrong target/invalid BO and stale incompatible state |
| `match_players_swapped` → `restore_players_swap` | Target match = payload match; `player1Id/player2Id` are **historical pre-swap slots** from that match, each null or stage-member as lawful; when two present, distinct. Do not require either ID equals **current** slot without reconstructed transition history | Reject different-stage/player-in-other-match IDs, impossible pre-swap pair, unknown hero-pick context |
| `match_featured`/`match_unfeatured` → `restore_featured` | `prevFeaturedMatchId` **null OR prior featured match in SAME TOURNAMENT**, **not necessarily the action's match/stage**. `match_featured.action.matchId` identifies **new featured match**, `match_unfeatured.action.matchId=null` is lawful | Reject any foreign-tournament/unmapped previous ID, but **do NOT require prevFeaturedMatchId == action.matchBackupId** or same stage (valid cross-stage retarget exists) |
| `player_added` → `delete_player`; `player_edited` → `restore_player` | `payload.playerId` belongs to action's tournament; `restore_player.prevData` is typed historical snapshot. Action itself may have no match/stage | Reject another tournament/unknown player or missing required fields; global roster Undo uses tournament-wide latest action CAS after locking |
| `player_removed`, `stage_completed`, `stage_started`, unrelated telemetry → **null** | Audit-only / no generic Undo unless explicit authorized typed reversible action exists | Never infer canUndo merely from known ID/key; non-undoable `stage_completed` must not block LIFO eligibility nor become a fake completion |

**Important field semantics:** known nested keys in actual `remapUndoPayload()`: `playerId,player1Id,player2Id,winnerId,matchId,prevFeaturedMatchId`. A known **scalar** key containing an array/object must not be silently accepted: current remapper loses the key context when descending into array elements, whereas PR56 validator iterates them with key inheritance; contract requires either reject wrong shape or a proved identical remapper. Other unknown fields may be opaque **only if they are not consumed operationally**; never reinterpret arbitrary numeric diagnostics as player/match IDs. Payload `type` has an allowlist per `actionType`; an unknown operational Undo type gets `DISABLE_UNDO`/reject per strict vs legacy policy, not blind execution.

## 4. Action chronology, histories, Undo LIFO and Direct Revert

- `completeMatch` performs match reset/finalization side effects, inserts next immutable `result_history.revision`, inserts one undoable `match_result_submitted` in the **same DB transaction**. No source `result_history.id` foreign key on action row; strict exporter must prove its typed pairing.
- Direct Revert checks current match shape, latest immutable history parity, exactly one active `match_result_submitted`, current action payload match equality and optional expected match revision/action ID under a tournament+stage+match lock. It sets original completion `isUndone=true`, returns match pending, preserves history, and appends nonundoable `match_result_reverted` audit. `system_bye` is explicitly blocked.
- Generic `undo-last` chooses the newest `action_log` with `isUndone=false AND undoPayload IS NOT NULL` (`createdAt DESC,id DESC`), so nonundoable BYE/audit actions are skipped **by eligibility**. Its roster path was strengthened on PR42 with same-tx tournament-global latest recheck; PR42 remains separate DRAFT, **not merged into strict import**.
- An imported action ordinal must preserve all source-action ordering and reproduce which *eligible* action would be next; `createdAt` alone cannot prove ties. Existing V3 exports action arrays with no source action ID, so legacy cannot safely reconstruct ambiguous ties from timestamps; disable destructive Undo if action precedence/closure cannot be proven.
- Direct Revert is per-match correction, **not the same API precondition policy as future public MP2B**. The domain has optional CAS guards; public `POST /matches/:id/revert` does not yet require owner-selected external CAS tokens (RA/RB/RC remains policy-open). Do not attach new Host/public contract to this Backup task.
- When restored strict modern completion→Undo→recompletion forms multiple immutable histories/actions: each historical manual completion points to its own history revision, at most one is active for the current completed match; a pending match after revert has zero active completions. Both action/identity references and clone-local remapped revision must be correct.

## 5. Strict vs positively recognized historical legacy — fail-closed capabilities

**Strict modern profile:** require all match/history typed action + action-local closure, portable match-state CAS and total order, provenance-attested producer. Invalid stage/action/history or any dangling known ID ⇒ reject **before clone**, intended `INVALID_BACKUP_V3`; late failure ⇒ whole transaction rollback. A marker inside untrusted JSON is **not** producer authentication. PR56 current pure helper alone does not protect real import; Zod may strip unknown marker before validation. Need A30-approved raw/parsed boundary that positively identifies legitimate old producer profile without treating missing marker as trusted legacy.

**Legacy V2/V3:** old genuine historical formats may have missing action IDs/typed completion links/history/portable CAS, and must not be universally rejected or assigned made-up data. If positive legacy recognition + conventional structural/tenant checks pass and present history is noncontradictory, permit **bounded, clearly marked degraded restore** of viewable records but:
- disable Direct Revert for each affected completed match without trusted current history **and** unique matching completion action; do not synthesize a manual completion for BYE;
- disable imported global destructive Undo if a newer eligible action's identity, order, local ID closure or safe remap cannot be proven. **Do not skip unsafe top action to undo an older one**; otherwise Global LIFO becomes false;
- never issue old authority tokens: regenerate organizer/viewer/support access and clone-local CAS identity; no imported `isUndone=false` magically reinstates an unsafe operation;
- if a known ID is foreign/unmapped or **present** history contradicts match state, reject rather than reclassify corrupt data as old legal backup. Degradation is not a generic security bypass.

**Suggested capability ledger on imported clone** (requires A20 future design/GO, not current schema): `provenanceProfile={STRICT_ATTESTED|LEGACY_VERIFIED|UNATTESTED}`, `unsafeUndoDisabledReason`, per-match `directRevertAllowed`, action `undoAllowed`, `sourceActionOrdinal`, `sourceCompletionHistoryRevision`. Until durable enforcement exists in every mutation entrypoint, **do not claim restricted restore is actually safe**. An untrusted profile absent reliable legacy identification should be rejected or quarantined, not automatically imported.

## 6. Minimal test-first regression matrix (expected, NOT_EXECUTED)

| ID | Class | Test oracle / expected |
|---|---|---|
| AP01 | positive | Completed played, valid bestOf scores, winner, history parity, matching manual source index + payload `revert_match`: strict ACCEPT |
| AP02 | positive | Completed walkover with null scores and typed manual completion: ACCEPT |
| AP03 | positive | Completed no_contest in Swiss/RR/group stage with null match winner but typed manual completion: ACCEPT; NC in SE/DE: REJECT |
| AP04 / **P23-01** | positive | Valid completed BYE with one `system_bye_assigned`, null Undo, history, **zero match_result_submitted**: ACCEPT |
| AP05 | negative | BYE missing, duplicate, wrong-stage, forged undoable system action, malformed resultReason/entrant/winner/history: REJECT |
| AP06 | negative | Two exported matches A/B: action `matchBackupId=A`, payload `revert_match.matchId=B` (B is globally valid): **REJECT action-local mismatch** |
| AP07 | negative | Same tournament but different stage player injected into swap/restore local pair, or unrelated completed history revision pointed by action: REJECT |
| AP08 | positive | `restore_featured.prevFeaturedMatchId=B`, action newly features A, both matches in same tournament but **different stages**; null prev pointer also legal: ACCEPT |
| AP09 | negative | `prevFeaturedMatchId` absent in map/foreign tournament/invalid string/array, or wrong match featured target: REJECT |
| AP10 | negative | Typed scalar `undoPayload.matchId=[B]` or `playerId={...}` coerced/retained through recursive mapping: REJECT before any remap |
| AP11 | sequence | Played A → Direct Revert → played B: history revisions 1,2 immutable, prior completion undone, exactly one active B; pending after revert has zero active: ACCEPT |
| AP12 | order | Two actions share `createdAt` but have distinct authoritative portable ordinal: LIFO stable; missing/duplicate/conflicting ordinal: REJECT strict / DISABLE_UNDO legacy |
| AP13 | negative | `match_result_reverted` written by generic featured/status Undo is **not** mistaken for a match completion Revert; non-undoable audit remains safe |
| AP14 | negative | Valid source ID in another exported match/stage or target DB colliding PK, and importer fallback `map.get(id)??id`: must REJECT; zero clone rows |
| AP15 | legacy | Positively recognized legal old V3 missing completion/history: bounded restore MAY pass, affected Direct Revert and unsafe Global Undo disabled; present contradictions: REJECT |
| AP16 | integration | Strict raw marker stripped/unknown; existing Zod parser could erase marker; reject untrusted/hybrid before clone; clean old producer must go to explicitly verified legacy mode |
| AP17 | atomicity | Invalid ID before clone ⇒ typed 400 `INVALID_BACKUP_V3` / zero writes; fault after rows created ⇒ 100% rollback; actual PG16 observation needed |
| AP18 | race | Imported LIFO stale X vs newer committed Y ⇒ 409 no-write after tournament lock, no skip; verify cross-action `revert_match` and roster cases |
| AP19 | BYE direct | `Direct Revert` of system BYE returns typed `SYSTEM_BYE_REVERT_BLOCKED` 409 and zero-write; never synthesize manual completion |

**Execution reality:** A70 ran **zero** Node/TS/PG16/importer tests, so CLI exits/TAP/observed HTTP/SQL snapshots = `NOT_EXECUTED`. PR56 test declarations exist after A90 P23-01 fix, but that is not A70 verification of runtime behavior.

## 7. Exact next ownership dependencies and gates

**A90 (strict producer/validator/restore integration owner):**
1. Contract-check PR56 on pinned `a7f71a7e7efdabd479b358a3cee80bc6359c4321`; add action-local `payload.matchId === action.matchBackupId` and `type ↔ actionType` (including roster and status) beyond current global ID-set guard; correctly model BYE system actions with no manual completion.
2. Prove typed completion-to-history association, source action order with equal timestamps, null/array behavior, cross-stage membership, `prevFeaturedMatchId` tournament-scoped exception, total remap without `?? originalId`.
3. Design strict/verified-legacy ingestion and durable degraded Undo/Revert behavior with explicit separate **code GO**, not PR56 stealth edits. Modern strict error 400 and late rollback remain NOT_WIRED.

**A30 (security peer):** review untrusted marker vs authenticated producer capabilities, Zod stripping boundary, cross-tenant/cross-stage references, unsafe unknown Undo types and spoofed active/action order, raw secrets/access tokens; independent negative tests AP06–AP10/AP14–AP16.

**A20 (DB / migration safety):** verify stage-scoped FKs, `matches.revision` trigger vs history revision, PostgreSQL atomic restore/rollback and clone-local total-order/action IDs; decide whether durable provenance/capability table, audit link and legacy feature-disable persistence require new migration, collision-free migration number and explicit isolated PG16 reset permission. No SQL run or migration authorization in this report.

**A60 independent QA:** assess future exact new source SHA and test evidence, not author labels; specifically distinguish `P23_01_FIXED_IN_PURE_SOURCE` from a real import/restore PASS. **A50** may execute only on trusted full checkout and physically isolated owner-approved PG16. **A00** reserves source ownership and a separate test-first implementation GO.

**FINAL A70 R23A:** **DOMAIN_CONTRACT_READY**. Semantic rules, lineage exceptions and test obligations specified; actual strict integration, legacy security enforcement, PR56 independent QA and runtime remain separate open gates. **WEB005_IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD**.
