# WEB-005 / A110 / R12 — UX-045 Backup Preview Isolation Patch

**Agent:** A110 — Basket Concurrency & Frontend State  
**Task:** `WEB-005-T110-A110-UX045-R12` • **Wave:** R12.1, 2026-10-14 (Europe/Warsaw)  
**Authorization:** **GO NARROW FRONTEND SOURCE-CODE ONLY / TEST-FIRST / LANE L3**  
**Base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Implementation branch:** `fix/web-005/t110-ux045-backup-preview-r12`  
**HEAD:** `5457a74187edc263730c3a4b25a663bdf5531ee9`  
**PR:** [#50 OPEN DRAFT](https://github.com/C8LyNn/aplikacja-turnieje/pull/50), **NOT MERGED**.  
**Status:** `PATCH_PROPOSED / SOURCE_ONLY_INSPECTED / RUNTIME_NOT_EXECUTED / A60_QA_PENDING / RELEASE_NO_GO`.

## 1. Exact patch scope and source evidence

The original release baseline contains **two independent unguarded FileReader paths**:
- [TournamentDetail backup import (L347–365)](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-detail.tsx#L347-L365): after a file is picked, delayed `onload` can set `importPreview`/`importError` without checking the tournament identity or file selection. New credential fields are not consistently reset on choosing a new file. Same-instance A→B behavior is **HYPOTHESIS**, not reproduced on a live browser.
- [BackupRestoreDialog (L30–69)](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/backup-restore-dialog.tsx#L30-L69): delayed reader `onload` can overwrite another file's preview; new organizer/viewer/support passwords survive file reselection. **SOURCE_CONFIRMED** absence of guard. The backend import creates **a distinct new tournament C** — it does not overwrite existing B.

**Change list, verified GitHub compare base→HEAD: 6 commits ahead / 0 behind, 5 files only.**
1. `artifacts/tournament-manager/src/hooks/use-scoped-backup-preview.ts` — **added**; shared scope owner + file-selection epoch + active reader instance triple-check, abort invalidates callbacks, `onerror` handled, existing `parseTournamentBackupFile` reused unchanged.
2. `artifacts/tournament-manager/src/hooks/use-scoped-backup-preview.test.tsx` — **added**, 5 deferred-read React RTL test definitions.
3. `artifacts/tournament-manager/src/components/backup-restore-dialog.tsx` — **modified**; per-route and per-open keyed child component prevents reused backup/credential state; file reselection clears preview/error and all **new** passwords; close/unmount cancels pending read.
4. `artifacts/tournament-manager/src/components/backup-restore-dialog.test.tsx` — **added**, 5 actual-dialog RTL test definitions with QueryClient/AuthProvider/Wouter, including asserted new-B-only mutation request payload when user explicitly presses Restore. **No real backend request**: mock fetch only.
5. `artifacts/tournament-manager/src/pages/tournament-detail.tsx` — **modified, backup-only sections**; `id` scope masks `importPreview`, `importError`, organizer/viewer/support **new** password values during an A→B render, and resets all after route change/file reselection/cancel; FileReader guarded by shared hook. Existing CSV code and PR43's separate CSV hook unchanged.

**No modifications:** `@workspace/api-server`, route handlers, Backup V2/V3 parser, API contracts, access tokens, export service, schema, migration files, Host draft, Stage modal, T055 Basket CAS, PR43 branch, main/release, SWARM-006.

## 2. Test-first fixtures — CREATED, NOT EXECUTED

| Case | Test file | Input | Expected |
|---|---|---|---|
| UX045-R12-01 | hook RTL | Pending A, new B selected, old A.onload/onerror after B | Only B preview, B secrets empty, no stale A error |
| UX045-R12-02 | hook RTL | Tournament A→B same React instance, pending A, delayed callback | A read aborted, B preview/error empty |
| UX045-R12-03 | hook RTL | Modal-close/unmount while reading, callback after abort | No old preview/error or React state resurrection |
| UX045-R12-04 | hook RTL | Current invalid V1, current FileReader error, then valid backup | Explicit parser/read errors only for current selection, subsequent valid success |
| UX045-R12-05 | hook RTL | Valid current V2 → valid current V3 | Parser acceptance and preview behavior preserved |
| UX045-DIALOG-01 | real component RTL | Private A password fields populated → choose B → late A callback | Credential inputs reset, A private viewer input hidden, B only, Restore disabled until new credentials |
| UX045-DIALOG-02 | real component RTL/Wouter | A pending → navigate to B, late A.onload/onerror | Old read aborted, B form password empty, no A preview/POST |
| UX045-DIALOG-03 | real component RTL | Close/open with pending read, then late A callback | Fresh form, no secret or preview |
| UX045-DIALOG-04 | real component RTL | Valid V3 + newly typed organizer password | Restore enabled only with valid new password; no auto POST |
| UX045-DIALOG-05 | real component RTL/mock HTTP | Valid A loaded and old password; select B, B valid/new password, explicitly Restore | At most one intentional POST containing B backup and B new password; A backup/secret excluded |

**Important limitation:** hook RTL is a minimal React Harness, and actual dialog RTL does not cover the whole `TournamentDetail` page. A50 must add/run real `TournamentDetail` Wouter route A→B and request-level negative tests; A60 must independently verify they enforce **zero stale credential + zero cross-tournament write**. Test definitions are not runtime verification.

## 3. Actual test/execution evidence

| Evidence | Result | Notes |
|---|---|---|
| GitHub fetch base source and PR43 | **SOURCE_CONFIRMED** | Baseline unguarded callback and PR43 is CSV-only |
| GitHub source diff base→UX045 | **STATIC_VERIFIED** | Only scoped 5 files, 6 commits, no imported PR43 |
| Frontend typecheck | **NOT_EXECUTED** | No local checked-out pnpm monorepo/dependencies available |
| 10 new RTL tests | **NOT_EXECUTED** | Test definitions committed; no command/exit 0 |
| Full frontend test suite | **NOT_EXECUTED** | No real isolated project checkout |
| Browser E2E `TournamentDetail` A→B | **NOT_EXECUTED** | Not an actual browser replay |
| API/PG new C creation | **NOT_EXECUTED** | No isolated database authorization or test harness |
| A60 independent QA | **PENDING** | No SOURCE_ACCEPTED / RUNTIME_VERIFIED claim |
| GitHub Actions run [38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147) | **FAIL / exit 1** | Auto-triggered, job 115978348803 Pack19 snapshot test 7 PASS / 1 FAIL: obsolete regex expects `readOnly:true`; existing release source uses `accessMode:"read only"`. Frontend UX045 tests were **NOT REACHED**. No manual paid rerun. |

Commands for A50 with exact detached HEAD and **actual** installed frontend environment:

```bash
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

A50: record environment, Node22/pnpm10, SHA, actual process exit codes, TAP pass/fail/skip, logs. **STOP and flag FAIL** if any required command fails. Source branch does not contain P01 PR35's Pack19 matcher fix. A failing historical Pack19 auto-CI gate is **not sufficient** to classify UX045 RTL; do not suppress or duplicate PR35. No GitHub Actions rerun permitted without explicit HQ/owner approval.

## 4. Source review and specific QA risks

- New shared hook requires `scopeRef.current===ownerScope`, `generationRef.current===generation`, `activeReaderRef.current===reader` before any preview/error mutation. `invalidate()` increments epoch and aborts a still-loading reader; tests deliberately invoke callbacks even after abort.
- `BackupRestoreDialog` keyed child remounts on route change and after `open=false → true`. Every new file selection clears previously entered new passwords. Backend password policy, private viewer requirement, role/session creation and endpoint behavior remain unchanged.
- `TournamentDetail` uses both render-time owner masking and route-change effect to avoid rendering old A preview/credentials in B. A50/A60 should test actual route not only hook Harness. The in-flight **already explicitly confirmed** import mutation is not changed by UX045; late import HTTP response is a distinct future policy/UI concern, not silently certified.
- Same file `tournament-detail.tsx` is modified by [PR43 CSV](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) and [PR50 backup](https://github.com/C8LyNn/aplikacja-turnieje/pull/50). The backup handler is separated from CSV source, but **imports/adjacent hunks can collide at integration**. A00 records this dependency; no rebase/cherry-pick/merge by A110.
- Independently test V2 and V3, `private_online` viewer password visibility, invalid FileReader `onerror`, old A callbacks after B success, zero B write unless explicitly user-initiated. A100 privacy review advisable; A60 owns acceptance.

## 5. Rollback, policy, ownership and next action

Rollback in review is simply **discard/close PR50 branch before integration**. No production data affected, no deployment performed, no migration/SQL, no shared DB test. Runtime rollback not applicable because nothing was deployed.

- **T055** full Basket PUT CAS remains `POLICY_OPEN` (token, 409/412, legacy, draft conflict UI), no source modification.
- **T110 UX044** Host navigation unsaved draft and **UX046** Stage modal stale state remain `NOT_IMPLEMENTED`.
- Withdrawn claims retained: ordinary StageBasketsPanel A→B does not prove advanced-draft transfer; backup import creates **new C**, not destructive overwrite of B.
- **A00:** register draft PR50 as a new R12 package ID only after A10 confirms canonical numbering; reserve future integration conflict resolution for SWARM-006 after formal WEB-005 closure.
- **A50:** execute targeted real React/typecheck and full frontend suite on PR50 exact SHA, plus real TournamentDetail A→B/negative HTTP tests.
- **A60:** exact-SHA independent source/privacy/RTL acceptance; report gaps in mock vs actual backend.
- **GO/STOP:** GO code only in L3 accomplished; STOP backend, cross-PR integration, SQL, paid CI rerun, release/deploy, and SWARM-006 activation.

**A110 R12 author verdict:** `PATCH_PROPOSED / QA_PENDING / RUNTIME_NOT_EXECUTED / POLICY_BASKET_OPEN / RELEASE_NO_GO`.
