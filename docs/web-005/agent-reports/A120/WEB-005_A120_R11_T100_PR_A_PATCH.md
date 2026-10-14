# WEB-005 — A120 / R11 — T100 Presentation PR-A PATCH

**Task:** `WEB-005-T100-A120-PR-A-R4`  
**Owner:** Agent A120 — Presentation & Bracket Views; coordinator A00; execution A50; independent QA A60  
**Wave:** R11.1, 2026-10-14 Europe/Warsaw  
**Authorization:** `GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR` (L3) per central `WEB-005_WAVE_R11_AGENT_PROMPTS.md`, blob `3e3b2ea04b6c7ce47986bff89c835a767e710cd4`.  
**Verdict:** `PATCH_PROPOSED`; `RUNTIME_VERIFIED: NO`; `SOURCE_ACCEPTED by A60: PENDING`; `RELEASE NO-GO`.

## 1. GitHub pins verified after implementation

- Repo: `C8LyNn/aplikacja-turnieje`.
- Base: `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, unchanged after authoring.
- Existing release→main PR #32: OPEN, unmerged, HEAD equals release base.
- Patch branch: `fix/web-005/t100-presentation-pr-a-r11`.
- **Draft PR #47:** https://github.com/C8LyNn/aplikacja-turnieje/pull/47
- **Patch HEAD SHA:** `8fd5ce643f65d6e12d4ac8935082a614728dabf1` (OPEN DRAFT, not merged).
- Existing dependencies: PR #42/MP2A, #43/UX042, #44/S1A, #45/RR reopen remain independent; none cherry-picked.
- Automatic GitHub Actions workflow `38595577625` observed `in_progress` at review; a pending job is neither PASS nor FAIL.
- Composite integration SHA and production deployed SHA: UNKNOWN; no merge/release/production authorization.

## 2. Exact changed files — compare release base to PR #47

| Path relative to `artifacts/tournament-manager/src/` | Change | Git blob SHA |
|---|---|---|
| `components/stage-progress-view.tsx` | F052: stage-ID-keyed dedicated DE GET; read-only graph; loading/error/retry/empty/identity guard | `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6` |
| `pages/tournament-bracket.tsx` | F053: reuse canonical `STAGE_FORMAT_LABELS` for public stage header | `0062293dcdfc7660068930cfaf3ed6623efe82c5` |
| `pages/tournament-audience.tsx` | F053+F055: canonical tournament-wide labels; completed overlay first, no completed hero extras | `ffe5ce79bfb975c03bc934a0364502a80682bc4f` |
| `components/stage-progress-view.test.tsx` | New RT-01, RT-02, RT-03 variants including 403/500, delayed/empty, stale stage identity | `ced3edc0bcd1c2d44948f2e9760f427b0eda493e` |
| `pages/public-stage-views.test.tsx` | RT-04: active stage DE label with legacy tournament RR format | `20ad7265d80a849c697110c45c55618a236f94e4` |
| `pages/tournament-audience.test.tsx` | RT-05/06/10; existing winnerId RT-07 test retained | `680f43c496162375be892263a1d10ebc3d159cad` |

**File ownership:** all six paths are A120-authorized in R11 (§0.5). No backend, OpenAPI, DB schema, authentication, router, generated client, lockfile or shared infra changes.

## 3. Implementation contract / expected vs source actual

### F052 — Organizer Details DE missing (P2 SOURCE_CONFIRMED; PATCH_PROPOSED)

Prior release `StageProgressView` handled groups, SE, Swiss, RR; returned `null` for active DE. A120 reused the existing generated `useGetDoubleEliminationStage` and `DoubleEliminationBracket`, which public Bracket already uses. The hook executes unconditionally (React hook order), but is enabled only when the selected stage is nonplanned DE, with `getGetDoubleEliminationStageQueryKey(tournamentId, stageId)` isolation.

Expected: active selected DE shows Upper/Lower/GF/Reset from dedicated response. Invalid/failed GET is never silently replaced with generic SE. HTTP 403/500 shows visible failure and manual retry (no cached graph rendered behind error); response IDs must match selected stage and tournament. Empty valid matches array shows explicit empty state; loading shows progress. `canManage=false` and `canReset=false`; no score writes.

Remaining caveat: a real browser test must confirm graph layout, generated API error conversion, status transitions and accessibility under actual dependencies. The code's source guards are not independent QA acceptance.

### F053 — Format labels (P2 SOURCE_CONFIRMED; PATCH_PROPOSED)

Removed incomplete local SE/Swiss/RR maps from public Bracket and Audience; imported existing five-format `STAGE_FORMAT_LABELS` from `lib/tournament-stages-ui.ts`. Bracket uses `publicStage.format`, not legacy tournament compatibility format. Audience uses the actual `tournament.format` field for its tournament-wide badge and footer and preserves legacy fallback. No sport terminology changed, no backend format reinterpretation. Marvel special stage label preserved.

### F055 — Completed Audience hero overlay (P2 SOURCE_CONFIRMED; PATCH_PROPOSED)

On LIVE section, `tournament.status === 'completed'` now renders final summary *before* hero card; completed tournaments also set derived `heroMatch=null` to avoid unnecessary hero extras. Active tournament featured/live match remains intact. Official champion resolution via existing `tournament.winnerId` lookup remains unchanged.

### F054 — Champion ID (RETENTION ONLY, no new patch)

Existing `tournament-audience.test.tsx` test `completed Audience names the persisted winner, not the aggregate standings leader` remains. New RT-05 also covers `winnerId=202` while leader=201; it does not choose champion from aggregate standings.

### F058 — RR stage-details freshness (DEFERRED / BLOCKED PR-B)

No polling/invalidation code added to `StageProgressView`. Depends on A70/T040 (Undo/Cancel), A80/T050 (authorized RR reopen and stage-roster readback) and A100/T080 private cache policy. No client-created rankings, stage status or tie-breaks.

## 4. Test-first source evidence and actual runtime status

**Test-first commit order:** 
1. `f51e7f2e3e21c585bba533dc81f9378a3e1210cd` — new DE component test file.
2. `87275fd193a3a532eba2355adae4491c65ee1a9e` — Audience tests.
3. `d1b00de660c991f59efb43d9a38b55294cc6346c` — public Bracket label test.
4. `a09d0e5b9313766884cfc6e838bdacbfdbc28831`, `cef1cbf6c0d949d416096194fb89aa8fbc2872de`, `d7feb39d77e625322c218ce3db3585fd2e8589bd` — F052/F053/F055 implementation.
5. `879ea9e19c2390902e525218cc1a312aa881b5d8`, `8fd5ce643f65d6e12d4ac8935082a614728dabf1` — stop completed hero extras and extend negative DE fixture coverage.

**Static inspection actually performed:** 13 targeted source invariants passed 13/13 on PR HEAD (canonical hook, enabled scope, read-only flags, stage/tournament identity, 403 data hiding order, labels, completed overlay and hero, winnerId preservation, regression sources, no F058 polling). This is `STATIC SOURCE CHECK`, **not** application test PASS, not a Node/React runtime result.

**Application tests:** `NOT_EXECUTED` — missing verified repository checkout with locked dependencies; author environment has Node v22.16.0, but no installed app workspace/pnpm checkout. No exit code exists for nonexecuted commands. No browser/PG/API or production test run by A120.

### A50 safe execution commands (proposed / not executed by A120)

From exact PR #47 checkout, with locked dependencies and Node22/pnpm10:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Frontend runner is `artifacts/tournament-manager/test/run-tests.mjs` (Node `--import tsx --import ./test/setup-dom.mjs --test` with project-local `TSX_TSCONFIG_PATH`). A50 must record command, full exit code, test counts, exact SHA, environment, logs and any isolation setup. Actual browser `BR-T100-01/03` and DE portion of `BR-T100-04` require approved isolated browser fixture; no production. `BR-T100-02` and RR portion of BR04 belong to future PR-B, not this PR.

### A60 independent acceptance checklist

- Validate source-to-test mapping RT-01/02/03/04/05/06/10 and existing RT-07; RT-08/09 remain deferred.
- Check DE `stageId` query-key, stale-stage response, no visible graph on 403/500 or identity mismatch, loading/empty/retry, no edit forms or write traffic.
- Check five canonical labels, mixed tournament RR vs active stage DE distinction and Marvel special wording.
- Check completed status suppresses hero and retains `winnerId` champion while active featured match still renders, viewer password gate unchanged.
- Inspect actual A50 output and give independent `SOURCE_ACCEPTED` or `FAIL/BLOCKED` on exact SHA; do not infer acceptance from draft PR or 13 static checks.

## 5. Ownership, blockers, GO/STOP

- **GO used:** authorized scoped source-only frontend code and draft PR L3.
- **HOLD:** runtime and independent A60 QA pending. Automatic CI state not accepted until completed and inspected; no manually initiated paid CI.
- **POLICY_OPEN / depends on others:** RR/terminal stage semantics, private cache, DE 2–N placements; outside this patch.
- **NEXT:** A50 execute actual FE test/typecheck/build on exact PR HEAD; A60 review that SHA; A00 gate disposition and decide any narrowly scoped rework. F058 PR-B remains blocked pending T040/T050.
- **MERGE / CHERRY-PICK / DEPLOY / PRODUCTION:** `NOT AUTHORIZED`. **SWARM-006:** HOLD; no dispatch or integration.
