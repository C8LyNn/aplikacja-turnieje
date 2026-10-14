# WEB-005 — A40 R22 FINAL HANDOFF → A00 / A50 / A60

**Task:** `WEB-005-T010-T017-A40-R22` · **Agent role:** A40 Pack19/Pack17 / L1+L2 test contract  
**R22 mode:** TEST CONTRACT (no app code authorization) · **Control:** R22.1 Git blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`  
**Release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Status:** `A40_R22_CONTRACT_PUBLISHED / NO_R22_APP_CODE_BY_A40 / L1_COMMAND_VERIFIED / L2_TEST_PATH_PENDING / NATIVE_TESTS_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.

**Mandatory linked technical deliverable:** [WEB-005_A40_R22_CODE_TEST_CONTRACT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R22_CODE_TEST_CONTRACT.md). Full file contains exact source Git blobs, L1 test oracle, native command, L2 deferred test path, CI Pack19 gate evidence and execution QA conditions. Both files are documentation-only on the central control branch. A40 created **no new functional code, branch or PR**, changed no existing P01/P02/P07 code, ran no paid CI and performed no merge/DB reset.

## 1. L1 Swiss — actual native invocation confirmed

**SOURCE_CONFIRMED on release:** `artifacts/api-server/package.json` blob `bf931f87a7b0d5532b949f44c7e091878fe6db52` declares `@workspace/api-server`; `test/swiss.test.ts` blob `f0ebfb25d80cd7ea52a71cb71237677699ba0e7d` exists and imports only the Swiss domain module; `src/domain/tournament/swiss.ts` blob `aa00b4ef445aaff7eb48152eb5d6c2063befbf7a`; old native unit runner convention `node --import tsx --test` verified. **Four baseline authored cases, no R22 runtime PASS.**

On **A80's own new** L1 source PR, and only once exact HEAD is published and A50 has a complete, clean, owner-authorized Node22/pnpm10/frozen-lockfile checkout:

```powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/swiss.test.ts
```

Expected new R22 tests from owner-approved S3/S4/S4-H: SCORE_GROUP_FIRST with repeat avoidance secondary and deterministic bounded fallback; lowest-ranked stage-local fair BYE with minimal count when all had one; formally completed `no_contest` and `walkover` count as previous pairing, cancelled does not. Critical integration acceptance: `previousMatches` / `StandingsMatch` lacks `stageId` — input must be stage-scoped at caller boundary. A40 did not implement caller change, run tests or certify stage-scope integration.

## 2. L2 strict Backup V3 — test path not verified yet

During inspection **no distinct R22 L2 module/test PR or verified test filename** was found from bounded new-PR and branch searches. A90's R22 GO is to author a separate pure validator + focused tests, *without* modifying shared `backup-v3.ts` or wiring import/export. Therefore **`L2_UNIT_PATH_NOT_YET_AVAILABLE`**. Do not invent a path or TAP PASS. Once A90 publishes the exact changed-file paths and new SHA, the package's executable pattern is `pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap <verified test path>`; this is **only a template**, not verified runnable against current repo. Pure validation tests cover strict-profile history/provenance/portable revision/ID invariants and downgrade rejection; PG16 rollback/import parity is independently blocked until future A20+owner test DB authorization.

## 3. Source QA/CI provenance unchanged; no duplicate patch

P01 [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) `7cb283aa82273a1e22daf9051a82311eef53760c`, P02 [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) `85ad0b86136fc3491c9ef18663d9b01396179349`, P07 [PR40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) `9a8287271299a59fc9291b8d253299a8d109a35d`: **all OPEN/DRAFT/unmerged on the release base**. Existing PR35 corrected old Pack19 test matcher; new R22 PRs based on release may still fail **OLD_BASELINE_PACK19_FAIL** before testing their L1/L2 feature. [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) Pack19 source 8/8 PASS, next Pack20 6/7 FAIL, overall FAILURE. **NO integrated CI PASS.**

Pack17 `--full` requires nine sequential source+PG16+typecheck+API/FE+build gates and 3 API-unit TAP outputs; real `--full` still NOT_EXECUTED. `--static` alone is release STOP. Historical `T017-QA-01` forged TAP counter-only source-helper risk unchanged, real nonzero child exit protected, no new independent severity/code authorization.

**Independent A60 source evidence:** [A60 R21 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`, `HANDOFF_NOT_READY`. Not a verdict on any unpublished R22 L1/L2 code. **A50 last actual receipt:** [R21 environment blocker](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`: 0 native application tests, no full trusted checkout/pnpm10 or approved physically isolated PG16.

## 4. Owner policy and next concrete actions

Approved sport S3 **SCORE_GROUP_FIRST**, S4 stage-local lowest eligible BYE and S4-H completed NC/walkover previous pairs; Backup B1-A, B2-B, B3-A, B4-A, B5-A, B6-A, T055 D1B/D2B/D3B/D4A/D5B/D6B. These are **valid decisions, not implemented runtime proof or final deployment consent**. R22 code GO belongs solely to **A80 L1**, **A90 L2**, and **A110 L3 test/DTO contract**, respectively. A40 has no production source lane.

**A80/A90 → A50:** publish distinct new PR URL, full SHA, exact changed test path and self-contained imports; A50 runs native test from frozen full checkout, saves real `git HEAD / Node+pnpm / command / exit / TAP`. **A60:** independently review those exact source SHAs and results before source acceptance. **A00:** register fresh packages and conflicts; close residual Steam/session/MP2B/cache owner policies and original WEB004 38-case provenance before the separately owner-approved single final-only SWARM-006 handoff. EXEC-B only delegates future test debt after formal closure with a hard integrated release STOP. No waiver automatically applied.

**Final R22 A40:** `SOURCE_TEST_CONTRACT_DONE / NO_NEW_CI_EVIDENCE / L1_TEST_NOT_EXECUTED / L2_NEW_TEST_FILE_NOT_AVAILABLE / INDEPENDENT_R22_L1_L2_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
