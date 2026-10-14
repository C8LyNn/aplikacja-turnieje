# WEB-005 / A110 / R13 — UX046 STALE STAGE LIFECYCLE MODAL

**Agent:** A110 — Basket Concurrency & Frontend State  
**Task:** `WEB-005-T110-A110-UX046-R13` • **Wave:** R13.1, 2026-10-14 Europe/Warsaw  
**Authority:** CONDITIONAL GO SOURCE-CODE ONLY L2, executed on SOURCE_CONFIRMED gap  
**Verdict:** `PATCH_PROPOSED` (not SOURCE_ACCEPTED, not RUNTIME_VERIFIED)

## 1. Source evidence that activates conditional GO

**Baseline:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

In the baseline [`tournament-stages-panel.tsx` L554–559](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/tournament-stages-panel.tsx#L554-L559) the modal stores `actionStageId` but not its owner tournament/status/version; [L735–795](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/tournament-stages-panel.tsx#L735-L795) opens and commits action from a currently resolved stage ID. When the stage list refetches, a same-ID stage can change `status` or `version` without invalidating the opened modal's original decision. The button checks the current status and readiness/preview but **does not compare open-time revision** or refresh the authoritative stage list immediately before commit. Source gap is `SOURCE_CONFIRMED`; actual unintended DB write is `NOT_PROVEN`. Existing server remains authoritative.

The generated [`TournamentStage` API model](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/api-client-react/src/generated/api.schemas.ts#L1131-L1171) already exposes mandatory `stage.version: number`. No new schema or version-field policy is needed.

## 2. Implementation — draft PR52 (not merged)

**[PR #52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52)** · **branch** `fix/web-005/t110-ux046-stage-modal-r13` · **exact HEAD** `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` · base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` · **five commits ahead, zero behind; exactly two files:**

| File | Change |
|---|---|
| `artifacts/tournament-manager/src/components/tournament-stages-panel.tsx` | Capture `(tournamentId, tournamentStatus, stageId, version, status, action)` on opening start/complete modal. Derived `lifecycleModalStale` disables confirmation and shows Polish stale-state explanation; re-opening captures fresh stage; confirm performs authoritative `stagesQuery.refetch()`, rejecting missing or changed scope/status/version. Start additionally refetches readiness and sequential ceremony if applicable. A checking lock blocks double submission/cancel while asynchronous preflight runs. Existing stage mutations unchanged; server remains final transition arbiter. |
| `artifacts/tournament-manager/src/components/tournament-stages-panel.test.tsx` | Existing RTL suite extended by **seven test definitions**, using existing real `TournamentStagesPanel`, QueryClient, Wouter and mock fetch. Fixture stages now carry `version:1` matching API. No old tests deleted. |

**Patch boundary:** no `tournament-detail.tsx` (A120 owns R13; PR43/PR50 remain untouched), no `revert-match.ts`/PR45, backend, SQL, generated clients, sport rules, or Basket CAS. This is UI preflight and epoch-by-stage-version behavior, **not** a new atomic backend CAS and not a promise that the stage stays unchanged between fresh GET and subsequent POST.

## 3. Seven focused test contracts: definitions authored, none run

| ID | Scenario | Asserted outcome |
|---|---|---|
| UX046-R13-01 | Complete modal open at stage active v1, external completion to v2; list-query invalidation | Old button disabled, controlled stale notice, **zero POST** |
| UX046-R13-02 | Planned start v1, another actor changes version to v2 with same status; refetch; close/reopen | Old start disabled, new modal can use v2 and fresh readiness, **zero old POST** |
| UX046-R13-03 | Complete modal open; server advances to v3 before polling refresh; user clicks | Confirm itself calls new stage GET; detects change and **zero POST** |
| UX046-R13-04 | Tournament A→B same numeric stage ID, same mounted panel | A modal becomes stale under B and **zero B mutation** |
| UX046-R13-05 | Valid unchanged planned stage; start confirm pressed | Fresh stage GET + readiness GET, **one intended POST** |
| UX046-R13-06 | Valid unchanged active stage; complete confirm pressed | Fresh stage GET, **one intended POST** |
| UX046-R13-07 | Fresh stage GET fails 503 despite cached active stage | No POST; existing stage-query controlled error fallback |

**Important:** Tests were added to the existing component RTL file and commit history is test-first. Those are **authored fixtures**, not a PASS. No actual `TournamentStagesPanel` browser route replay, frontend typecheck, full suite, HTTP/PG staging or independent QA ran in this A110 context.

## 4. Execution and GitHub CI status

| Evidence | Status | Exact details |
|---|---|---|
| GitHub source baseline + SHA | `SOURCE_CONFIRMED` | Baseline at `1fdc401d...`, stage API exposes mandatory `version` |
| GitHub compare + draft PR | `PATCH_PROPOSED` | Only 2 focused files, 5 commits, PR52 draft |
| Typecheck | `NOT_EXECUTED` | No checked-out local monorepo with pinned deps in this A110 environment |
| Targeted RTL (new 7 + existing tests) | `NOT_EXECUTED` | No real command execution or exit code |
| Full frontend suite | `NOT_EXECUTED` | No real command/exit |
| Real Wouter/browser route A→B | `NOT_EXECUTED` | JSX fixture defined, browser E2E unverified |
| PG16/mutation | `NOT_EXECUTED` | No authorized isolated DB, no backend change |
| Independent A60 | `PENDING` | No exact-SHA SOURCE_ACCEPTED |
| Auto GitHub Actions run [38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) | `IN_PROGRESS` **at first inspection** | No manual CI rerun. Release baseline still has historical Pack19 matcher; if it fails, inspect logs rather than attributing failure to UX046 |

**A50 deterministic commands on immutable PR52 HEAD** (run in genuine checkout with Node22/pnpm10, log versions, exact SHA, commands, exit/TAP pass/fail/skip counts):

```bash
git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

**A60/A80 independent QA:** check exact SHA and source of `version`, stage identity after route changes, stale portal warning and disabled confirmation, fresh list + start readiness/ceremony, no double submit, existing completion preview and DE ceremony parity. A80 signs lifecycle semantics; no new sports rule was selected. Distinguish `STATIC_INFERRED` fix mechanism from runtime proof.

## 5. Integration dependencies / owner decisions / safe rollback

- PR52 owns only `tournament-stages-panel.tsx` and its RTL test. The author saw **no overlap** with PR43/50's `tournament-detail.tsx`, or PR45's backend `revert-match.ts`. A10 still needs to pin final package IDs/any future other PR conflicts; no composite SHA is claimed.
- T055 Basket full PUT CAS remains **POLICY_OPEN** (token format, missing-token fail-closed code, 409 vs 412, legacy UI conflict); UX044 Host unsaved navigation **NOT_IMPLEMENTED**; UX045 Backup preview remains **PR50 draft / QA pending**. Withdrawn StageBasketsPanel A→B and backup-overwrite claims remain withdrawn.
- **Rollback prior to integration:** close/discard unmerged PR52; no release/live changes, schema or data rollback. No staging/live or Replit touched. No SQL/DDL. No SWARM-006.
- **A00 next:** register PR52 in A10's internal buffer only; assign A50 exact-SHA frontend typecheck + targeted RTL, A60 independent QA, A80 semantics peer. Continue QA-first backlog; no merge or release until formal owner HQ decisions and verified evidence.

**Final author label:** `WEB-005/A110 R13 L2 SOURCE PATCH COMPLETE; PR52 DRAFT; RUNTIME_NOT_EXECUTED; QA_PENDING; RELEASE_NO_GO; SWARM006_HOLD`.
