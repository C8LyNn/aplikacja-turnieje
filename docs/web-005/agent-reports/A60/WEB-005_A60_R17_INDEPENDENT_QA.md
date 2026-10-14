# WEB-005 — A60 Independent QA R17

**TASK:** `WEB-005-T130-A60-R17` | **ROLE:** A60 Independent QA & Release Gates | **PARENT:** A00 | **MODE:** STRICT READ-ONLY for application code, documentation publication only.  
**DATE:** 2026-10-14 Europe/Warsaw. **CONTROL:** `docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md` Git blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`.  
**RELEASE BASE:** `release/tournament-ops-20261013-01` HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**FINAL:** `R16_ARTIFACTS_UNAVAILABLE / 21 PR OPEN DRAFT / P08 P09 P20 SOURCE_BLOCKED / P21 SOURCE_ONLY BLOCKED / APP_RUNTIME_0_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. R16 reconstruction: no original A60 R16 artifact available

This A60 thread contains R15 work followed by the R17 instruction; no independent A60 R16 task execution, original report or output is present. Exact searches for `WEB-005_A60_R16_HANDOFF.md`, `WEB-005_A60_R16_INDEPENDENT_QA.md`, and `WEB-005_A60_R16_PACKAGE_MATRIX.json` found no original source in accessible conversation/library. GitHub central `docs/web-005/agent-reports/A60/` has no R16 original. Therefore **R16_ARTIFACTS_UNAVAILABLE**, not a retrospective `PATCH_COMPLETE` and not an invented R16 result. Actual R15 evidence is preserved at [A60 original R15 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) and [A60 signed R15 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_PACKAGE_MATRIX.json).

At the first R17 readback the three R16 carryover PRs retained their R15 HEADs. They later received **new R17 commits during this A60 audit**. Section 2 records before/after SHA and independent verdicts. This is not evidence of an original A60 R16 artifact.

## 2. Reconciled live R17 GitHub HEADs / 21-row matrix

**This section supersedes the initial R17 pre-patch snapshot.** Agents A90/A70/A100 pushed R17 test-first and application commits *during the A60 audit*. The historical R16 recovery remains `R16_ARTIFACTS_UNAVAILABLE` because these are **R17**, not original R16 deliverables.

All 21 PR #34–54 remain OPEN DRAFT/unmerged on release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Complete pinned HEADs and evidence: [A60 R17 21-row machine matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json).

| Package / PR | R15/early R17 HEAD | Latest independently inspected R17 HEAD | SOURCE verdict |
|---|---|---|---|
| **P08 [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41)** | `e847cb705296a48ab5c68ece96776cd0e0bbb417` | **`f03cf3d09988a04ba9c2856e205d21f994ff67f1`** | **SOURCE_ACCEPTED_CONDITIONAL** for QP/QPE/OP position parity; PG16 runtime NOT_EXECUTED |
| **P09 [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42)** | `1ae0ccb801f4177052bff1ec7041e55b8c992c8b` | **`25b09f1a48a85ae882b817118f5d8c23bffbe383`** | **SOURCE_BLOCKED**: authored roster LIFO tests but global recheck absent in latest production |
| **P20 [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53)** | `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` | **`8f959733258aed0cab15298dd0684ca068045e6f`** | **SOURCE_ACCEPTED narrow** for tuple bans and proven match ownership; **SOURCE_BLOCKED full privacy** for unknown-owner picks |
| **P21 [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54)** | unchanged | **`dbba0eb82920b4f324866b1b983e1211459f52ec`** | **SOURCE_BLOCKED_UI_SCOPE**; A120 source-only oracle |

Seventeen prior scoped/conditional/offline source verdicts from R15 carry forward on identical commits. R17 gains one newly conditionally accepted source patch (P08), while **three package full-claims P09/P20/P21 remain SOURCE_BLOCKED**. No complete source+runtime QA acceptance and no composite SHA.

## 3. P08 / PR #41 — source position parity newly patched

**HEAD:** `f03cf3d09988a04ba9c2856e205d21f994ff67f1`; `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` Git blob **`a8482fa7137f1d71817c8b4ec43da7d6292f8183`**.

**Independent source acceptance (conditional):** QPE positions are checked for contiguous 1-based order within each output basket sorted by placement rank (around lines 58–79); route receipt `sourceBasketPosition` is compared against the matching approved QPE basket/player/final rank (around 153–184). `undefined` is rejected, but explicit `null` remains legal for the existing writer's export behavior. This addresses the reported narrow parity gap without arbitrarily redefining legacy `null` policy.

The updated `stage-basket-route-execution.integration.test.ts` defines valid legacy-null and explicit non-null cases, malformed QPE position swap/gap/missing field and receipt position swap/mismatch/zero/missing scenarios; checks `400 INVALID_BACKUP_V3` and unchanged clone-root count. The tests are **authored, NOT_EXECUTED** on physical PG16. An induced late transactional rollback and child-table counts remain separate acceptance gates, and Backup B2 historical policy stays OPEN. **Verdict:** `SOURCE_ACCEPTED_CONDITIONAL / RUNTIME_NOT_EXECUTED / QA_NOT_ACCEPTED_FULL`.

## 4. P09 / PR #42 — roster Undo global latest still absent

**HEAD:** `25b09f1a48a85ae882b817118f5d8c23bffbe383`. Newly authored test source `artifacts/api-server/test/revert-match.integration.test.ts` defines deterministic queued X / newer committed Y for both roster undo action types with `pg_blocking_pids` and positive lawful Undo cases. No app PG16 execution has been verified.

**Independent blocking finding:** `artifacts/api-server/src/application/players/tournament-roster.ts` at this HEAD has no `latestUndoable` tournament-global selection in `undoTournamentRosterAction` after `lockDraftTournament`; it only selects the previously chosen action by its `actionId` with `FOR UPDATE` then mutates player/log. `src/routes/tournaments.ts` still dispatches `delete_player/restore_player` to this separate function, bypassing the generic `lockLatestUndoableAction` guard. A temporary R17 commit with global latest recheck was subsequently undone in the final inspected HEAD. No new source acceptance follows from test definitions alone.

**A70 required next source:** restore the global most recent undoable-action recheck under the same tournament lock/tx before any write; keep stale X 409 `UNDO_ACTION_CHANGED` zero-write, Y remains undoable and valid latest Undo succeeds. Test on authorized disposable PG16. **Verdict:** `SOURCE_BLOCKED_GLOBAL_LIFO / RUNTIME_NOT_EXECUTED`.

## 5. P20 / PR #53 — noncanonical cache patch, partial privacy acceptance

**HEAD:** `8f959733258aed0cab15298dd0684ca068045e6f`; `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob **`626d31eb5b82d38c171f091f07990e00069de4ad`**.

**SOURCE_ACCEPTED narrow:** the query matcher now recognizes `["tournaments", id, "player-bans"]` with exact tournament ID, as well as canonical `/api/tournaments/:id` prefix. For `["matches", matchId, "game-picks"]` it gets the cached `getListMatchesQueryKey(tournamentId)` list and checks each record's `tournamentId` before evicting only IDs owned by A; 401/403 match-only errors similarly resolve ownership only when a trusted cached list is present. The server's GET tournament matches maps `...m`, including `tournamentId`, so a legitimate list can supply this identity; numeric matchId equality is not presumed. `use-tournament-auth.test.tsx` now wraps `AuthProvider` in `QueryClientProvider`, resolving the source fixture mismatch. Six S2B negative tests were authored; no targeted React execution receipt is available.

**Residual SOURCE_BLOCKED full privacy:** where no trusted `getListMatchesQueryKey(tid)` entry is present, a standalone previously fetched game-picks key cannot be attributed to the tournament and is **left cached** after logout/revocation; the authored 'unknown ownership' test explicitly asserts it stays. This is a potential retention of privileged cached data, not proven browser disclosure. A30/owner must decide a privacy-preserving attribution method at fetch-time or an explicitly bounded alternative that never purges public B; do not accept `FULL_PRIVACY` or use global query clear without owner approval. Also test late nonabortable A responses and active observers.

**Verdict:** `SOURCE_ACCEPTED_CONDITIONAL_KNOWN_OWNER_ONLY / SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER / RUNTIME_NOT_EXECUTED`.

## 6. P21 / PR #54 — mixed RR403/DE remains source-only

**HEAD:** `dbba0eb82920b4f324866b1b983e1211459f52ec`; `artifacts/tournament-manager/src/pages/tournament-detail.tsx` blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`. Any historical RR stage detail 401/403 detected by `RoundRobinReadbackBridge` (around line 163) suppresses the entire `TournamentDetail` tab tree wrapped around 963–1855, including otherwise lawful DE/Overview, not just denied private RR records.

A120 R15 [source-only acceptance oracle](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R15_T100_ACCEPTANCE.md) requires keeping lawful DE/Overview visible, hiding RR secrets and allowing 200 retry/N→N+1 without unrelated poll storms. No R17 PR54 code GO, no independent RTL/browser PASS. **Verdict:** `SOURCE_BLOCKED_UI_SCOPE / RUNTIME_NOT_EXECUTED`.

## 7. Execution / CI / provenance

**R17 A60 actual test command:** `NOT_EXECUTED`; this wave performed GitHub API source/blob/PR/CI/doc readbacks and documentation publication only. A50 [R15 physical executor blocker](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) records **0 native application tests** owing to no full checkout/pnpm/disposable PG16. No newer exact-SHA A50 application TAP receipt is verified here. Prior A60 PR40 pure Node contract 24/24 exit0 was scoped only and is **not** a Pack17 full/API/PG application PASS.

GitHub Actions: [PR41 run 38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598), [PR53 run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795), [PR54 run 38606249912](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606249912) failed on **earlier Pack19 baseline contract**, not their target tests; PR42 has no matching exact-head Actions run. PR35 has the isolated Pack19 matcher fix, not integrated. Do not infer domain FAIL or PASS from these CI states.

A50 runtime unblocker: a trusted owner-provided disposable PC/VM with separate clean per-PR checkout, Node22/pnpm10, frozen dependencies and explicit test GO; for API integration also physically isolated PG16 dedicated test DB, `TEST_DATABASE_URL`, schema `tm_test_*`, documented narrowly approved reset scope. No fallback to shared/prod DB.

WEB-004 R2 history remains **immutable 38 cases = 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT RUN**. Product owner/HQ must still sign T055 Basket CAS, Swiss terminal, SE currentRound, Swiss rematch/BYE, DE ranking, Backup B2 portability/revisions/legacy, Direct Revert CAS+Host, Steam missing-secret and auth TTL/digest/rotation. These are POLICY_OPEN, not A60 decisions.


**R17 primary agent receipt reconciliation (read after A60 draft):** [A50 actual R17 execution receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) confirms Node/Git preflight only and **0 native application RTL/API/PG16 tests**; it precedes the live PR41/42/53 amendments, so no domain PASS is implied. [A70 R17 handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A70/WEB-005_A70_R17_HANDOFF.md) confirms PR42 is intentionally **test-only** and that `tournament-roster.ts` is *outside* the original R16 A70 file ownership; A00/HQ must give **new explicit file-scope GO** before restoring the missing LIFO guard. [A100 R17 source result](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A100/WEB-005_A100_R17_PR53_S2B_RESULT.md) explicitly declares unknown-owner standalone picks as remaining outside scoped eviction; [A120 R17 oracle](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R17_PR54_TEST_ORACLE.md) details mixed RR/DE 403 tests; neither is runtime PASS.

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

**FINAL:** `WEB-005-T130-A60-R17 — REPORT_PUBLISHED / R16_ARTIFACTS_UNAVAILABLE / THREE_CARRYOVER_PRS_REVISED / P08_SOURCE_ACCEPTED_CONDITIONAL / P09_P20_P21_SOURCE_BLOCKED / APP_RUNTIME_0_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.
