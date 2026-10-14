# WEB-005 — A110 — R12 HANDOFF TO LOCAL A00

**AGENT:** A110 / Basket Concurrency & Frontend State  
**TASK:** `WEB-005-T110-A110-UX045-R12` • **WAVE:** R12.1 (2026-10-14 Europe/Warsaw)  
**AUTHORIZATION:** **GO NARROW FRONTEND SOURCE-CODE ONLY / TEST-FIRST / L3**.  
**AUTHOR OUTCOME:** `PATCH_PROPOSED / SOURCE_DIFF_VERIFIED / REAL_RTL_NOT_EXECUTED / A60_QA_PENDING / RELEASE_NO_GO`.

## 1. Source, branch, SHA, PR

| Object | Pinned evidence |
|---|---|
| Repository | `C8LyNn/aplikacja-turnieje` |
| Release baseline | `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| Main | `c50cc48e6fa508592bda3f4838111e9cff5af80c` |
| Implemented branch | `fix/web-005/t110-ux045-backup-preview-r12` |
| Exact implementation HEAD | `5457a74187edc263730c3a4b25a663bdf5531ee9` |
| Draft PR | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50), OPEN/DRAFT, NOT MERGED, GitHub mergeable=true (not merge authorization) |
| Compare base...head | Ahead 6, behind 0, 5 changed frontend files |
| Existing relevant PR | [#43 CSV](https://github.com/C8LyNn/aplikacja-turnieje/pull/43), unchanged HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a` |
| Backup exporter PR | [#48 Backup V3 B3A](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), unchanged HEAD `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`; no edits by A110 |

## 2. Exact changed files

1. **Added** `artifacts/tournament-manager/src/hooks/use-scoped-backup-preview.test.tsx`: five deferred reader RTL tests (test-first commit `31857a77f0aace5de769570da7a78b2e1f081875`).
2. **Added** `artifacts/tournament-manager/src/hooks/use-scoped-backup-preview.ts`: identity + epoch + reader guard, `abort`, preserve same V2/V3 parser (commit `965d0033576ba19c9451f30697fa70d9885dd6af`).
3. **Modified** `artifacts/tournament-manager/src/components/backup-restore-dialog.tsx`: keyed route/open scope, reset new organizer/viewer/support credentials on file choice, ignore old `onload/onerror` (commit `1e0de9ec6c5961c03b984aad8762da9128c02856`).
4. **Modified** `artifacts/tournament-manager/src/pages/tournament-detail.tsx`: backup-only handler/state, route ID masking/reset of preview and new password fields, old-file callback invalidation (commit `0c3c3c2bd9faf0fb79a44b43d1f56bcb5c1dcb75`).
5. **Added** `artifacts/tournament-manager/src/components/backup-restore-dialog.test.tsx`: actual dialog RTL cases and mock-HTTP negative B-only request (commits `c3a94304b2656a79bef8d1c28f5cafd4861590c7`, `5457a74187edc263730c3a4b25a663bdf5531ee9`).

No backend, OpenAPI, generated API clients, backup parser/schema, DB or SQL changed. No changes made to PR43 CSV; no merger of R12 lanes; no write in A70/A100 ownership zones.

## 3. QA evidence, actual commands and exit codes

**STATIC SOURCE CONFIRMED:** release baseline two unscoped FileReaders; existing credential values not reset on backup reselection. New PR50 has hook triple-guard, route/open keyed dialog, detail ID masking, 10 authored RTL test cases. A runtime cross-tournament exploit in the old UI is **not established**.

**Actual A110 executed frontend commands:** **NONE** — no mounted repository checkout with pnpm dependencies; therefore typecheck, 10 new targeted RTL tests, full frontend regression, actual TournamentDetail route E2E and API/PG are all **NOT_EXECUTED**; no exit codes. No local test PASS claim.

**Actual external CI (automatic, not manually invoked by A110):** [run 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), workflow `Tournament correction safety CI` at PR50 HEAD, job `correction-qa` ID `115978348803`, **completed FAILURE, exit=1** at **Pack19 snapshot consistency tests**: `qa/pack19/source-contract.test.mjs`, 7 PASS/1 FAIL, outdated regex expects `readOnly:true` while baseline uses `accessMode:"read only"`. This is a **CI baseline/contract mismatch** already addressed in separate draft PR35, not a demonstrated UX045 regression. **Frontend UX045 tests were not reached**. No paid rerun/retrigger by A110.

**A60 independent acceptance:** PENDING; no signed `SOURCE_ACCEPTED` or `RUNTIME_VERIFIED` on PR50 exact HEAD.

## 4. QA handoff to A50 and A60

A50 checkout immutable PR HEAD in approved isolated frontend environment, record Node22/pnpm10 versions, command+exit, TAP and skipped suite:

```bash
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

**Required actual page/browser follow-up:** mount real `TournamentDetail` with auth/query clients and Wouter route A→B in a **reused instance**; defer old A backup `FileReader.onload/onerror`; assert no A preview/error/secret appears in B and **no POST with A backup under B**, unless a distinct, explicit user action selecting B and entering B-specific new credentials occurred. Test close/reopen, private_online viewer password reset, valid V2/V3. Test a real new-tournament import separately in **authorized disposable** PG16 only if A50 has explicit preflight; import **creates new C**, B unchanged. No normal DB test authorized by A110.

**A60 checks:** independently inspect hook abort-after-callback and source scoped identity, dialog keyed remount, detailed route state masking, readability/privacy of new password fields, whether selection resets do not accidentally auto submit, and PR43 `tournament-detail.tsx` conflict hunk. Existing authored tests are not automatic QA acceptance. Any failure must be reported with exact source SHA and actual reproduction.

## 5. Integration collision, policy/lock and next step

**Conflict:** PR43 (CSV) and PR50 (backup) both independently modify `tournament-detail.tsx` on **the same release baseline**. Features are separate but import-adjacent hunks may collide. **A00** should flag future integration sequencing; no PR43 edit, cherry-pick, rebase or merge permitted by A110. Merge conflict/aggregate release test responsibility is outside this lane and reserved to SWARM-006 **only after final WEB-005 closure**.

**Policies untouched:** T055 Basket full PUT CAS requires owner token/status 409/412 and legacy choices (`POLICY_OPEN`); UX044 Host dirty navigation and UX046 stale stage modal not implemented; Backup V3 revision/legacy policy not selected; credential TTL/rotation/token migration not changed. No fourth code lane. **WITHDRAWN:** alleged ordinary StageBasketsPanel A→B advanced draft transfer and backup overwrite of existing B remain withdrawn.

**Rollback:** PR50 is an isolated draft with no release/live impact. Discard/close the PR prior to any authorized integration; no data rollback or migration required.

**Next action:** A50 executes real targeted RTL/typecheck/full frontend tests at `5457a74187edc263730c3a4b25a663bdf5531ee9`; A60 performs independent source/runtime/privacy review. A00 records the PR43 vs PR50 shared-file dependency and corrects CI Pack19 gate only via already-owned PR35/P01 (not by A110).

**Related detailed artifact:** [WEB-005_A110_R12_UX045_BACKUP_PREVIEW_PATCH.md](./WEB-005_A110_R12_UX045_BACKUP_PREVIEW_PATCH.md).

### Formal §3 verdict

`A110 / WEB-005-T110-A110-UX045-R12 / GO L3 SOURCE-CODE PATCH COMPLETE / PR50 HEAD 5457a74187edc263730c3a4b25a663bdf5531ee9 / BASE 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 / FILES 5 / TEST DEFINITIONS 10 / REAL RTL+TYPECHECK NOT_EXECUTED / AUTOMATIC CI PACK19 FAIL exit1 / A60 PENDING / POLICY OPEN T055 / PR43 HUNK COLLISION FLAG / MERGE+DEPLOY NO-GO / SWARM-006 HOLD`.
