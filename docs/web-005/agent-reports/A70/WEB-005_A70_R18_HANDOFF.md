# WEB-005 — A70 R18 final handoff to A00

**TASK:** WEB-005-T040-A70-MP2A-ROSTER-R18  
**ROLE:** A70 — Match Lifecycle & Undo  
**WAVE:** R18.1 / 2026-10-14 Europe/Warsaw  
**AUTHORITY:** explicit narrow CODE L1 on own existing PR #42, R18 §§0–2, A70.  
**COORDINATOR:** WEB-005/A00 Implementation Lead; HQ/Queen remains global/separate.  
**REPO:** C8LyNn/aplikacja-turnieje  
**RELEASE BASE:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**PR42:** https://github.com/C8LyNn/aplikacja-turnieje/pull/42 — OPEN DRAFT, UNMERGED  
**BEFORE R18:** 25b09f1a48a85ae882b817118f5d8c23bffbe383  
**AFTER R18 CODE HEAD:** **021bed269f9ea8ac8ce53caeea44263c098aa2dd**  
**DETAILED SOURCE/QA RESULT:** [WEB-005_A70_R18_PR42_ROSTER_FIX.md](../../WEB-005_A70_R18_PR42_ROSTER_FIX.md)  
**STATUS:** PATCH_REVISED / SOURCE_CONFIRMED / A60 R18 INDEPENDENT_VERDICT_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO.

## 1. R17 exact independent QA: issue validated before source write

Primary [A60 R17 independent QA](../A60/WEB-005_A60_R17_INDEPENDENT_QA.md) pinned P09 PR42 @ 25b09f1a48a85ae882b817118f5d8c23bffbe383 as SOURCE_BLOCKED: R17 four tests existed, but roster Undo used an unguarded separate transaction and did not reselect globally latest Undo after tournament-row lock. Primary [A50 R17 receipt](../A50/WEB-005_A50_R17_RECEIPT.md) documented no real app tests (Node/Git preflight only; no full test checkout/isolated PG16). R18 **explicitly expanded** A70's file scope to tournament-roster.ts and narrow HTTP 409 map; this clears the old authorization blocker without any other scope expansion.

## 2. Exact owned source change on same PR42 (no new PR)

| File | Change from R17 HEAD | Blob |
|---|---|---|
| artifacts/api-server/src/application/players/tournament-roster.ts | +21/-1, latest tournament-wide eligible Undo ID query under lock in SAME existing roster service transaction; throw typed UNDO_ACTION_CHANGED before any player/action write | b47bc6e1452173fbc65b236909efe01aebf76116 |
| artifacts/api-server/src/routes/tournaments.ts | +1/-1, map this roster error to stable HTTP 409 | 6d9608104700bd0619754e362bc30d5af053bd0b |
| artifacts/api-server/test/revert-match.integration.test.ts | unchanged from R17; four existing deterministic roster test cases are retained, no extra test edits in R18 | 3479ab5fe888416858346f82691d4c57f369df25 |

Source commit sequence: d39a0c7ef7e32d8554a7d41c4fb33fb9c725b410 (service), 021bed269f9ea8ac8ce53caeea44263c098aa2dd (route). GitHub compare_commits R17→R18 confirmed **only two changed production code files**, 2 new commits, and no merge/base change.

Under pre-existing draft tournament + actor lock, action row is locked, then latest eligible action is queried using same tx with ORDER BY createdAt DESC,id DESC and compared to preselected action id. A newer Y causes 409 UNDO_ACTION_CHANGED with no X writes. If candidate is latest, existing delete_player/restore_player semantics run without change, including draft-only guards and actor checks. There is no nested transaction, migration, route-only TOCTOU or public Direct Revert MP2B policy change.

## 3. Test-first evidence and true runtime status

Four R17 tests at old test-file blob 3479ab5fe888416858346f82691d4c57f369df25:
- deterministic queued stale X/newer committed Y action for roster delete_player, using pg_blocking_pids barrier; HTTP 409 and post-Y SQL-state equality;
- same for restore_player;
- legitimate latest delete_player Undo 200 once, no duplicate;
- legitimate latest restore_player Undo 200 once restoring previous values, no duplicate.

Snapshots cover tournament, players, action_log, matches, result_history, tournament_stages, stage_participants and match_game_picks. R18 code is designed to satisfy the authored tests, but **NO ACTUAL native typecheck, API/HTTP, PG16 or other tests were executed by A70**. Hence no actual exit status, TAP count or DB rollback receipt; do not label the change RUNTIME_VERIFIED. Source-only 10/10 static predicates checked lock/filter/order, error map and retained tests; not independent QA.

**A50 exact-SHA execution needed** only after owner/A20-approved physically isolated disposable PG16 test-only database and reset scope, complete checkout at 021bed269f9ea8ac8ce53caeea44263c098aa2dd, Node22/pnpm10/frozen deps, TEST_DATABASE_URL test DB (no production/shared fallback), TEST_DATABASE_SCHEMA=tm_test_t040_r18_roster, explicit TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA approval, Node test runner. Commands **NOT_EXECUTED**:
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Record real exit/TAP, checked SHA and safe DB identity, actual 200/409, committed-Y / rejected-X before-after snapshots. Verify generic status and revert_match regressions, not only new roster tests. On failure report FAIL/BLOCKED, not source author PASS.

**A60:** re-review THIS EXACT NEW PR42 SHA, not its R17 SOURCE_BLOCKED old SHA; signed independent source status is pending, not self-granted. If results are SOURCE_ACCEPTED_CONDITIONAL, A00/A10 must carry remaining PG16 debt explicitly.

## 4. Ownership, conflicts, policy and release gates

- A70 touched **ONLY** existing PR42 own branch with two explicitly allowed files; the third authorized test file retained prior tests; no PR39/44/46/51 modifications, no code from other branches.
- routes/tournaments.ts shared conflict remains against PR39/44/46/51; revert-match.integration.test.ts overlaps PR51. No composite source, no merge/rebase/cherry-pick. A10 future manifest/SWARM-006 post-handoff integration handles dependency ordering.
- T040 public Direct Revert MP2B + Host old-client cutover/activeCompletionActionId remains POLICY_OPEN under A00/HQ; **not chosen and not modified**. Other T050 sporting, T055 Basket CAS, T060 B2 Backup history remain their respective owners.
- Per R18 §3, A00/HQ may approve final handoff only after source QA, backlog finding disposition, 21-packet manifest and **actual test evidence OR separate signed RUNTIME_DEBT_TO_SWARM006 authorization**; neither can be presumed from author patch.
- No SQL DDL/migrations, production/shared database, paid CI rerun, Replit, staging/live, merge/deploy, SWARM-006 dispatch or owner-waiver enacted.

## 5. One actionable next step to A00

Send **PR42 @ 021bed269f9ea8ac8ce53caeea44263c098aa2dd** plus this report to A60 for independent source QA and A50/A20 for safe actual PG16 execution or explicit test debt. Update A10 P09 manifest **only after** exact-SHA evidence, and request one final owner/HQ permission for full project handoff only when all R18 §3 gates are met. Do not report P09 independent SOURCE_ACCEPTED or RUNTIME_VERIFIED from these author artifacts alone.

**A70 R18 assigned source correction complete as PATCH_REVISED; independent QA and runtime remain pending. WEB-005 IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD.**