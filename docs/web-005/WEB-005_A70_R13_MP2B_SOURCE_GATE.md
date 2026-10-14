# WEB-005 A70 R13 — PR51 Independent QA Handoff and MP2B Source Gate

**Agent / task:** A70 — Match Lifecycle & Undo / WEB-005-T040-A70-R13  
**Wave:** R13.1, 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE-ONLY / QA HANDOFF / OWNER POLICY; **NO CODE GO**  
**Coordinator:** WEB-005 A00 / one global HQ-Queen (separate project)  
**Baseline:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**Task source:** docs/web-005/WEB-005_WAVE_R13_AGENT_PROMPTS.md on chore/web-005/t000-wave1-control  
**Status:** SOURCE_CONFIRMED / PATCH_PROPOSED / RUNTIME NOT VERIFIED / POLICY OPEN / RELEASE NO-GO

## 1. Actual GitHub state pinned on R13

| Dependency | SHA | State | Changed scope |
|---|---|---|---|
| PR #39 — Cancel/Restore MP1 | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT | routes/tournaments.ts, tests, API schema/Zod |
| PR #42 — Global Undo LIFO MP2A | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT | routes/tournaments.ts, revert integration tests |
| **PR #51 — Historical Undo parser** | **2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a** | **OPEN DRAFT, FROZEN** | routes/tournaments.ts, revert integration tests, two reports |
| PR #41 — Backup V3 B1 | e847cb705296a48ab5c68ece96776cd0e0bbb417 | OPEN DRAFT | backups/backup-v3.ts plus integrity helper/test |
| PR #48 — Backup V3 B3A | 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3 | OPEN DRAFT | backups/backup-v3.ts plus route-execution test |
| PR #27 — historical reference only | 8e5a6e1fc613a0afacca22ac21bf86a38899e034 | OPEN DRAFT, PR7 stacked | historical Undo parser/reference; not cherry-picked |

All these refs target their own branches; there is no composite SHA and no integration on release/main. PR #51 compare to release: six commits, **six ahead / zero behind**, four files (93 lines added/4 deleted Undo route, 126 added integration test lines, two reports). PR #39, PR #42 and PR #51 all edit routes/tournaments.ts and require future authorized merge sequencing; also PR #44/#46 overlap that file. PR #42 and #51 both extend the existing revert-match.integration.test.ts.

**Runtime/independent QA:** PR #51 branch GitHub Actions query returned zero runs; list of formal PR51 GitHub review submissions returned zero. This does not rule out externally saved A60 reports. With no independently verified test result on pinned SHA, do not call the patch SOURCE_ACCEPTED or RUNTIME_VERIFIED.

## 2. PR #51 actual source controls — source-only verification

The POST /tournaments/:id/undo-last route no longer calls unchecked JSON.parse on stored payload at its own prelock/postlock sites; it instead calls parseHistoricalUndoPayload. Parser uses JSON.parse inside a try/catch and an actionType→payload.type allowlist. Null, arrays, primitives, empty/unknown shape, missing/wrong match identifier and mismatched action/payload type are rejected using the existing RevertMatchError("UNDO_ACTION_CHANGED"), mapped to 409. The postlock path checks actionType/raw payload/matchId equality and generic Undo tournament ownership before running its existing status/BO/featured/cancel/swap cases. A malformed most-recent action is rejected, not bypassed to a previous valid action. The result-completion and roster services are called using existing routes, not rewritten.

**Actual R13 verification command:** GitHub connector read of exact PR #51 source and integration test, plus in-process static predicate checks: **13/13 SOURCE predicates present**. Count of new test definitions: **11 table-driven + 6 individually named = 17**. This is not a native build, Node test runner, database test, or independent QA sign-off.

**Limitations:** structural parser does not prove stale-but-well-formed history CAS or global LIFO (PR42 addresses the latter separately). Reader mapActionLog.canUndo can still claim a nonempty malformed payload is undoable; this is only a conservative read-model issue, not repaired here. PR #51 does not alter public Direct Revert request CAS or Backup V3 semantics.

## 3. A50/A60 — exact 17-case PostgreSQL HTTP test targets

All cases below are authored as test definitions in PR #51 at HEAD 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a. The source contains assertions, **not executed PASS evidence**.

| Case | Test target | Expected HTTP / invariant |
|---|---|---|
| H01 | truncated JSON | 409 UNDO_ACTION_CHANGED; no writes, no uncontrolled 500 |
| H02 | persisted JSON null | 409, zero-write |
| H03 | JSON array instead of object | 409, zero-write |
| H04 | JSON primitive string | 409, zero-write |
| H05 | empty JSON object | 409, zero-write |
| H06 | unknown payload.type for declared action | 409, zero-write |
| H07 | actionType/payload.type mismatch | 409, zero-write |
| H08 | missing match ID | 409, zero-write |
| H09 | string match ID, no numeric coercion | 409, zero-write |
| H10 | invalid previous status shape (array) | 409, zero-write |
| H11 | unknown persisted actionType with undoPayload | 409, zero-write |
| H12 | newer malformed Undo row above earlier valid action | 409; older action remains pending, no skip |
| H13 | match ID from a foreign tournament | 409; neither tournament mutated |
| H14 | payload.matchId differs from action_log.match_id | 409, zero-write |
| H15 | featured-match old ID from a foreign tournament | 409; both tenants unchanged |
| H16 | valid legacy match_started Undo | 200; match returns pending; original action undone once |
| H17 | valid completion Undo | 200; result_history retains immutable history and completion is undone |

**What A50 must verify independently (not by trusting test source):**
- Every 4xx snapshot before/after of tournaments, matches, action_log, result_history, players, tournament_stages, match_game_picks; foreign-target test snapshots both tournaments. Also consider stage_participants, correction receipts and downstream slots when those tables are populated.
- H12 select latest by created_at DESC/id DESC, no hidden fallback to older action; action_log isUndone unchanged, no new revert event.
- H13 and H15 must not write foreign match_game_picks via ID-only predicates.
- H16/H17 protect valid legacy history, authorization and existing Revert behavior.
- Node22 + pinned pnpm10 and lockfile, exact checkout SHA, PostgreSQL16 dedicated disposable DB, isolated test-only TEST_DATABASE_URL (name contains test and no prod), TEST_DATABASE_SCHEMA=tm_test_t040_r13_hist, explicit TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA, and test runner NODE_TEST_CONTEXT.
- No use of shared DB, production credentials, real user backup data, paid Actions/manual CI rerun or fake placeholder target.

**Suggested A50 commands AFTER safety preflight (NOT EXECUTED by A70):**
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Capture two shell exit codes, TAP totals/pass/fail/skip, file or artifact proof, exact HEAD and safe DB/schema fingerprint. If any runner aborts during schema reset or times out waiting on locks, mark FAIL/BLOCKED honestly, not PASS.

**A60 independent QA:**
1. Review exactly PR51 HEAD and diff; check scope/test-first ordering and parser admission/legacy backward compatibility, especially match_restored, match_cancelled, match_featured and swap histories.
2. Check structurally valid but unsafe historical payloads are not misrepresented as fully protected by this patch; classify additional concerns by SOURCE_CONFIRMED/STATIC_INFERRED.
3. Confirm actual HTTP 409 and no committed writes from A50 exact-SHA evidence, test H12 no-skip, tenant isolation and legal Undo H16/H17.
4. Review independent PR42 HEAD under global LIFO and PR39 MP1 separately; tests on one branch do not certify the other.
5. Produce SOURCE_ACCEPTED or FAIL and RUNTIME_VERIFIED only with separately attached exact-SHA evidence. No automatic go for merge or deployment.

## 4. MP2B public Direct Revert CAS — design refreshed, code forbidden R13

**SOURCE_CONFIRMED gap:** Release POST /matches/:id/revert authenticates and calls revertMatch without parsing or forwarding body preconditions; its domain use case already supports optional expectedMatchRevision and expectedCompletionActionId under its transaction and guards against old revisions/actions when supplied. Public OpenAPI lacks a requestBody, generated Zod lacks RevertMatchBody, generated React client calls revertMatch(id, options?) without mutation data; Host calls revertMatch.mutate({id:matchId}) without CAS. Tournament action-log GET reads only latest 50 actions; a completed match's active completion action cannot be discovered robustly by that endpoint alone.

**Proposed future strict request, subject to explicit A00/HQ policy:**
~~~json
{"expectedMatchRevision": 7, "expectedCompletionActionId": 1234}
~~~
Both required positive safe integers on public Direct Revert. Missing/malformed/null/array/decimal/negative/string/unsafe integer -> controlled **422 INVALID_REVERT_PRECONDITION** and zero writes. Stale revision -> **409 CONCURRENT_MODIFICATION**; stale or wrong completion ID -> **409 UNDO_ACTION_CHANGED**; two simultaneous identical requests -> at most one successful Undo, loser 409. ABA result A completed→reverted→result B completed must reject stale A even if match is again completed. Do not automatically refetch and retry against newly learned revision or completion ID without renewed operator confirmation.

**Keep internal domain semantics:** controlled-correction caller with expectedStageVersionVector and correction receipt must not be silently broken by public-route strictness; no new SQL/migration assumed.

**Policy decisions still needed (DO NOT IMPLEMENT):**
- Choose external field name expectedMatchRevision versus expectedRevision; avoid aliases with ambiguous semantics.
- Choose strict old-Host/browser-tab rollout: old client currently sends an empty revert body, so coordinated frontend/generated-client/API deployment or explicit version-gating is necessary; indefinite optional preconditions defeat request CAS.
- Choose where/how authorized Host reads activeCompletionActionId, including privacy, old completion history >50 actions and correlation with match revision.
- Agree stable machine-readable 422 error for invalid new request and exact 409 precedence if both supplied tokens are stale.
- Approve MP3 OpenAPI → backend Zod → React client generator → Host confirmation flow and independent HTTP+RTL tests as a separately authorized future code lane.

**Minimum MP2B acceptance matrix for future GO:** valid played/walkover/no_contest; missing fields/malformed shape; revision 0/decimal/string/unsafe; stale revision; stale action; ABA; concurrent identical POST; wrong tournament/actor; stage qualification/downstream blocked; correction receipt unchanged; completion older than latest-50 log window; legacy browser tab after strict cutover. Every rejected case requires before/after SQL snapshots and no mutation.

**GO threshold for one narrow future patch:** A00/HQ explicitly approves wire naming, old-Host rollout and completion-ID read model; A50/A60 source/runtime verdicts on PR39/42/51 are recorded; conflict owner for routes/tournaments.ts and related Host/OpenAPI files is assigned. Code patch only after new task + GO. This R13 document is NOT code authorization.

## 5. Strict boundary: Undo action payload vs result_history provenance vs Backup V3 B2

- **A70/T040 PR51:** validates persisted action_log.undoPayload syntax/family/match targeting only for the Undo endpoint. It does not validate portable export/import of match result-history records or restore lineage.
- **A80/T050:** domain revert-match.ts validates live match/result_history relationship during match reversal, and controls status/round/qualification; keep its sporting correction rules separate from parsing action-log text.
- **A90/T060 B2:** owns Backup V3 portable match revision/history, imported result_history match/stage provenance, legacy compatibility and cross-file restore integrity policy. PR41/PR48 are separate Backup V3 source patches; both modify backups/backup-v3.ts, not PR51 Undo parser. A70 does NOT patch result_history, Backup V3 serializer/deserializer, or specify new B2 acceptance semantics.

**Recommended A70→A90 boundary handoff:** For a malformed imported result_history row whose matchBackupId/stageBackupId references conflict with the restored match, diagnose and gate at Backup V3 validation/restore (A90 B2, A60 review), not by adding a special case to Undo's JSON parser. History rows cannot be silently reassigned or fabricated to make Undo succeed. This is ownership guidance, not a confirmed new runtime incident, not new code and not a B2 policy decision.

## 6. Conflict and release gating

**Overlapping frozen source:** PR39 / PR42 / PR51 share routes/tournaments.ts; PR42 / PR51 share revert-match.integration.test.ts; A100 PR44 / PR46 also edit tournaments route. A00 records file conflicts, integration is reserved for future SWARM-006 after full WEB-005 closeout and owner/HQ final GO. No composite branch, merge, rebase or cherry-pick in A70 R13.

**A70 current actions:** GitHub reads, exact SHA checks, 13 source predicate checks and docs; zero application source commits, zero SQL/test runtime, no CI reruns. **No A70 code GO for R13.**

**Next one small authorized patch, conditional not promised:** Once owner signs MP2B wire/rollout/read-model policy AND A50/A60 accept existing candidate SHA(s), A00 may authorize a narrow test-first *public Direct Revert request validation + forwarding* patch from an approved source baseline, with client contract rollout separately gated. Until then, only QA evidence is warranted.

**Release:** NO-GO. **SWARM-006:** HOLD, do not dispatch before formal project-wide final handoff.