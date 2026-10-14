# WEB-005 / A120 / R18 — P21 PR54 RR401/403 scope amendment: FAIL-FIRST TESTS; SAFE CODE FIX ON HOLD

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R18` · **2026-10-14 Europe/Warsaw**  
**Authority:** `docs/web-005/WEB-005_WAVE_R18_AGENT_PROMPTS.md`, Git blob `fd08cedcbd2db3222e4a444403180414d1666f6c`, §§0–2 and AGENT A120.  
**Authorized GO:** source-code L3 **only on existing PR54 branch**, test-first, preserve lawful DE/Overview and privacy of manually selected RR; if PR47-owned child must change, **HOLD that subcase and notify A00 before editing**.  
**Actual result:** `PATCH_REVISED_TEST_ONLY / SOURCE_BLOCKED_SELECTED_STAGE_OWNERSHIP / NOT_EXECUTED / RELEASE_NO_GO`. This artifact name is the required R18 patch report; **it does not claim a completed application code fix**.

## 1. Frozen exact GitHub evidence

| Item | Verified GitHub result |
|---|---|
| Repository | `C8LyNn/aplikacja-turnieje` |
| Release base | `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (unchanged) |
| PR54 | https://github.com/C8LyNn/aplikacja-turnieje/pull/54 · **OPEN DRAFT, unmerged** |
| PR54 old HEAD | `dbba0eb82920b4f324866b1b983e1211459f52ec` |
| **PR54 R18 new HEAD** | **`9866e5d2e73c99e01c2934a38ca1c62455efd2ed`** |
| Changed R18 commit | `9866e5d2e73c99e01c2934a38ca1c62455efd2ed` · `test(t100): R18 fail-first mixed old RR401/403 vs lawful DE and overview` |
| Production code | **No changes**. `artifacts/tournament-manager/src/pages/tournament-detail.tsx` Git blob remains `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`. Existing full-tabs denial remains on source. |
| Test file | `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx`; prior blob `21eaad81248eb26c9430dfcd77ccb261ca11f191` → **`c907d4431f632f82d1ae9bc14d7520292c332a70`** |
| PR54 compare | Now **6 commits ahead** of the unchanged release base, exactly same two total changed paths; only test file amended in R18. |
| Related PR47 | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 · OPEN DRAFT, HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`. Owns selected-stage `src/components/stage-progress-view.tsx`. No PR47 code changed. |
| PR43 CSV / PR50 backup preview | Both OPEN DRAFT, same `tournament-detail.tsx` path; heads `96a6068f69027574ac76e18d4d5a2c444b5a914a` / `5457a74187edc263730c3a4b25a663bdf5531ee9`. No merge, cherry-pick or hunk resolution. |

**Independent A60 R17 review:** [A60 R17 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), blob `ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d`; [A60 machine matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json), blob `cc6f24f582d216e99d8870d0e3519ff497fd8ad3`. On **old PR54 SHA**, verdict `SOURCE_ACCEPTED_RR_REFRESH_ONLY; SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE`. This old-SHA independent verdict **does NOT automatically accept or reject the newly authored tests or new PR54 HEAD**. A60 exact-new-HEAD review is pending.

## 2. Source-confirmed problem, fail-closed invariant

At PR54 HEAD `src/pages/tournament-detail.tsx` defines `RoundRobinReadbackBridge` around **all TournamentDetail Tabs**. It checks `rrStageIds.some(...getQueryState(getGetTournamentStageQueryKey(tournamentId,stageId))?.error status 401/403)` for **every historical RR stage**. It then returns a full replacement alert when any RR detail errors, hiding lawful Overview and current DE.

**A60's P21 blocker is real SOURCE_CONFIRMED scope, not a reproduced browser exploit.** Required two-part security contract:

1. Old historical RR31 detail resource GET401/403 cannot suppress lawful current DE32/Overview responses GET200; those views remain navigable and visible. The historical error does not grant broader permission to read RR31.
2. When the user **manually selects forbidden RR31**, the RR participant/rank data formerly cached after authorized GET200 **must be hidden** even when TanStack Query retains previous `detailQuery.data` alongside the 401/403 error. Local stage-scoped alert with retry **of RR31 only**, with StageNavigation and other tabs still usable. Whole-tournament auth 401/403 is separate: preserve A100's fail-closed private tournament gate.

**Ownership discovery:** `src/components/stage-progress-view.tsx` (PR47-owned child) holds manually selected `selectedStageId` in its own `useState`; only it knows the actual selected stage. Parent PR54 only knows `tournament.activeStageId` and selected page tab, which **need not match** manual selection. The child currently displays `detailQuery.error` banner and still evaluates `selected && detailQuery.data`. Thus a parent-only patch that simply removes the global denial guard and checks `activeStageId` leaves a plausible cached-data disclosure path for manually selected RR31. Conversely leaving the global guard denies lawful DE32. No fully safe remedy exists within the owned parent alone without a new explicit selection identity interface or a child-local guard.

**Resulting boundary:** **do not replace a known overblocking guard with an underblocking private-data leak**. This is exactly the R18 §0.7 `HOLD` clause for PR47-owned child changes. The test-only PR54 HEAD preserves prior production behavior while furnishing negative test evidence for the next authorized GO.

## 3. Actual R18 test-first source change — authored, NOT EXECUTED

**Existing test file appended two parametrized regression cases** by `for (const forbidden of [401,403])` after all existing six conceptual R13 tests. Both are `MIX-401` and `MIX-403` variants:

- Instantiate independent React Query `QueryClient` with `retry:false`, long stale cache.
- Seed `getGetTournamentStageQueryKey(77,31)` with synthetic previously authorized, now invalid participant name `RR_STALE_PRIVATE_RANK_701` and `finalRank=1`.
- Use actual `queryClient.fetchQuery({queryKey,queryFn:throw status 401/403,staleTime:0,retry:false})`, assert rejection and **retained prior data + query status error** to faithfully represent TanStack error-after-success.
- Pass **both** RR31 completed and lawful DE32 active to `RoundRobinReadbackBridge`, with distinct match IDs/revisions.
- Render two lawful fixture children: `data-testid="lawful-overview"` / `"lawful-de"`. Assert these are present **despite historical RR403/401**.
- Assert `RR_STALE_PRIVATE_RANK_701` is not visible and `queryByRole("alert") === null` (no full-tabs historical error). The synthetic lawful view fixture itself does not render RR data; **the separate manually-selected RR private-data contract remains an unimplemented, blocked additional negative test**.

**Expected test classification on unmodified production source:** `RED_EXPECTED_SOURCE_INFERRED` because the global bridge returns alert instead of both lawful children; actual Node/TAP command **NOT_EXECUTED**. The tests are not marked failed or passed until A50 actually runs them.

**What was NOT changed:** no `tournament-detail.tsx` production logic, `stage-progress-view.tsx`, React Query auth provider, generated client, backend, DB or other PR. No new PR. The test-only changes preserve the prior narrow RR refresh implementation without claiming resolved blocker.

## 4. CI actual exit vs target tests

- Prior PR54 automatic workflow `38606249912` failed Pack19, before T100 tests.
- **New PR54 HEAD automatic workflow `38626801186`** job **`116067902963`** completed **FAILURE** at step **`Pack 19 snapshot consistency tests`**: Pack19 TAP **7 pass / 1 fail**, process exit **1**, matcher expects `isolationLevel:"repeatable read",readOnly:true` whereas repo code uses `accessMode:"read only"`. Follow-on Pack20–26 and release gates SKIPPED. PR35 remains separate dedicated CI baseline repair. **No T100 React, typecheck or build ran in this workflow**.
- **A120 application test commands:** **NOT_EXECUTED**; 0 verified native RTL/browser/API/PG tests. No Node22/pnpm10/frozen-deps checkout available to A120. A50 R17 [receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) (blob `da3b9892a2675748263091c6193306c61995ce27`) likewise verifies 0 native application tests and missing trusted full checkout/pnpm.

**A50 target run when available**, separate exact PR54 checkout, from monorepo root:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Focused new regression from `artifacts/tournament-manager` working directory:

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx
```

Record `exact_sha, command, cwd, dependency_lock, node/pnpm versions, exit_code, TAP counts, HTTP statuses and request order`. No DB is needed for this mocked React test. On CURRENT PR54 source, **fail-first** is expected; A60 must validate the test oracle independently and not misconstrue intentionally RED tests as a green-release candidate.

## 5. Minimal complete follow-up patch sketch — NOT AUTHORIZED OR APPLIED

**Needs exact new A00 exclusive file/hunk assignment after PR47 collision review.** A120 cannot edit PR47-owned `stage-progress-view.tsx` under R18 because §0.7 explicitly says HOLD that subcase and report A00 before writing.

1. In PR54 `tournament-detail.tsx`, **retain** `RoundRobinReadbackBridge` for parent-stage/match snapshot observation and exact RR detail+standings invalidation, but **remove** the global `if (rrStageIds.length > 0 && (denied || hasDeniedRrDetail())) return <full-tabs-alert>` replacing the entire `<Tabs>`. Keep the tournament-wide A100 auth gate unchanged. This alone addresses lawful Overview/DE but cannot safely close manually-selected RR cached data.
2. In **PR47-owned** `stage-progress-view.tsx`, after `StageNavigation` add a **selected-stage-only** denial branch keyed by `selected?.format === "round_robin"` and actual `detailQuery.error` HTTP401/403. The branch shows a local accessible `role=alert` and a retry invoking **only `detailQuery.refetch()`**. Suppress all `detailQuery.data` use for that selected RR stage while denied, even when cached data remains. Avoid double-rendering generic error banner; do not gate legal DE or Overview, and keep DE read-only. Retain tournament-wide 401/403 fail-closed via separate A100 logic.
3. Add **test-first** selected-stage navigation fixture on explicitly owned `stage-progress-view.test.tsx`: DE32 visible with RR31 historical 403, select RR31 with retained old authorized participants, local denial, no old ranks, valid retry 200 recovers new ranks, switch DE32 unaffected. Include late N→N+1 and non-RR no-poll regressions.
4. Only after a **separate A00 GO**, create appropriately serialized file/hunk updates to own PR54/PR47 depending on assigned integration strategy. Do **not** cherry-pick PR47 into PR54 without integrator authority. Independent A60 review of new exact SHA and real A50 RTL required before `SOURCE_ACCEPTED` or release.
5. **Same-file collision:** PR43 CSV, PR50 Backup Preview, PR54 RR bridge all independently modify `tournament-detail.tsx`. Confirmed same-file overlap, **not** proven same-hunk git conflict without authorized merge. Later authorized SWARM-006 owns composite integration and rollback after formal handoff.

**Without the child-level scope GO, full historical RR403 fix is blocked**. Do not claim `SOURCE_FIXED`, `SOURCE_ACCEPTED_FULL`, `RUNTIME_VERIFIED` or `WEB005_CLOSED`.

## 6. Required A00 / A60 decision

**A00 REQUEST:** formally allocate an **exclusive narrow child file lane** for `artifacts/tournament-manager/src/components/stage-progress-view.tsx` and its test file, coordinating with PR47 author ownership (this same A120 agent, but a *separate PR*). Explicitly specify whether to amend PR47 child first, then PR54 page fix in a later controlled wave, or authorize a narrowly scoped selection contract between files. If owner/HQ chooses to accept a source-blocked exception or runtime-test debt, record that decision explicitly; A120 cannot waive it.

**A60:** independently validate the R18 fail-first tests and updated PR54 exact HEAD; old R17 scoped RR refresh approval does not transfer automatically. After any future child/page patch, re-review complete mixed RR401/403 privacy + lawful DE/Overview. **A50:** run real tests with command/env/exit on each exact SHA, if an approved executor exists. No new policy or session TTL decisions made here.

**Final R18 disposition:** `PATCH_REVISED_TEST_ONLY / SOURCE_BLOCKED_FULL_CLAIM / CHILD_OWNERSHIP_GO_REQUIRED / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`. Any future final handoff with runtime test debt needs separate owner/HQ explicit authorization; not auto-triggered by R18.
