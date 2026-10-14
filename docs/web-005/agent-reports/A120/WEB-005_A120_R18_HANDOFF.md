# WEB-005 — A120 / WAVE R18 FINAL HANDOFF TO A00

**Role:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R18` · **Date:** 2026-10-14 Europe/Warsaw  
**Authority:** `WEB-005_WAVE_R18_AGENT_PROMPTS.md` blob `fd08cedcbd2db3222e4a444403180414d1666f6c`, §§0–2 and A120.  
**FINAL STATUS:** **`PATCH_REVISED_TEST_ONLY / SOURCE_BLOCKED_FULL_RR403_FIX / A00_CHILD_FILE_GO_REQUIRED / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`**. This is **not** a claim that the original R18 production fix was completed.

## 1. Exact SHA, PR and verified source changes

- Repo `C8LyNn/aplikacja-turnieje`; release base `release/tournament-ops-20261013-01` HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, unchanged.
- **P21 PR54:** https://github.com/C8LyNn/aplikacja-turnieje/pull/54 ; **OPEN DRAFT, UNMERGED**, base release. **R18 OLD HEAD** `dbba0eb82920b4f324866b1b983e1211459f52ec` → **NEW HEAD** **`9866e5d2e73c99e01c2934a38ca1c62455efd2ed`**. R18 commit exactly this new HEAD, with **one file changed in R18**.
- **R18 test source:** `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx`; blob **`21eaad81248eb26c9430dfcd77ccb261ca11f191` → `c907d4431f632f82d1ae9bc14d7520292c332a70`**. Added two fail-first `MIX-401/403` cases (one parameterized `test()` definition) with actual TanStack Query successful-cache-then-refetch-denied data preservation and lawful DE/Overview children. Tests are **AUTHORED, NOT EXECUTED**; RED is **source-inferred**, not an observed TAP fail.
- **Production code not changed in R18:** `artifacts/tournament-manager/src/pages/tournament-detail.tsx` still blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`, with global `any historical RR401/403` full-tab guard. Combined PR54 branch remains **6 commits ahead / same two paths total**.
- **Related P14 PR47:** https://github.com/C8LyNn/aplikacja-turnieje/pull/47, unchanged `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`, OPEN DRAFT. Its `src/components/stage-progress-view.tsx` owns manual `selectedStageId` and is **not authorized for A120 modification under this R18 PR54 lane without explicit A00 reassignment**.
- **Same-file collisions:** PR43 `96a6068f69027574ac76e18d4d5a2c444b5a914a` and PR50 `5457a74187edc263730c3a4b25a663bdf5531ee9` both edit `tournament-detail.tsx`. Neither was merged/cherry-picked; this is file-level overlap, not necessarily same-hunk conflict.

## 2. Independent QA and actual executable evidence

- **Independent A60 R17 source QA:** [WEB-005_A60_R17_INDEPENDENT_QA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), blob `ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d`; machine matrix blob `cc6f24f582d216e99d8870d0e3519ff497fd8ad3`. On OLD PR54 SHA: **`SOURCE_ACCEPTED_RR_REFRESH_ONLY / SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE`**. This signed old-SHA review is real, but **no A60 exact NEW HEAD review is claimed**.
- **A50 R17 receipt:** [WEB-005_A50_R17_RECEIPT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md), blob `da3b9892a2675748263091c6193306c61995ce27`: only Node/Git environment preflight, no full repo checkout/pnpm, **0 app RTL/API/PG tests**.
- **A120 R18 native commands:** `NOT_EXECUTED` for React RTL, typecheck, build, browser and isolated PG16; actual app `exit_code=NULL`, `PASS=NULL`, `FAIL=NULL` and `SKIP=NULL`. Source-only code review + GitHub blob/PR/CI checks are not app test execution.
- **New automatic PR54 CI:** run `38626801186`, job `116067902963` = `COMPLETED FAILURE`. Pack19 snapshot contract **7 PASS / 1 FAIL**, exit **1**; expects `readOnly:true`, code uses `accessMode:"read only"`. Pack20–26 and release gates were SKIPPED; **no target T100 RTL/typecheck/build ran**. No paid/manual rerun, no Pack19 code modifications by A120.
- **New exact SHA A60 verdict:** `PENDING` and must independently review test-source changes and any later true source fix. Do not transfer old A60 signature to new HEAD.

## 3. Why R18 full production patch is blocked, not silently weakened

A120 confirmed the precise conditional in PR54: `RoundRobinReadbackBridge` enumerates all RR stage IDs and returns a full replacement alert for any history RR query 401/403. That blocks lawful DE32 and Overview 200. Fixing that overbroad parent guard **alone** exposes a separate possible confidentiality regression: `StageProgressView` stores manually chosen selected stage ID inside its child and currently renders `detailQuery.data` even with `detailQuery.error`. The parent only knows `tournament.activeStageId` (not manual selection). No safe source-complete page-only workaround was established that meets **both** lawful DE/Overview and selected forbidden historical RR no-stale-privacy acceptance.

**R18 §0.7 explicitly instructs HOLD** if changes to the PR47-owned child are necessary. Therefore **A120 did not alter production source**, rather than remove a privacy guard without replacing it with stage-local fail-closed rendering. This is `SOURCE_BLOCKED_BY_FILE_OWNERSHIP`, not a complete implementation. A00 should not label P21 `SOURCE_FIXED` solely because the test-first commit exists.

## 4. Concrete test oracle and requested smallest new GO

- **Published principal R18 patch/hold evidence:** [WEB-005_A120_R18_PR54_RR403_PATCH.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R18_PR54_RR403_PATCH.md). Includes exact old/new SHAs, two actual committed tests, expected red source, focused A50 commands, precise future fix sketch and restrictions.
- **Existing R17 full oracle:** [WEB-005_A120_R17_PR54_TEST_ORACLE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R17_PR54_TEST_ORACLE.md). Scenario historical RR31 GET403 cached former 200 + lawful DE32/Overview GET200; selected RR31 must show local error and hide old rank; authorized selected RR retry 200 restores backend state, N→N+1 refresh, old late response, DE-only no poll, whole-tournament denial fail-closed.
- **Exact narrow missing code ownership requested from A00/HQ:** `artifacts/tournament-manager/src/components/stage-progress-view.tsx` and its `stage-progress-view.test.tsx` (PR47-owned) to implement manual-selected RR401/403 cache-hiding plus local selected-stage retry after StageNavigation. Also authorizes removal of global overbroad guard in PR54-owned `tournament-detail.tsx` only **after** stage-local guard is safely handled; maintain RR canonical fingerprint refetch observer. Specify separate serialized base/hunk plan; do not silently cherry-pick PR47 or create a composite branch in WEB-005.
- A60 must independently approve the comprehensive **two-boundary invariant** (old historical RR denial does not hide DE/Overview, selected denied RR reveals no cached rows, whole-tournament auth revocation still fail-closed). A50 on approved Node22/pnpm10 frozen clean per-SHA checkout must run React tests/typecheck/build with exact SHA, exit codes and logs. Selected-stage tests **not yet committed**, because the child source file lacks R18 authorization; original R17 description remains an oracle.
- Owner/HQ product policy decisions (Swiss/SE/DE ranks, Basket CAS, Backup portability and TTL/digest) remain separate; A120 makes none.

## 5. Direct A00 decision and hard STOP

**DECISION REQUEST:** allocate exclusive cross-PR file/hunk ownership of `stage-progress-view.tsx` with test-first local RR denied rendering (either amend PR47 first or separately approved safe selection contract); then authorize follow-up PR54 page guard removal and A60 review. Alternatively record an explicit owner-approved exception for P21 with a precise residual privacy+availability risk; A120 cannot accept or waive this risk itself.

**NO SELF-CERTIFICATION:** `PATCH_REVISED_TEST_ONLY` is a GitHub-observed change, while `SOURCE_ACCEPTED`, `RUNTIME_VERIFIED`, `WEB005_FINAL_CLOSEOUT` and `FINAL_HANDOFF_GO` are **not** established. All remaining 21-packet cross-PR integration is later SWARM-006's responsibility only after HQ handoff permission.

**STOP respected:** no new PR, merge/cherry-pick/rebase, composite checkout/branch, auth/cache helper changes, backend changes, SQL/PG reset, manually paid CI rerun, staging/live/Replit, own-source QA acceptance or SWARM-006 dispatch.

**END STATUS:** `R18_A120_HANDOFF_PUBLISHED / P21_TESTS_FIRST_ONLY / FULL_SOURCE_FIX_BLOCKED_PR47_CHILD_SCOPE / A50_RUNTIME_ZERO / RELEASE_NO_GO / SWARM006_HOLD`.
