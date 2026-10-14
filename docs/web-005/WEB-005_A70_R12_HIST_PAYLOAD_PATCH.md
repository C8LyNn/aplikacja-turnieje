# WEB-005 A70 R12 — T040 Historical Undo Payload Fail-Closed

AGENT: A70 — Match Lifecycle & Undo
TASK: WEB-005-T040-A70-HIST-PARSE-R12
WAVE: R12.1 / 2026-10-14 Europe/Warsaw
MODE: GO NARROW SOURCE-CODE ONLY / TEST-FIRST
BASE: release/tournament-ops-20261013-01, SHA 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7
BRANCH: fix/web-005/t040-hist-parse-r12
LAST CODE COMMIT: f560b1330b496c709783f7dae75416e4cc3adca2
PR: see draft PR opened for this branch. Final HEAD will include this documentation commit.
MERGE/DEPLOY/SQL/REPLIT/SWARM-006: NOT AUTHORIZED

## Source gap / exact patch

Baseline POST /tournaments/:id/undo-last called JSON.parse on lastAction.undoPayload before try/catch, and JSON.parse on lockedAction.undoPayload inside the transaction. Persisted malformed JSON could escape through an uncontrolled exception; HTTP 500 is STATIC_INFERRED, not runtime-confirmed.

Actual edits:
1. artifacts/api-server/src/routes/tournaments.ts: introduced parseHistoricalUndoPayload with try/catch, actionType-to-payload.type allowlist, object/null/array/primitive rejection, safe numeric validation, known legacy field shapes and explicit 409 UNDO_ACTION_CHANGED on invalid persisted history. The newest malformed action is NOT skipped/deleted/marked undone.
2. Prelock and postlock parsing are both safe; postlock checks action identity (actionType, raw payload, matchId) before any state mutation. For generic Undo, match targets, current/previous featured match targets are verified to belong to the request tournament before Undo updates, preventing foreign match_game_picks writes.
3. artifacts/api-server/test/revert-match.integration.test.ts: 17 new test definitions for malformed JSON/object/unknown action, wrong/missing/foreign match IDs, no write to affected tables or other tournaments, preserving older valid history, and valid legacy status/completion Undo.
4. This report.

Do not confuse this narrow malformed-history fix with MP2A global LIFO (PR #42) or MP2B strict direct Revert CAS. No application changes to those branches, OpenAPI, Host, generated clients, revert-match.ts, or migrations. Existing Undo operation switch and roster/completion use cases preserved.

## Test-first commit record

- 7e30a80dfda1b2695c2f0d0136319857e8f10e59: initial negative tests, before production patch
- 3695f76b8612129b3433abadd483ecd857dac784: minimal history parser/tenant guard
- 911b7ab7dd9177bbf24cb344d7822061c5f54d77: additional foreign featured ID negative test
- f560b1330b496c709783f7dae75416e4cc3adca2: TypeScript unknown-to-number narrowing

Tests defined: 11 table-driven invalid payload shapes + 6 focused tests (malformed newest vs older valid; foreign match target; action/payload mismatch; foreign featured target; valid status Undo; valid completion Undo). Each 409 negative asserts zero-write using full snapshots of tournaments, matches, action_log, result_history, players, tournament_stages, match_game_picks; foreign-target cases also snapshot the other tournament.

Actual tests EXECUTED: static source predicates only, 12/12 conditions present on the patch (NOT application typecheck). PostgreSQL/HTTP/Node test suite: NOT_EXECUTED. No exit code, TAP, or database evidence. The environment has Node 22, but not a checked-out workspace with pnpm dependencies or an approved isolated PostgreSQL16 database.

## A50 execution handoff — required independent isolated environment

Preflight physical dedicated disposable PostgreSQL16, dedicated test URL (database name contains test; no production/shared DB), Node22/pnpm10 checkout at exact PR HEAD. Set TEST_DATABASE_URL securely in the test process, do not publish credentials; TEST_DATABASE_SCHEMA=tm_test_t040_r12_hist; TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA. Safe runner uses NODE_TEST_CONTEXT.

Commands:
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts

Capture checkout full SHA, command exit codes, TAP passed/failed/skipped counts and database fingerprint without secrets. Assert existing legal Undo tests as well as new negative scenarios; no positive pass claim without execution.

## A60 QA contract and open risks

Independently inspect exact PR head, test-first commit order, parser structural validation and committed SQL snapshots. In particular, latest malformed action should give HTTP 409 UNDO_ACTION_CHANGED rather than 500 or a rollback of a prior valid action; foreign match payload must never mutate match_game_picks. Confirm valid result-history and roster Undo remain legal.

Known limitations: structural parsing is NOT a full historical state-transition CAS or a remediation workflow for corrupt history; these require a separately approved subsequent scope. Read-model canUndo still checks only nonempty payload and may advertise corrupt history as undoable — unchanged, report to A00 if policy is needed. Global LIFO remains on separate draft PR42; direct Revert strict CAS remains POLICY_OPEN. No SQL migrations.

## Ownership and integration sequencing

R12 A70 owns only generic Undo hunks of routes/tournaments.ts and the Undo tests. PR39/PR42/PR44/PR46 also edit routes/tournaments.ts on independent branches; integration must be sequenced later by authorized integration owner (SWARM-006, only after WEB-005 formal handoff). Do not merge/cherry-pick now. A100 routes/auth.ts ownership respected. A80 revert-match.ts not changed.

## Rollback / GO-STOP

Rollback: do not merge draft, or close/discard isolated branch; no production/schema/state rollback needed. After separate authorized integration, revert only this small diff through reviewed Git changes, not SQL.

STATUS: PATCH_PROPOSED / source-only static check. PG16 RUNTIME_VERIFIED = NOT_EXECUTED. Independent A60 QA = PENDING. MERGE/DEPLOY = NOT AUTHORIZED.
NEXT: A50/A60 validate pinned PR head and send exact-SHA verdict to A00.