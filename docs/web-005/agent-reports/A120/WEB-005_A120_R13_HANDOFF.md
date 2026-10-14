# WEB-005 — Agent A120 — WAVE R13 HANDOFF FOR 00

**AGENT:** A120 — Presentation & Bracket Views  
**TASK:** `WEB-005-T100-A120-PR-B-R13` | **WAVE:** R13.1 | **DATE:** 2026-10-14 Europe/Warsaw  
**AUTHORITY:** central R13 `WEB-005_WAVE_R13_AGENT_PROMPTS.md` blob `ec765236516cb63c1dd62e0e9257943ad9c9cc71`; CONDITIONAL GO CODE L3 on source-confirmed F058; test-first isolated source-only, DRAFT PR.  
**AUTHOR STATUS:** **PATCH_PROPOSED / SOURCE_GAP_CONFIRMED / RUNTIME_NOT_EXECUTED / A60_ACCEPTANCE_PENDING / RELEASE_NO_GO**.

## 1 — Repository, branch, PR, exact SHA

- Repository: `C8LyNn/aplikacja-turnieje`.
- **BASE:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (no writes).
- **R13 branch:** `fix/web-005/t100-rr-readback-r13`.
- **NEW DRAFT [PR #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54)**, OPEN/UNMERGED.
- **PR54 HEAD:** `dbba0eb82920b4f324866b1b983e1211459f52ec` (5 commits, independent of PR47; no cherry-pick/merge).
- **Changed exactly two files** under `artifacts/tournament-manager/src/pages/`:
  - `tournament-detail.tsx` blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`: `RoundRobinReadbackBridge` around organizer tabs, scoped RR stage+match fingerprint, conditional invalidation of canonical Stage Details and tournament standings, 401/403 cached RR detail suppression + retry.
  - `tournament-detail.rr-readback.test.tsx` blob `21eaad81248eb26c9430dfcd77ccb261ca11f191`: authored test-first React Query fixtures.
- PR47 PR-A [link](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`, OPEN DRAFT/UNMERGED; no reimplementation of F052/053/054/055.
- Release and main not merged/deployed. Current actual production SHA UNKNOWN.

## 2 — Source-confirmed gap and outcome

Prior parent polls `/matches` and `/stages` every 5s, but `StageProgressView` reads canonical `/stages/:stageId` detail (backend stage participant `finalRank/status/seed`) via a different React Query key **without** periodic readback. An external host update changes matches/stages but not the local invalidation helper; classification can remain cached.

**R13 patch design:** detect changed RR status/match revision or results from already-polled canonical parent responses → invalidate exact existing stage-details key and tournament-wide standings key → force React Query GET for active subscribers. No synthetic rank, winner, group policy, qualification, sport-rule or new backend endpoint. Unchanged snapshots trigger no invalidation. SE/DE fingerprints not watched. Bridge remains mounted across the organizer tabs, not only the Bracket tab. React Query handles request generations; actual late-response behavior requires A50/A60 execution.

**Privacy boundary:** when canonical RR Stage Detail GET explicitly returns 401/403, the bridge suppresses cached tab content and offers retry. This protects presentation only within this page; global auth/logout/cross-route cache clearing is owned by A100/R13 L1. The code doesn't edit A100 auth helper files or token policy.

## 3 — Evidence level, commands, exact CI outcome

- **STATIC SOURCE validation by author:** 10/10 targeted invariants on `dbba0eb82920b4f324866b1b983e1211459f52ec`. This is **not** React QA PASS.
- **TEST-FIRST evidence:** first commit `7ff81355ec42e8f1255796e3477fc02147163bac` adds fixtures ahead of production commit `3da338a59f2dd140e52b38b180576003b5dfd1c3`; final test extension `af398fcd71615269174dfdb941ec08fad4d9dfd9`.
- **Author tests:** React RTL `NOT_EXECUTED`; frontend full suite `NOT_EXECUTED`; typecheck `NOT_EXECUTED`; build `NOT_EXECUTED`; browser `NOT_EXECUTED`. No commands with app exit codes or installed dependencies available in A120 environment. No real PostgreSQL required/used for these mocked frontend tests.
- **Actual GitHub automatic CI:** run **`38606249912`**, job **`115997784820`** completed **FAILURE**, stop step 8 **Pack19 source contract**, TAP 7/8 PASS / 1 FAIL, process exit 1; old `readOnly:true` test expectation versus valid `accessMode:"read only"`. Follow-on Pack20+/release tests SKIPPED. Existing unmerged PR35 owns Pack19. **No frontend T100 RTL/typecheck/build was run by this workflow.** No manual CI rerun.
- **Independent A60 SOURCE_ACCEPTED:** PENDING / not established on exact PR54 HEAD.

### A50 isolated safe next commands (proposed, not executed by A120)

From checked-out exact PR54 HEAD and frozen dependencies, Node22/pnpm10:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Focused React test source: `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx`. Core cases: external revision N→N+1, deferred late N response, 401/403 cached read denied then retry 200, DE no-op, stage-only terminal RR reopen and unchanged/rejected event no-op. Ask A50 to capture actual command, cwd, HEAD, Node/pnpm versions, stdout/stderr and exit code; no secret or production token. Browser acceptance only when A00 authorizes isolated QA. Full-stack PG16 for backend PR39/42/45 remains another owner's lane.

## 4 — Dependencies and file conflict owner

- **FILE COLLISION:** PR43 CSV HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a` and PR50 Backup preview HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9` both change `tournament-detail.tsx`. A120 branch isolated at release base. No merge/rebase/cherry-pick, hunk resolution or composite branch; later integrator owns it.
- **PR47** (A120 earlier DE Details) modifies different files; stays separately QA pending. F054 champion winnerId is **RETEST ONLY**.
- **PR45** (A80) terminal RR stage-only roster, **PR39/42** (A70) Cancel/Undo authoritative response and 409 rejection contract: OPEN DRAFT / native PG16 acceptance not assumed. PR54 only consumes GETs, does not choose lifecycle policies.
- **A100 R13 L1** owns true session logout/private cached data across routes; local stage error-guard is not claimed to solve global auth, TTL, token hashing or rotation.
- **A60 independent QA:** check snapshot/signature correctness, actual React Query cancellation and late responses, possible 401/403 stale content on other queries/routes, recovery and re-fetch costs, non-RR invariance, and PR43/50 conflicts.
- **A00** owns test prioritization, later hunk resolution and policy queue, determines any rework code-lane authorization.

## 5 — GO / STOP / NEXT for coordinator A00

**GO performed:** verified §0–§2 and A120 R13 mandate, checked PR47/43/50/45/39/42 + release SHA, source-confirmed RR readback gap, committed tests before patch, implemented narrow page-local readback, opened **DRAFT PR54**, recorded source checks and actual CI failure, wrote R13 documentation + this handoff.

**STOP respected:** no backend, no auth/cache helpers, no A110 stage-panel, no migrations/SQL, no shared DB, no cross-PR integration, no paid CI reruns, no Replit, no staging/live, no release/main merge, no SWARM-006.

**NEXT:** A50 runs frontend-only test/typecheck/build on PR54 SHA and provides real exit codes → A60 issues independent SOURCE_ACCEPTED/FAIL and runtime verdict → A00 decides bounded rework and schedules conflict resolution for the later designated integrator. If test or review shows unresolvable auth policy or hunk conflict, **HOLD patch** rather than silently expand scope. **Release NO-GO; final SWARM-006 handoff deferred**.

**Detail report:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R13_T100_PR_B_PATCH_OR_HOLD.md
