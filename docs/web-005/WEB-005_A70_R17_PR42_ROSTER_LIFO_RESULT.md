# WEB-005 — A70 R17 — PR #42 Roster Undo Global LIFO Test-First Result

**AGENT:** A70 — Match Lifecycle & Undo  
**TASK:** `WEB-005-T040-A70-MP2A-ROSTER-R17` (R16 carryover)  
**DATE:** 2026-10-14 Europe/Warsaw  
**TASK SOURCE:** `WEB-005_WAVE_R17_AGENT_PROMPTS.md` §0–§2 / AGENT A70, and original `WEB-005_WAVE_R16_AGENT_PROMPTS.md` AGENT A70  
**GO/STOP RESULT:** **BLOCKED_WITH_EXACT_REASON** — deterministic tests authored and published in PR #42; production fix NOT retained because required service file falls outside original exclusive R16 authorizations.  
**CANDIDATE:** [PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42), branch `fix/web-005/t040-mp2a-global-undo-lifo-r9`, remains OPEN DRAFT / UNMERGED.  
**RELEASE BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**BEFORE R17 HEAD:** `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`.  
**R17 TEST-ONLY HEAD (pre-report):** `25b09f1a48a85ae882b817118f5d8c23bffbe383`.  
**R16 evidence:** [WEB-005_A70_R16_RECOVERY_STATUS.md](./agent-reports/A70/WEB-005_A70_R16_RECOVERY_STATUS.md) — `R16_ARTIFACTS_UNAVAILABLE`.

## 1. Identified P09 blocker — authoritative R15 A60 verdict

Read A60 primary `docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md`, which classified P09 / PR42 at `1ae0ccb...` as **SOURCE_BLOCKED_GLOBAL_UNDO_LIFO**. Existing `routes/tournaments.ts` preselects a last undoable action before tournament lock; ordinary `restore_status` and completion `revert_match` have a locked transaction rechecking globally latest action. **Roster payloads** `delete_player` and `restore_player` instead call `undoTournamentRosterAction` before those guarded branches. That service starts a **separate own `db.transaction`**, locks the draft tournament with `lockDraftTournament`, locks the candidate action, and then mutates players and action_log **without globally rechecking the latest undoable action**.

Under concurrent writers X/Y: X selects roster action A, queues on tournament row, Y commits newer undoable action B, X later locks draft tournament and wrongly undoes A. Expected 409 `UNDO_ACTION_CHANGED`, zero X writes, Y and A not undone. This is SOURCE_CONFIRMED on original candidate. It is not fixed by only checking in the route before starting service after the first lock is released: TOCTOU remains; opening a second transaction while the outer transaction owns the tournament row can deadlock.

## 2. Actual R17 work — test-first and scope review

**New authored code retained in final PR42 diff:** only `artifacts/api-server/test/revert-match.integration.test.ts` (+156 lines from pinned old HEAD). Four deterministic test definitions: two `queued stale delete_player / restore_player` and two `latest valid delete_player / restore_player`. No migration or fixtures outside the app test file.

- Builds synthetic draft tournament and players with a valid older action_log `player_added → delete_player` or `player_edited → restore_player`.
- Holds the tournament `FOR UPDATE` lock in blocker B; starts HTTP Undo X; uses PostgreSQL `pg_blocking_pids` barrier to prove X actually queued, not a timer assertion.
- Within B creates and commits a newer legitimate `player_added → delete_player` action Y. Takes full expected SQL snapshots **inside B transaction before COMMIT**, avoiding accidental read/write races in the oracle.
- X is expected to return **409 / UNDO_ACTION_CHANGED**; comparison of post-X versus post-Y snapshots checks unchanged tournament, roster players, full action_log, matches, result_history, stages, stage_participants and game picks. Both actions remain not undone; a second legitimate newest-Y Undo returns 200 and removes Y's player.
- Positive latest A Undo for both kinds should return 200 exactly once (deletes the added player or restores prior name), and duplicate Undo must not succeed.
- Test execution not performed: **TEST_DEFINITIONS_AUTHORED**, **NOT_EXECUTED**, and assertions cannot be declared PASS. With the service unmodified, test-first stale-race tests are expected to expose the still-present bug when A50 runs them safely (not a confirmed runtime FAIL).

**Source commits in R17:** first test commit `1d6fa89fe4290af63c59b809306ff82d828d874b`; test HTTP Promise refinement `ab828bd8ee08423e4062d5f7b85af21a64c1b892`. During investigation intermediate changes to `tournament-roster.ts` and `routes/tournaments.ts` were committed but then **fully reverted** upon rereading original R16 exclusive file scope. Exact blob comparison confirmed end-state:
- `artifacts/api-server/src/application/players/tournament-roster.ts` = original Git blob `1a9184d92736b5c2bcca07bb0d3067a0f7b314ce`;
- `artifacts/api-server/src/routes/tournaments.ts` = original Git blob `a0473fed687932a26275f2bef14864d196ed3bb7`;
- `artifacts/api-server/test/revert-match.integration.test.ts` = revised Git blob `3479ab5fe888416858346f82691d4c57f369df25`.

**Final diff compared to old R9 PR42 HEAD:** test file only (+156 lines); no operational code additions remain, despite intermediate revert commits in history. No PR39/44/46/51 imported and no changes to public Direct Revert CAS or sporting policy.

## 3. Why production fix is on HOLD: exact authority conflict

R16 original AGENT A70 clause 4 explicitly grants exclusive source ownership only for:
1. `artifacts/api-server/src/routes/tournaments.ts`
2. `artifacts/api-server/test/revert-match.integration.test.ts`

R17 clause directs us to finish exactly **the same bounded R16 scope** without enlarging it. The correct atomic fix requires adding global latest selection **inside `undoTournamentRosterAction`'s own transaction after `lockDraftTournament` and locked candidate**, which resides at **`artifacts/api-server/src/application/players/tournament-roster.ts`** (outside the two authorized files). That service does not accept an external transaction, so wrapping it in `withTournamentMutationLock` at the route would either release the lock before its independent transaction (race remains) or retain the lock while waiting for its nested transaction (risk of deadlock). Reimplementing roster mutations directly in routes would duplicate authorization/invariants and exceed bounded scope.

**Therefore:** no safe route-only production fix and no permission for service edit. The service change attempted during exploration was explicitly reverted to obey original GO/STOP; this is NOT a silently fixed defect. This limitation was also anticipated by original R16 clause 5: **HOLD implementation if same transaction cannot be guaranteed without a larger rewrite.**

### Narrow approval request for A00/HQ — NOT AN EXISTING GO

Authorize an explicit *amendment* of the A70/P09 exclusive file window, on this **same** PR #42 only, to include:
- `artifacts/api-server/src/application/players/tournament-roster.ts`: while the **same** roster transaction already holds the tournament row and candidate action lock, reselect globally latest `action_log` row where `isUndone=false` and `undoPayload IS NOT NULL`, ordered `createdAt DESC, id DESC`; reject mismatch with a typed `UNDO_ACTION_CHANGED` before all roster writes. Preserve `revalidateTournamentMutationActor`, `ROSTER_LOCKED`, name uniqueness, draft status, actor role and positive Undo.
- `artifacts/api-server/src/routes/tournaments.ts`: map this *specific* `TournamentRosterError` code to HTTP 409 without affecting other roster errors; no new endpoint or API schema.
- `artifacts/api-server/test/revert-match.integration.test.ts`: use the already-authored four deterministic tests, plus any A60 defect-driven correction.
- Explicitly reserve these file hunks against concurrent other agents, retain PR #42 ownership and source QA independence. Do not combine PR #51 malformed JSON or public Direct Revert MP2B.

After an A00/HQ **new explicit narrow file-scope GO** only, a safe final test-first implementation can be made on PR42. This request itself is not permission.

## 4. Runtime, exact SHA QA and evidence

**A50 actual R15 original receipt:** `docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md` reports NO full app checkout/pnpm or physically verified isolated PG16 and **zero actual application tests**. R17 A70 did not run native typecheck or any HTTP/PG query and does not provide exit/TAP/DB receipts.

If A00/A20/A50 provision an authorized disposable physical PG16 (dedicated test-only `TEST_DATABASE_URL`, database name includes `test`, `TEST_DATABASE_SCHEMA=tm_test_t040_r17_roster`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` explicitly authorized, Node22/pnpm10 locked checkout at actual PR42 SHA, no prod/shared secrets), targeted commands:
```sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
```
**EXPECTED test-first:** currently code is missing roster LIFO, so two negative queued-X/newer-Y cases should reveal a 200/incorrect state against expected 409. This is an **expectation**, not measured failure. The positive newest roster cases and original status/revert cases remain source definitions, not executed passes.

**A60 independent QA:** current A60 R15 verdict was on OLD `1ae0ccb...`, not current test-only head. A60 must review new exact PR42 SHA and scope, and can mark test source conditional but NOT accept the roster LIFO fix absent authorized service amendment. No A70 self-review.

**R17 actual tests:** connector-level static/source checks for barrier, both kinds, test expected snapshot and restored original production blob = observed; native `pnpm` typecheck/Node integration/PG16 = **NOT_EXECUTED**. No CI manual runs, no SQL DDL or shared DB reset.

## 5. Decisions and handoff

| Dimension | Final state |
|---|---|
| R16 previous work | **R16_ARTIFACTS_UNAVAILABLE**, not represented as patched |
| R17 test-first code | **PATCH_REVISED_TESTS_ONLY**, on existing PR42 |
| R17 production roster fix | **BLOCKED_WITH_EXACT_REASON**, original file authorization excludes roster service |
| P09 full global LIFO | **SOURCE_BLOCKED** until same-transaction roster service check and independent review |
| A50 real PG16 test | **NOT_EXECUTED** |
| A60 current exact-SHA QA | **PENDING** |
| MP2B public Direct Revert policy, PR39/44/46/51 | Untouched |
| Merge/CI rerun/SQL/deploy/SWARM-006 | **HARD STOP**, release NO-GO |

**ONE ACTION TO A00:** either authorize the narrowly expanded P09 file scope in `tournament-roster.ts` and route HTTP 409 mapper on the *existing* PR42 with written GO and exclusive ownership, or formally record P09 as blocked/exception. Supply trusted A50 executor/PG16 and request independent A60 exact-SHA review; do not promote the test-only current head to a fixed global Undo package.
