# WEB-005 — A80 R11 / TERMINAL SWISS POLICY PACKET

**AGENT:** A80 — Stage Lifecycle & Sporting Rules  
**TASK:** `WEB-005-T050-T051-A80-R4`  
**WAVE:** R11 — 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE-ONLY / POLICY OPTIONS / TEST FIRST / NO CODE  
**DELIVERABLE STATUS:** `POLICY_PACKET_READY / POLICY_OPEN / APP_RUNTIME_NOT_EXECUTED`  
**SCOPE:** A52-F022 terminal Swiss, A52-F018 SE currentRound, BIZ-21-17 Swiss matching, BIZ-21-19 DE placement, BIZ-21-18 RR-stageSeed regression only; PR45 A52-F019 review handoff.

## 0. Exact source and GitHub evidence

- Central task `docs/web-005/WEB-005_WAVE_R11_AGENT_PROMPTS.md`, `chore/web-005/t000-wave1-control`, blob **`3e3b2ea04b6c7ce47986bff89c835a767e710cd4`** (read §0–§2 and only A80).
- Release `release/tournament-ops-20261013-01` = **`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`**; release→main PR [#32](https://github.com/C8LyNn/aplikacja-turnieje/pull/32) OPEN, not merged; base main `c50cc48e6fa508592bda3f4838111e9cff5af80c`.
- P12 **[#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45)** A80 `fix/web-005/t050-rr-stage-roster-reopen-r10` HEAD **`a7a87bc019731191dbfa44bee6939e3fa25e27f4`**, OPEN DRAFT, 4 changed files; no changed HEAD since R10.
- P09 **[#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42)** A70 Undo MP2A HEAD **`1ae0ccb801f4177052bff1ec7041e55b8c992c8b`**, OPEN DRAFT, source only, no runtime PostgreSQL verification. PR #39 MP1 HEAD `16053ee132756ca05b6f2cd1f0cabae823905387`, OPEN DRAFT.
- [CI PR45 run 38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) completed **FAIL**: `correction-qa` Pack19 snapshot consistency failed; SE safety passed, later Pack20–26 and static/database release gates **SKIPPED**. This is a workflow result **on PR45 SHA**, not execution of the new RR4 HTTP/PG regression, and not proof that A52-F019 is fixed or broken. No manual CI rerun requested.
- [A80 R10 patch report](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7a87bc019731191dbfa44bee6939e3fa25e27f4/docs/web-005/WEB-005_A80_R10_T050_RR_PATCH.md), [R10 handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7a87bc019731191dbfa44bee6939e3fa25e27f4/docs/web-005/WEB-005_A80_R10_HANDOFF.md).
- No GitHub PR45 submitted reviews or discussion comments returned at check; separate A60 reporting might exist and is **not disproven** by their absence.
- Source pinned release: `application/matches/revert-match.ts` blob `0cb16ad0d82da754bac0553a946a3513db70e1ee`; `application/matches/complete-match.ts` blob `fa77dc80c1250766ed73db605f985abc7b2fa591`; `application/stages/stage-lifecycle.ts` blob `e344fd4198e081a3a4574d976829665bea71fb6a`; `domain/tournament/swiss.ts` blob `aa00b4ef445aaff7eb48152eb5d6c2063befbf7a`.
- R1 and R9 synthetic fixture/model observations were retained as **synthetic evidence only**. Current R11 machine-readable fixtures: `docs/web-005/WEB-005_A80_R11_DETERMINISTIC_FIXTURES.json`.

## 1. A52-F019 / P12 PR45 — source-only QA handoff, no reimplementation

**SOURCE_CONFIRMED baseline:** `revert-match.ts` branch `!isSingleStageTournament && shouldReopenRoundRobin` previously updated all `players` rows by `tournamentId`, restoring eliminated earlier-stage nonqualifiers.

**PATCH_PROPOSED PR45:** reads locked stage roster from `stage_participants` for reopened terminal RR and restricts `players.status='active'` update to `tournamentId AND playerId IN stageRoster`; requires affected count parity. Other branches/Undo rules unchanged. The added `round-robin-terminal-reopen.integration.test.ts` exercises SE8→RR4, checks four RR members reactivated, four earlier nonqualifiers still eliminated, previous membership unchanged, both winner IDs and active stage pointer, action log/result history, re-completion.

**What A50/A60 must verify physically** (on checkout SHA `a7a87bc...27f4`, not on release alone): HTTP+PG16 test reaches full path, single-stage RR regression, 8→4→RR4 in a real migrated DB; zero resurrection P5–P8 in global `players` and prior `stage_participants`; exact immutable history, correct `stage.version`, `match.revision`, `active_stage_id`, no unintended trigger write. Independently exercise Undo-last from #42 in a later **authorized composite candidate**; a test in PR45 alone does not certify integration. **No QA acceptance claimed by A80.**

## 2. Formal owner choice TS — completed terminal Swiss / A52-F022

**Confirmed source gap:** existing terminal reopen toggles only for `single_elimination` and `round_robin`. Swiss revert may change the final completed match to `pending` while `stage.status` and `tournament.status` remain `completed`, leaving stale `winnerId`; later `completeMatch` rejects non-active stage. This consequence is source-inferred, not reproduced via native PG/HTTP.

**Invariant TS-I1, irrespective of selected policy:** `tournament.status='completed'` must never coexist with a **required** terminal Swiss match `status='pending'` after a successful mutation. In every persisted state: stage/tournament terminal completion, winner IDs, terminal participant standings/statuses and `activeStageId` are mutually consistent; no partial write or stale completion action.

**Option TS-A / DENY_409 / owner signature REQUIRED:**
- Revert final Swiss match from completed terminal stage/tournament: **HTTP 409**; no modifications to `matches`, `result_history`, `action_log`, `tournament_stages`, `tournaments`, `stage_participants`, `players`, qualification/route records.
- Do not undo original completion action or increment `match.revision`/`stage.version`; unchanged stage+tour completed, winner unchanged.
- Distinct domain error `TERMINAL_SWISS_REVERT_BLOCKED` is only a *proposal* (would require route mapping + A100 ownership coordination). Reusing existing `DOWNSTREAM_BLOCKED` 409 requires **explicit product API approval**, not an accidental error-code choice.
- Still allow legal revert of active Swiss stage or completed nonterminal stage with next planned (according to existing guards). A completed system BYE remains denied by current system-BYE rule. `no_contest` terminal match is also denied, even if match winner is null.
- Benefits: smallest containment / no cross-table reopen. Cost: users cannot correct completed terminal Swiss without an authorized recovery procedure.

**Option TS-B / ATOMIC_REOPEN / owner signature REQUIRED:**
- Under the *existing canonical* tournament→stage→match locking and T040 post-lock latest-action check, validate terminal Swiss completion, stage/tournament winner agreement, result and action history integrity, no started next stage/downstream approvals, eligible last-round match and legal actor/revision. In one transaction: revert chosen match to pending; mark precisely one completion action undone; create precisely one revert audit event; clear stage `completedAt,winnerId`, set stage active and bump stage version; set tournament active, clear tournament winnerId and restore terminal `activeStageId` safely with trigger semantics.
- Clear only the terminal stage's final/qualification rank fields; re-enable terminal stage members only. **Never** globally reactivate all tournament players: previously eliminated nonqualifiers P5–P8 stay eliminated; previous stages, stage seeds and route provenance persist. Handle a final `no_contest` with null match winner: do not require `match.winnerId === stage.winnerId`.
- Roll back **all** touched tables if any subsequent operation, trigger, history write, hook or concurrent validation fails. Recompletion must work via original `completeMatch` and `completeStage` and again yield one champion.
- Benefits: organizer correction path. Costs: larger version/trigger/Undo/qualification matrix, higher QA burden, potential conflict with PR45 and PR42.

**Decision form for A00 / owner/HQ:** `POLICY-TERMINAL-SWISS = DENY_409 | ATOMIC_REOPEN` + permitted error code + desired correction UX; date, signer, compatibility and rollback notes. A80 does not select either.

| Fixture | Precondition | TS-A expected | TS-B expected |
|---|---|---|---|
| TS01 | Swiss4 / 2 rounds terminal completed; final played match | 409; *entire* DB snapshot unchanged | 200; match pending, stage/tour active, both winners null, correct stage pointer and roster |
| TS02 | Final no_contest, match winner null | 409; no writes | as TS01; do not compare match winner to tour winner |
| TS03 | System BYE | existing BYE 409, no writes | same |
| TS04 | latest Undo changes during lock wait | A70 409, no writes | A70 409, no writes |
| TS05 | injected fault after match reset | forbidden action never reaches write hook | full transaction rollback, no committed writes |
| TS06 | 8→4→terminal Swiss4 | all eight statuses unchanged | only terminal four active; previously excluded P5–P8 still eliminated |
| TS07 | nonterminal stage, next started/route approved | guarded existing conflict, no writes | same |
| TS08 | final Swiss active (not completed) | legal existing match revert retained | same |

Acceptance must include persisted `result_history` immutable rows, `action_log.isUndone`, match/stage revisions and transaction isolation under concurrency. Application/DB test remains **NOT_EXECUTED**.

## 3. A52-F018 / SE currentRound — formal product semantics

**SOURCE_CONFIRMED behavior:** after both R1 feeders complete, `completeMatch` advances stage/tournament `currentRound` to 2 when R2 exists. Legal revert of a completed R1 feeder clears the exact slot of the pristine R2 match; the revert path currently does **not** rewind `currentRound`.

**SE-A / EARLIEST_ACTIONABLE:** `currentRound` identifies earliest round with unfinished required action. For SE4 `R1:M1=1>2,R1:M2=3>4,R2:M1=(1,3,pending)`, revert R1:M1 produces `R1:M1=pending`, `R2:M1=(null,3,pending)`, stage/tour `currentRound=1`. API/UI must locate and offer the actionable R1 result editor; phase displays must not claim R2 is ready to play.

**SE-B / MAX_GENERATED:** `currentRound` identifies the highest round already generated. After same revert, `currentRound=2` remains valid; **separate** computed `earliestActionableRound=1` (or equivalent view derived from match readiness) is needed for navigation and operation enablement; do not change currentRound implicitly. R2 stays visibly generated yet blocked. If a new API field is needed, backend schema/UI/API consumers are a separate scoped task and must be approved.

**Owner decision:** `POLICY-SE-ROUND = EARLIEST_ACTIONABLE | MAX_GENERATED`. Document impact on tournament/stage public API, bracket, Host controls, navigation, statistics and persisted backward compatibility *before* code. No claim of a proven UI error without browser test. No R11 code.

## 4. T051 / BIZ-21-17 — Swiss5/Swiss6, BYE and matching policy

**SOURCE_CONFIRMED:** `generateSwissPairings` uses greedy first available unpaired non-opponent; then falls back to first available opponent without looking for a complete global matching. Some pairing orders therefore produce an avoidable repeat.

| Case | Standings at R3 | Fixed BYE | Greedy output | Globally repeat-free witness |
|---|---|---|---|---|
| SW5-R3 | `1,5,3,4,2` | 2 | `(1,5),(3,4),(2,BYE)`: repeat (3,4) | `(1,4),(3,5),(2,BYE)`: 0 repeats |
| SW6-R3 | `1,5,3,4,2,6` | none | `(1,5),(3,2),(4,6)`: repeat (4,6) | `(1,4),(2,6),(3,5)`: 0 repeats |

The witness is **not** a default mandated by policy. To enforce it, owner signs a priority ordering, e.g. `MIN_REMATCHES_FIRST -> score-band distance -> stageSeed/playerId canonical tie-break`; alternatives `STRICT_SCORE_BAND_FIRST` or `REMATCH_FREE_IF_FEASIBLE` can produce different results. `RNG` must not make outputs nondeterministic. Fixing BYE eligibility before matching can be a separate tradeoff versus solving bye+matching jointly.

**Current BYE source:** for an odd pool, select lowest-ranked entrant without prior completed `bye`; if all had BYE, select bottom ranked and allow repeat. `SW5-BYE-FIRST-FAIR`: standings 1..5, prior bye P5 → BYE P4; `SW5-BYE-EXHAUSTED`: all prior bye → BYE P5. Require policy signature before changing this. BYE is not a historical opponent pair, and winner gets Swiss match win under standings rules.

**`no_contest`:** source Swiss pairing treats any completed 2-person match with resultType as a previous encounter, including `no_contest`; `standings.ts` excludes it from match record and Buchholz. Must decide whether a completed `no_contest` bars a later pairing. `cancelled` is not completed and is not counted as prior encounter. Walkover counts as a past encounter and standings win. Maintain source/current semantics until signed.

**Negative fallback (nonrematch globally impossible):**
- `SW4-FORCED1` prior edges `12,13,14,23,24`: only `34` is novel; every perfect matching needs at least one rematch. Witness `(1,2),(3,4)` = 1 repeat. A first-fit 'novel edge' alone cannot guarantee optimal global matching.
- `SW4-EXHAUSTED` prior edges complete K4: every perfect matching contains two repeats; must choose deterministically and terminate.
- Additional negative: odd pool all prior BYEs; null/nonexistent/duplicate players; history from another stage; BYE with two entrants; `no_contest` + `walkover` history; cancellation not counted; malformed historical snapshots must reject/ignore according to *existing* input contract, not silently produce ghost matches.
- Tie-break deterministic for same input: repeated invocation and reversed input array retaining canonical `standings` order must produce equivalent pairing; each active entrant appears exactly once including BYE.

**Formal signature `POLICY-SWISS`:** rematch vs score-group precedence; BYE selection scope and repeat fairness; status of completed NC; deterministic tie-break + maximum pool/solver complexity budget; behavior when no rematch-free perfect matching exists. Until signed: **no rewrite**.

## 5. T051 / BIZ-21-19 — Double Elimination champion, runner-up, places 3–N

**SOURCE_CONFIRMED:** `completeStage()` DE preview sorts one winner first and all others by `stageSeed` (no elimination order), so `A(1),B(2),C(3),D(4)` seeded ordering yields `A,B,C,D` even when D lost decisive GF and must be vice-champion under standard GF semantics. Existing V2 routing produces match winner/loser and GF reset state.

**Three DE4 deterministic paths**, all start Upper `A>D,B>C,A>B`, Lower `D>C,D>B`:

| Case | Grand Final | GF Reset | Champion | Runner-up | Places 3–4 (only if loss-order policy signed) |
|---|---|---|---|---|---|
| DE4-GF-UPPER | A>D | system BYE | A | D | B,C |
| DE4-GF-RESET-UPPER | D>A | A>D | A | D | B,C |
| DE4-GF-RESET-LOWER | D>A | D>A | D | A | B,C |

Runner-up is the **loser of decisive final**, i.e. loser of GF when upper winner closes it or loser of **played** GF Reset. In reset BYE, do not invent second match losses. A60 must verify persisted `stage_participants.finalRank`, stage preview rank, published standings and winner are mutually consistent on real PG16.

**Open `POLICY-DE-RANK-3-N`:** options: `ELIMINATION_WAVE` (later second loss ranks higher, equal wave uses shared rank or explicit stageSeed tiebreak); `STAGE_SEED` within nonfinalists (current implementation); `PLACEMENT_TIES` for shared lower-bracket elimination level. Reject seed-only runner-up **if** owner signs decisive-final loser semantics. Verify GF reset, BYE, forfeits, different bracket sizes 3,4,6,8,9,17,32, and no ghost participant. Do not fabricate ranking 3–N absent signed policy.

**RR `stageSeed` BIZ-21-18:** PR32 `complete-match.ts` already constructs `seedByPlayerId` from `stage_participants.stageSeed`; source-fix present. Retest RR3 1–1–1 cyclic tie where global `players.seed` is opposite stageSeed, including PG trigger and published standings. **No duplicate source patch**.

## 6. Test evidence, A50/A60 handoff and hard STOP

**Executed in R11 by A80:** connector-only exact GitHub PR/source reads and CI job-log inspection. R11 fixture object validated via offline deterministic perfect-matching enumeration and BYE checks: SW5 min 0 vs greedy 1, SW6 min 0 vs greedy 1; forced min 1, exhausted min 2; BYE expected 4 and 5; three DE final-loser cases. These are **MODEL_CHECKED**, not native TypeScript/HTTP/PG test results, no application exit code.

**NOT_EXECUTED:** `artifacts/api-server/test/swiss.test.ts`, `round-robin-terminal-reopen.integration.test.ts`, `revert-match.integration.test.ts`, `complete-match.integration.test.ts`, `double-elimination-api.integration.test.ts`, any live browser tests. No physical isolated PostgreSQL16 authorization received by A80, no manual paid CI. Defer exact checkout/dependency/DB preflight to A50.

**A50 test commands after its independent physical isolation preflight** (shell inside `artifacts/api-server`, Node22 and installed locked dependencies; env configured externally, never include actual credentials in docs or logs):

```bash
node --import tsx --test ./test/swiss.test.ts ./test/double-elimination-v2.test.ts
# POSTGRESQL 16 ONLY after A50 verified isolated TEST_DATABASE_URL,
# TEST_DATABASE_SCHEMA=tm_test_a80_r11 and explicit safe TEST_DATABASE_RESET:
node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
node --import tsx --test --test-concurrency=1 ./test/complete-match.integration.test.ts
node --import tsx --test --test-concurrency=1 ./test/double-elimination-api.integration.test.ts
```

**Future** Swiss/terminal/DE test definitions are not present on release: A50/A60 should use R11 JSON and document the missing test implementation as `NOT_EXECUTED` until an authorized patch is created. A60 independently maps source expectations to exact PR SHA; source assertions by A80 **are not QA signoff**. Any test failure must report command, env fingerprint, exit code, and supported finding without exposing DB tokens.

**File ownership and STOP:** PR45 frozen, `revert-match.ts` A80 SOURCE-ONLY in R11; PR42 Undo and A70 frozen; `routes/tournaments.ts` A100 DELETE lane, not available; Backup A90 and presentation A120 own other lanes. **No R11 source-code patch, draft PR, merge, CI rerun, DB write, staging, Replit, SWARM-006 dispatch.** See companion future-patch plan and final handoff.

## 7. A00 decision list (never auto-approved)

| Decision | Formal options | Blocked until |
|---|---|---|
| `POLICY-TERMINAL-SWISS` | TS-A DENY_409 vs TS-B ATOMIC_REOPEN + error code | Owner/HQ + Undo/CAS compat |
| `POLICY-SE-ROUND` | Earliest actionable vs maximum generated (+ separate actionable view) | Owner/HQ + UI/API impact |
| `POLICY-SWISS` | rematch-first vs score-band-first, NC + BYE/fallback/tie-break | Owner/HQ + input validation |
| `POLICY-DE` | decisive GF runner-up and rank 3–N tie/wave/seed | Owner/HQ + persisted preview rules |
| P12 PR45 acceptance | Source review, PG16 HTTP and Undo parity | A50 + independent A60 exact SHA |
| Code lane for next patch | one small future PR only | A00 explicit GO after policy + R11 lane release |

**One next action:** A00 routes signed `POLICY-TERMINAL-SWISS` decision while A50/A60 establish native P12 QA; then authorizes one narrowly scoped patch from a future freed code lane. Formal recommendation is *sequencing*, **not** selection of a sporting policy.
