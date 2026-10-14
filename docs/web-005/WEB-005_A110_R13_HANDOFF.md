# WEB-005 — A110 R13 HANDOFF TO A00

**Agent:** A110 / Basket Concurrency & Frontend State  
**Task:** WEB-005-T110-A110-UX046-R13  
**Wave:** R13.1 — 2026-10-14 Europe/Warsaw  
**Authority:** CONDITIONAL GO, frontend SOURCE-CODE ONLY lane L2, exercised after SOURCE_CONFIRMED gap.  
**Verdict:** PATCH_PROPOSED / EXACT_SHA_SOURCE_VERIFIED / REAL_TESTS_NOT_EXECUTED / A60_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD.

## 1. GitHub pins

| Object | Exact SHA or status |
|---|---|
| Repo | C8LyNn/aplikacja-turnieje |
| Baseline | release/tournament-ops-20261013-01 at 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 |
| Main | c50cc48e6fa508592bda3f4838111e9cff5af80c |
| New branch | fix/web-005/t110-ux046-stage-modal-r13 |
| Implemented HEAD | cce73ec47445102b216b3f8eceb4ec9de67eb1a7 |
| PR | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) OPEN DRAFT, NOT MERGED |
| Diff | 5 commits ahead, 0 behind; exactly 2 modified frontend files |
| A110 previous P10 | [PR43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) HEAD 96a6068f69027574ac76e18d4d5a2c444b5a914a, unchanged |
| A110 prior UX045 | [PR50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) HEAD 5457a74187edc263730c3a4b25a663bdf5531ee9, unchanged |
| Existing lifecycle/RR | [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) HEAD a7a87bc019731191dbfa44bee6939e3fa25e27f4, unchanged |

## 2. Why conditional code GO was allowed

**SOURCE_CONFIRMED:** TournamentStagesPanel stored the stage action ID but not an open-time tournament/status/version snapshot. After an external edit, list refresh could leave the old modal armed for the currently resolved same-ID stage. The generated TournamentStage model already includes mandatory version:number, so there was no need for a new API version field or owner policy. **Actual illegal server mutation is NOT_PROVEN**; backend remains the final lifecycle authority.

**Only changed files:**
1. artifacts/tournament-manager/src/components/tournament-stages-panel.test.tsx — 7 test-first RTL case definitions; existing tests retained; stage fixture gets version:1 to mirror the generated API.
2. artifacts/tournament-manager/src/components/tournament-stages-panel.tsx — snapshot of tournamentId, tournamentStatus, stageId, version, status, action at modal opening; stale warning and disabled buttons on mismatch; fresh authoritative stage-list read on confirmation; start additionally rechecks readiness and sequential ceremony; checking lock prevents double submission and cancellation during preflight. Existing start/complete endpoints and sport rules unchanged.

**Commits:** 93b4065285bcd09770d1e0125a69791e624d4e44 (tests first), d931ee7c9c628e3c7966680e0f95cac1aec2e4f1 (implementation), 8a5f2d53638b526e446ff63da5aa93384e54949d (hardening), 9aa3ad624f8b56b0fdfa2231be66c583d66e884e (positive + negative cases), cce73ec47445102b216b3f8eceb4ec9de67eb1a7 (failed-read fixture correction).

## 3. Tests: exact distinction between authored and executed

Seven authored (NOT_EXECUTED) RTL cases:
- UX046-R13-01: another editor completes active stage v1→v2 while completion dialog open; old confirm disabled; zero POST.
- UX046-R13-02: same planned status but version 1→2 invalidates start; close/reopen binds new snapshot.
- UX046-R13-03: version changes server-side after last list poll; confirm refetch catches change; zero POST.
- UX046-R13-04: reused panel A→B, same numeric stage ID, original modal cannot mutate B.
- UX046-R13-05: unchanged planned stage still starts once after fresh stage and readiness GET.
- UX046-R13-06: unchanged active stage completes once after fresh stage GET.
- UX046-R13-07: fresh GET returns 503 despite cached stage; existing stage-list error fallback, zero POST.

**A110 actual executed frontend tests:** NONE. No checked-out full monorepo with installed frozen pnpm dependencies; typecheck, targeted RTL, full suite, real Wouter/browser and PG/HTTP integration all NOT_EXECUTED. Thus no author exit codes and NO claimed RTL PASS.

**Automatic GitHub CI only:** [run 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) on exact PR52 HEAD ended FAIL, job 115995862418, step Pack19 snapshot consistency tests, **7 PASS / 1 FAIL / exit 1**. The outdated test regex expects readOnly:true while the release source uses accessMode:"read only". This baseline-contract issue is already addressed by separate PR35. **No UX046 frontend tests were reached in this CI run**; do not label UX046 feature FAIL or PASS. No manual paid rerun was requested by A110.

**A60 independent QA:** PENDING; no submitted PR52 review at inspection. SOURCE_ACCEPTED=NOT_ESTABLISHED, RUNTIME_VERIFIED=NO.

## 4. A50 test execution handoff

Use immutable checkout (Node22/pnpm10; capture exact commands, versions, TAP counts, skip counts and exit codes):

    git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
    git rev-parse HEAD
    node --version
    pnpm --version
    pnpm --filter @workspace/tournament-manager run typecheck
    pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx
    pnpm --filter @workspace/tournament-manager run test

Required independent A60 review (with A80 lifecycle peer): correct open-time version/status/tournament identity, no stale confirm POST, valid unchanged start/complete still working, query failure behavior, dialog close/reopen, DE/ceremony and qualifications unchanged, backend final authority. A real browser A→B test remains useful; do not certify it based on synthetic Wouter test alone.

## 5. Dependencies, conflicts, rollback and next step

No source changes to tournament-detail.tsx (A120 R13, PR43/50), revert-match.ts (A80/PR45), API/backend, Host UX044, Basket T055, Backup UX045, migrations, generated clients, release/main or another code lane. A110 found no shared-file conflict with PR43/50/45; future integration still requires dedicated independent gating, not A110 merge.

**POLICY OPEN:** Basket full PUT CAS (409 vs 412, version/precondition, legacy, conflict UX); plus broader owner/HQ sport/auth/backup policies belong to their owners. Withdrawn StageBasketsPanel ordinary A→B advanced draft transfer and existing-B backup overwrite remain withdrawn. Backup import creates a NEW tournament.

**Rollback:** close/discard isolated draft PR52; no deployed code or database change to undo.

**A00 next:** register PR52 with A10 using verified internal package naming, A50 test exact SHA and A60 independently assess with A80 lifecycle review. No composite SHA, no release merge, no SWARM-006 until WEB-005 backlog formally closed.

**Detailed report:** [WEB-005_A110_R13_T110_UX046_PATCH_OR_HOLD.md](./WEB-005_A110_R13_T110_UX046_PATCH_OR_HOLD.md).

**Formal result:** A110 R13 CODE L2 AUTHOR WORK DONE / PATCH_PROPOSED PR52 / QA PENDING / RUNTIME NOT_EXECUTED / RELEASE NO-GO / SWARM-006 HOLD.
