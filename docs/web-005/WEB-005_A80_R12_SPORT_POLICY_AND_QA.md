# WEB-005 — A80 R12 SPORT POLICY AND PR45 QA

**Agent:** A80 — Stage Lifecycle & Sporting Rules  
**Task:** WEB-005-T050-T051-A80-R5 | **Wave:** R12 | **Date:** 2026-10-14 (Europe/Warsaw)  
**Mode:** SOURCE-ONLY / no code changes / no new PR  
**Classification:** POLICY_OPEN / PR45_PATCH_PROPOSED / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO

## 1. GitHub evidence verified at R12

- Central R12 control document blob: 7f39cc5c7a5e845a97e3952187c8128510e498bc. Common §0–§2 and A80 authorized SOURCE-ONLY.
- Release PR #32 OPEN, unmerged; release HEAD 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7, main base c50cc48e6fa508592bda3f4838111e9cff5af80c.
- [P12 / PR #45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) OPEN DRAFT / unmerged, HEAD a7a87bc019731191dbfa44bee6939e3fa25e27f4, base release. Four files only: application/matches/revert-match.ts; test/round-robin-terminal-reopen.integration.test.ts; two R10 report files.
- [P09 / PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) OPEN DRAFT, HEAD 1ae0ccb801f4177052bff1ec7041e55b8c992c8b.
- R11 PR #46 HEAD 7f60849e389a7ed35fdd39dd5493c4c4c267d860, PR #47 HEAD f09a13623faca8d7ab29b09a2c5b43907c2acd0b, PR #48 HEAD 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3; all OPEN DRAFT.
- PR45 test-first sequence confirmed by commit file changes: ce72152b8d69aab313a3829a05367f2f45bf87cd touched *only* new test; e6b7cd8191a16640fc6b7c290910897c5217bdb3 touched *only* revert-match.ts. This verifies ordering of commits, NOT execution of a failing test before the fix.
- PR45 Actions run [38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) FAILED at historical Pack19 snapshot contract; downstream gates skipped. R12 control attributes the baseline CI discrepancy to expected readOnly:true versus actual accessMode:"read only", separately corrected in PR #35. This does **not** independently verify the new PR45 RR4 test.
- PR45 GitHub reviews API returned no reviews. Does not disprove any separately stored A60 report.
- The inspected DECISIONS.md blob a777ca34521b3d932c1b4f7798c21eeccfcf6bcc did not contain a signed choice for terminal Swiss, SE currentRound, Swiss matching/bye, or DE ranking.

## 2. A52-F019 / P12 PR45 read-only audit

**SOURCE_CONFIRMED original gap:** finished multi-stage RR Revert previously activated all players with matching tournament ID, including entrants eliminated before terminal RR and absent from its roster.

**PATCH_PROPOSED at exact PR45 HEAD:** inside the terminal multi-stage Round Robin branch, lock and load current stage_participants roster; update players.status=active constrained by BOTH tournament ID and those member player IDs; verify updated count matches roster; retain existing winner, stage/tournament reopen and audit logic. The single-stage RR path and generic Undo were not rewritten. No changes to PR45 are authorized in R12.

**Risk that remains unverified:** PostgreSQL compatibility trigger players_sync_single_stage_participant may project player status changes to first-stage membership of earlier qualifiers. The test currently asserts that earlier **nonqualifiers** stay eliminated, but does not fully classify changed first-stage membership rows of previously qualified entrants. A50 records that delta separately; A60 evaluates impact without assigning an unapproved migration change to A80.

**Action-order interface:** original completion of the terminal RR stage writes a stage_completed action after the final match_result_submitted action. PR45 direct Revert test expects 200 after stage completion. PR42's Undo-last Global LIFO may treat latest actions differently; public Direct Revert strict preconditions remain POLICY_OPEN under A70/A00. A standalone PR45 result cannot certify combined PR42+PR45 behavior.

### Definitive PG16 acceptance fixture for A50/A60: RR12-PG-01

**Test identity:** exact checkout a7a87bc019731191dbfa44bee6939e3fa25e27f4, Node22/pnpm10, locked dependencies, physically disposable PostgreSQL16 in TEST database, unique schema tm_test_a80_r12, explicit reset permission, no shared/prod database or backup. A50 exclusively owns this preflight. Test runner drops/recreates its test schema.

| Step | Preparation/action | Assert on real database |
|---|---|---|
| 01 | Create SE8 → RR4 tournament; register eight players | Exactly 2 ordered stages, 8 first-stage entrants and planned 4 RR entrants |
| 02 | Start SE8; complete four first-round matches; complete stage | 4 qualified, 4 excluded; record actual qualified player IDs (not guessed by seed) |
| 03 | Start terminal RR4 | RR stage roster exactly four qualified IDs; six round-robin matches |
| 04 | Complete six RR matches and terminal stage | Tournament and RR completed with same winner; tournament activeStageId null, eight global player statuses 1 winner + 7 eliminated |
| 05 | Before Revert snapshot | All players (id, status, seed), all stage participants (stage, player, status, stageSeed, finalRank, nextStageSeed), tournament and both stages (status, winner, timestamps, revisions), target match, result_history and action_log |
| 06 | Direct POST /api/matches/:lastRRMatchId/revert | In standalone PR45: HTTP 200; target match pending/winner null; RR and tournament active, both winner IDs null, activeStageId = RR stage |
| 07 | Excluded prior players | All four absent from terminal RR membership remain globally eliminated and their first-stage membership unchanged, with zero newly active old nonqualifiers |
| 08 | Current RR entrants | All four globally active and RR membership active, finalRank null; RR stage seeds and exact roster preserved |
| 09 | Prior qualified stage membership trigger effects | Diff all rows for *qualified* earlier-stage members; distinguish expected projection by DB trigger from harmful nonqualifier resurrection; never assume unchanged first-stage rows |
| 10 | History and revision | Old result_history immutable; original match_result_submitted action undone once; one match_result_reverted audit action; match revision reflects existing revision trigger; no duplicated action |
| 11 | Corrected complete + terminal stage complete | One champion from RR4; 4 earlier excluded globally eliminated; target history has exactly two ordered revisions |
| 12 | Controls | Single-stage RR reopens as before; duplicate Revert, stale revision, failed authorization and injected rollback have no partial writes |

**Required physical commands only AFTER A50 isolation preflight** (run with installed dependencies, cwd artifacts/api-server):

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

From workspace root: pnpm --filter @workspace/api-server typecheck.

A50 reports command, **actual exit code**, exact HEAD SHA, Node/pnpm/PG16 versions, sanitised database fingerprint, schema, log evidence. A60 independently decides source/runtime acceptance. A80 HAS NOT EXECUTED these commands. No combined PR42/45 runtime assumption permitted.

## 3. Terminal Swiss A52-F022 — TWO FORMAL OPTIONS (OWNER SIGNATURE NEEDED)

**SOURCE_CONFIRMED contract gap:** source RevertMatch reopen cases are only SE and RR. A completed terminal Swiss match can be set pending while stage/tournament stay completed and winner IDs stale (STATIC_INFERRED downstream persistent state; not PG-verified). CompleteMatch rejects pending match if stage is not active.

**Non-negotiable invariant:** no successful mutation leaves a tournament completed with a required terminal Swiss match pending. Tournament/stage status, completedAt, winner IDs, activeStageId, player/status membership, result_history and action log must be mutually consistent and transactional.

**TS-A — DENY_409, no writes:**
- Return controlled HTTP 409 for completed terminal Swiss result revert; all tables/statuses/versions/winner/timestamps/history/action entries byte-for-byte unchanged. No phantom Undo or new Revert action.
- Explain to organizer that completed tournament cannot be corrected through the current operation; route to a separately authorized correction workflow. Actor and exact API error code require signature.
- Negative cases: final played/walkover/no_contest all rejected, system BYE keeps its existing protected rejection; active Swiss and correctly guarded nonterminal completed Swiss unaffected.

**TS-B — ATOMIC_REOPEN:**
- After canonical tournament→stage→match/action post-lock checks, atomically reset chosen match; set terminal stage+tournament active, clear both winner IDs and terminal completedAt, reactivate only terminal stage roster; preserve prior eliminated nonqualifiers and stage seeds/route provenance.
- Restore correct activeStageId, increment appropriate version/revision under existing triggers; one completion action undone and one Revert audit event. Corrected match completion and full stage/tournament finalization must then succeed.
- A failure after any partial operation, including stage/participant writes or audit hook, must roll back the entire transaction. A completed no_contest may have NULL match winner; do not assume match winner equals tournament winner.
- More substantial implementation and trigger/Undo QA than DENY; needs separate new A00 GO.

**REQUIRED SIGNATURE FOR A00 / owner/HQ:** policy ID POLICY-TERMINAL-SWISS, option TS-A/TS-B, stable external HTTP error and exact correction UX, latest-action/direct-Revert compatibility, owner/date, rollback evidence. No option selected by A80.

## 4. Independent sporting policy decisions (do not bundle)

| Domain | SOURCE_CONFIRMED / MODEL_CHECKED | Owner decision |
|---|---|---|
| SE currentRound A52-F018 | After R1 feeder reversion clears only the pristine R2 winner slot, source currentRound remains at 2 | EARLIEST_ACTIONABLE (rewind to 1) vs MAX_GENERATED (retain 2 but derive actionable=1 for UI); both stage/tournament/API contract |
| Swiss5/6 BIZ-21-17 | R3 standings Swiss5 [1,5,3,4,2] with BYE P2: greedy (1,5),(3,4) repeats 3–4, witness (1,4),(3,5) zero repeats. Swiss6 [1,5,3,4,2,6]: greedy (1,5),(3,2),(4,6) repeats 4–6, witness (1,4),(2,6),(3,5) zero repeats | Score-band vs minimal rematches priority, deterministic tie-break, solver size/cap, fallback, BYE fairness, completed no_contest historical pairing effect |
| Swiss BYE / NC | Current source: lowest ranked without prior BYE; if everyone has BYE, bottom ranked may repeat; completed no_contest counts as prior pairing but not standings match win/Buchholz; cancelled does not count | Sign whether preserving these priorities or modifying them; do not silently equate no_contest and cancellation |
| DE Grand Final | Source stage rank sorts champion then others by stageSeed; DE4 A seed1, B2, C3, D4 can give [A,B,C,D] even when actual GF runner-up D | Sign runner-up = loser of decisive GF or played reset, with GF reset BYE/no phantom loss |
| DE positions 3–N | Current seed ranking does not reflect second-loss order | Sign loss-wave vs seed vs shared rank/tie policy, include non-power-of-two brackets |
| RR stageSeed BIZ-21-18 | Release complete-match.ts already reads stageParticipant stageSeed for RR result | Regression only: cyclic RR3 1–1–1 with inverted global players.seed; no duplicate patch |

No app code authorized for these policies in R12.

## 5. R11 model reproducibility — rechecked R12

Fixture source: WEB-005_A80_R11_DETERMINISTIC_FIXTURES.json blob a44147b1da905509277395f7fcaee6331cbd7844.

A fresh, independent JS enumeration implemented source-equivalent greedy ordering and exhaustive minimum-rematch matching. **Nine offline model assertions passed:** Swiss5 and Swiss6 greedy=1 vs optimum=0 (witness 0), repeated invocation deterministic; SW4 forced fallback optimum=1, exhausted-history optimum=2; prior BYE P5→BYE P4, all prior BYEs→P5; DE4 winner/runner-up (A,D), (A,D), (D,A) for GF upper, reset upper, reset lower. **Evidence level: MODEL_CHECKED only.** Not an actual call to application TypeScript pairing API, node --test, PostgreSQL, or browser.

Future matching negative gates: no duplicate participants, no phantom BYE opponents, historical completed no_contest distinct from cancelled, deterministic stable tie-break, global fallback termination when repeat-free impossible, stages isolated correctly, no unauthorized alternative selection.

## 6. One conditional future code-lane candidate — no R12 implementation

**Candidate after signed TS-A only:** T050-TERMINAL-SWISS-DENY-GUARD. Make one test-first dedicated terminal-swiss-revert.integration.test.ts, then guard in application/matches/revert-match.ts after canonical validation/locks and before any mutation, returning **owner-approved** 409 and preserving all history. Negative tests: completed terminal Swiss played/NC/walkover, system BYE, 8→4→terminal Swiss prior nonqualifiers, active Swiss legal revert, completed nonterminal Swiss with downstream protections, concurrent attempts, whole-database snapshot no writes.

**STOP if TS-B chosen:** entirely different multi-table atomic reopen patch plan with stage status, tournament pointer, participant trigger and rollback fixtures. No accidental implementation of both policies.

**Conflicts:** PR45 already owns one hunk in revert-match.ts, A70 owns public direct Revert/Undo history and R12 Undo route/test; routes/tournaments.ts R12 A70 file ownership. No changes to PR45, PR42 or routes. A00 must explicitly release later code lane and resolve ancestry/error-code contracts. Never create a fourth R12 code lane.

## 7. Evidence, handoff and hard stop

**Actually performed in this R12 thread:** GitHub connector read of R12 prompt, PR32/42/45/46/47/48 metadata, PR45 changed-file list and source/test/historical R10 commits, R11 policy/docs JSON and current DECISIONS/BACKLOG, CI result, source current Swiss/stage lifecycle. Separate JS offline fixture check produced 9 model assertions, no shell exit code.

**NOT_EXECUTED:** application unit/integration tests, actual PostgreSQL16, native typecheck, frontend/browser, isolated stage replays, composite runtime; no independent A60 source acceptance was recorded in the queried PR45 GitHub reviews.

**A50:** run exact-HEAD preflight and RR12-PG-01, capture commands and real exit statuses. **A60:** review exact source/trigger/Undo boundaries and validate observed runtime. **A00/owner/HQ:** sign terminal Swiss option and other separate sports policy choices.

**Hard STOP:** no source edits, new PR, SQL/DDL, production/shared DB, CI rerun, merges, staging/live, Replit, SWARM-006. R12 document only on existing control branch.

**Final classification:** A80_R12_SOURCE_ONLY_COMPLETE / POLICY_REQUIRED / PR45_QA_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO.
