# WEB-005 / A70 / R18 — PR42 global roster Undo LIFO source correction

**TASK:** WEB-005-T040-A70-MP2A-ROSTER-R18  
**WAVE:** R18.1 / 2026-10-14 / Europe/Warsaw  
**OWNER:** A70 — Match Lifecycle & Undo  
**AUTHORIZATION:** R18 explicit small L1 GO: own existing PR42 branch only; tournament-roster.ts, narrow routes/tournaments.ts mapping and prior revert-match.integration.test.ts; no merge/SQL/MP2B/other PR changes.  
**REPO:** C8LyNn/aplikacja-turnieje  
**BASE RELEASE:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/42 — OPEN DRAFT, unmerged.  
**R17 before SHA:** 25b09f1a48a85ae882b817118f5d8c23bffbe383  
**R18 after SHA:** **021bed269f9ea8ac8ce53caeea44263c098aa2dd** (final source code HEAD at report publication)  
**STATUS:** PATCH_REVISED / SOURCE_CONFIRMED IMPLEMENTATION / A60 EXACT-SHA QA PENDING / PG16 NOT_EXECUTED / RELEASE_NO_GO.

## 1. Independent R17 evidence and prior issue

A60 R17 independent source audit: [WEB-005_A60_R17_INDEPENDENT_QA.md](./agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) P09/#42 @ 25b09f1a48a85ae882b817118f5d8c23bffbe383 = SOURCE_BLOCKED: only test-first roster cases, but application/players/tournament-roster.ts did not perform tournament-wide latest undoable action selection. Generic restore_status and revert_match already used locked global LIFO. R17 report: [A70_R17_HANDOFF](./agent-reports/A70/WEB-005_A70_R17_HANDOFF.md) describes why roster service file was originally outside R16 source scope. R18.1 §0.5 + agent A70 explicitly expanded ownership and is the first authorization for this narrow roster service fix.

A50 R17 receipt: [WEB-005_A50_R17_RECEIPT.md](./agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) confirms 0 real native API/PG16/RTL application tests and no physically approved disposable PG16 access. Do not infer runtime PASS.

## 2. Actual R18 changes — exactly two files

| Path | R18 diff compared with before SHA | Detail |
|---|---|---|
| artifacts/api-server/src/application/players/tournament-roster.ts | +21 / -1 | in undoTournamentRosterAction, after lockDraftTournament and candidate action FOR UPDATE, query globally newest eligible Undo across same tournament in SAME db.transaction; compare id; reject with typed UNDO_ACTION_CHANGED BEFORE mutations; add desc/sql and error code/message |
| artifacts/api-server/src/routes/tournaments.ts | +1 / -1 | map newly defined TournamentRosterError UNDO_ACTION_CHANGED to existing stable HTTP 409 rather than default 422 |
| artifacts/api-server/test/revert-match.integration.test.ts | unchanged in R18; R17 blob retained | four test-first definitions for roster delete/restore queued race + positive controls; no new test file or changed fixture |

**Implementation commits:**
- d39a0c7ef7e32d8554a7d41c4fb33fb9c725b410 — roster service same-tx guarded latest action
- 021bed269f9ea8ac8ce53caeea44263c098aa2dd — mapped stale roster Undo to HTTP 409

**Verified Git blob SHA:**
- tournament-roster.ts: b47bc6e1452173fbc65b236909efe01aebf76116
- routes/tournaments.ts: 6d9608104700bd0619754e362bc30d5af053bd0b
- revert-match.integration.test.ts: 3479ab5fe888416858346f82691d4c57f369df25 (unchanged R18)

No application code was changed in PR39/44/46/51; PR42 route change is limited to roster error mapping. The original MP2A recheck and transaction path for revert_match and generic Undo remain intact. No Direct Revert MP2B strict CAS, OpenAPI, generated clients, new policy, migration, deployment or cherry-pick.

## 3. Lock order, consistency, 409, zero-write

After POST /tournaments/:id/undo-last preselects the older candidate, roster Undo executes in its EXISTING service transaction:
1. db.transaction begins; lockDraftTournament(tx, tournamentId, actor) locks tournament row FOR UPDATE and revalidates actor/draft constraints.
2. It locks the selected roster action row FOR UPDATE; refuses absent/previously undone/non-undoable candidate.
3. Before JSON parsing and any player/action-log writes, SELECT latest {id} action_log WHERE tournament_id = same tournament, is_undone=false and undo_payload IS NOT NULL, ORDER BY created_at DESC,id DESC LIMIT 1 using **the same tx**.
4. If latest id != originally selected action id, throw TournamentRosterError("UNDO_ACTION_CHANGED"). Existing db.transaction rolls back; sendTournamentRosterError maps to 409 with JSON code UNDO_ACTION_CHANGED. No player/log mutations have occurred.
5. If id matches, execute original delete_player or restore_player branch unchanged; actor, name uniqueness, draft status, player row lock and final is_undone mutation retain existing semantics.

The tournament lock serializes compliant tournament writers; the candidate action row lock and latest-action query are in matching order to the existing MP2A generic path. There is **no route-only lock/release TOCTOU and no new nested transaction**. Historical action_log entries are not repaired or skipped. An older X queued while B owns tournament lock cannot bypass Y after Y commits a more recent undoable row; no claim of safety for external writers that fail to follow the same locking protocol.

**Expected HTTP:** stale X -> 409 UNDO_ACTION_CHANGED and zero committed X-originated writes; committed Y remains eligible to Undo; valid latest delete_player/restore_player -> HTTP 200 exactly once.

## 4. Four existing R17 test-first definitions (not executed)

The existing test file @ blob 3479ab5fe888416858346f82691d4c57f369df25 defines:
- queued stale delete_player X, newer roster Y committed while X blocked at PostgreSQL tournament row lock; expected 409, unchanged post-Y full SQL state, Y still latest Undo, followed by positive Y Undo;
- same deterministic interleaving for restore_player;
- valid latest delete_player Undo 200 once; second Undo does not duplicate;
- valid latest restore_player Undo 200 once with previous name restored; second Undo does not duplicate.

The X/Y barrier uses PostgreSQL pg_blocking_pids, not sleep timing as its correctness oracle. Snapshot inside B transaction before COMMIT and after X resolution includes tournaments, players, action_log, matches, result_history, tournament_stages, stage_participants and match_game_picks. This provides **source-authored test assertions**; until an isolated PG16 run happens, it is not an actual observed response/rollback.

**R18 source verification performed:** GitHub fetch of exact changed blobs, compare_commits(old R17 SHA, R18 SHA) showing two code files; **10/10 static source predicates true** covering lock order, one transaction, global candidate filter/sort, before-write typed rejection, existing 409 mapping and test preservation. This is an author-level static check, NOT native typecheck or independent A60 verdict.

## 5. Actual test run / A50 runner requirements

**Native pnpm/typecheck/HTTP/PG16 tests executed by A70:** **NOT_EXECUTED** — no complete repo checkout, frozen dependency install or owner-approved physically isolated disposable PostgreSQL16 database in this agent environment. Real command exit codes, TAP totals and DB snapshots do not exist. GitHub commit-linked Actions on new HEAD: 0 found at initial check; formal submitted PR42 reviews: 0.

**A50 must first independently verify:** owner-approved disposable PG16 test-only URL with database name containing test (not prod/shared), schema tm_test_t040_r18_roster, explicit TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA consent and identity, no DATABASE_URL fallback, Node22/pnpm10 locked checkout at **021bed269f9ea8ac8ce53caeea44263c098aa2dd**, and valid isolated test runner. Do not log secrets or delete any shared schema.

Target commands AFTER safety preflight (these were not run by A70):
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Capture full git HEAD, CLI exit codes, TAP total/pass/fail/skip, PG version, test DB/schema fingerprint (no credentials), completed 409/200 HTTP responses and before/after snapshots. Verify original generic Undo and revert_match tests as well as roster. If unavailable, report BLOCKED/NOT_EXECUTED, do not invent PASS.

## 6. A60 exact SHA review, conflicts, stop

**A60 review requested on NEW R18 SHA** (not R17 blocked verdict). Validate lock order, no nested transaction, draft-role restrictions, error semantics, invalid original roster payload compatibility, no-write under real PG16, positive Undo, and unchanged generic/revert_match. A60 may mark SOURCE_ACCEPTED, SOURCE_ACCEPTED_CONDITIONAL or SOURCE_BLOCKED only after independent review; A70 does not self-certify. New SHA and this report handed to A00/A50/A60.

**Known future integration conflicts:** routes/tournaments.ts has independent edits on PR39/42/44/46/51, and revert-match.integration.test.ts overlaps PR51. There is no composite branch, no authorized merge/cherry-pick; SWARM-006 can handle them only after separate full project closeout, owner/HQ FINAL_HANDOFF_GO, and explicit decision for any runtime debt. No approval for native test debt waiver in this A70 report.

**STATUS:** PATCH_REVISED, SOURCE_CONFIRMED atomic roster check, NATIVE_TESTS_NOT_EXECUTED, INDEPENDENT_QA_PENDING, RELEASE_NO_GO, SWARM006_HOLD.