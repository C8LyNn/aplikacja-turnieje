# WEB-005 — A120 R21 — Presentation integration acceptance oracle (PR47 + PR54)

**Task:** WEB-005-T100-A120-R21 · **Role:** A120 / Presentation & Bracket Views · **Date:** 2026-10-14 Europe/Warsaw.
**Mode:** READ-ONLY INTEGRATION CONTRACT. This is a future acceptance oracle, **not** a merge instruction, composite SHA, tested integration, implementation GO, release certificate or transfer to SWARM-006.
**Authority:** R21 central prompt `WEB-005_WAVE_R21_AGENT_PROMPTS.md`, Git blob `f90aa01ada90a0a311eb9a8d97d04a5c65c89e45`, §§0–2 and AGENT A120.

## 1. Frozen, real input refs and independent QA

| Input | Verified October 14 GitHub ref |
|---|---|
| Release base | `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| PR47 / P14 DE, Polish labels, champion/overlay | [PR #47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) OPEN DRAFT, HEAD **`f09a13623faca8d7ab29b09a2c5b43907c2acd0b`**, 6 files; selected child `stage-progress-view.tsx` blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6` |
| PR54 / P21 selected RR401/403 + readback | [PR #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) OPEN DRAFT, HEAD **`bfa9d075b431185aa8bbf87bf021d64dde8ae22f`**, 4 files; selected child `stage-progress-view.tsx` blob `2c50b5915572ec3721ad709ffd18ec58a597273f`; parent `tournament-detail.tsx` blob `a3565b6638f9def4ee9aebb0126444c15a613338` |
| PR43 / P10 CSV | [PR #43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) OPEN DRAFT, HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`; edits parent |
| PR50 / P17 Backup Preview | [PR #50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) OPEN DRAFT, HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`; edits parent |
| PR53 / P20 global auth and game-picks cache | [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) OPEN DRAFT, HEAD `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`; separate A100/A30/A60 ownership |

**Independent A60 R20** — [signed exact-SHA source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), Git blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`:
- P21/PR54 exact `bfa9d075...`: **SOURCE_ACCEPTED_CONDITIONAL_ON_EXACT_SHA** for the parent/selected-RR two-boundary source patch, **NOT RUNTIME_VERIFIED**; conditional on future PR47 same-file composition, security boundary and React/browser regression.
- P20/PR53 exact `d1aebfca...`: **SOURCE_ACCEPTED_SCOPED_ON_EXACT_SHA**, while untagged legacy raw cache retention remains **POLICY_OPEN**.
- A60 overall: **HANDOFF_NOT_READY / RELEASE_NO_GO**. Author A120 cannot upgrade this to full independent acceptance.

**Owner/HQ** — [R21 decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md), Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`, is **DRAFT / ZERO SIGNED DECISIONS**. This document cannot grant implementation, merge, code, runtime debt or final handoff permission. **WAIT_OWNER**.

## 2. Exact semantic composition obligations — do not substitute one child for the other

**Conflict A (same file):** `artifacts/tournament-manager/src/components/stage-progress-view.tsx`:
- Preserve from **PR47**: `useGetDoubleEliminationStage(tournamentId, selected DE stage ID)`, correct generated query-key identity and response stage-ID validation, read-only `DoubleEliminationBracket` Upper/Lower/Grand Final/Reset; `canManage=false`, `canReset=false`; loading, empty, 403/500, retry, old-selected-stage response isolation. PR47 also updates Bracket, Audience and tests for five canonical Polish stage labels, completed final hero precedence and persisted official winnerId. None may disappear.
- Preserve from **PR54**: manually selected `selectedStageId` identity governs RR `detailQuery.error` 401/403 detection, `visibleDetails=undefined` while selected RR denied even with retained previously authorized cache, including *derived winner* and participant/rank table; an accessible **stage-local** error and selected-only `detailQuery.refetch()`; StageNavigation remains accessible; historical RR denies must never mask legal DE/Overview.
- Both changes are on **separate release-derived branches**; PR54 does not contain PR47 dedicated DE. A file-level overlap is certain. A literal same-hunk conflict is not determined absent an authorized merge. **Never choose PR47 or PR54 file wholesale as resolution**: that discards one feature. Later authorized integrator must reconcile both semantics and tests on a new identified composite SHA, with an inspected diff.
- **Source risk requiring test rather than guessing:** when a selected DE graph error coincides with historical RR cached 403, error banners/cached details must not become mixed or duplicate. Delayed old RR responses cannot overwrite selected DE, and older DE responses cannot reselect RR.

**Conflict B (same parent file):** `artifacts/tournament-manager/src/pages/tournament-detail.tsx` is independently changed by **PR43, PR50 and PR54**. The future integrator must preserve CSV input/progress paths from PR43, safe Backup V3 preview and no accidental restore from PR50, and PR54's `RoundRobinReadbackBridge` canonical stage/matches fingerprint plus exact stage-details and tournament standings invalidation. Preserve the page's whole-tournament private `readOk` gate; historical RR detail error does not replace all Tabs. Check routing and tabs so overview/bracket/standings/import/backup remain reachable. This shared-path overlap is **not proof** of an actual same-hunk Git conflict.

**Security separation:** PR54 local RR denial does NOT assert whole-session privacy safety. A100/PR53 controls credential change A→B, owner-qualified game-picks cache, legacy orphan/raw retention and revoked tournament-wide permission. The integrator must not override global 401/403 with a DE-looking stage's local 200. Source-accepted scoped privacy != cleared raw legacy cache, and only owner can decide retention/erasure policy.

## 3. Mandatory future isolated integration acceptance matrix (no current execution)

All IDs are synthetic **test fixtures only**. Use an approved clean per-SHA composite checkout *only after* explicit owner/HQ final handoff approval, never by A120 in WEB-005. Capture exact composite SHA, component diff resolution, Node/pnpm, actual command/exit/TAP/browser/network screenshots; don't infer PASS from source assertions.

| ID / priority | Stimulus / temporal order | Required result |
|---|---|---|
| **INT-PRES-01 P0** | Synthetic tournament77 has history RR stage31 completed, current DE stage32 active. Stage31 formerly GET200 then GET403 (run 401 variant separately), tournament/stages/Overview/DE GET200. | Real Organizer Overview and current DE tabs remain visible/navigable; **no full-tabs RR denial**; no old RR private sentinel elsewhere. |
| **INT-PRES-02 P0** | Select DE32, dedicated `/stages/32/double-elimination` GET200 with Upper, Lower, GF, GF Reset, winner decision. | Correct read-only 4-section DE graph, ID32 only, no update/reset controls or score writes. PR47's DE graph is actually present after merge. |
| **INT-PRES-03 P0** | Select historic RR31 manually through StageNavigation while its cached prior GET200 still contains sentinel `RR_STALE_PRIVATE_RANK_701`, later GET401/403. | **RR31 only** shows local `role=alert`; no participant/rank/winner leak at any synchronous first-paint or refetching frame; lawful DE32, Overview still usable. |
| **INT-PRES-04 P0** | With RR31 denied, click selected **Spróbuj ponownie**, server returns authorized RR31 GET200 with new sentinel `RR_CANONICAL_AFTER_RETRY_701`. | Exactly selected-stage retry; only canonical new rank/winner displays after successful 200; stale sentinel never recurs; no other RR bulk requests. |
| **INT-PRES-05 P0** | While historical RR31 cached error403, user selects DE32; dedicated DE graph GET403, 500, empty and success on controlled retries. | Correct DE-specific error/empty/loading/retry without historical RR error hiding DE navigation, wrong stage graph or stale cached DE graph; no private data shown where forbidden. |
| **INT-PRES-06 P0** | Revoke whole private tournament session after legal view, including credential A→B; trigger canonical tournament auth401/403 and old A in-flight game-picks. | Whole private view gated and old-A private data not shown. Public B lawful UI survives. A100 PR53 owner-qualified cache policy and signed residual risk required. |
| **INT-PRES-07 P0** | Tournament completed but old `featuredMatchId` persists; official winnerId differs from rank-one intermediate leader. | Final overlay takes precedence over active hero, shows persisted official winnerId. Active tournament still shows featured hero. |
| **INT-PRES-08 P1** | RR stage match revision N→N+1 from second session, followed by terminal stage completed→active with unchanged matches. | Parent invalidates exact canonical RR stage details and tournament standings on changed RR snapshot; displayed rank/status from server, never browser recomputation. |
| **INT-PRES-09 P1** | Hold old RR31 GET N; accept newer N+1; resolve old N last; additionally switch selected RR31↔DE32 and tournament77→78. | No stale overwrite/cross-tournament participant text, correct stage ID/query isolation; no bad late winner. |
| **INT-PRES-10 P1** | Change only DE32 match, let parent poll RR unchanged every interval, retain old RR31 denied error. | No RR refetch/invalidation storm, lawful DE remains visible and read-only. |
| **INT-PRES-11 P1** | Navigate five stage formats RR/Group/SE/DE/Swiss with tournament-wide RR compatibility. | Correct canonical Polish labels from selected stage, no known raw format enums; tournament-wide badge reflects actual tournament format where intended. |
| **INT-PRES-12 P1** | Real organizer Tabs move through Overview/Stage/Standings/CSV/Backup preview after PR43/50/54 composition. | No missing tab due shared parent merge, CSV remains scoped to its authorized import flow, backup preview is nonmutating, RR readback remains active while alternate tabs shown. |
| **INT-PRES-13 P1** | Mock backend Undo/Revert 409 or denied 403 with no canonical state change. | No locally invented RR rank/undo/winner mutation; controlled failed-write UI, unchanged server source. Owner backend sport semantics not assumed. |
| **INT-PRES-14 P2** | Selected RR detail 500/network error (separate from 401/403). | Explicit transient error UX, no false new canonical ranking or blanket privacy bypass; policy evaluated by A60. |

**Scope / acceptance distinction:** PR54's existing `tournament-detail.rr-readback.test.tsx` includes parent MIX401/MIX403 with **synthetic child sections**, not complete Tabs. PR54's `stage-progress-view.rr-denied.test.tsx` has manual RR stage, cache-after-401/403 and retry. PR47's `stage-progress-view.test.tsx`, `public-stage-views.test.tsx` and `tournament-audience.test.tsx` cover DE and final presentation. **All must be made mutually compatible in the future composite**, not assumed from two independent passed subsets. Real E2E with actual tabs and browser session pairing needed for P0 acceptance.

## 4. Future executor + QA release gate (not a present authorization)

After **one separately signed FINAL_HANDOFF_GO**, an authorized integrator first pins all input PR SHAs, records conflict resolution and new composite SHA. Required future frontend commands from approved complete monorepo workspace (Node22, pnpm10, frozen deps; no live credentials/shared DB):

    git rev-parse HEAD
    node --version
    pnpm --version
    pnpm install --frozen-lockfile
    pnpm --filter @workspace/tournament-manager test
    pnpm --filter @workspace/tournament-manager typecheck
    pnpm --filter @workspace/tournament-manager build

Use focused TSX runner in artifacts/tournament-manager for the PR47 DE/Labels/Audience suites and PR54 parent/child RR suites. Capture exact process exits and TAP counts; browser fixtures must capture request chronology, network response status and screenshots. No runtime PASS is known today.

A50 R20 [actual receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R20_RECEIPT.md), blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`, records **0 native application test executions** due missing trusted connected full checkout, frozen pnpm deps, and isolated PG16. An explicit owner-approved runtime-debt handoff is a **separate conditional decision**, not a waiver for unresolved source/privacy/policy/backlog and not authorization to deploy.

Existing PR54 automatic GitHub workflow run **38631912235** failed **upstream Pack19 snapshot regex** before T100 frontend tests; PR35 separately owns matcher fix. It is neither an INT-PRES test PASS nor proof of a feature FAIL. No manual paid rerun by A120.

Independent A60 must verify **the actual new composite SHA** and issue formal review (no author self-acceptance), including owner-approved legacy cache/raw retention and whole-tournament 401/403; approved deployment gates require actual frontend/API/isolated PG16/Pack17 full+Pack20–26/CI afterward, outside A120.

## 5. R21 owner gate, blockers, single exact A00 action

**Owner packet:** `WEB-005_R21_OWNER_DECISION_PACKET.md` at blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065` is explicitly **DRAFT / ZERO SIGNED DECISIONS**: sport S1–S6, Basket CAS D1–D6, Backup B1–B6, MP2B RA/RB/RC, Steam/session, PR53 orphan retention, historical 38-source O1/O2, real executor vs debt EXEC-A/B and separate FINAL_HANDOFF_GO all remain open. A120 sets none of them. **WAIT_OWNER**; do not infer defaults.

**38-case provenance:** original WEB-004 R2 CSV unavailable; A10 has only 29 secondary historical IDs and 9 SOURCE_ID_NOT_AVAILABLE. Missing nine IDs are not PASS/WONT_FIX. Source completion requires authentic matrix or signed provenance exception with explicit residual risk, plus owner per-finding dispositions.

**A00 next unblocker:** collect actual owner/HQ signed decision packet and original 38-case provenance or explicit exception; obtain A60 final gate and A10 21-packet manifest. No automatic SWARM-006 dispatch. On approval, transfer this frozen oracle as a dependency for **one** later authorized final integration. With no owner response, report **WAIT_OWNER / WEB005_IN_PROGRESS / SWARM006_HOLD / RELEASE_NO_GO** and suspend speculative new work.

**R21 A120 changes:** documentation only under agent-reports/A120; no PR code, new PR, merge, cherry-pick, rebase, composite, CI rerun, SQL, staging/live or SWARM-006.

**FINAL:** `A120_R21_ORACLE_PUBLISHED / A60_R20_P21_SOURCE_ACCEPTED_CONDITIONAL / WAIT_OWNER / RUNTIME_NOT_EXECUTED / FINAL_HANDOFF_NOT_AUTHORIZED`.
