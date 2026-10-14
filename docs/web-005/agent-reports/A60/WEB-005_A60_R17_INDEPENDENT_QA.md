# WEB-005 — A60 Independent QA R17

**TASK:** `WEB-005-T130-A60-R17` | **ROLE:** A60 Independent QA & Release Gates | **PARENT:** A00 | **MODE:** STRICT READ-ONLY for application code, documentation publication only.  
**DATE:** 2026-10-14 Europe/Warsaw. **CONTROL:** `docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md` Git blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`.  
**RELEASE BASE:** `release/tournament-ops-20261013-01` HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**FINAL:** `R16_ARTIFACTS_UNAVAILABLE / 21 PR OPEN DRAFT / P08 P09 P20 SOURCE_BLOCKED / P21 SOURCE_ONLY BLOCKED / APP_RUNTIME_0_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. R16 reconstruction: no original A60 R16 artifact available

This A60 thread contains R15 work followed by the R17 instruction; no independent A60 R16 task execution, original report or output is present. Exact searches for `WEB-005_A60_R16_HANDOFF.md`, `WEB-005_A60_R16_INDEPENDENT_QA.md`, and `WEB-005_A60_R16_PACKAGE_MATRIX.json` found no original source in accessible conversation/library. GitHub central `docs/web-005/agent-reports/A60/` has no R16 original. Therefore **R16_ARTIFACTS_UNAVAILABLE**, not a retrospective `PATCH_COMPLETE` and not an invented R16 result. Actual R15 evidence is preserved at [A60 original R15 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) and [A60 signed R15 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_PACKAGE_MATRIX.json).

Crucially, the three conditional R16 code lanes **never changed the GitHub HEAD in the R17 readback**: #41 `e847cb705296a48ab5c68ece96776cd0e0bbb417`; #42 `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`; #53 `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`. No patch can be source accepted without an actual diff and changed HEAD.

## 2. Current 21-row independent SHA matrix

[WEB-005_A60_R17_PACKAGE_MATRIX.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) records all 21 open, draft, unmerged source PRs #34–54 on their exact GitHub HEADs/base and independent evidence. All 17 previously scoped/conditional/offline source acceptances were carried forward **only because the HEAD did not change**; no full QA acceptance is implied. Four full-claim source blockers remain **P08, P09, P20, P21**. New PR count beyond #54 is zero in the recorded check. No integrated/composite SHA.

## 3. P08 / PR41 — backup QP/QPE/OP integrity

**SHA:** `e847cb705296a48ab5c68ece96776cd0e0bbb417`. **SOURCE_BLOCKED_FULL_PARITY**.  
**Source:** `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` Git blob `cfe3d87bbb412e6878c872ffc003b7583fb53b57`; receipt/arrival match key at line 144 uses `playerBackupId + ":" + sourceFinalRank`. The full `sourceBasketPosition` equivalence across approved QP/QPE/OP/output receipts remains unproven and not implemented for the failure path. Positive legal V3/legacy and corrupted-position preclone 400/zero-write tests have no actual isolated PG16 execution receipt.

**A90/L1 test-first requirement:** verify valid proposal/output/route bijection, consistent legal legacy import and routes; alter only source basket position with otherwise matching rank/player/route; fail closed with typed 400, no tournament clone, no root/child rows; prove rollback on induced transactional failure; preserve prior imported data. One new commit to **existing** #41 branch and evidence of exact new SHA are required before A60 re-review.

## 4. P09 / PR42 — global LIFO includes roster Undo

**SHA:** `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`. **SOURCE_BLOCKED_GLOBAL_LIFO**.  
**Source:** `artifacts/api-server/src/routes/tournaments.ts` Git blob `a0473fed687932a26275f2bef14864d196ed3bb7`. In `undo-last`, the `delete_player` and `restore_player` dispatch at lines ~2339–2350 calls `undoTournamentRosterAction`; unlike the other Undo branches it does not perform a tournament-global `lockLatestUndoableAction` selection under the shared transaction/lock.

**A70/L2 test-first requirement:** deterministic X waits for tournament lock, Y writes newer undoable action, then X acquires lock and re-reads latest immutable action/revision: expected controlled 409 and **zero X writes** to player/match/stage/action-log/history; Y is preserved and may be lawfully undone next. Positive latest roster add/edit Undo remains atomic; unrelated tournament isolation and exception rollback hold. Same tournament lock/tx and no source scope outside #42.

## 5. P20 / PR53 — private cache and missing QueryClientProvider fixture

**SHA:** `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`. **SOURCE_BLOCKED_FULL_PRIVACY**, although canonical URL-prefixed query eviction is source accepted only for that narrow scope.

- `src/lib/tournament-query-invalidation.ts` under `artifacts/tournament-manager`, blob `1d4365963192646dd918675a65f4496913f2873f`, lines 45–78 recognizes only `/api/tournaments/:id` URL query keys.
- Actual `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts`, blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`, creates and uses `["tournaments", tournamentId, "player-bans"]` (lines 35/49) and `["matches", matchId, "game-picks"]` (38/96). They are outside that URL predicate. Match ownership must be mapped to tournament explicitly; global cache clear would corrupt unrelated public B isolation.
- `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx`, blob `2b1f7433b478de5dbb60459a9460055079d8b9b1`, lines 16–18 mounts `AuthProvider` without `QueryClientProvider`. New PR53 `AuthProvider` blob `8916545544d55fc8d7fbd146d0328e36543bebb7` unconditionally calls `useQueryClient()`. **Fixture mismatch is SOURCE_CONFIRMED; actual runtime FAIL/observed data leak is NOT established.**

**A100/L3 test-first requirement:** verify logout/token rotation and denied 401/403 evict actual A tuple bans and A-owned match picks as well as canonical keys, including pending late A response and enabled observers; prove unrelated public B cached data survive; map matchId→tournamentId without numeric assumption or global purge; fix legacy AuthProvider test fixture. Need native Node22/pnpm10 RTL/typecheck exact HEAD and owner-specific authorization. Old HEAD cannot be accepted as R16 patch.

## 6. P21 / PR54 — mixed historical RR403 / current DE or Overview

**SHA:** `dbba0eb82920b4f324866b1b983e1211459f52ec`. **SOURCE_ACCEPTED_NARROW_RR_REFRESH / SOURCE_BLOCKED_UI_SCOPE**.  
**Source:** `artifacts/tournament-manager/src/pages/tournament-detail.tsx`, blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`. `RoundRobinReadbackBridge` checks all RR stage query errors with `rrStageIds.some` at line 163 and replaces the entire tab tree after any 401/403 at line 182, while wrapping all `TournamentDetail` tabs at lines 963–1855.

**A120 source-only oracle (no R17 code GO):** current lawful DE/Overview remains visible when an unrelated historical RR stage returns 403; only the denied private RR data are hidden, retry 200 restores current RR details, old deferred N cannot overwrite N+1, unchanged/non-RR poll does not cause refetch storm. Prior source-only [A120 acceptance contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R15_T100_ACCEPTANCE.md). No real browser or RTL execution was evidenced for PR54; no new PR54 code is authorized in R17.

## 7. Execution / CI / provenance

**R17 A60 actual test command:** `NOT_EXECUTED`; this wave performed GitHub API source/blob/PR/CI/doc readbacks and documentation publication only. A50 [R15 physical executor blocker](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) records **0 native application tests** owing to no full checkout/pnpm/disposable PG16. No newer exact-SHA A50 application TAP receipt is verified here. Prior A60 PR40 pure Node contract 24/24 exit0 was scoped only and is **not** a Pack17 full/API/PG application PASS.

GitHub Actions: [PR41 run 38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598), [PR53 run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795), [PR54 run 38606249912](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606249912) failed on **earlier Pack19 baseline contract**, not their target tests; PR42 has no matching exact-head Actions run. PR35 has the isolated Pack19 matcher fix, not integrated. Do not infer domain FAIL or PASS from these CI states.

A50 runtime unblocker: a trusted owner-provided disposable PC/VM with separate clean per-PR checkout, Node22/pnpm10, frozen dependencies and explicit test GO; for API integration also physically isolated PG16 dedicated test DB, `TEST_DATABASE_URL`, schema `tm_test_*`, documented narrowly approved reset scope. No fallback to shared/prod DB.

WEB-004 R2 history remains **immutable 38 cases = 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT RUN**. Product owner/HQ must still sign T055 Basket CAS, Swiss terminal, SE currentRound, Swiss rematch/BYE, DE ranking, Backup B2 portability/revisions/legacy, Direct Revert CAS+Host, Steam missing-secret and auth TTL/digest/rotation. These are POLICY_OPEN, not A60 decisions.

## 8. Ranked A00 handoff

| Priority | Owner | Exact next step | A60 decision |
|---|---|---|---|
| P0 | A90 / PR41 | Publish approved L1 test-first correction to old #41 head; preclone parity/zero-write | SOURCE_BLOCKED until new SHA |
| P0 | A70 / PR42 | Publish approved L2 roster Undo global last-action recheck under tx lock with deterministic tests | SOURCE_BLOCKED until new SHA |
| P0 | A100 / PR53 | Publish approved L3 scoped private tuple-cache eviction/fixture with match attribution and A/B safety | SOURCE_BLOCKED until new SHA |
| P0 | A50 + A00 owner | Provide physical trusted executor and exact app RTL/typecheck/PG evidence | RUNTIME NOT_EXECUTED |
| P1 | A120 / PR54 | Publish **source-only** mixed RR403/DE oracle, no R17 code | SOURCE_BLOCKED_UI_SCOPE |
| P0 | A00/HQ | Close accepted WEB004 backlog findings with signed exceptions; complete product policy decisions | WEB005_IN_PROGRESS |
| P1 | A10/A00 | Preserve 21 exact-SHA dependency/conflict DAG, final-only SWARM006 handoff | HOLD |

**GO:** only A70/A90/A100 within pre-authorized R17 L1–L3 source lanes, with their own PR branches and exclusive files. **STOP:** A60 code writes, extra PR lane, any merge/cherry-pick/rebase, composite branch, unapproved SQL reset, paid CI, staging/live or interim SWARM006 handoff.

**FINAL:** `WEB-005-T130-A60-R17 — REPORT_PUBLISHED / R16_ARTIFACTS_UNAVAILABLE / THREE_CARRYOVER_PRS_UNCHANGED / FOUR_SOURCE_BLOCKERS / APP_RUNTIME_0_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.
