# WEB-005 — A80 / DEVELOPMENT_FIRST_HANDOFF

**Agent:** A80 — Stage Lifecycle & Sporting Rules
**Date:** 2026-10-18 Europe/Warsaw
**Priority:** HIGH / parallel feature development independent of destructive PG16
**Status:** `SOURCE_PATCH_PUBLISHED / OFFLINE_ALGORITHM_MODEL_CHECK / TARGET_NATIVE_TEST_NOT_EXECUTED / A60_INDEPENDENT_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`

## Task chosen and evidence

From current [PR #57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) and [PR #61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61), previous [A60 independent PR57 review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md) and [PR61 review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR61_A80_SOURCE_QA.md), selected the highest-priority independently executable A80 source-quality issue: **avoidable rematches in the >16 Swiss S3 bounded fallback**. A60 explicitly requested adversarial 18/32/64 checks; current >16 path was source-accepted only conditionally. Terminal Swiss TS-B, stage completion and PG16 caller execution are separate blocked lanes requiring orchestration/PG16, not this task.

**Observed root cause in PR57:** the fallback sets `FALLBACK_SWAP_PASSES = 4`, but a labelled `break outer` exits the entire pair search after ONE improving exchange per pass. At 32/64 players it may therefore leave independent score-neutral rematch repairs unused. This is a source-confirmed control-flow limitation, not a PG runtime claim.

## Actual publication — isolated test-first Draft PR

- **[Draft PR #102](https://github.com/C8LyNn/aplikacja-turnieje/pull/102)**, head `fix/web-005/a80-development-first-swiss-fallback`, exact HEAD **b2bbfd2bac32c81f2876138bf53273e61eccac0b**.
- **Parent:** PR57 unmodified HEAD **a57fe31c1bc123c5217b3f58bcdd34750c64c5c6** at `fix/web-005/t051-swiss-pairing-policy-r22`; direct independent sibling to PR61 (which touches a different, PG-dependent test file). PR57 itself is an unmerged draft based on release commit **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**. This is a stacked candidate, not a protected/release merge.
- **Commit 1 test-first:** `3deadb79286cb8b8d231eec648f027c2b662119d`. Added **artifacts/api-server/test/swiss-fallback-adversarial.test.ts**; Git blob **17f4377f4fe74c8dca19617b379db8b9262cc66b** (115 lines).
- **Commit 2 source fix:** `b2bbfd2bac32c81f2876138bf53273e61eccac0b`. Modified **artifacts/api-server/src/domain/tournament/swiss.ts**; Git blob **d6a93a2b13887f7a85c289f532acb8ecc98dfd11** (7 insertions / 5 deletions relative to PR57).
- **Verified Git compare:** 2 commits ahead / 0 behind PR57, exactly the two files above. No packages, migrations, API routes, schema, scoring, game source/assets/HTML, lockfile or other agent changes.

**Change:** preserve lexicographic first objective (sum absolute matchWins gaps) and second objective (count of historical opponents); preserve stable rank/seed/ID order and exactly the same <=16 optimal bitmask DP path. The >16 fallback still starts from deterministic score-first greedy pairing and still stops after at most **FOUR bounded sweeps**, but may improve multiple independent pair slots per sweep, each slot at most one improvement per pass. A candidate swap must strictly decrease (scoreGap, rematchCount). Work remains bounded O(4 × pairCount²), without any claim of global optimum. BYE min-count and S4-H completed walkover/no_contest/cancelled logic untouched.

## Tests and execution truth

### Model check completed (not native application tests)

A deterministic off-repository model of the **old one-improvement-per-pass** and **new complete bounded-sweep** control flow used the same adversarial score-group fixture implemented in the new source test (completed `played`/`walkover`/`no_contest`; cancelled excluded). Results:

| Entrants | Old gap/repeats | New gap/repeats | Unique IDs (new) |
|---:|---|---|---:|
| 18 | 0 / 0 | 0 / 0 | 18 |
| 32 | 0 / 4 | 0 / 0 | 32 |
| 64 | 0 / 12 | 0 / 0 | 64 |

These are actual deterministic offline **model checks**, not evidence that TypeScript source was executed. In the checked fixtures, all repaired repeated pairings are score-gap-neutral; no duplicate entrants. New authored Node tests cover 18/32/64 deterministic reversed input, exact no-rematch expectation, no duplicate players, zero gap, prior historical statuses, plus 65-player min-count BYE. Source test was committed before the code modification.

### Native application execution

- **A80 connected full checkout / installed pnpm workspace:** unavailable. **Node/tsx native Swiss unit TAP:** NOT_EXECUTED. **Workspace typecheck:** NOT_EXECUTED. **Physical PG16:** NOT_REQUIRED for this pure fallback unit path, but also NOT_EXECUTED; no DB mutation.
- Future native test from `artifacts/api-server`: `node --import tsx --test --test-concurrency=1 ./test/swiss-fallback-adversarial.test.ts` (plus existing `./test/swiss.test.ts`). Root workspace: `pnpm --filter @workspace/api-server typecheck`. A50 or an independently authorized executor must capture real process exits and TAP at **PR102 HEAD**.
- **Automatic GitHub Actions** [run 39125558132](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125558132) on exact PR102 SHA: `correction-qa` FAILED at inherited **Pack19 snapshot matcher** (expected `readOnly:true`, source uses `accessMode:"read only"`); later steps skipped. The Swiss fallback test was NOT shown executing. This workflow is NOT Swiss feature FAIL/PASS; separate Pack19 candidate PR35 must not be silently merged for A80.

## Independent QA, conflict DAG, API/security constraints

**A60 exact-SHA QA requested for PR102** (not self-certification): verify all test fixtures genuinely encode independent score-neutral repairs, new bounded multi-sweep loop/loop labels and tie determinism, <=16 parity, 18/32/64 and 65 regressions, limits and worst-case stability. An issue found by independent QA needs separately scoped source fix. Release GO is not implied by source acceptance.

**A10/A40 integration map:** release -> PR57 -> **PR102**. Existing PR61 is a sibling child of PR57 (test-only, PostgreSQL integration). When composing C02, A10/A40 should include PR57 source once, then compare PR102 `swiss.ts` **relative to PR57**; do not overwrite or count Swiss source twice. PR61 test file is disjoint but still requires an authorized disposable PG16 before execution. R23D Issue #75 C02 inclusion and Issue #77 independent QA/registry belong to A40/A10/A60; A80 does not execute those agents or resolve their conflicting files.

**No changes to public API**, Swiss lifecycle, stage filtering, TS-B terminal reopen, S2 actionableRound, DE S5/S6, result accounting/Buchholz, Backup, Basket CAS, migrations or games. The user-requested DEVELOPMENT FIRST source work was completed without waiting for R23H authorization, and without defeating the PG safety gate.

**Rollback:** discard the disposable PR102/branch or revert only its two isolated commits. PR57/PR61 remain unchanged; no database/state migration to roll back.

**Final:** `DEVELOPMENT_FIRST_HANDOFF_PUBLISHED / PR102_DRAFT / MODEL_CHECK_PASS_SCOPED / NATIVE_TEST_NOT_EXECUTED / A60_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.