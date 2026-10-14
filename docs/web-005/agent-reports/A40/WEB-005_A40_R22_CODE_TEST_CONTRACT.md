# WEB-005 — A40 R22 CODE TEST CONTRACT: L1 Swiss / L2 Backup V3

**Task:** `WEB-005-T010-T017-A40-R22`  
**Role:** A40 — Pack19/Pack17 CI / code-lane test contract  
**Authorization:** SOURCE TEST CONTRACT ONLY; **NO CODE GO**, no new functional PR, merge, rerun paid CI, DB reset, or SWARM-006 dispatch.  
**Central source:** [WEB-005_WAVE_R22_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md), R22.1, blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`.  
**Date:** 2026-10-15 Europe/Warsaw. **Evidence:** SOURCE_VERIFIED / NO_NEW_APP_RUNTIME / R22_PR56_PR57_OPEN_DRAFT / SOURCE_QA_PENDING / RELEASE_NO_GO.

## 1. Live source / package command contract

**Release base** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Existing CI PRs:
- P01 [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) `7cb283aa82273a1e22daf9051a82311eef53760c`, OPEN/DRAFT/unmerged, existing Pack19 source matcher correction;
- P02 [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) `85ad0b86136fc3491c9ef18663d9b01396179349`, OPEN/DRAFT/unmerged, existing Pack20–26 source contract corrections;
- P07 [PR40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) `9a8287271299a59fc9291b8d253299a8d109a35d`, OPEN/DRAFT/unmerged, nine-gate Pack17 source.

**L1 / A80** sources actually read on release:
- `artifacts/api-server/package.json`, Git blob `bf931f87a7b0d5532b949f44c7e091878fe6db52`, package **`@workspace/api-server`**. Actual sibling native script `test:deadlock-game-catalog` uses `node --import tsx --test ./test/*.test.ts`; `test:unit` exists but is broader than this single pure suite.
- `artifacts/api-server/src/domain/tournament/swiss.ts`, blob `aa00b4ef445aaff7eb48152eb5d6c2063befbf7a` (existing Swiss greedy generator).
- `artifacts/api-server/test/swiss.test.ts`, blob `f0ebfb25d80cd7ea52a71cb71237677699ba0e7d` (**four authored baseline cases**, NOT new R22 test PASS).
- `artifacts/api-server/src/domain/tournament/standings.ts`, blob `2f87df4e6ce5d62580197cc0b2ea7d283f8a6efd`: `StandingsMatch.status` includes `completed/cancelled`; result types `played/walkover/bye/no_contest`.
- Root `package.json` defines `typecheck` through workspace build; API `typecheck` validates application and test TS config.

**R22 L1 actual [PR #57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57):** OPEN/DRAFT/UNMERGED, release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, HEAD **`a57fe31c1bc123c5217b3f58bcdd34750c64c5c6`**. Changed exactly: `artifacts/api-server/test/swiss.test.ts` blob **`150d34619abb83d12bb351a7aedb6e377d5d1332`** (**13 authored cases**) and `artifacts/api-server/src/domain/tournament/swiss.ts` blob **`5e7fa424371c10a0360e471bb050afa7096d361b`** (**197-line code implementation**, score-first matching + bounded 16-entrant exact solver, deterministic fallback and stage-local bye counts). Source requires caller to supply **only current Swiss stage** `previousMatches`; API signature does not contain stage ID. An earlier test-first SHA `ef6d2de1c4d2a2bcc7f0a0dfb181d094ceb73696` lacked implementation and is superseded. **Tests AUTHORED, not EXECUTED.**

**L1 recommended executable native test (not executed by A40):**

```powershell
# Must run at monorepo root in a complete clean, independently pinned
# A80 R22 Swiss branch checkout at its pinned HEAD (or later registered new PR), NOT the release baseline.
# Verify: git rev-parse HEAD = current NEW PR HEAD before execution.
node --version               # Node22 required
pnpm --version               # pnpm10 required
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'FROZEN INSTALL FAILED / STOP' }
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/swiss.test.ts
$testExit = $LASTEXITCODE
if ($testExit -ne 0) { throw "L1 Swiss native test FAIL, exit $testExit" }
```

This is the documented actual package-root test path, uses real `tsx`/Node native TAP and can run without PG16 as long as the pure test continues importing only the Swiss domain module. **A40 did not execute this command on the R22 A80 branch.** Branch and test file have verified HEAD/blob, but source generator is unchanged and no native exit/TAP receipt exists. The latest *existing* four cases cannot certify S3/S4.

**L1 expected test oracle from approved owner policy:** S3 `SCORE_GROUP_FIRST` primary grouping, prior opponent avoidance **secondary**, deterministic tie-break and bounded fallback; S4 stage-local lowest-ranked eligible first BYE without repeat, then minimum stage-local BYE count/lowest rank if everyone has BYE; S4-H *completed* `no_contest` and `walkover` count toward historical opponents, `cancelled` does not. Also verify no duplicate same-round players/opponents, lawful odd roster, repeatable ordering/seed, score-group-vs-rematch conflict. **Critical source boundary:** the current `generateSwissPairings` takes `previousMatches` with no `stageId` in `StandingsMatch` and therefore cannot itself discriminate BYEs from other stages; the calling-layer input **must** be restricted to the current Swiss stage or a future separately authorized signature/contract must supply stage context. A80 owns this gap; A40 will not alter callers or declare stage-fairness complete from pure-unit tests alone. Do not confuse S4 pairing history with standings/Buchholz scoring.

After the focused test, A50 should run `pnpm --filter @workspace/api-server run typecheck` and the approved API unit suite on the **same pinned SHA**. API full integration and Postgres16 require *separate*, actually physically isolated dedicated disposable test DB and explicit owner/A20 reset scope; not a prerequisite to one safe pure L1 unit run.

## 2. L2 / A90 pure strict Backup V3 validator — PR56

[**R22 PR #56**](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) is OPEN/DRAFT/UNMERGED on release, HEAD **`77707092202ca79277de7bc57cc4e37e4c033171`**, 3 commits ahead. Changed exactly `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` Git blob **`c663c3d8347f22caf9375ae48a6f7670a6629d34`** (286-line pure modern strict policy; zero imports; NOT_WIRED), and `artifacts/api-server/test/backup-v3-strict-policy.test.ts` blob **`fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc`** (**8 authored** native test cases). Interim test blob `3fb2e1134ac03f69c013ee45cec0cb47016da7b9` was superseded by a 6-line test adjustment.

**Verified exact runnable path, NOT_EXECUTED by A40**; A50 only on clean complete PR56 checkout Node22/pnpm10 frozen deps:

```powershell
# git rev-parse HEAD == 77707092202ca79277de7bc57cc4e37e4c033171
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/backup-v3-strict-policy.test.ts
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "L2 pure validator FAIL: $exit" }
```

Pure tests cover B1 modern strict/legacy classification, B2 history parity, B3 distinct state revision, B4 deterministic typed action provenance, B5 nested recognized IDs, B6 typed invalid backup error and no marker downgrade. **Author-authored test file does not prove TAP PASS** or real import/export, HTTP 400, clone/PG16 rollback, legacy producer authenticity or integration. A60 must independently inspect exact PR56 SHA. Future API/DB wiring requires separate owner/A20 review + GO and isolated PG16.

## 3. Existing Pack19/Pack17 baseline and CI evidence

Source correction already exists **only on unmerged P01 PR35**: old baseline matcher expects `readOnly:true`, whereas the actual route uses `{isolationLevel:"repeatable read",accessMode:"read only"}`. PR35 fixes test source matching, not application transaction. This inherited mismatch can fail a new isolated R22 source PR's GitHub Actions before its new tests are reached. DO NOT weaken or bypass source gates, duplicate P01/P02 fixes, label unrelated `OLD_BASELINE_PACK19_FAIL` as `L1_TEST_FAIL`/`L2_TEST_FAIL`, or request billable CI rerun without separate GO.

**New R22 actual CI jobs:** [PR57 run 38646317948](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646317948), job `116133937701`; [PR56 run 38646256645](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646256645), job `116133734773`. Both **COMPLETED FAILURE** at inherited Pack19 source **7/8 FAIL** (actual logs show old `readOnly:true` regexp vs application `accessMode:"read only"`), and later Pack20–26/Pack17 were SKIPPED. **Not L1/L2 targeted suite verdicts.**

Existing genuine Actions receipts:
- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 source **8/8 scoped PASS**, later Pack20 **6/7 FAIL**, overall workflow failure.
- [PR53 run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899) and [PR54 run 38631912235](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235): inherited source Pack19 **7/8 FAIL**, later gates skipped; these are old PRs, not R22 L1/L2 runtime evidence.
- No PR35/36/40 merge, no composite HEAD, no `Pack17 --full` physically isolated PG16 PASS.

P07 `--full` remains nine sequential source/contract/PG/typecheck/API/FE/build checks, API unit **3 TAP sub-summaries**. `--static` success is `RELEASE STOP`. The historical parser warning **T017-QA-01** (forged/counter-only TAP summary accepted by pure helper without plan/record reconciliation) is unchanged and no new A60 severity decision or code GO from A40; runner separately blocks real child nonzero exit. No code changes to Pack17.

## 4. Evidence classification and A50/A60 handoff

**A60 independent R21:** [WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`: `HANDOFF_NOT_READY` before R22 policy delegations. Existing P01/P02/P07 scoped source verdicts still apply at unchanged HEAD but no composite QA. [A50 R21 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`: **0 native application tests**, no connected full workspace/pnpm10 or approved isolated PG16.

**A50 action only after runnable host GO:** provide actual authorized clean per-SHA source checkouts, Node22/pnpm10/frozen dependencies, execute BOTH real confirmed L1/L2 commands above on their separate branch HEADs or later reviewed new PR heads. Capture actual Git HEAD, full command, dependency state, Node version, exit, TAP `tests/pass/fail/cancelled/skipped/todo`, evidence log URL; no mock reports or author assertion counted as green. **No R22 native test run by A40.**

**A60:** independently review code/tests and exact new SHA for L1/L2, negative fixtures, L1 stage scope and L2 downgrade/legacy boundaries; signed source review is not native runtime acceptance. Both new PRs #57 and #56 are now published OPEN/DRAFT; status `PR_PUBLISHED / A60_INDEPENDENT_QA_PENDING`, not `QA_PASS`.

**A00:** register L1/L2 new PR candidates and overlap DAG, freeze released exact SHA, protect owner-approved S3/S4 and Backup B1–B6 semantics, separately track T055 L3 and future PR47 conflicts. EXEC-B is conditional **future test debt transfer only after source/owner/case closeout and new final owner GO**. No SWARM-006 activity, merge, Replit, production DDL or release in R22.

**Final A40:** `CODE_TEST_CONTRACT_PUBLISHED / PR57_L1_PR56_L2_CODE_AND_TESTS_VERIFIED / L1_L2_RUNTIME_NOT_EXECUTED / INDEPENDENT_A60_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
