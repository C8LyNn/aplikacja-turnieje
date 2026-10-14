# WEB-005 / A120 — R17 — PR54 historical RR403 vs lawful DE/Overview TEST ORACLE

**AGENT:** A120 — Presentation & Bracket Views · **TASK:** `WEB-005-T100-A120-R17`  
**MODE:** `SOURCE-ONLY / TEST-FIRST CONTRACT` · **Date:** 2026-10-14 Europe/Warsaw  
**GO:** inspect frozen PR54 and existing independent QA, author exact synthetic React/browser acceptance contract and future smallest safe patch boundary.  
**STOP:** no code edits, new PR, cherry-pick/merge/rebase, paid CI rerun, real DB write, staging/live, SWARM-006.  
**Current classification:** `SOURCE_CONFIRMED_SCOPE_BUG` (full-tabs guard), user-visible failure `STATIC_INFERRED` without executed browser; `SOURCE_BLOCKED_FULL_CLAIM` by independent A60; `RUNTIME_VERIFIED=NO`; `PATCH_HOLD` pending exclusive future A00 GO.

## 0. Original R16 evidence provenance — no retroactive work claim

The original R16 prompt `WEB-005_WAVE_R16_AGENT_PROMPTS.md` (blob `688e9c149dcf542587125d5f05a4a9683f3ac156`) assigned A120 source-only mixed historical RR403 + lawful DE/Overview tests, not code. **No execution, original contract, report or R16 commit was found in this A120 thread or enumerated GitHub central report directory**, and PR54 HEAD did not move. A separate **R17-created retrospective absence receipt** is published as `WEB-005_A120_R16_RECOVERY_STATUS.md`. Verdict `R16_ARTIFACTS_UNAVAILABLE`; it is NOT a falsely dated R16 completion. **This document is new, actual R17 work** implementing that design request.

## 1. Verified exact GitHub and independent QA

| Item | Verified pin / disposition |
|---|---|
| Release/source baseline | `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| **P21 / PR54** | https://github.com/C8LyNn/aplikacja-turnieje/pull/54 · `OPEN DRAFT`, no merge; HEAD **`dbba0eb82920b4f324866b1b983e1211459f52ec`**, 5 commits from release, 2 changed files |
| PR54 source | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` Git blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d` |
| PR54 authored tests | `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx` Git blob `21eaad81248eb26c9430dfcd77ccb261ca11f191` |
| P14 / PR47 | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 · `OPEN DRAFT` `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`; `stage-progress-view.tsx` Git blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6` |
| **A60 source review** | `docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md` (blob `195f23368f3932889552f83a5981a90994a28cdf`) + `WEB-005_A60_R15_PACKAGE_MATRIX.json` (blob `2f3e3575da341cac87c1a54e8fee09ff41d8cecb`): **`SOURCE_ACCEPTED_RR_REFRESH_ONLY; SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE`** for exact PR54 HEAD |
| A50 original R15 receipt | `docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md` (blob `86b89937c32a01cb62253019f3d3808890b47c24`): **0 native application tests**, blocked by missing verified full checkout/pnpm/isolated executor. R17 source reports no new exact-SHA app PASS. |
| PR54 CI | GitHub run `38606249912` / job `115997784820`: `COMPLETED FAILURE` at earlier **Pack19 snapshot consistency**, not T100 RTL/typecheck/browser verdict. PR35 owns upstream matcher fix. |

**SOURCE_CONFIRMED precise bug site:** `tournament-detail.tsx` lines ~153–198 at frozen PR54:
- `rrStageIds = stages.filter(stage.format === "round_robin").map(stage.id)` contains **historical and current** RR stages.
- `hasDeniedRrDetail = rrStageIds.some(stageId => queryClient.getQueryState(getGetTournamentStageQueryKey(tournamentId,stageId))?.error status 401/403)` treats a **single old RR error** as a full panel denial.
- `if (rrStageIds.length > 0 && (denied || hasDeniedRrDetail())) return <div role="alert">...retry **all** RR IDs ...</div>` replaces children; the wrapper encloses **every `<Tabs>`** from approx line 963 through 1855: Overview, Stage/Bracket, Standings, backup/settings and legal DE.
- This conditional does not inspect **`activeDetailTab`** or **the actually selected stage**. It has no stage-scoped visibility boundary.
- Meanwhile `StageProgressView` keeps `selectedStageId` inside its own `useState`, changes it through `StageNavigation`, fetches `useGetTournamentStage(tournamentId,selectedStageId)`, and, if `detailQuery.error` is present but `detailQuery.data` still exists, can render cached participants. Therefore a parent-only test with default `tournament.activeStageId` **cannot prove safety for manually selected historical stages**. This is a **source inference**, not a measured exploit or browser FAIL.

**Expected security distinction:** denial of a *historical RR stage detail resource* does not revoke lawful current DE/Overview resources that separately return 200. When the **denied RR stage itself is selected**, fail closed for its participant/rank view and show local error/retry. If the *whole tournament/session* loses authorization (canonical tournament GET 401/403; A100 revocation), do **not** keep showing private tabs merely because the currently selected stage is DE. A100 controls whole-tournament auth/logout/cache eviction and cannot be bypassed by this UI change.

## 2. Synthetic canonical fixture: M-403-77 (must be tested RED on current HEAD, not asserted executed)

**IDs are synthetic, isolated test-only; do not use real tournament or secret.**

```json
{
  "tournament": {"id": 77, "status": "active", "activeStageId": 32, "visibility": "public_online"},
  "stages": [
    {"id": 31, "tournamentId": 77, "name": "History RR", "format": "round_robin", "status": "completed"},
    {"id": 32, "tournamentId": 77, "name": "DE Live", "format": "double_elimination", "status": "active"}
  ],
  "matches": [
    {"id": 3101, "stageId": 31, "revision": 7, "status": "completed", "winnerId": 701, "score1": 2, "score2": 1},
    {"id": 3201, "stageId": 32, "revision": 1, "status": "pending", "winnerId": null, "score1": null, "score2": null}
  ],
  "http": {
    "/api/tournaments/77": 200,
    "/api/tournaments/77/stages": 200,
    "/api/tournaments/77/stages/31": 403,
    "/api/tournaments/77/stages/32": 200,
    "/api/tournaments/77/stages/32/double-elimination": 200,
    "/api/tournaments/77/stats": 200
  },
  "cached_unauthorized_history": {"queryKey": ["/api/tournaments/77/stages/31"], "from_previous_200": "RR_STALE_PRIVATE_RANK_701"},
  "lawful_overview": "Overview-77",
  "lawful_de": "DE32 Upper/Lower/Grand Final/Reset"
}
```

Generated query keys in a concrete test must be imported from `@workspace/api-client-react`, not guessed from the JSON display above; the JSON is an **oracle/fixture description**, not an executed browser recording. Use actual DTO shapes verified against generated client and PR47's `DoubleEliminationStageState`. If fixture uses `private_online`, provide synthetic valid viewer/organizer auth only in the fake harness and segregate whole-tournament denial tests separately.

## 3. Test-first React/RTL matrix — exact selection and response sequence

Use the existing `node --import tsx --import ./test/setup-dom.mjs --test` runner, real `QueryClientProvider`, mocked canonical GET, `StageProgressView` navigation and/or actual `TournamentDetail` Tab surfaces. Seed existing cache only with synthetic data. Use `act`/controlled promises for late replies; do not turn implementation assumptions into PASS. When asserting no old rows, search DOM text/role with **distinct** sentinel values.

| Case / priority | Deterministic chronology | Required expected result | Current PR54 source status |
|---|---|---|---|
| **MIX-01 P0** | M-403-77: historical RR31 query previously fetched 200 then refetch 403; currently selected DE32 GET 200; active tab Bracket | DE32 Upper, Lower, Grand Final, Reset and StageNavigation visible; `RR_STALE_PRIVATE_RANK_701` **not visible**; **no full-page RR error**. 403 remains scoped to historical RR31. | `SOURCE_BLOCKED`: global `some(rrId)` hides all tabs |
| **MIX-02 P0** | Same fixture, active `overview`; RR31 cached query error 403, tournament/stats GET 200 | `Overview-77` and valid stats visible, no full-page RR error and no RR private rows | `SOURCE_BLOCKED` global guard |
| **MIX-03 P0** | Start in legal DE32; choose history RR31 using **StageProgressView navigation** (not just parent activeStageId). Its detail query returns 403 but retains prior cached v1 data; DE32 GET remains 200 | **Only selected RR panel** gets `role="alert"` + retry, no `RR_STALE_PRIVATE_RANK_701`, no rank/qualifier/winner leak. Bracket nav and lawful tabs remain usable. | Requires stage-selection-scoped guard; parent-only shortcut insufficient |
| **MIX-04 P0** | With RR31 selected/denied, click `Spróbuj ponownie`, RR31 GET subsequently returns authorized 200 version 8 | Show server-authoritative RR31 participant/rank only **after** successful 200. Retry **RR31 only**, not every historical RR stage; no full-page gate, no cross-stage data. | `PATCH_READY` oracle only; no execution |
| **MIX-05 P0** | Selected RR31 cached v7, GET 401/403, server still denies; revisit stage/tabs | Previously authorized RR rank never visible while denied; do not use `isLoading` alone to infer safe empty cache. Repeated 403 does not auto-retry/storm. 401 vs 403 separately. | Full-claim source block; actual runtime unknown |
| **AUTH-06 P0** | Tournament-level GET/credential revoked 401/403, or A100 session logout; the selected stage happens to be lawful-looking DE | Whole-tournament gate remains fail-closed; no A120 code bypassing A100 auth/query removal or retaining cached private bans/picks | A100-owned integration privacy gate |
| **REFRESH-07 P1** | Selected RR31 previously v7, external match revision 8 and/or status active from successful canonical /matches,/stages; canonical details reply v8 | Stage detail and standings keys invalidated on changed fingerprint; rendered rank/status comes **only** from new GET; no client ranking calculation | Narrow source `SOURCE_ACCEPTED_RR_REFRESH_ONLY` by A60; runtime unverified |
| **LATE-08 P1** | Old detail GET v7 deliberately deferred, newer v8 accepted first, then old promise resolves last | No old v7 overwrite of selected RR stage; log exact request order and cancellation, not a fabricated version guarantee | Existing authored R13 negative test; NOT_EXECUTED |
| **NONRR-09 P1** | Legal DE32/SE33 active, only DE match revision changes; stale historical RR31 is cached as 403 | No extra RR refetch from DE-only update, no denial of DE32/Overview, no endless RR polling or retries | Full UI block currently; snapshot no-storm source candidate |
| **ID-10 P1** | Switch tournament 77→78 with in-flight RR31 GET; both tournaments own distinct stage IDs/data | No tournament77 RR errors/data should blank/hide tournament78 legal stages or leak old rank | Query-key/source isolation must be tested |
| **ERR-11 P2** | Selected RR31 500/network failure with stale v7 cached, distinct from 401/403 | Do not assert freshly confirmed v8. Show explicit transient error/stale-data policy without inventing ranking; user can still navigate. A00/A60 determine whether conservative hide is required by privacy policy | Policy/UX boundary; not a source-verified PASS |

**Necessary negative control:** Seed DE32 detail to 200, historical RR31 to 403 and assert `getByText("DE32 ...")` works **after** error is cached. A test with no mounted/legal tabs (only a dummy `StageRows` under `RoundRobinReadbackBridge`) may catch private cache hiding but **cannot** prove A60's full mixed-stage visibility invariant. Existing PR54 `tournament-detail.rr-readback.test.tsx` uses one RR stage ID31 or one DE id31 and a single `StageRows` child; it has **no** simultaneous historical RR31 + DE32 + Overview fixture. The new cases are needed as test-first source additions **only after later code GO**.

## 4. Browser test protocol — runnable on approved isolated executor, not run by A120

**Setup:** full isolated per-PR checkout, Node22/pnpm10 + locked deps, two synthetic browser sessions and mocked/canonical-safe HTTP. Separate exact PR54 testing from future composite PR47+54 unless integrator separately authorizes composition. No live/private user data, no real production. Capture SHA, URL, local wall-clock time, requested routes/response status, screenshots and browser errors.

1. **BR-MIX-01:** open `tournament 77` in Overview, seed an old RR31 authorized cache, make only its detail request 403, allow tournament77+stats+DE32 GET 200. **Expected:** overview visible and DE32 accessible; no entire-tabs alert, no historical RR stale player names. Take before/after screenshot and Network waterfall.
2. **BR-MIX-02:** while on DE32 bracket view, let RR31 403 occur/linger. **Expected:** DE graph still shows Upper/Lower/GF/Reset and read-only controls; only navigating to RR31 displays a stage-scoped error.
3. **BR-MIX-03:** navigate to RR31, retry its GET as 200. **Expected:** old cached RR ranks absent during 403; only current response ranks appear following 200; count RR GETs and confirm no all-stage retry storm.
4. **BR-MIX-04:** in a second session update synthetic RR result N→N+1 while first observes selected RR. Delay old GET and resolve after new. **Expected:** eventual authoritative latest readback, no old overwrite; original DE/Overview unaffected.
5. **BR-MIX-05:** whole-tournament authorization denied separately from historical RR route denied. **Expected:** entire private view gated according to A100; no stage-level UI change bypasses auth; don't log token values.
6. **BR-MIX-06:** non-RR update only while RR historical 403 remains cached. **Expected:** no extra RR polling/refetch, lawful DE/Overview stay visible.

**Backend RR terminal roster/reopen** still depends on PR45/A80 and authorized isolated PG16; a mocked UI readback result is not proof that Undo/Revert is legally allowed on the real backend.

If no full app checkout / pnpm / browser fixture: `BLOCKED / NOT_EXECUTED` with external-executor recipe, **not** `RUNTIME_VERIFIED`.

## 5. A50 concrete execution commands — existing PR heads, no repository merge

From each independently checked-out full repo and frozen install, capture actual output + exit codes:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Focus PR54 authored test file, working directory `artifacts/tournament-manager` (POSIX):

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx
```

For future **MIX-01..11 tests**: write tests only after new A00 code-and-test lane GO; source-only test oracle above is not a test file created in R17. A50 execution must be on the **exact HEAD SHA being independently reviewed**; log `cwd,gitSHA,node,pnpm,command,exit_code,TAP pass/fail/skip,response sequence,fixture ID,redacted evidence refs`. No DB needed for mocked RTL, no paid GitHub CI rerun.

## 6. Smallest precise future patch boundary / dependency on A00 GO

**Existing code L1 A90/PR41, L2 A70/PR42, L3 A100/PR53 occupy all three R17 slots. A120 has NO CODE GO; PR54 must remain unchanged.** Next-wave fix may be small, but only after A00 closes/reallocates a slot and A60 accepts the fail-first mixed fixture.

### A. Page-level fix, `tournament-detail.tsx` (PR54-owned; future)

- **Keep** `RoundRobinReadbackBridge` mounted around Tabs to watch already-polled RR/matches while user is on Standings/Overview; preserve `rrSnapshot`, fingerprint and exact canonical query-key invalidation.
- **Remove** the global `if (rrStageIds.length > 0 && (denied || hasDeniedRrDetail())) return <full page alert>` branch; it must **never suppress lawful unrelated tabs** for an old stage-specific error.
- **Do not** replace global denial with naive `activeDetailTab === "bracket"` only or `stageId === tournament.activeStageId`: neither identifies the stage selected manually inside `StageProgressView`. Do not retry **all RR stage IDs** for one denied history stage.
- Global tournament-level auth denial is handled by A100-controlled `readOk`/session/cache mechanism; do not weaken that guard.

### B. Selected-stage fail-closed presentation, `stage-progress-view.tsx` (additional explicitly owned future hunk)

`selectedStageId` exists **only in this child component**. Correct RR-selected denial and stale-cache hiding therefore needs a **localized guard here**, not a page-wide wrapper:

```tsx
// FUTURE SKETCH ONLY — NOT APPLIED, NOT REVIEWED AS COMPILING SOURCE.
const deniedRrDetail =
  selected?.format === "round_robin" &&
  isHttp401or403(detailQuery.error);
// After StageNavigation (keep navigation usable):
{deniedRrDetail && (
  <section role="alert">
    Dostęp do wybranego etapu RR został odrzucony.
    <button onClick={() => void detailQuery.refetch()}>
      Spróbuj ponownie
    </button>
  </section>
)}
// Exclude denied data even when TanStack retained old successful payload:
{selected && detailQuery.data && !deniedRrDetail && renderSelectedStage()}
```

- Implement `isHttp401or403` using the actual generated error type (`status` or `response.status`), not a guessed 403 HTML string. The existing `detailQuery.error` generic banner should be de-duplicated against the RR deny alert.
- Query retry should target **`selectedStageId` only** and only after explicit user action, and should not unmount the navigation.
- Read-only DE block / selected DE query and canonical status display from PR47 remain unchanged; don't recreate the champion or ranking rules. A60 must separately rule on generic non-RR 401/403 privacy, which may require A100 policy.
- **Technical ownership:** if A00 authorizes **only** `tournament-detail.tsx` next wave, it can fix lawful Overview/DE availability, but it **cannot truthfully close the full selected-RR cached-data confidentiality invariant** without selected stage identity propagation or ownership of `stage-progress-view.tsx`. This is an explicit STOP/GO decision, not permission to silently edit the second file.

### C. Tests and collision control

- Test-first amend `src/pages/tournament-detail.rr-readback.test.tsx` with simultaneous RR31+DE32+Overview fixture and fake cached 403; plus `src/components/stage-progress-view.test.tsx` for StageNavigation RR-selected local error/200 retry if ownership granted. Target 2 source files + 2 test files **at most**, with separate exclusive hunks and no backend.
- **Same-file collision:** PR43 CSV (HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`) and PR50 Backup Preview (HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`) independently modify `tournament-detail.tsx`. This is confirmed same-path overlap **not** proven unavoidable same-hunk conflict. No author merge; later SWARM-006 resolves after its own GO.
- PR47 (HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`) modifies `stage-progress-view.tsx`; code amendment there must be planned against the exact PR47 state and its owner, not silently copied onto PR54 or release. A00/A60 must authorize the cross-PR dependency. No composite branch in WEB-005.
- PR53/A100 global private query eviction (HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`) has independent noncanonical bans/picks risks and a separate active L3. **Do not** broaden A120's patch to session logout, cache purge, auth token policy or cross-tournament query ownership.

**Rollback concept for a future patch:** revert only the newly authorized PR54-local edits if mixed-stage visibility fails, without touching release, PR43/47/50/53; actual deployment rollback is outside WEB-005 A120.

## 7. Signed-vs-author status and decision request for A00

**Independent A60 R15 exact HEAD:** `SOURCE_ACCEPTED_RR_REFRESH_ONLY`; `SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE`. This is a real signed source finding from A60, NOT A120's own acceptance. Current PR54 remains unchanged, and no A50 actual RTL/browser receipts or A60 post-fix QA verdict have been verified.

**A120 R17 deliverable verdict:**
- `SOURCE_CONFIRMED` unsafe presentation scope: historical RR query 403 can replace every lawful tab.
- `STATIC_INFERRED` user-visible mixed RR/DE regression; **not** a measured browser FAIL.
- `TEST_ORACLE_READY`, **NOT_EXECUTED** (0 RTL / 0 browser by A120), **NO_CODE_CHANGE**.
- `R16_ARTIFACTS_UNAVAILABLE`: retrospective evidence receipt only.
- `PATCH_HOLD`: no free lane, no source code amendments permitted in R17.
- `RELEASE_NO_GO`, `SWARM-006_HOLD`.

**One requested A00 decision, not a self-issued GO:** after an R17 lane is freed, authorize a **test-first, narrowly scoped** PR54 correction with explicit hunk/file ownership across `tournament-detail.tsx` **and** selected-stage `stage-progress-view.tsx` if needed, A60 signoff of MIX-01..05 oracle and A50 real exact-SHA test execution. If A00 grants page-only ownership, retain `SOURCE_BLOCKED_SELECTED_RR_CACHE_GUARD` as an unresolved remainder rather than claiming full fix. **No new PR/merge/deploy/SWARM-006 action** until separate authorization.
