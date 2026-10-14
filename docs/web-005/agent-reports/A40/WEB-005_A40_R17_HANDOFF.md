# WEB-005 — A40 R17 FINAL HANDOFF

**AGENT:** A40 — Pack19/Pack17 CI Contract Recovery  
**TASK:** `WEB-005-T010-T017-A40-R17`  
**MODE:** SOURCE-ONLY / TEST GUIDANCE · **DATE:** 2026-10-14 Europe/Warsaw  
**CENTRAL TASK SOURCE:** `WEB-005_WAVE_R17_AGENT_PROMPTS.md` R17.1 Git blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`  
**STATUS:** `R17_SOURCE_WORK_COMPLETE / REPORT_PUBLISHED / RUNTIME_TESTS_NOT_EXECUTED_BY_A40 / RELEASE_NO_GO`

## 1. Direct published GitHub deliverables

- **Mandatory task deliverable:** [WEB-005_A40_R17_TEST_COMMANDS_AND_TAP_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R17_TEST_COMMANDS_AND_TAP_GATE.md)
- **Recovered R16 provenance status:** [WEB-005_A40_R16_RECOVERY_STATUS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R16_RECOVERY_STATUS.md)

**R16 status is `R16_ARTIFACTS_UNAVAILABLE`.** Original A40 R16 report `WEB-005_A40_R16_CI_READINESS.md` was not found in inspected central files, GitHub branch search, code search or PR40 comments; no prior A40 R16 command/exit/commit was independently recovered. The above recovery notice **does not masquerade as an executed R16 report**. Source-level R17 tests/docs cannot be backdated to R16.

## 2. BASE, HEAD/PR, exact evidence reviewed

**Release base:** `release/tournament-ops-20261013-01` = `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, confirmed identical to checkpoint.

| Packet / PR | HEAD SHA | State / files | Evidence |
|---|---|---|---|
| P01 #35 | `7cb283aa82273a1e22daf9051a82311eef53760c` | OPEN DRAFT unmerged; only `qa/pack19/source-contract.test.mjs` | Actual CI Pack19 8/8 scoped PASS; overall workflow FAIL downstream Pack20 |
| P02 #36 | `85ad0b86136fc3491c9ef18663d9b01396179349` | OPEN DRAFT; Pack20/21/25/26 source contract files | A60 R15 source-scoped accepted; full runtime pending |
| P07 #40 | `9a8287271299a59fc9291b8d253299a8d109a35d` | OPEN DRAFT; `qa/pack17/gate-contract.mjs`, `gate-contract.test.mjs`, `run-gates.mjs` | A60 R15 SOURCE_ACCEPTED; historical A40 author test 24/24 PASS; `--full` NOT_EXECUTED |
| P10 #43 | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | OPEN DRAFT | CSV targeted RTL path verified |
| P14 #47 | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | OPEN DRAFT | Three DE/Audience RTL paths verified |
| P17 #50 | `5457a74187edc263730c3a4b25a663bdf5531ee9` | OPEN DRAFT | Two Backup-preview RTL paths verified |
| P19 #52 | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | OPEN DRAFT | Lifecycle RTL path verified |
| P20 #53 | `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` | OPEN DRAFT; pre-R16 amendment | Cache RTL plus existing AuthProvider fixture: source concern only, pending A100 amendment/A50 native test |
| P21 #54 | `dbba0eb82920b4f324866b1b983e1211459f52ec` | OPEN DRAFT | RR RTL path verified; A60 source block on historical RR403 UI |

All PRs inspected are based on the same release; none of these represents a merged or composite version. **Conflicts** remain A00/SWARM-006 future integration ownership, not A40's lane.

Original signed [A60 R15 exact-SHA report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md): `SOURCE_ACCEPTED` scoped for P01/P02/P07; NO independent full runtime application receipt. [A50 R15 published blocker](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md): no complete repository checkout, pnpm or approved physical PG16; **zero actual application tests** in that receipt.

## 3. Actual test and CI evidence, not inferred tests

**New A40 R17 Node/React test commands executed:** `NOT_EXECUTED` (no full per-SHA workspace, pnpm10).  
**New A40 R17 PostgreSQL 16 / Pack17 --full:** `NOT_EXECUTED` (no independently approved physically isolated test DB and reset).  
**Manual paid CI reruns, CI edits, app code edits, merges, production/staging:** **NONE**.  
**Historical author tests:** Node22.16.0 `node --test --test-reporter=tap qa/pack17/gate-contract.test.mjs` 24/24 PASS on unchanged PR40 blobs in older waves, **not** current R17 real application testing.

**Current-relevant real GitHub CI jobs:**
- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 8/8 PASS on corrected matcher; downstream Pack20 6/7 FAIL, Pack17 skipped → overall FAIL.
- [PR53 run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795): Pack19 7/8 FAIL on old release matcher; Pack20 and Pack17 skipped → **not** an execution of PR53 cache tests.
- PR36 and PR40 HEAD: no pull_request Actions runs returned at latest check. Absence of PR-head runs does not certify them.
- Source evidence: release `qa/pack19/source-contract.test.mjs` blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5` expects `readOnly:true`; existing P01 corrected blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e` expects `accessMode:"read only"` with `repeatable read`; backend remains same read-only transaction route blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757`. No duplicate PR35 patch warranted.

## 4. Exact executable A50 path and failure mapping

**Minimal single-PR run:** [linked technical deliverable §2](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R17_TEST_COMMANDS_AND_TAP_GATE.md#2-one-minimally-useful-executable-a50-path-p20--pr53) defines clean disposable per-PR full checkout, HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, Node22/pnpm10 frozen dependencies, `TSX_TSCONFIG_PATH` and:

```powershell
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
```

Uses real `artifacts/tournament-manager/test/run-tests.mjs` native stack and JSDOM setup, no Pack19 earlier workflow. The second existing test exercises a source-confirmed `AuthProvider`/React Query provider compatibility risk; no runtime FAIL asserted. A50 must capture actual git SHA, command, versions, TAP summaries and exit, distinguish `INFRA_BLOCKED`, `FAIL` and `RUNTIME_VERIFIED_TARGETED`.

**Five additional exact per-SHA frontend commands:** in deliverable §3 for PR54 RR, PR52 lifecycle, PR43 CSV, PR47 DE and PR50 Backup; all reference actual changed test paths on current PR branches and have **NOT_EXECUTED** status. Run broader frontend typecheck, full test, build including Animated Effects on that *same SHA* after scoped tests, not instead of them.

**Failure mapping:** `OLD_BASELINE_PACK19_FAIL` is CI prerequisite regression in isolated release-based feature PR (downstream feature tests SKIPPED). Native targeted test nonzero/real failed assertion is `FEATURE_TEST_FAIL` on exact SHA. Missing installed deps, checkout or pnpm are `INFRA_BLOCKED`. Source assertion absent real runtime report is `SOURCE_ONLY`. Unexecuted = `NOT_EXECUTED`. No author-generated TAP or plan-only launcher counts as app green.

## 5. Pack17 release gates, TAP defect, ownership

**Nine ordered actual `--full` gates on PR40:** source-contract TAP, helper-contract TAP, physically isolated PostgreSQL16 atomic correction TAP, workspace typecheck, API unit (**3** distinct TAP summaries), API integration TAP, frontend suite TAP, API build and frontend build (Animated Effects). Separate earlier Pack19–26, codegen, manual browser, eventual composite regression still mandatory. `--static` success explicitly says **RELEASE STOP**.

**Open `T017-QA-01`:** Pack17 helper `assertCompleteTap` parses TAP header + summary counters but not `ok`/`not ok` records or `1..N` plan; crafted counter-only and `not ok` with forged `# pass 1/# fail 0` have been accepted in older source-level probes. R17 reread unchanged source and did not rerun tests. No evidence a real Node test subprocess with nonzero exit can bypass runner exit fail-closed. **A60 independent disposition pending**; no A40 code authorization.

**Immediate NEXT owner actions:** A50 needs one authorized trusted complete checkout with Node22/pnpm10 and explicit per-SHA test GO (not another PLAN-only simulation). Separate A20/owner physical PG16 + disposable schema reset consent needed before `--full`. A60 independent source/runtime same-SHA verdict and TAP QA issue decision. A00 coordinates missing original R16 artifacts, signs any separate GO, and keeps final-only SWARM-006 gate.

**Final A40 disposition:** `R16_ARTIFACTS_UNAVAILABLE / R17_SOURCE_COMPLETE / REPORT_PUBLISHED / P07_SOURCE_ACCEPTED_SCOPED / P07_FULL_RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.
