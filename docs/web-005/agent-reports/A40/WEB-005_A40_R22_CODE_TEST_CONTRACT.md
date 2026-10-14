# WEB-005 — A40 R22 CODE TEST CONTRACT: L1 Swiss / L2 Backup V3

**Task:** `WEB-005-T010-T017-A40-R22`  
**Role:** A40 — Pack19/Pack17 CI / code-lane test contract  
**Authorization:** SOURCE TEST CONTRACT ONLY; **NO CODE GO**, no new functional PR, merge, rerun paid CI, DB reset, or SWARM-006 dispatch.  
**Central source:** [WEB-005_WAVE_R22_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md), R22.1, blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`.  
**Date:** 2026-10-15 Europe/Warsaw. **Evidence:** SOURCE_VERIFIED / NO_NEW_APP_RUNTIME / NO_R22_L1_OR_L2_PR_OBSERVED_AT_INSPECTION / RELEASE_NO_GO.

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

**L1 recommended executable native test (not executed by A40):**

```powershell
# Must run at monorepo root in a complete clean, independently pinned
# A80 R22 NEW source PR checkout, NOT the release baseline.
# Verify: git rev-parse HEAD = current NEW PR HEAD before execution.
node --version               # Node22 required
pnpm --version               # pnpm10 required
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'FROZEN INSTALL FAILED / STOP' }
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/swiss.test.ts
$testExit = $LASTEXITCODE
if ($testExit -ne 0) { throw "L1 Swiss native test FAIL, exit $testExit" }
```

This is the documented actual package-root test path, uses real `tsx`/Node native TAP and can run without PG16 as long as the pure test continues importing only the Swiss domain module. **A40 has not run this command on the R22 A80 code** because no such PR/HEAD/test receipt was observed. The latest *existing* four cases cannot certify S3/S4.

**L1 expected test oracle from approved owner policy:** S3 `SCORE_GROUP_FIRST` primary grouping, prior opponent avoidance **secondary**, deterministic tie-break and bounded fallback; S4 stage-local lowest-ranked eligible first BYE without repeat, then minimum stage-local BYE count/lowest rank if everyone has BYE; S4-H *completed* `no_contest` and `walkover` count toward historical opponents, `cancelled` does not. Also verify no duplicate same-round players/opponents, lawful odd roster, repeatable ordering/seed, score-group-vs-rematch conflict. **Critical source boundary:** the current `generateSwissPairings` takes `previousMatches` with no `stageId` in `StandingsMatch` and therefore cannot itself discriminate BYEs from other stages; the calling-layer input **must** be restricted to the current Swiss stage or a future separately authorized signature/contract must supply stage context. A80 owns this gap; A40 will not alter callers or declare stage-fairness complete from pure-unit tests alone. Do not confuse S4 pairing history with standings/Buchholz scoring.

After the focused test, A50 should run `pnpm --filter @workspace/api-server run typecheck` and the approved API unit suite on the **same pinned SHA**. API full integration and Postgres16 require *separate*, actually physically isolated dedicated disposable test DB and explicit owner/A20 reset scope; not a prerequisite to one safe pure L1 unit run.

## 2. L2 / A90 strict-profile Backup V3 isolated validator test

At the R22 A40 GitHub inspection, an `R22`/Swiss-specific new branch or PR was **not returned** in bounded branch/PR searches; no new L2 strict-profile module path, test filename or immutable PR HEAD was supplied/verified. The old `backup-v3.ts` is an application integration module and explicitly **out of scope** for A90's R22 change. Consequently:

**`L2_UNIT_COMMAND = NOT_DETERMINED / WAIT_FOR_REAL_MODULE_AND_TEST_PATH`.**
**Do not invent `test/backup-v3-strict-profile.test.ts` or claim L2 runtime PASS.**

Once A90 publishes a distinct new R22 feature PR and its changed-file list explicitly includes a self-contained `*.test.ts` under `artifacts/api-server/test/`, A40/A50 can construct an exact command using the verified real path and current new PR SHA:

`pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap <VERIFIED_RELATIVE_TEST_PATH>`

**This is a conditional command template, NOT YET AN EXECUTABLE VERIFIED L2 FILE PATH.** Confirm all TS imports are pure and no DB/schema/import-export side effects. The isolated validator's accepted contract is modern strict profile only, separately gated legal legacy V2/V3, B2 latest-history mismatch reject, B3 portable match-state revision (not `resultHistory.revision`), B4 typed deterministic action order, B5 no recognized foreign/unmapped nested IDs and B6 preclone `INVALID_BACKUP_V3`; pure tests validate decision invariants but **cannot** demonstrate persistence/transaction rollback. Boundary and negative fixtures must include strict-to-legacy downgrade attempt. A20/owner physical PG16 verification remains a separate future integration gate; **no calls to DB, actual restore or destructive SQL now**.

## 3. Existing Pack19/Pack17 baseline and CI evidence

Source correction already exists **only on unmerged P01 PR35**: old baseline matcher expects `readOnly:true`, whereas the actual route uses `{isolationLevel:"repeatable read",accessMode:"read only"}`. PR35 fixes test source matching, not application transaction. This inherited mismatch can fail a new isolated R22 source PR's GitHub Actions before its new tests are reached. DO NOT weaken or bypass source gates, duplicate P01/P02 fixes, label unrelated `OLD_BASELINE_PACK19_FAIL` as `L1_TEST_FAIL`/`L2_TEST_FAIL`, or request billable CI rerun without separate GO.

Existing genuine Actions receipts:
- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 source **8/8 scoped PASS**, later Pack20 **6/7 FAIL**, overall workflow failure.
- [PR53 run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899) and [PR54 run 38631912235](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235): inherited source Pack19 **7/8 FAIL**, later gates skipped; these are old PRs, not R22 L1/L2 runtime evidence.
- No PR35/36/40 merge, no composite HEAD, no `Pack17 --full` physically isolated PG16 PASS.

P07 `--full` remains nine sequential source/contract/PG/typecheck/API/FE/build checks, API unit **3 TAP sub-summaries**. `--static` success is `RELEASE STOP`. The historical parser warning **T017-QA-01** (forged/counter-only TAP summary accepted by pure helper without plan/record reconciliation) is unchanged and no new A60 severity decision or code GO from A40; runner separately blocks real child nonzero exit. No code changes to Pack17.

## 4. Evidence classification and A50/A60 handoff

**A60 independent R21:** [WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`: `HANDOFF_NOT_READY` before R22 policy delegations. Existing P01/P02/P07 scoped source verdicts still apply at unchanged HEAD but no composite QA. [A50 R21 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`: **0 native application tests**, no connected full workspace/pnpm10 or approved isolated PG16.

**A50 action only after runnable host GO:** provide actual authorized complete per-SHA source checkout and Node22/pnpm10/frozen dependencies, execute L1 on A80 new PR exact SHA, and L2 only after A90 real file path + exact SHA verified. Capture actual Git HEAD, full command, dependency state, Node version, exit, TAP `tests/pass/fail/cancelled/skipped/todo`, evidence log URL; no mock reports or author assertion counted as green. **No R22 native test run by A40.**

**A60:** independently review code/tests and exact new SHA for L1/L2, negative fixtures, L1 stage scope and L2 downgrade/legacy boundaries; signed source review is not native runtime acceptance. If new R22 PR has no URL yet, status `NOT_PUBLISHED / QA_NOT_STARTED`, not `QA_PASS`.

**A00:** register L1/L2 new PR candidates and overlap DAG, freeze released exact SHA, protect owner-approved S3/S4 and Backup B1–B6 semantics, separately track T055 L3 and future PR47 conflicts. EXEC-B is conditional **future test debt transfer only after source/owner/case closeout and new final owner GO**. No SWARM-006 activity, merge, Replit, production DDL or release in R22.

**Final A40:** `CODE_TEST_CONTRACT_PUBLISHED / L1_COMMAND_VERIFIED_FROM_RELEASE_SOURCE / L1_R22_RUNTIME_NOT_EXECUTED / L2_PATH_PENDING / NO_NEW_CI_EVIDENCE / R22_NEW_PR_NOT_OBSERVED_AT_CHECK / RELEASE_NO_GO / SWARM006_HOLD`.
