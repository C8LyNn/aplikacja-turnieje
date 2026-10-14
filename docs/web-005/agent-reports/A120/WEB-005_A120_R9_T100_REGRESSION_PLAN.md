# WEB-005 — A120 — R9 / T100 Presentation State Reliability

**Artifact:** `WEB-005_A120_R9_T100_REGRESSION_PLAN.md`  
**Task:** `WEB-005-T100-A120-R2` | **Agent:** A120 | **Wave:** R9.1 | **Date:** 2026-10-14 Europe/Warsaw  
**Owner / QA:** A00 Implementation Lead / A60 Independent QA; execution harness: A50  
**Authorization:** SOURCE-ONLY / REGRESSION CONTRACT — **NO FRONTEND CODE / NO PR / NO MERGE / NO PROD**.  
**Verdict:** `SOURCE_CONFIRMED` scope and regression contract READY; `RUNTIME_VERIFIED` = **NO**; implementation **HOLD**.  
**Input:** central `docs/web-005/WEB-005_WAVE_R9_AGENT_PROMPTS.md` on `chore/web-005/t000-wave1-control`, blob `edd4f1e5ce48bca4f10f049d52d098c098261db3`; R1 `WEB-005-T100-A120-R1.md`; WEB-004 HANDOFF R2.

## 1. Pinning and evidence discipline

| Branch / PR | Verified state on 2026-10-14 | Purpose |
|---|---|---|
| `main` | `c50cc48e6fa508592bda3f4838111e9cff5af80c` | Comparison only |
| `release/tournament-ops-20261013-01` | **`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`** via Git `refs/heads/...` and PR #32 | **Actual source baseline** |
| PR #32 | OPEN, unmerged, HEAD = above | F054 source mitigation present here, not necessarily deployed |
| PR #39 T040 MP1 | OPEN DRAFT, `16053ee132756ca05b6f2cd1f0cabae823905387` | Lifecycle dependency, NOT in release |
| PR #40 Pack17 | OPEN DRAFT, `9a8287271299a59fc9291b8d253299a8d109a35d` | QA/CI dependency, NOT in release |
| Central documentation branch | `01bf9e8e73678cb762d2b4c7b29467eb674a9ad4` | Control and instructions only |
| PR #32 CI | run `38407744200`, completed FAILURE | NOT a passing runtime gate |

**SOURCE_CONFIRMED** indicates inspected code path at the specified SHA. **STATIC_INFERRED** is a consequence plausible from static code. **HYPOTHESIS** awaits execution. **SOURCE_ACCEPTED** is not runtime verification. **NOT_EXECUTED** for all T100 React/browser/PG tests in this wave. Production SHA unknown. No claim that a frontend finding occurs on live.

Cross-check R1: `WEB-005-T100-A120-R1.md` is previous **design**, not tested implementation. Existing bracket/projector/audience parity tests already guard stage selection and DE elsewhere; this R9 contract adds missing states without reopening layout redesign.

## 2. Source map: authority versus cache

| Surface / data | Source-of-truth and client | Current behavior / risk | Contract boundary |
|---|---|---|---|
| Organizer Details → Bracket | `pages/tournament-detail.tsx:1463-1472` → `components/stage-progress-view.tsx` | StageProgressView handles groups/SE/Swiss/RR, but **not DE** (`:169-271`) | Display DE from **dedicated DE API**, not synthetic generic bracket |
| Selected stage | `/tournaments/:id/stages` + `:stageId` detail (`useListTournamentStages`, `useGetTournamentStage`) | `stage-progress-view.tsx:52-80` no `refetchInterval` or reactive invalidation on external updates | On completed→active transition, eventually show authoritative Stage Details and status; don't synthesize stage lifecycle |
| Stage standings RR | GET `:stageId` → `participants` with `finalRank`, `stageSeed`, `status` + stage-specific matches | `ParticipantTable` in `tournament-stages-panel.tsx:200-280` sorts by `finalRank`, then `stageSeed`, and renders record from passed stage matches | UI reflects backend fields; no client-side policy for tiebreaks, advancement or winner |
| DE state | `GET /tournaments/:id/stages/:stageId/double-elimination` | Public Bracket queries `useGetDoubleEliminationStage` (`tournament-bracket.tsx:84-103`) and renders `DoubleEliminationBracket` (`:304-309`). Organizer StageProgressView lacks branch. | Preserve Upper/Lower/Grand Final/Reset schema and optional read-only mode |
| Public stage selection | `lib/public-stage.ts` | `selectPublicStage()` prefers active, then highest-position completed; `publicStageBracket()` filters matches by `stageId` | No all-stage bleed; preserve stage-specific view |
| Audience LIVE | `tournament.status`, `winnerId`, `featuredMatchId`, matches; name by player ID, optionally standings ID lookup | `tournament-audience.tsx:234-241`, `:446-574`: `heroMatch` condition precedes `status === completed` | Completed tournament is display priority; no orphaned featured match suppresses summary |
| Official champion | `tournament.winnerId`, player/standing **lookup by player ID** | `tournament-audience.tsx:230-233` + `tournament-audience.test.tsx:164-185` already retain #32 fix | F054 **RETENTION ONLY**; never `standings[0]` as champion authority |
| Stage labels | `STAGE_FORMAT_LABELS` in `lib/tournament-stages-ui.ts` has five formats; local maps in Bracket/Audience have only three | Bracket local map `:30-34`; Audience `:52-56`, final badge `:569-571` | Translate known values; use `stage.format` for stage, preserve `tournament.format` compatibility field for tournament-wide text |
| Shared query invalidation | `lib/tournament-query-invalidation.ts:22-40` | `invalidateTournamentDependentQueries()` includes `getGetTournamentStandings`, generic bracket and stage-prefix predicates; not automatically called for external writes | For cross-client reopen, no assumed instantaneous invalidation; implement bounded refresh only after lifecycle semantics verified |
| Read query state | `components/read-query-state.tsx:5-23` | With refetch error and cached data, warning explicitly says freshness cannot be confirmed | Reuse visible failure/retry semantics; don't present cached final rank as *confirmed current* |

**Important split:** the public `GET /tournaments/:id/standings` aggregates tournament-wide results and is not equivalent to Stage Details participant `finalRank`. Source `getTournamentStageDetails` in `artifacts/api-server/src/application/stages/stage-queries.ts:46-125` returns stage participants and ranking, ordered/derived from stage-specific membership. UI must not substitute global standings for reopened RR stage rank. `RoundRobinView` uses a separate optional `standings` prop; StageProgressView renders the `ParticipantTable` and calls `RoundRobinView ... hideStandings`, so changes to generic RR widget are not a substitute for refreshing stage-specific details.

## 3. Finding disposition: exact expected / actual / minimal test

| ID | Priority, evidence | **Actual at release source** | Expected after bounded patch | Negative fixture and non-ownership |
|---|---|---|---|---|
| **A20-F052** DE Organizer Details→Bracket | P2 `SOURCE_CONFIRMED` | `StageProgressView` format chain ends in `return null` for DE (`:271`). Public Bracket renders canonical DE state separately. | In Organizer Details selecting active DE displays Upper/Lower/Grand Final (+Reset if supplied), scoped to selected stage, with loading/error handling. No score-write controls in read-only branch. | `DE-DETAILS-21`, `DE-ERROR-21`, `DE-SWITCH-21`. Don't repair DE routing, GF/placement logic. |
| **A20-F053** incomplete labels | P2 `SOURCE_CONFIRMED` | Public Bracket/Audience local maps omit `group_stage` and `double_elimination`; raw enum fallback possible. | Five known labels consistent with `STAGE_FORMAT_LABELS`; stage headings use `stage.format`, not compatibility `tournament.format`. | `LABEL-MIXED`. Don't redefine tournament format compatibility semantics (POLICY_OPEN). |
| **A20-F055** finished Audience overlay | P2 `SOURCE_CONFIRMED` | Non-null `heroMatch` renders before completed summary even if tournament is `completed`. | When canonical tournament GET returns `completed`, final summary and official winner take priority over retained `featuredMatchId`. Noncompleted tournaments retain live/featured UI. | `FINAL-FEATURED`, `ACTIVE-FEATURED`. Don't change saved match or clear backend featured match. |
| **A20-F058** stale RR standings | P2 `SOURCE_CONFIRMED` lack of stage-detail polling; user symptom `STATIC_INFERRED` | Stage status list/details queries in StageProgressView have no interval. Parent matches poll at 5s; cached Stage Details/participants may remain terminal after remote Revert/Undo. | After authorized backend reopen and eventual successful stage GET, status heading and ranked rows reflect **fresh stage payload**. Before GET success, show loading/freshness warning rather than claim terminal authority; cross-ID stale responses cannot leak. | `RR-REOPEN-4`, `RR-8TO4-4`, `RR-DELAY-4`; back-end reopen policy is **T050/T040**, not A120. |
| **A20-F054** champion banner | P2 `PATCH_PROPOSED` / source-mitigated PR #32 | Release already resolves winner from `tournament.winnerId` by ID; test `completed Audience names the persisted winner, not the aggregate standings leader` exists. | Existing regression remains unchanged, even after F055 change; ID=202 remains winner when standings leader=201. | `FINAL-FEATURED` contains winner mismatch; keep test source and do not recreate fix. |

`F058` statement strictly concerns missing automatic freshness trigger, not a proven browser incident. Local stage mutations may already invalidate query keys through another component. Never claim all UI paths are stale.

## 4. Reproducible read-only fixtures and API response sequencing

**Companion file:** `WEB-005_A120_R9_T100_FIXTURES.json` (synthetic only, no actual user data). Fixture IDs are defined in its `scenarios`, with request URLs, toggled GET phases, state expectations and React test identifiers. Reuse JSON as a *source template* and conform to generated `@workspace/api-client-react` types when composing actual tests. Tests may add mandatory fields omitted for readability; no production fetch.

- `DE-DETAILS-21`: tournament 9001, RR stage 20 completed, terminal DE stage 21 active; GET `/api/tournaments/9001/stages/21/double-elimination` returns revision=4, Upper and Lower, Grand Final and Grand Final Reset; GET Stage Details returns participants. `StageProgressView` must not rebuild DE from generic match list and must not show score inputs. Existing DE type/sample fixture: `public-stage-views.test.tsx:39-47`, `double-elimination-bracket.test.tsx:19-33`.
- `DE-ERROR-21`: first DE GET is deferred (assert explicit loading), then HTTP 403 or 500 (assert explicit error/retry), then valid GET (assert recovery). Failure is **not** an empty bracket. No backend writes.
- `DE-SWITCH-21`: stale stage 20 RR request completes after stage 21 DE was chosen. Current stage shows DE 21, no RR 20 participant leaks, selectedStageId and query-key remain 21. Historical stage selection is allowed when intentional; never force active selection over manual choice without policy.
- `LABEL-MIXED`: `tournament.format = round_robin` retained for compatibility while `stage[21].format = double_elimination`. Bracket stage heading must say `Podwójna eliminacja`; final Audience badge translation assertion uses a separate tournament fixture where `tournament.format=double_elimination`. **Do not require** tournament-wide badge to claim DE when `tournament.format` is RR — that would change semantics.
- `FINAL-FEATURED`: tournament 9002 `completed`, `winnerId=202`, `featuredMatchId=901`; match 901 remains present/completed; global standings leader is player 201. Result must show final summary / 202, not match card / 201. With `ACTIVE-FEATURED`, tournament remains `active`, so featured/live match card must remain.
- `RR-REOPEN-4`: tournament 9003, RR stage 31 participants P301–P304. BEFORE: completed/winner assigned/final ranks and all matches done. AFTER successful **authorized** backend operation: stage active, winner cleared, one match pending, stage participant ranks/status exactly as returned by stage GET. A120 asserts rendering of AFTER payload, not whether Undo itself is legal. If backend policy rejects revert 409, UI must remain BEFORE and no fabricated reopening.
- `RR-8TO4-4`: tournament 9004 Stage 40 SE8→Stage 41 RR4. P405–P408 remain eliminated/nonqualified after stage 41 reopen. Stage roster contains only P401–P404. The actual backend invariant belongs to A80/T050; frontend checks ID presence/order after authorized GET.
- `RR-DELAY-4`: trigger updated GET `/stages`, deliver updated `/matches` quickly, defer `/stages/31` (with old rank cached) and/or fail with 500; verify no inaccurate 'current' freshness assertion, then deliver new details and verify convergence. Late response from old stage must not supersede stage 31.

**Sequence control for A50/A60:** disable/override background timers in deterministic React harness; `QueryClient` isolated per test; `globalThis.fetch` intercepts only local mock URLs; optionally gate response with promise/deferred resolver. For browser run, use locally hosted *isolated fixture* and explicit response barriers, not production. Reset QueryClient/store/auth between scenarios. Tag successful GET phase `before` or `after` in trace, with stageId, tournamentId and request index (never token). Keep transition controlled, no unapproved live Undo/Revert.

## 5. Ten **React** cases, exact matrix (planned; none executed)

| ID | Priority | Fixture + target spec | Trigger and deterministic expected assertion |
|---|---|---|---|
| `RT-T100-01` | P2 | `DE-DETAILS-21` → **new** `components/stage-progress-view.test.tsx` | mount Organizer Bracket tab for active DE21; GET DE stage exactly `/stages/21/double-elimination`; Upper/Lower/GF visible; no blank body, no write/score controls; correct ID and revision |
| `RT-T100-02` | P2 | `DE-SWITCH-21` → same | RR stage20 selected, select DE21; finish delayed RR20 details after 21; no RR20 players in DE21, query stage ID 21, no cross-stage graph leak |
| `RT-T100-03` | P2 | `DE-ERROR-21` → same | pending DE GET→loading text; 403/500→error/Retry; valid refetch→DE graph. No silent empty surface, no GET to wrong stageId |
| `RT-T100-04` | P2 | `LABEL-MIXED` → **extend** `pages/public-stage-views.test.tsx` | public Bracket active DE21 with `tournament.format=round_robin`; shows `Podwójna eliminacja`, not raw enum / compatibility RR; existing stage-only DE graph maintained |
| `RT-T100-05` | P2 | `FINAL-FEATURED` → **extend** `pages/tournament-audience.test.tsx` | completed status + retained featured completed match; `Turniej zakończony!` visible; winner P202 visible; featured hero card absent in LIVE section |
| `RT-T100-06` | P2 | `ACTIVE-FEATURED` → same | tournament active, valid featured live/done match; existing hero UI visible; no premature completion overlay |
| `RT-T100-07` | P2 retention | `FINAL-FEATURED` winner mismatch → same existing regression `:164-185` | persist `winnerId=202`, standings leader P201; final banner must identify P202 before and after explicit refetch; **no duplicate F054 patch** |
| `RT-T100-08` | P2 blocked on lifecycle | `RR-REOPEN-4`, `RR-8TO4-4` → **new** `components/stage-progress-view.test.tsx` | completed→active response sequencing; `Klasyfikacja bieżąca etapu` plus rows from new Stage Details, P405–P408 excluded for multistage; no winner banner after legal reopen |
| `RT-T100-09` | P2 | `RR-DELAY-4` → same | delayed or failed `/stages/31` during refetch: retain last data only with freshness warning / safe pending marker; recover to new stage details; do not display stale final ranking as newly confirmed |
| `RT-T100-10` | P2 | `LABEL-MIXED` → **new/extend** `lib/tournament-stages-ui.test.ts` and audience test | five labels in single shared map: SE/Swiss/RR/group/DE; no raw `double_elimination` / `group_stage` in known format UI; `tournament.format` distinction preserved |

**Count: exactly 10 planned React checks.** `RT-T100-07` is a *retention check* of existing test source, not an assertion that a new test must duplicate it. `RT-T100-08` has two fixtures within **one logically parameterized test contract**; implementer may split at their discretion and must report actual test count. All statuses `NOT_EXECUTED` until A50/A60 logs show real command, SHA, exit code and result.

## 6. Four **browser** scenarios for A50/A60 (planned; none executed)

| ID | Fixture / setup (isolated ONLY) | Interaction and required evidence | Acceptance |
|---|---|---|---|
| `BR-T100-01` | `DE-DETAILS-21`, initialized via local synthetic read fixture; user with authorized viewing access | Open Organizer Details/Bracket, then public `/bracket`, `/projector` and `/audience?section=bracket`; capture stage ID, DE revision, screenshots, request URLs | all surfaces show stage21 Upper/Lower/GF; no mix from RR20; Organizer Details has clear read-only state |
| `BR-T100-02` | `RR-REOPEN-4` + `RR-8TO4-4`; isolated DB/event harness **only if A50 authorizes physical PG16 and policy is signed** | Complete legal stage, issue authorized Undo/Revert or simulate signed event, observe GET old/new phases and updated headings/rows | accepted reopen: stage active, fresh rank, correct participants; rejected policy: 409 + no DB writes and unchanged UI; no false 'completed' after successful refresh |
| `BR-T100-03` | `FINAL-FEATURED` and `ACTIVE-FEATURED` in disposable seeded server | Keep featuredMatchId attached across simulated completed transition, reload Audience LIVE and refetch | completed shows official champion 202 and summary, no match hero; active keeps match hero, never wrong standings leader 201 |
| `BR-T100-04` | `DE-SWITCH-21`, `RR-DELAY-4` simulated latency (controlled mock server) | Rapidly switch RR20→DE21, delay responses, then reload; record screenshots and network request ordering | no previous-stage names in current DE canvas or rank; explicit loading/error/recovery; no cross-tournament private leakage |

**Count: exactly 4 planned browser scenarios.** No product freshness SLA is invented. Deterministic React checks wait for explicitly controlled post-transition successful GET; browser checks must log actual response settlement and any observed delay. A00 may set an engineering timeout for test harness separately; that timeout is not a claim of guaranteed user-facing consistency.

## 7. Minimal future PR plan (NOT authorized for code in R9)

### Future PR-T100-A: P2 source-local presentation fixes; independent of DB/sport policy

**Fixes:** F053 → F052 → F055, retain F054.  
**Bounded source files:**
1. `artifacts/tournament-manager/src/pages/tournament-bracket.tsx` — use existing `STAGE_FORMAT_LABELS` for stage header.
2. `artifacts/tournament-manager/src/pages/tournament-audience.tsx` — use existing map for all supported format IDs and prioritize completed tournament over match hero; keep `winnerId` lookup.
3. `artifacts/tournament-manager/src/components/stage-progress-view.tsx` — unconditional `useGetDoubleEliminationStage` hook with `enabled` selected DE stage, dedicated read-only `DoubleEliminationBracket`, query/error/loading and selection key. **No backend edits.**

**Bounded tests:** `pages/public-stage-views.test.tsx`, `pages/tournament-audience.test.tsx`, **new** `components/stage-progress-view.test.tsx`, optionally a narrow format-mapping test. `lib/tournament-stages-ui.ts` already has five labels: **prefer import, no modification needed**. Check `canManage` remains false in Organizer Details unless a separate product decision authorizes score mutation there. PR from verified release baseline, not another agent's draft; separate PR branch created **only after A00 explicit code GO**.

### Future PR-T100-B: P2 Round Robin reload after lifecycle signatures

**Fixes:** F058 only, after T040 MP2A / T050 RR reopen authoritative state transitions are stable; no client invented policy.  
**Likely source files:** `components/stage-progress-view.tsx` (small scoped refresh/invalidation, status and rank label); optional narrowly audited `lib/tournament-query-invalidation.ts` if a *proven missing mutation invalidation* exists. Avoid gratuitous edits to `tournament-detail.tsx`, backend `routes/tournaments.ts`, OpenAPI and global standings.  
**Tests:** focused `stage-progress-view.test.tsx` (`RT-08/09`), safe browser `BR-02/04`, backend event contract supplied by A80/A70. Follow PR-A sequentially because `stage-progress-view.tsx` overlaps; no concurrent cherry-pick.

No wide redesign, no changes to Swiss pairing, DE GF Reset placements, Round Robin tie-breaks, undo locking, authentication or DB migrations in either future PR.

## 8. Dependencies, STOP rules and open policies

| Owner / task | Needs from owner before code / runtime acceptance | A120's limit |
|---|---|---|
| **A70 / T040** | Deterministic Cancel/Revert/Undo result and zero-write negative scenarios; PR39 MP1 draft not deployed; MP2A global LIFO unmerged | no mutation code, no changing `revert-match.ts` |
| **A80 / T050** | Single-stage/multistage RR reopened response shape and eliminated P405–P408 invariant; SE currentRound behavior clarified | no backend lifecycle implementation |
| **A80 / T051** | RR stageSeed retention / DE GF Reset placement policy and approved outputs | no standings recalculation, no DE ranking guessing |
| **A100 / T080** | Privacy session cache and revocation boundaries: unauthorized 401/403 must not leave inaccessible private results exposed after session change | T100 fixture uses fake public data; no cache-security implementation |
| **A50 / T133** | Environment: actual Node22/pnpm10 and installed deps; isolated browser fixture/DB PG16 only if explicitly authorized; command + exit code + exact SHA | no production test execution or unauthorized PG writes |
| **A60 / T130** | Independent review of planned 10+4 checks, compare source diff, witness actual test results on exact future PR HEAD; QA gate still open | no self-certification / no app PASS claims |
| **A00 / T000** | Decide whether/when future two code PR lanes become available; approve scope, sign open policy and priority | R9 instructions prohibit fourth active code lane |

**POLICY_OPEN:** T050 terminal Undo/Reopen or deny, RR event/result semantics, T051 stageSeed/tie-break and DE runner-up/placements, F053 tournament-level compatibility format presentation, T080 private cache invalidation after revocation, test freshness SLA, any StageProgressView edit-write authorization. Do **not** automatically choose sporting policy.

## 9. A50/A60 reproducible commands / evidence requests

**For test executors AFTER code GO and with dependencies installed, from repo root** (commands are proposals, **NOT EXECUTED** by A120):

```bash
node --version
pnpm --version
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

For a targeted Node test invocation, use the actual app test runner's `node --import tsx --import ./test/setup-dom.mjs --test <test-files>` with appropriate working directory and `TSX_TSCONFIG_PATH` (see `artifacts/tournament-manager/test/run-tests.mjs`); A50 must confirm the command and environment instead of assuming the standalone file can be run from repo root. Browser fixture harness and PG16 policy require separate authorization.

**Evidence matrix fields:** `test_id, source_sha, branch, environment, fixture_id, command, started_at_utc, exit_code, assertion_result, GET_sequence, screenshot/log refs, qa_reviewer`. **NEVER** record access tokens, passwords, production personal data or unapproved SQL logs. Historical failing CI on PR32 does not make T100 tests FAIL — these tests have not run.

## 10. Formal closure / next step

- **AGENT / TASK / WAVE:** `A120 / WEB-005-T100-A120-R2 / R9`.
- **BASE / HEAD / PR:** `release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; PR #32 is the unmerged baseline; **NO PR — SOURCE-ONLY** for A120.
- **ACTUAL CHANGES:** NO REPO SOURCE CHANGES. Local documentation / synthetic fixture artifacts only.
- **TEST EVIDENCE:** T100 React `0/10 RUN`, Browser `0/4 RUN`, API/DB `NOT_EXECUTED`. JSON syntax validation of fixture file, if run, is documentation validation only.
- **FINDING DISPOSITION:** F052/F053/F055 `SOURCE_CONFIRMED`; F058 missing automatic stage refresh `SOURCE_CONFIRMED` / user symptom `STATIC_INFERRED`; F054 `PATCH_PROPOSED` on PR32 with source regression existing; runtime all not reproduced.
- **DEPENDENCIES / FILE CONFLICTS:** Future PR-T100-A/B share `stage-progress-view.tsx` → sequential; T040/T050/T051/T080 boundaries as above; no R9 code ownership conflict because A120 writes no frontend code.
- **GO/STOP:** regression-plan/documentation `GO`; implementation `STOP` until A00 separate authorization and available lane; RR B additionally blocked on T040/T050 semantics; release `NO-GO`.
- **NEXT ACTION:** A00 review PR-T100-A scope and reserve **a future code slot after one current code lane frees**, then direct A50/A60 to execute RT-01..07/10 on the resulting exact PR HEAD. Defer PR-T100-B until T040/T050 policy + runtime state contract.
- **MERGE / DEPLOY:** `NOT AUTHORIZED`.

**Handoff destination:** A00 central triage; A50 execution contract; A60 independent acceptance. **Do not forward to SWARM-006.**