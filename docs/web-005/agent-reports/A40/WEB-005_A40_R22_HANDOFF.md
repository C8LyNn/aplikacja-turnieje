# WEB-005 — A40 R22 FINAL HANDOFF → A00 / A50 / A60

**Task:** `WEB-005-T010-T017-A40-R22` · **Agent role:** A40 Pack19/Pack17 / L1+L2 test contract  
**R22 mode:** TEST CONTRACT (no app code authorization) · **Control:** R22.1 Git blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`  
**Release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Status:** `A40_R22_CONTRACT_PUBLISHED / NO_R22_APP_CODE_BY_A40 / L1_COMMAND_VERIFIED / L2_TEST_PATH_VERIFIED / NATIVE_TESTS_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.

**Mandatory linked technical deliverable:** [WEB-005_A40_R22_CODE_TEST_CONTRACT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R22_CODE_TEST_CONTRACT.md). Full file contains exact source Git blobs, L1 test oracle, native command, L2 verified test path, CI Pack19 gate evidence and execution QA conditions. Both files are documentation-only on the central control branch. A40 created **no new functional code, branch or PR**, changed no existing P01/P02/P07 code, ran no paid CI and performed no merge/DB reset.

## 1. L1 Swiss — PR57 native unit command

**R22 [PR57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57)** OPEN/DRAFT/UNMERGED, release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, HEAD **`a57fe31c1bc123c5217b3f58bcdd34750c64c5c6`**. Exact changed paths:
- `artifacts/api-server/src/domain/tournament/swiss.ts` blob `5e7fa424371c10a0360e471bb050afa7096d361b`: 197-line S3 score-group-first lexicographic matching, bounded exact solver/fallback, S4 stage-local BYE counters from caller-supplied stage matches;
- `artifacts/api-server/test/swiss.test.ts` blob `150d34619abb83d12bb351a7aedb6e377d5d1332`: 13 authored S3/S4/S4-H test cases.

Actual package metadata: `artifacts/api-server/package.json` blob `bf931f87a7b0d5532b949f44c7e091878fe6db52` names `@workspace/api-server` and real convention `node --import tsx --test`. **A50 exact native command**, only after full clean PR57 checkout, Node22/pnpm10/frozen install and HEAD validation:

```powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/swiss.test.ts
```

**NOT_EXECUTED by A40, no actual TAP/exit.** Stage-local validity requires the caller to pass only matches from the current Swiss stage because `StandingsMatch` lacks stageId; pure tests alone cannot certify the API caller. Existing R21 S3/S4/S4-H decisions govern result semantics and do not constitute test PASS.

## 2. L2 isolated strict Backup V3 — PR56 native unit command

**R22 [PR56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56)** OPEN/DRAFT/UNMERGED, same release base, HEAD **`77707092202ca79277de7bc57cc4e37e4c033171`**. Changed:
- `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` blob `c663c3d8347f22caf9375ae48a6f7670a6629d34`: standalone pure validator, **NOT_WIRED** into backup import/export;
- `artifacts/api-server/test/backup-v3-strict-policy.test.ts` blob `fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc`: 8 authored Node test cases.

**A50 exact native command** on a **separate** full clean PR56 checkout, Node22/pnpm10/frozen install and exact HEAD:

```powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/backup-v3-strict-policy.test.ts
```

**NOT_EXECUTED by A40.** Pure suite covers B1–B6 marker/downgrade, latest history parity, independent match revision, typed action ordering, nested IDs and invalid-backup error. No API 400 wiring/PG16 rollback or legal legacy restore test claim. PR56 and PR57 each require independent exact-SHA A60 source review and genuine A50 runtime receipts before scope acceptance.

## 3. Source QA/CI provenance unchanged; no duplicate patch

P01 [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) `7cb283aa82273a1e22daf9051a82311eef53760c`, P02 [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) `85ad0b86136fc3491c9ef18663d9b01396179349`, P07 [PR40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) `9a8287271299a59fc9291b8d253299a8d109a35d`: **all OPEN/DRAFT/unmerged on the release base**. Existing PR35 corrected old Pack19 test matcher; new R22 PRs based on release may still fail **OLD_BASELINE_PACK19_FAIL** before testing their L1/L2 feature. [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) Pack19 source 8/8 PASS, next Pack20 6/7 FAIL, overall FAILURE. **NO integrated CI PASS.**

**New R22 real CI:** [PR57 run 38646317948](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646317948), job `116133937701`, and [PR56 run 38646256645](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646256645), job `116133734773`: both **COMPLETED FAILURE** at inherited Pack19 source test **7/8**, old `readOnly:true` assertion; later Pack20–26 and Pack17 skipped. The real job logs were read. **Neither is an executed L1/L2 focused test result.**

Pack17 `--full` requires nine sequential source+PG16+typecheck+API/FE+build gates and 3 API-unit TAP outputs; real `--full` still NOT_EXECUTED. `--static` alone is release STOP. Historical `T017-QA-01` forged TAP counter-only source-helper risk unchanged, real nonzero child exit protected, no new independent severity/code authorization.

**Independent A60 source evidence:** [A60 R21 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`, `HANDOFF_NOT_READY`. Not a verdict on any unpublished R22 L1/L2 code. **A50 last actual receipt:** [R21 environment blocker](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`: 0 native application tests, no full trusted checkout/pnpm10 or approved physically isolated PG16.

## 4. Owner policy and next concrete actions

Approved sport S3 **SCORE_GROUP_FIRST**, S4 stage-local lowest eligible BYE and S4-H completed NC/walkover previous pairs; Backup B1-A, B2-B, B3-A, B4-A, B5-A, B6-A, T055 D1B/D2B/D3B/D4A/D5B/D6B. These are **valid decisions, not implemented runtime proof or final deployment consent**. R22 code GO belongs solely to **A80 L1**, **A90 L2**, and **A110 L3 test/DTO contract**, respectively. A40 has no production source lane.

**A80/A90 → A50:** distinct R22 draft PRs **#57/#56 are published**. A50 runs the two real native test commands on their individually pinned HEADs from separate frozen full checkouts, saves real `git HEAD / Node+pnpm / command / exit / TAP`. **A60:** independently review those exact source SHAs and results before source acceptance. **A00:** register fresh packages and conflicts; close residual Steam/session/MP2B/cache owner policies and original WEB004 38-case provenance before the separately owner-approved single final-only SWARM-006 handoff. EXEC-B only delegates future test debt after formal closure with a hard integrated release STOP. No waiver automatically applied.

**Final R22 A40:** `SOURCE_TEST_CONTRACT_DONE / NO_NEW_CI_EVIDENCE / L1_TEST_NOT_EXECUTED / PR57_L1_PR56_L2_TEST_FILES_VERIFIED_NOT_EXECUTED / INDEPENDENT_R22_L1_L2_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
