# WEB-005 / A120 / R12 — PR47 Source QA & F058 Future PR-B Readback Plan

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R5` | **Wave:** R12.1, 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE ONLY / QA HANDOFF. **NO CODE GO R12.**  
**Task authority:** `docs/web-005/WEB-005_WAVE_R12_AGENT_PROMPTS.md`, Git blob `7f39cc5c7a5e845a97e3952187c8128510e498bc`, §§0–2 and AGENT A120.  
**Verdict:** PR47 `PATCH_PROPOSED`, independent `SOURCE_ACCEPTED` not established, `RUNTIME_VERIFIED` not established. Future F058 = `DESIGN READY / CODE HOLD`. Release `NO-GO`.

## 1. Verified GitHub baseline and scope

| Object | HEAD / status verified in R12 |
|---|---|
| Source baseline | `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| PR47 T100-A | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 — OPEN DRAFT / unmerged; HEAD **`f09a13623faca8d7ab29b09a2c5b43907c2acd0b`**; base equals release |
| PR45 RR roster | https://github.com/C8LyNn/aplikacja-turnieje/pull/45 — OPEN DRAFT; `a7a87bc019731191dbfa44bee6939e3fa25e27f4` |
| PR39 Cancel/Restore | https://github.com/C8LyNn/aplikacja-turnieje/pull/39 — OPEN DRAFT; `16053ee132756ca05b6f2cd1f0cabae823905387` |
| PR42 Global Undo | https://github.com/C8LyNn/aplikacja-turnieje/pull/42 — OPEN DRAFT; `1ae0ccb801f4177052bff1ec7041e55b8c992c8b` |
| PR35 Pack19 matcher | https://github.com/C8LyNn/aplikacja-turnieje/pull/35 — OPEN DRAFT; `7cb283aa82273a1e22daf9051a82311eef53760c` |
| PR47 changed files | Exactly six: three source, three React test; nine commits ahead of release, no backend, DB or generated API changes |
| GitHub PR47 reviews/comments | No submitted GitHub review, issue comment or inline thread observed during R12 check. An external A60 report may exist separately; not assumed absent or accepted. |

**PR47 changed source:** `artifacts/tournament-manager/src/components/stage-progress-view.tsx`; `src/pages/tournament-bracket.tsx`; `src/pages/tournament-audience.tsx`.  
**PR47 changed tests:** `src/components/stage-progress-view.test.tsx`; `src/pages/public-stage-views.test.tsx`; `src/pages/tournament-audience.test.tsx`.  
**Ownership:** All scoped to prior R11 A120 L3. In R12 A120 touched no source, test, or PR47 HEAD.

## 2. PR47 source review: actual / expected / evidence class

| Finding | Exact source observations at PR47 HEAD | Expected result & next QA | Status |
|---|---|---|---|
| **A20-F052 DE Details** | `stage-progress-view.tsx` uses `useGetDoubleEliminationStage(tournamentId, deStageId)` keyed by `getGetDoubleEliminationStageQueryKey`. Nonplanned selected DE only; `DoubleEliminationBracket` gets `canManage={false}`, `canReset={false}`. Visible loading, error/retry, empty, stageId/tournamentId mismatch paths. Public Bracket already used dedicated DE API at release. | Render Upper, Lower, GF, GF Reset of selected DE only; no SE substitution/write actions. A60 inspect response identity and privileged-cache behavior; A50 actually run RTL and browser. | `PATCH_PROPOSED`; source confirmed; runtime `NOT_EXECUTED/UNPROVEN` |
| **A20-F053 labels** | Bracket and Audience import the existing five-value `STAGE_FORMAT_LABELS` from `lib/tournament-stages-ui.ts`. Bracket chooses `publicStage.format`; Audience footer/banner uses `tournament.format` compatibility value. Marvel exceptional label preserved. | All five labels localized, no raw known enum, no stage/tournament semantic conflation. | `PATCH_PROPOSED` |
| **A20-F055 final hero** | `tournament-audience.tsx`: `tournament?.status === "completed"` renders summary before active hero; derived `heroMatch = null` when complete. | Completed winner summary visible with stale featuredMatchId still set; live active featured match unchanged. | `PATCH_PROPOSED` |
| **A20-F054 champion** | Existing `winnerName` resolves `tournament.winnerId` by player ID (players then standings lookup), not `standings[0]`. Original winner-vs-leader regression and new RT-05 fixture exist. | Retention only. Do NOT add a second fix. | Prior PR32 source mitigation; actual RTL `NOT_EXECUTED/UNPROVEN` |
| **A20-F058 RR stale detail** | `stage-progress-view.tsx` `useListTournamentStages` and `useGetTournamentStage` have no own `refetchInterval`. Parent `pages/tournament-detail.tsx` polls matches and stages every 5000 ms, but not selected Stage Details. Cached `detailQuery.data.participants` supplies rank/status rows while stage list supplies heading status. Local write handlers can call `invalidateTournamentDependentQueries`, including stage-prefixed keys; external writes do not invoke this in the observing browser. | Fresh successful canonical stage detail read should eventually replace cached final rank/status after accepted Revert/Undo. No custom ranking computation. | Missing refresh trigger `SOURCE_CONFIRMED`; user-observed stale UI `STATIC_INFERRED` / runtime NOT_REPRODUCED |

### Additional A60 source-risk candidates (do not assert a reproduced vulnerability)

1. **Detail-read 401/403 with retained cache:** `StageProgressView` renders `detailQuery.error` banner yet still evaluates `selected && detailQuery.data` and can render cached `ParticipantTable` or DE graph while a Stage Details refetch failed. The dedicated `deQuery.error` branch suppresses a failed DE payload, **but a Stage Details error is not a DE render gate**. Similarly a `stagesQuery.error` with cached list is not a universal denial gate. Source permits this conditional; whether an unauthorized cached stage is actually exposed in product flow requires A60/A100 review and runtime fixtures. Risk: stale or no-longer-authorized data displayed after response 401/403.
2. **Cross-stage/tournament identity:** PR47 DE graph guards `deQuery.data.stageId` and `tournamentId` plus `detailQuery.data.stage.id` against selected stage. The non-DE/RR render path lacks equivalent explicit Stage Details `stage.id`/ `stage.tournamentId` check; generated query keys provide isolation but the UI should independently fail closed on malformed/wrong-ID body.
3. **Mixed-epoch reads:** Parent `/stages` and `/matches` 5-second polling can update before the child Stage Details read; a completed/active heading sourced from list may disagree with cached ranks from details. Without an atomic multi-endpoint snapshot version, avoid claiming a guaranteed immediate or linearizable UI. Tests must use deterministic response ordering, not fabricated SLAs.
4. **Password/session boundaries:** Parent may render based on `readOk`, and session-owner A100 controls auth policies. Any need to change shared auth/query-client caches is OUT OF SCOPE for A120 future PR-B until A00/A100 explicitly define ownership.

**A60 requests:** independently adjudicate the above on exact PR47 SHA, especially cached Stage Details + 401/403, loading/mismatch/deferred GET, private revocation and DE read-only mutations. No automatic SOURCE_ACCEPTED just because source/tests exist.

## 3. PR47 A50 target execution matrix (designed source tests, not run in R12)

| Contract ID | Actual existing fixture/test source | Deterministic expected | Evidence gate |
|---|---|---|---|
| RT-T100-01 | `stage-progress-view.test.tsx`: DE21 revision 4, Upper/Lower/GF/GF Reset | Dedicated GET `/api/tournaments/9001/stages/21/double-elimination`; no score/reset controls | Execute React, record GET trace |
| RT-T100-02 | Same: old RR20 stage detail resolves late; mismatched DE stageId=99 variant | Selected DE21 graph remains, no RR20 player, wrong stage is denied | React + A60 source |
| RT-T100-03 | Same: status 403/500 then Retry 200; deferred initial GET then valid empty graph | Error visible, graph hidden until successful authenticated GET; explicit loading and empty message | React + negative 401/403 cached-data variant recommended |
| RT-T100-04 | `public-stage-views.test.tsx`: tournament RR compat, active stage DE | Public header says `Podwójna eliminacja`, retains dedicated DE stage graph | React |
| RT-T100-05 | `tournament-audience.test.tsx`: winnerId=202, featuredMatchId=901, standings leader=201, completed | Champion 202 and final summary, no hero | React |
| RT-T100-06 | Same: active with featured 901 | Hero still visible, no final summary | React |
| RT-T100-07 | Preexisting `completed Audience names the persisted winner, not the aggregate standings leader` | winnerId by ID on repeated GET; F054 retest only | React |
| RT-T100-10 | Audience group format + Bracket DE format; shared map has five labels | Group and DE translated; preserve stage vs tournament compatibility | React |
| RT-T100-08/09 | F058 RR-REOPEN/DELAY & RR8→RR4 templates only | Reserved for **future PR-B**; not to mark passing PR47 | BLOCKED |

**Future browser:** `BR-T100-01` DE Details/public Bracket/Projector/Audience; `BR-T100-03` active↔completed Audience; DE section of `BR-T100-04` late-response/mismatched stage. `BR-T100-02` and RR portion BR04 await PR-B + signed PR45/Undo contracts. No browser test performed by A120.

**A50 commands proposed, not executed here**, from an isolated checkout at exact `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`, using locked dependencies:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Optional focused tests from `artifacts/tournament-manager`, after confirming Node22/pnpm10 and local tsx runner dependencies:

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/components/stage-progress-view.test.tsx src/pages/public-stage-views.test.tsx src/pages/tournament-audience.test.tsx
```

Require `SHA, command, Node/pnpm versions, environment, exit_code, pass/fail/skip counts, fixture ID, request chronology, screenshot/log refs, QA reviewer`. Never store tokens, secrets, user data. No physical PostgreSQL necessary for pure mocked/frontend tests; no shared/production DB.

**CI status on PR47:** run `38596198607`, job `correction-qa` `115963443350` `COMPLETED FAILURE`. Step 8 `Pack 19 snapshot consistency tests` = 7/8 PASS, 1 FAIL, exit 1, expected legacy regex `isolationLevel:"repeatable read",readOnly:true`. Next Pack20+ and release gates skipped; this workflow did **not** reach T100 frontend RTL/typecheck/build. PR35 (separate P01) patches source contract regex but is unmerged on baseline. Do not copy/cherry-pick PR35 or manually re-run paid CI from A120.

## 4. F058 — future PR-B **minimal design**, not executable R12 patch

**Trigger:** Stage Details for selected `round_robin` can remain from an older completed epoch while an external authorized Revert/Undo updates Stage List and Matches. Backend `GET /api/tournaments/:id/stages/:stageId` returns `{stage, groups, participants, ranking, qualifiers}` from `artifacts/api-server/src/application/stages/stage-queries.ts`; participants expose backend `status, finalRank, groupRank, stageSeed`. It is the single readback authority; `GET /tournaments/:id/standings` aggregates tournament-wide matches and is **not** a replacement for RR stage participant rank.

### Proposed execution sequence AFTER new A00 code GO

1. **Base/ownership:** derive future PR-B from an **approved, QA-reviewed PR47** branch/commit; do not concurrently edit `stage-progress-view.tsx` on PR47 and PR-B. If A00 mandates release baseline instead, coordinate a clean serial dependency without silent cherry-picks. No PR-B creation in R12.
2. **Narrow refresh:** for a selected RR stage, including when its current status is `completed`, enable controlled re-fetch of existing `useGetTournamentStage` using its canonical query key `getGetTournamentStageQueryKey(tournamentId, selectedStageId)`. Preferred minimal implementation is a bounded interval comparable to existing parent stage/match 5s cadence (engineering proposal, **NOT guaranteed user-facing freshness SLA**) plus targeted re-fetch/invalidation when a verified stage lifecycle transition appears in the already-polled canonical `/stages` result. Ensure no self-triggering infinite refetch loop and no polling for unselected/non-RR stages.
3. **Identity and coherence gate:** before rendering rank/status, require `detail.data.stage.id === selectedStageId` and `detail.data.stage.tournamentId === tournamentId`; independently require that displayed selected navigation stage corresponds to same `id`. On a list-status/detail-status mismatch (e.g. list now active, detail still completed), display a neutral “odświeżanie etapu” state and retry canonical GET instead of asserting a confirmed final rank. Do not forge `status=active` or clear ranks on the client before backend readback. A successful current Stage Details response determines participant rank/status. Avoid stale old ID/tournament data after navigation, even with an out-of-order completion.
4. **401/403 fail-closed:** a denied Stage List or Stage Details response must **suppress cached participants, ranking and graph** immediately; show access-denied/retry rather than stale final rows. If the denial represents a revoked session, the canonical owner A100 must define cache eviction and re-auth semantics across the app; PR-B may not quietly take ownership of global session policy. Do not rely only on `!query.data` because TanStack Query can retain data after failed refetch. HTTP 500/network timeout: distinguish temporary failure from auth denial and clearly mark any retained content as unverified; or conservatively hide it if user could infer current/qualified status.
5. **Accepted backend state only:** after a successful authorized terminal RR reopen, UI displays exact `stage.status`, backend participant statuses, `finalRank` and `stageSeed` and stage-specific matches from canonical GETs. In multistage SE8→RR4, assert P405–P408 never appear as reactivated RR entrants (fixture IDs synthetic). Rejected Revert/Undo 409 or blocked policy returns leave the prior state unmodified. No local recalculation of ranks, tiebreaker, qualification, stage status, or winner.
6. **Separation:** scope future PR-B to `src/components/stage-progress-view.tsx` + `src/components/stage-progress-view.test.tsx` where possible. Only propose `lib/tournament-query-invalidation.ts` change if a *specific absent local invalidation* is demonstrated and A00 assigns file ownership. No backend/schema/OpenAPI changes, `tournament-detail.tsx` owner A110 and `routes/tournaments.ts` owner A70/A100 untouched. Existing `invalidateTournamentDependentQueries` already invalidates stage-prefixed query keys for known local writes.
7. **No invented consistency bound:** the stage/matches/list/detail endpoints are independent and their reads are not one atomic MVCC snapshot. Test successful **eventual convergence after deliberately delivered GET** and explicit transitional/error states; do not claim zero flicker, monotonic revisions, or a time SLA without API support/product decision.

### Future PR-B deterministic RTL matrix — new source tests only after GO

| Case | Synthetic request order | Expected |
|---|---|---|
| F058-01 / RT-08-A | RR31 completed stage/details/matches → external authorized rewind → `/stages` active → `/matches` pending → successful `/stages/31` active | Before authoritative stage details: no fresh-final claim; after: active title, stage-provided ranks/status and selected-stage fixtures; no winner invented |
| F058-02 / RT-08-B | SE8 stage40 completed → RR4 stage41 terminal completed → PR45-approved reopen → stage41 GET, roster only P401–P404 | No P405–P408 reactivation or cross-stage row bleed; stage seed preserved as returned |
| F058-03 / RT-09-A | /stages active arrives, /stages/31 deferred; old details cached, then new details success | Explicit pending/freshness state while list and detail differ, then successful convergence; no duplicate fetch storm |
| F058-04 / RT-09-B | /stages/31 fails HTTP500 while old cached data available; then Retry 200 | Error and stale-data disclaimer or fail-closed, no “newly confirmed” final/active rank before success |
| F058-05 / SECURITY | old authorized stage details cached; new GET 401/403 after session revocation | No cached participants or DE graph on denied response, no implicit credential retention; A100 owns global cache invalidation |
| F058-06 / IDENTITY | Rapid tournament 9003→9004 or stage30→31, old GET resolves last, then valid current GET | Current tournament/stage only; old player identifiers never appear in new selected-stage table |
| F058-07 / DENY | Revert/Undo 409 rejected; existing completed data and no legitimate fresh stage event | No local synthetic “reopened” state; no backend write side-effects in read-only fixture |
| F058-08 / COMPAT | All non-RR formats, DE graph in PR47, managed draft form elsewhere | No extra RR polling outside selected RR, no regression DE/Swiss/SE, no reset of interactive draft state |

Use isolated `QueryClient`, mocked `fetch` with deferred promises, timers controlled explicitly; no real Undo request in React tests. A50 browser acceptance after A00/A60/PG16 authorization only: `BR-T100-02` plus RR part of `BR-T100-04`, including request-epoch trace and screenshots.

## 5. Dependency and STOP matrix

| Owner / PR | Required authoritative input for A120 PR-B | Status now |
|---|---|---|
| **A80 / PR45** | RR terminal reopen: legal backend response and SE8→RR4 stage-roster invariant. Draft modifies `revert-match.ts` with stage-only reactivation and a new DB integration test; integration PG16 **not proven**. | `PATCH_PROPOSED / RUNTIME NOT VERIFIED` |
| **A70 / PR39, PR42** | Cancel/Restore and global Undo LIFO event/readback semantics and rejection behavior, exact 409/authorization cases; no A120 mutation code. | Both OPEN DRAFT, no assumed backend acceptance |
| **A100 / T080** | 401/403 + session revocation / cache separation contract, so a shared cache isn't exposed after role change. | Policy/ownership pending |
| **A50** | Exact PR47 frontend React/typecheck/build and future PR-B test logs on real checkout; isolated PG16 for backend only upon approved preflight. | No A50 actual PR47 React PASS evidence verified by A120 |
| **A60** | Independent PR47 source QA and actual test evidence, explicit verdict by exact SHA; approve/hold upstream before PR-B. | `SOURCE_ACCEPTED PENDING` (GitHub review not observed; possible separate report unverified) |
| **A00/HQ** | Written new R13+ code-lane GO and designated file ownership after PR47 review; resolve product policy where needed. | `CODE HOLD R12` |

**Rollback plan (future, if ever authorized):** PR-B is additive to PR47 but isolated; if newly introduced refresh breaks selected-stage identity, revert only PR-B commit(s) in its branch before merge, leaving PR47 code/test unchanged. Actual rollback/deploy owned by integrator when authorized, not A120 in R12.

**GO:** source QA, test handoff, future PR-B design. **STOP:** all frontend writes, merge/cherry-pick, paid CI reruns, staging/live/Replit, SQL/DB changes, new PR-B, SWARM-006.

## 6. Formal conclusion

**R12 A120 result:** precise source-to-test mapping and future F058 readback design ready for A00 review. **No app code modified in R12; no application tests executed by A120.** PR47 remains OPEN DRAFT / not source-accepted or runtime-verified in the examined evidence. Next actions are A50 execution, A60 independent review and A00 separate code-lane GO, with PR45/PR39/PR42 policies signed first. WEB-005 and release remain `NO-GO`.
