# WEB-005 — A90 / P23-01 narrow source correction / PR #56

**TASK:** `WEB-005-T060-A90-R22-P23-01-HOTFIX`  
**Date:** 2026-10-15, Europe/Warsaw · **Role:** A90 Backup V3 Integrity & Restore  
**Authorization:** only two existing A90-owned PR #56 files, **TEST FIRST**, no importer/exporter/DTO/DB edit, merge, DDL, staging/live or SWARM-006.
**Status:** `P23_01_AUTHOR_FIX_PUBLISHED / NEW_SHA_READY_FOR_A60_INDEPENDENT_QA / NOT_WIRED / NATIVE_TESTS_NOT_EXECUTED`.

## 1. Exact provenance and patch custody

- **Existing PR:** [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56), OPEN DRAFT, branch `fix/web-005/t060-b2-strict-policy-core-r22`, release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **Previous SHA independently SOURCE_BLOCKED by A60:** `77707092202ca79277de7bc57cc4e37e4c033171`.
- **Current patched HEAD:** **`a7f71a7e7efdabd479b358a3cee80bc6359c4321`**.
- **Independent initial finding:** [A60 R22 late delta QA / P23-01](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md), Git blob `ca3d4b5e2ac53208898c09c3f77a1da8816ecfa8`: real completed Swiss BYE has `system_bye_assigned` not `match_result_submitted`; previous pure strict validator incorrectly demanded an active manual completion action.
- **Observed release source** [tournaments.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L1544-L1570) and next-round path ~L1738–1764: BYE is `status=completed`, `resultType=bye`, `resultReason=system_bye`, player1=winner, player2=null, scores=null, matching `resultHistory` and `actionLog.actionType=system_bye_assigned` with null `undoPayload`. Exported `canUndo=false`, `isUndone=false`.

**GitHub compare previous HEAD → new HEAD:** 4 commits ahead; exactly **two changed files**, no other path:
| File | Increment from previous SHA | Final Git blob SHA-1 |
|---|---|---|
| [backup-v3-strict-policy.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts) | +42 / -2 | `595c68b87a5361623bef6293519ed668e9d4e493` |
| [backup-v3-strict-policy.test.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/test/backup-v3-strict-policy.test.ts) | +176 | `d1242b84c9b2db269ab6864459d8d11656d4fe8c` |

**Test-first correction commit order:**
1. `b2b1cbacca0b7ff81c0977c2a6554a262d9f65c7` — add positive BYE, hybrid played+BYE and forged/missing/stale negative regression cases **before the code fix**.
2. `7c73c7316bc30a150e7aad9cd510d30b4399ac19` — isolated production-source pure validator correction.
3. `3391867f32a41ca377dd153ad49b3bbb52e5e9c5` — replace one forged manual test's TS cast with a structurally typed invalid fixture.
4. `a7f71a7e7efdabd479b358a3cee80bc6359c4321` — explicitly narrow an unknown system match ID before typed Set/Map checks.

## 2. Source change: typed disjoint manual/system completion

**Existing manual path preserved:** completed played/walkover/NC matches still need a properly active typed `match_result_submitted` with provenance targeting the matching newest result-history revision. No global `resultType !== played` exemption.

**New tightly scoped BYE path:** only a `status=completed`, `resultType=bye`, `resultReason=system_bye` match with present exported player1, no player2, winner exactly player1 and both scores null qualifies for system resolution. Requires **exactly one** `system_bye_assigned` action with identical `matchBackupId` and `stageBackupId`, `canUndo=false`, `undoPayload=null`, `isUndone=false`; demands **zero** active manual completion actions for that BYE. Wrong type, foreign/missing identity, false stage linkage, duplicated/missing system action, inconsistent Undo fields or phantom manual completion remain errors.

**Nothing relaxed:** newest `resultHistory` tuple/time parity is still checked for every completed BYE, as are full `matchStateRevisions` coverage/unique-positive CAS version, ordered `actionOrder`/typed manual provenance, and recognized nested match/player identifiers. Current strict marker omission still `UNATTESTED`, not a trusted old-producer declaration; **downgrade-safe live importer not claimed**.

## 3. Regression test contract — authored, NOT executed

Six new `node:test` bodies (including table-driven variants) appended to the existing eight:
1. **positive source-authentic single BYE** with `system_bye_assigned`, no manual completion or Undo token;
2. **positive hybrid played+BYE**, and negative attempt to attach a phantom manual token to BYE;
3. **negative missing or contradictory BYE resultHistory**;
4. **negative spoofed player2, wrong winner/player1, synthetic score and invalid reason** with deliberately matching forged history to test semantic check beyond parity;
5. **negative forged/wrong/missing/duplicate system action**, unexpected `canUndo`, payload, `isUndone`, stage/match;
6. **negative manual played→system impersonation** and attempts to classify `walkover`/`no_contest` as system BYE.

**No actual native test pass claim.** This conversation's environment lacks a fully mounted, dependency-installed, trusted pinned application checkout and `pnpm`; external GitHub is read/written through connector. **`pnpm install / typecheck / node --import tsx --test = NOT_EXECUTED`**, exit/TAP **N/A**. Node installed locally does not by itself prove this repository's test run. No DB needed for pure unit test.

**Exact A50/authorized pure test run (no PG16 or reset):**
~~~sh
git fetch origin fix/web-005/t060-b2-strict-policy-core-r22
git switch --detach a7f71a7e7efdabd479b358a3cee80bc6359c4321
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-strict-policy.test.ts
~~~
Record actual shell exit, TAP pass/fail and test names; do not infer 6 new TAP PASS from authored bodies. Automatic workflow for final HEAD [run 38698700862](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38698700862) was observed **in_progress**, not an asserted successful CI. Do not initiate manually paid CI.

## 4. Required independent follow-ups and stops

- **A60:** independently fetch exact **new** PR56 SHA `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, compare to `777070...`, inspect real writer and all six new test bodies, assign `P23_SOURCE_ACCEPTED_SCOPED_CONDITIONAL` **only if** P23-01 is demonstrably fixed. A90 does **not** self-approve. Source review and native test are distinct gates.
- **A10:** once A60 publishes exact-head independent review, append P23 new HEAD and both final file blob SHA-1 / computed SHA-256 to P22–P24 registry, preserving old SHA and P01–P21 identities.
- **A00/A30/A20/A70:** later separate GO still needed to design authenticated/allowlisted old backup origin, marker preservation against Zod stripping, portable revision and global Undo contracts; **current strict-only module remains NOT_WIRED**.
- **A50:** optional approved exact-head pure unit/typecheck receipt. No PG16 test/reset in P23-01.
- **Integration / release:** `HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`. No changes to PR41/PR48, importer/exporter, DTO/OpenAPI, SQL or other PRs. No merge, migration or deployment.

**End status:** `P23_01_AUTHOR_PATCH_PUBLISHED / EXACT_NEW_SHA_A60_QA_REQUESTED / NATIVE_NOT_EXECUTED / NOT_WIRED / SOURCE_DEFECT_FIXED_AWAITING_INDEPENDENT_QA / RELEASE_NO_GO`.
