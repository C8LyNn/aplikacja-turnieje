# WEB-005 — A120 / R22: S2 actionableRound, DE S5/S6 — future code and QA contract

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R22` · **Prepared:** 2026-10-15 Europe/Warsaw  
**Mode:** `SOURCE_ONLY / R23_SCOPE_PROPOSAL` — **zero source-code GO** in R22; no integration, PR, migration, paid CI, merge, deployment, or SWARM-006.  
**Binding directive:** `docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md` blob **`f616bca63a441bc2a4eead64ff67586e57e2b6ca`**, §§0–2 and AGENT A120.  

**Status:** `SOURCE_CONTRACT_READY / FUTURE_IMPLEMENTATION_PENDING / A60_FUTURE_EXACT_SHA_REQUIRED / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Pinned source, approved policy, and evidence quality

- **Release baseline unchanged**: `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **PR47 (P14)** [presentation/DE](https://github.com/C8LyNn/aplikacja-turnieje/pull/47): `OPEN DRAFT / UNMERGED`, HEAD **`f09a13623faca8d7ab29b09a2c5b43907c2acd0b`**, same release base; `stage-progress-view.tsx` Git blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6`.
- **PR54 (P21)** [RR historical 401/403](https://github.com/C8LyNn/aplikacja-turnieje/pull/54): `OPEN DRAFT / UNMERGED`, HEAD **`bfa9d075b431185aa8bbf87bf021d64dde8ae22f`**, same release base; `stage-progress-view.tsx` Git blob `2c50b5915572ec3721ad709ffd18ec58a597273f`, parent `tournament-detail.tsx` Git blob `a3565b6638f9def4ee9aebb0126444c15a613338`.
- **PR43 (CSV)** `96a6068f69027574ac76e18d4d5a2c444b5a914a` and **PR50 (Backup preview)** `5457a74187edc263730c3a4b25a663bdf5531ee9` modify the same parent page; all draft/unmerged. **PR45** `a7a87bc019731191dbfa44bee6939e3fa25e27f4` is separate terminal-RR roster code, not S2/S5/S6 implementation.
- **Independent A60 R21**: [`WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob **`47dc44f980734ce68dd63769ba3f25ad60dc899f`**: `HANDOFF_NOT_READY`, PR47 `SOURCE_ACCEPTED_CONDITIONAL`, PR54 `SOURCE_ACCEPTED_CONDITIONAL`; **zero native app runtime proof**. This verdict does **not** accept unimplemented S2/S5/S6.
- **Approved sport policy**: [`WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md), blob **`e5a779a372a38d198e6c56375f560b878dac0df1`**. S2-B = `currentRound` **latest generated round**, distinct from `actionableRound` **earliest actionable pending feeder**. S5 = runner-up **loser of legally decisive played/walkover Grand Final or Grand Final Reset**; technical BYE not a deciding final. S6 = rank by **second-loss elimination wave**, participants eliminated in same wave share places, competition rank e.g. `3,3,5`; no `stageSeed`/player-ID tie break. S5/S6 decisions were made by A00 under owner-delegated game-rule authority, not direct owner quotes.
- Other approved decisions **acknowledged but out of A120 scope**: Swiss S1 TS-B / S3 score-group / S4 stage BYE / S4-H history; Basket T055 D1B/D2B/D3B/D4A/D5B/D6B (blob `36a14ef3be7852c202cc003264bf17e67da2f022`); Backup B1-A and B2B/B3A/B4A/B5A/B6A (blobs `a0579990ace09d85eea62cfcab33b8ad54ea6fdc` / `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a`). **Policy selections are NOT code or QA PASS.**

## 2. S2 — currentRound vs actionableRound: source-confirmed gap and future contract

**SOURCE_CONFIRMED baseline:** `lib/db/src/schema/tournaments.ts` includes `currentRound`, `totalRounds` on tournament and stage, but **no `actionableRound` field**. `artifacts/api-server/src/application/stages/stage-lifecycle.ts` initializes both currentRound values to 1 at stage start (~1342, 1355). `artifacts/api-server/src/routes/tournaments.ts` serializes tournament `currentRound` (~383) and (for Swiss) increments stage and tournament `currentRound` on generation (~1675–1774). `artifacts/api-server/src/application/stages/stage-queries.ts` serializes stage currentRound (~21), no actionableRound. `lib/api-spec/openapi.yaml` TournamentStage (~3014–3033) and tournament representations (~2786/3262/4598) have currentRound, **not** actionableRound. These are **source facts**, not observed production UI failures.

**Future API contract, S2-B:** keep both existing tournament and stage `currentRound` semantics as **greatest GENERATED round**; **do not decrement them** merely because an earlier feeder result was reverted. Expose a **distinct nullable `actionableRound`** for the relevant stage and tournament/Host active-stage projection. Use a server-authoritative calculation in an authenticated canonical read, not an independent UI heuristic. Candidate definition:

1. From canonical matches scoped to **active Single Elimination stage ID**, identify lowest positive round with a **legally actionable** unresolved match: unfinished playable fixture with enough known participants/slots and valid result-entry permissions, or in-progress match. A future-round placeholder lacking feeder participants is NOT actionable even when `status=pending`.
2. After an upstream feeder Revert/Undo, invalidate downstream result/participants according to backend invariants, recompute `actionableRound` from the **post-transaction** match snapshot, and show that round in Host, Bracket, organizer and public projections. Keep stored generated currentRound unchanged.
3. If no round is currently actionable (e.g., stage completed, all matches resolved or temporarily blocked by dependencies), return `null`/explicit no-action state — **never fabricate round 2** merely because it has been generated. A bracket may still render generated rounds as schedule/history.
4. Technical automatic BYE is already resolved, not a player-actionable pending match. Cancelled/no-contest must be handled by the actual correction policy: do not silently treat them as played or as an actionable participant-filled match without canonical status confirmation.
5. Respect `tournament.activeStageId`: multi-stage older/current stage and public views must not use a globally unrelated tournament.currentRound to navigate another stage.

**Explicit implementation choice awaiting A00/A20 engineering gate:** Prefer **derived read-only projected `actionableRound`** computed from actual canonical match/feeder state, without adding a new persisted column; if transactional/consistency needs require a persisted field, A20 reviews schema/migration and A00 issues a separate exact GO. Neither alternative is implemented or authorized in R22.

**Source ownership map for future R23 (NOT NOW):**

| Proposed source/test file | Intended role / owner dependency |
|---|---|
| `artifacts/api-server/src/application/stages/stage-lifecycle.ts` | stage start/completion/correction lifecycle; ensure S2 invariant is not broken. **Backend-stage lane A80/A70 or A00-assigned exclusive owner**, not A120 R22 |
| `artifacts/api-server/src/application/stages/stage-queries.ts` | canonical Stage GET/list serialization of projected actionableRound; backend API lane |
| `artifacts/api-server/src/routes/tournaments.ts` | tournament/Host read projection and stage-scoped match behavior; **high-overlap backend route** requiring exclusive A00 hunk assignment |
| `lib/api-spec/openapi.yaml` + generated `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/` | nullable actionableRound DTO from generated contracts, never manual divergence; API spec/codegen owner |
| `artifacts/tournament-manager/src/pages/tournament-host.tsx` | Host round selection/display: use actionableRound for pending work, generated currentRound for history/counter |
| `artifacts/tournament-manager/src/pages/tournament-bracket.tsx` and `src/components/stage-progress-view.tsx` / `src/components/tournament-stages-panel.tsx` | stage-selected round badge, highlighted actionable feeder, no false R2 when R1 reopened; **PR47/54 child overlap requires future integrator coordination** |
| `artifacts/tournament-manager/src/pages/tournament-audience.tsx` | optional public current/actionable distinction; **PR47 same-file ownership** |
| `artifacts/api-server/test/tournament-stages-lifecycle.integration.test.ts`, SE correction/revert integration tests; `artifacts/tournament-manager/src/pages/public-stage-views.test.tsx`, `tournament-host.test.tsx` | executable deterministic scenario and negative regressions. Isolated PG16 only with owner/A20 reset GO |

**Important:** `src/lib/stage-utils.ts` has `deriveCurrentRound(matches)` based on in_progress/latest completed; it is not a server-authoritative actionable feeder calculation. Do **not** silently repurpose it as the new API contract.

## 3. S2 deterministic fixtures (future tests; NOT executed)

| Fixture | Canonical match states (active SE stage) | Required currentRound/actionableRound |
|---|---|---|
| **S2-01 feeder revert after R2 generated** | R1M1 completed then reverted to pending with two participants, R1M2 completed; R2M1 generated but dependency invalid / pending no legal pair | **`currentRound=2`, `actionableRound=1`**; Host and Bracket highlight R1M1; stale R2 result is not selectable |
| **S2-02 normal generated next round** | R1 all completed; R2 generated with legal participants, R2M1 pending/ready | **2 / 2** |
| **S2-03 auto BYE only in R1** | R1 BYE match marked completed with resultType=bye; another R1 valid played/pending match | **generated round / earliest actually playable pending**, no BYE as actionable |
| **S2-04 R2 placeholder** | R2 pending but missing a required feeder; no currently actionable unplayed R1 | **`actionableRound=null`** or explicit inconsistent/unresolved derived state, never pretend missing participants are actionable |
| **S2-05 final/completed** | All generated matches legally completed, stage completed | **`actionableRound=null`**, generated `currentRound` preserved |
| **S2-06 multi-stage isolation** | earlier SE stage completed; current active RR/DE stage with its own matches | active-stage projection never inherits stale former SE actionableRound |
| **S2-07 late response** | Host GET old stage/match state resolves after newer Revert N→N+1 | eventual display uses new canonical actionableRound; no old R2 reappearance. No local score/write simulation |

**Required negative checks:** an actual backend Revert must invalidate downstream state atomically and not silently corrupt bracket; stage authorization remains fail-closed; no change to Swiss `currentRound` next-generation semantics from S3/S4 lane.

## 4. S5/S6 DE — source-confirmed defect and future ranking ownership

**SOURCE_CONFIRMED:** `artifacts/api-server/src/application/stages/stage-lifecycle.ts` **~675–714** handles completion of `double_elimination` stage by inspecting `evaluateRoutingExecutionV2` participants and sorting membership as **champion first, everyone else by stageSeed**. It writes `rank=index+1`, and later persists to `stageParticipantsTable.finalRank` (~737 onward); `winnerId` takes ranking[0]. This does **NOT** implement the authorized S5 decisive-final runner-up or S6 second-loss waves/competition ties. Simply changing a frontend sort cannot repair canonical finalRank, standings, qualification preview or undo consistency.

**Other exact sources:**
- `artifacts/api-server/src/domain/tournament/v2/routing-execution.ts` `RoutingExecutionEvaluationV2` exposes `matches` (matchKey, status, winnerParticipantKey, loserParticipantKey), `participants` (loss count/status), `snapshot.decisions` and champion. **It does not provide an authoritative elimination-wave or official runner-up/rank mapping.** Internally `evaluateRoutingExecutionV2` derives losses only from completed match losers (~355–382) and normalizes decisions by key. The `snapshot.decisions` array order is **NOT** a trusted chronological elimination order.
- `artifacts/api-server/src/domain/tournament/v2/double-elimination-format-engine.ts`: bracket has named `grand-final`, `grand-final-reset`, Upper/Lower logical rounds and conditional reset route. `artifacts/api-server/src/application/stages/double-elimination-stage.ts` serializes round/bracket/order/status, canonical match ID and winner/loser for GET `/tournaments/:id/stages/:stageId/double-elimination`. Technical reset `bye` occurs when upper winner closes GF without played reset (existing `artifacts/api-server/test/double-elimination-v2.test.ts` cases for both paths).
- `artifacts/api-server/src/application/stages/double-elimination-match-runtime.ts` applies/reverts canonical matches, synchronizes participant state and clears `finalRank` after completed-stage revert (~319–352). S5/S6 must rebuild ranks from **current authoritative snapshot after every correction**, with no historical ghost place.
- `artifacts/api-server/src/application/stages/stage-queries.ts` exposes the persisted `finalRank` in GET stage details; `artifacts/tournament-manager/src/components/tournament-stages-panel.tsx` renders those ranks, `tournament-host.tsx` and `tournament-audience.tsx` render standings. `lib/api-spec/openapi.yaml` contains nullable stage-participant `finalRank` and stage ranking/DE state representations. **No client-only renumbering**.
- A60 R21 source acceptance of PR47/54 is for original presentation/visibility, **not** future S5/S6 place correctness.

**Future pure domain helper proposal** (separate new file only under exact R23 GO, location e.g. `artifacts/api-server/src/domain/tournament/v2/double-elimination-placement.ts` + dedicated unit tests):
1. Validate stage execution `evaluation.completed`, champion, canonical match outcomes and matchKey/route identity. Resolve **legally decisive** GF/reset: a truly completed played/walkover reset wins if required; otherwise a legally completed GF wins when reset is technical BYE/skipped. Walkover is a formal loss with provenance; **technical BYE does not incur loss or assign position**.
2. Runner-up = the losing participant in the **decisive actually resolved** GF/reset; if source is contradictory, cancelled, no_contest, no traceable final winner/loser or no legal concluding event, return a typed `UNRESOLVED`/reject completion — never infer runner-up from stageSeed or last timestamp.
3. For places 3–N, derive each eliminated player's **second loss** from completed canonical lower-bracket decisions and bracket DAG/wave, not snapshot decision index, sorted array order, wall clock or stageSeed. Later elimination wave ranks higher; equal wave shares a competition place. E.g. top 1,2; two eliminated together both **3**, next group starts at **5**. BYEs do not count; a formal lower-bracket walkover can count. Handle non-power-of-two capacities (e.g. 5/6/17 with technical BYEs) based on actual participant entries, not padded bracket slots. Validate exactly each entered participant appears once, no phantom participants, no duplicate second losses.
4. Persist derived ranks as `finalRank` via the existing completion transaction; stage winner always champion; complete-stage preview and GET stage details must display the **same** sorted ranking and competition ties. Sorting for stable presentation within equal rank can use names/seed **without assigning distinct rank numbers**. Any unsafe mismatch leaves completion rejected/rolled back.
5. On Revert/Undo/reset of a decisive GF/lower result, clear invalid `finalRank`, reopen as required and regenerate **only after a new legal completion**. Preserve other PR42/PR45/TS-B transaction boundaries and winner/roster consistency.

**Specific implementation hazard for A80/A70/A00:** S6's `elimination wave` must be a defined **structural bracket wave / causal lower-bracket round**, not incidental time order or a local UI sort. Validate graph ties on synthetic parallel Lower exits; for irregular size, no inferred played losses on padded technical BYEs. A00 should approve the minimal structure→wave mapping after A60 sees fixtures, without reopening the owner choice S6.

## 5. S5/S6 deterministic fixtures (future tests; NOT executed)

| Fixture | Canonical DE outcome | Expected ordered competition places / invariant |
|---|---|---|
| **DE-01 GF no reset** | Upper finalist beats Lower finalist in legally played Grand Final; conditional reset is `bye`/skipped | GF winner **1**, losing finalist **2**, reset BYE gives **no loss**; other positions follow second-loss wave |
| **DE-02 GF Reset** | Lower finalist wins first GF, legally played reset decides champion | Reset winner **1**, reset loser **2**; **loser of first GF is NOT automatically runner-up** |
| **DE-03 decisive walkover** | Legally completed decisive GF/reset with resultType=walkover and identified winner/loser | Winner 1 / loser 2 with walkover provenance, no fabrication of played score |
| **DE-04 technical GF/reset BYE** | Conditional reset `bye` or a technical route skip, no actual deciding match | Do not count automatic BYE as played final or second loss; infer only from last truly decisive legal completion, else `UNRESOLVED` |
| **DE-05 invalid conclusion** | Cancelled/no_contest or inconsistent decisive GF/Reset metadata | `UNRESOLVED` / reject final rank write; no stageSeed-based fallback |
| **DE-06 competition ties** | Two entrants incur confirmed second loss in same bracket elimination wave, following finalists | Ranks **1,2,3,3,5** for first five; next group begins after both 3rds; no `stageSeed` tie-break of rank |
| **DE-07 4/8 entrant coverage** | Valid bracket of 4 or 8 with distinct lower elimination waves | Precisely one winner, one runner-up, correct wave ordering, no duplicate ranks unless same wave |
| **DE-08 non-power-of-two 5/6/17** | padded bracket generates BYEs; real entrants only | Exactly N rank assignments for N entrants; empty seeds and BYEs create **no ghost loser/place** |
| **DE-09 lower walkover** | Valid lower-bracket walkover is second formal loss | Participant eliminated at wave of walkover; no phantom earlier elimination |
| **DE-10 correction/reset** | Complete DE; revert GF or lower feeder, replay with different winner; or reset runtime | Old finalRank/runner-up invalidated atomically, state reopened, new placements recalc only after legal completion, no stale standings/champion |
| **DE-11 source parity** | same finalized state via qualification preview, GET stage details, Host, Audience | Identical ranks incl shared competition place, winnerId/champion and stage status; no client fabricated ranks |

**Existing tests to extend, never claim executed:** `artifacts/api-server/test/double-elimination-v2.test.ts`, `double-elimination-api.integration.test.ts`, `double-elimination-persistence.integration.test.ts`, `tournament-stages-lifecycle.integration.test.ts`; client `artifacts/tournament-manager/src/pages/public-stage-views.test.tsx`, `tournament-host.test.tsx`, PR47 `stage-progress-view.test.tsx` and `tournament-audience.test.tsx`. Future pure helper should have standalone deterministic unit tests before DB implementation. **No physical PG16 reset in R22.**

## 6. Exact future R23 ownership/collision and test gate

**Suggested serialized ownership (proposal only — A00 allocates exclusive GO):**

- **Backend sports R23 / A80 or A70:** new pure DE ranking helper & tests, `stage-lifecycle.ts` completion call, `routing-execution.ts` / DE runtime **only if explicitly scoped** after inspecting existing S1 TS-B correction ownership. Stage currentRound vs actionableRound read projection/API routes likewise needs separate source GO. Avoid editing `swiss.ts` R22 L1 owned by A80 as A120.
- **OpenAPI & generated DTO R23 / API owner:** `lib/api-spec/openapi.yaml`, generated `lib/api-zod` and `lib/api-client-react`, version compatibility, nullability and no speculative manual type edits.
- **Frontend R23 / A120 only if A00 gives separate GO:** `tournament-host.tsx`, `tournament-bracket.tsx`, selected `stage-progress-view.tsx` and `tournament-audience.tsx`; StageNavigation should use canonical stage IDs; currentRound and actionableRound are distinct labels. PR47 **same child** DE presentation and PR54 **same child** RR private denial; do not overwrite either. PR43/50/54 **same parent** `tournament-detail.tsx`; retain CSV, Backup preview and RR N→N+1 observer.
- **Test/QA/Integration:** no composite branch in WEB005; after A00/HQ one final handoff and SWARM006 authorization, integrate exact PR SHAs with conflicts recorded and run combined DE graph, RR401/403, S2 Round pointer, S5/S6 ranks, Host/Audience/Brackets; independent A60 reviews exact new PR + future composite. PG16 tests only in physically isolated disposable DB with A20/owner reset GO.

**R22 actual execution truth:** A120 inspected live GitHub source/docs/PR metadata only. `RTL=NOT_EXECUTED`, `typecheck=NOT_EXECUTED`, `build=NOT_EXECUTED`, `browser=NOT_EXECUTED`, `API/PG16=NOT_EXECUTED`. **No application command exit/TAP/PASS or independent QA on future uncreated R23 source.** No code changes/PR made by A120.

**Outstanding unrelated owner/HQ gates:** MP2B public Direct Revert CAS, Steam absent-secret HTTP, session TTL/digest, PR53 ownerless raw cache erasure/retention, missing original WEB004 nine case IDs and 38 signed dispositions. Delegated S2/S5/S6 game-policy approval is **not** a waiver of these. Conditional EXEC-B is **not** final handoff GO or an app test PASS.

**ONE A00 next action:** define a **fresh narrow R23 GO** naming owner of `stage-lifecycle.ts` / DE pure ranking helper, separate S2 projection/OpenAPI owner, and coordinated frontend hunk ownership with PR47/54; then require real tests (or future signed test-debt ledger) plus independent exact-SHA A60. Do not transfer to SWARM006 before entire WEB005 source/policy/38-case gate and explicit HQ final authorization.

**End state:** `A120_R22_SOURCE_CONTRACT_PUBLISHED / R23_GO_REQUIRED / WEB005_IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD`.
