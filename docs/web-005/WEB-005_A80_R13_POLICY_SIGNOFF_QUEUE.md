# WEB-005 — A80 R13 POLICY SIGNOFF QUEUE

**Agent:** A80 — Stage Lifecycle & Sporting Rules  
**Task:** WEB-005-T050-T051-A80-R6  
**Wave:** R13 / 2026-10-14 Europe/Warsaw  
**Authority:** SOURCE-ONLY. No application code, PR45 modification, new draft PR, merge, or SWARM-006.  
**Disposition:** POLICY_PACKET_READY / PR45_PATCH_PROPOSED / QA_PENDING / RELEASE_NO_GO.

## 1. Exact source and GitHub preflight

R13 control document blob: ec765236516cb63c1dd62e0e9257943ad9c9cc71 on chore/web-005/t000-wave1-control. Release HEAD 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7, PR [#32](https://github.com/C8LyNn/aplikacja-turnieje/pull/32) OPEN and unmerged, main base c50cc48e6fa508592bda3f4838111e9cff5af80c.

| Candidate | Verified HEAD, all base release | Status |
|---|---|---|
| [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45), A80 RR | a7a87bc019731191dbfa44bee6939e3fa25e27f4 | OPEN DRAFT, unmerged |
| [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42), A70 LIFO | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT, unmerged |
| [PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51), A70 history | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT, unmerged |
| PR49 / PR50 | 99298b81501c3e7764d653604923522a19b9f05c / 5457a74187edc263730c3a4b25a663bdf5531ee9 | OPEN DRAFT, unmerged |

PR45 changes exactly the source application/matches/revert-match.ts, the new test round-robin-terminal-reopen.integration.test.ts, and two R10 documentation files. PR42 and PR51 both edit routes/tournaments.ts and the existing revert-match.integration.test.ts plus their own reports; neither touches domain/tournament/swiss.ts. PR45 review submissions and comments returned zero at inspection; this does **not** disprove separate A60 reports.

[PR45 CI run 38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) FAILED at inherited Pack19 snapshot contract; downstream steps SKIPPED. Old release source matcher expected readOnly:true whereas source uses accessMode:"read only"; PR35 contains the separate source-test correction. The target PR45 PG test was not shown to run; CI failure does not certify target PASS or target FAIL.

## 2. A52-F019 PR45 — A50/A60 exact-SHA acceptance boundary

**SOURCE_CONFIRMED:** release terminal multi-stage RR Revert reactivated every tournament player, including eliminated prior-stage nonqualifiers. **PATCH_PROPOSED:** PR45 reads and locks stage_participants for the current terminal RR stage, updates global players only for the exact stage member IDs plus tournament ID, checks affected cardinality, and preserves existing stage/tournament reopen, winner, audit and result-history flow.

**Test-first source order confirmed:** ce72152b8d69aab313a3829a05367f2f45bf87cd created the dedicated fixture file; e6b7cd8191a16640fc6b7c290910897c5217bdb3 applied the narrow production source fix. This is commit ordering, **not** evidence a red test was executed beforehand.

**Definitive physical acceptance:** companion WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json (18 conditional cases). A50 must check out exact PR45 HEAD, configure owner-authorized physically isolated disposable PostgreSQL16, dedicated test DB and schema tm_test_*, explicit schema DROP/RESET authorization, locked Node22/pnpm10 dependencies; then run the new round-robin-terminal-reopen.integration.test.ts plus the existing revert-match and match-revision integration tests, attaching real command, exit, redacted environment fingerprint and logs.

**Core persisted oracle (RR13-01 to RR13-04):** SE8 → top4 → terminal RR4. Complete 4 SE fixtures then all 6 RR fixtures and terminal stage. Snapshot tournament/stage/match/statuses/revisions/players/stage_participants/result_history/action_log. Revert final RR match: match pending, stage/tournament active, both winner IDs NULL, tournament.activeStageId=terminal RR4, exactly four RR stage entrants globally active; the other four **previous nonqualifiers**, determined by set difference rather than assumed player IDs, remain globally eliminated with first-stage membership unchanged. Stage seeds preserved, final RR ranks reset, result history immutable and one completion action undone / one Revert action added. Re-complete and re-finalize: one winner from RR4, all nonqualifiers still eliminated, second immutable result revision appended.

**Trigger caution:** migration 0002/0006 players_sync_single_stage_participant can project global player status changes into *first stage* membership for prior **qualifiers**. Their rows may mutate on terminal RR reopen; record their before/after independently rather than falsely asserting all original stage rows unchanged. No SQL change authorized A80.

**Public Direct Revert/Global Undo caution:** a terminal stage_completed action follows last match_result_submitted, but standalone PR45 test calls direct Revert and expects 200. PR42 global Undo LIFO and PR51 malformed Undo handler are separate; owner/HQ direct Revert CAS/latest-action preconditions remain POLICY_OPEN. Do not assume combined acceptance or merge these PRs to test in WEB-005.

## 3. POLICY-TERMINAL-SWISS — P0 owner signature #1

**SOURCE_CONFIRMED gap; STATIC_INFERRED consequence:** revert-match.ts terminal reopen switches only on SE/RR. Swiss terminal match may become pending after Revert while its final stage and tournament remain completed and winner IDs stale. CompleteMatch rejects non-active stages. Must prove persistence in future isolated PG, not claim a runtime incident today.

**Non-negotiable invariant:** after every successful mutation, there must not be a pending *required terminal Swiss match* while stage/tournament remain completed. Winner IDs, completedAt, activeStageId, tournament status, participant statuses, match/stage revisions, audit/history must remain atomic and self-consistent.

| Decision | Required API + state | Correction UX + audit/rollback |
|---|---|---|
| **TS-A DENY_409** | Controlled 409 with owner-approved domain code; **zero writes** to match/history/action/stage/tournament/players/members, no version increment | Explain finalized result cannot be edited through this operation; separate authorized correction channel; stage_completed action and earlier history unchanged |
| **TS-B ATOMIC_REOPEN** | Under locks and validated latest-action/CAS, one transaction resets match pending, stage+tournament active, winner IDs NULL, stage completedAt NULL, correct activeStageId, current-stage members active, earlier nonqualifiers untouched | Correction screen permits re-entry/re-finalization; preserve immutable history; explicitly define compensation/supersession of existing stage_completed audit action vs global LIFO; any injected error must roll back **all** tables |

Both options must handle played, walkover and no_contest (match winner can be NULL), system-generated BYE (protected 409 under either option), stale actor/revision, downstream started stage or approved routing, 8→4→terminal Swiss4 with prior nonqualifiers, and transaction fault injection. Do not compare match winner directly to overall Swiss champion.

**Owner signature fields REQUIRED:** POLICY-TERMINAL-SWISS decision TS-A or TS-B, stable external HTTP/domain code, correction UX, allowed actor, public Direct Revert and Undo-last precedence, stage_completed action compensation policy, rollback guarantee, signer, date. **NO DEFAULT SELECTED.**

## 4. Independent policy decisions for SE, Swiss and DE

| Policy to sign | Evidence and conditional outputs | Alternatives |
|---|---|---|
| POLICY-SE-ROUND | SE4 R1 first match P1>P2, second P3>P4; R2 pending [P1,P3]. Revert first feeder clears only R2 slot 1, keeps slot 2 P3; source currentRound remains 2 | EARLIEST_ACTIONABLE → stage/tour currentRound 1; MAX_GENERATED → remain 2 plus separate actionable projection 1. Include API/UI/Host semantics |
| POLICY-SWISS-PAIRING | Swiss5 standings [1,5,3,4,2], BYE P2: greedy (1,5)+(3,4) has 1 repeat, zero-repeat witness (1,4)+(3,5). Swiss6 standings [1,5,3,4,2,6]: greedy (1,5)+(3,2)+(4,6) has 1 repeat; witness (1,4)+(2,6)+(3,5) has zero | Minimum repeats primary vs score-band proximity primary vs explicitly retaining greedy fallback; fix deterministic tie-break and acceptable solver complexity before implementing |
| POLICY-SWISS-BYE-NC | Current BYE chooses lowest-ranked entrant without earlier BYE, otherwise bottom ranked even if repeating. Completed no_contest is prior pairing (but not standings win/Buchholz), cancelled is not paired history | BYE fairness/scope, NC as prior encounter, fallback and tie-break; do not silently change existing source semantics |
| POLICY-DE-GF-RUNNERUP | DE4 GF A>D reset BYE ⇒ champion A, runner D; GF D>A reset A>D ⇒ A,D; GF D>A reset D>A ⇒ D,A. Source stage ranks winner then rest by stageSeed and can wrongly place seed2 B second | Owner must sign runner-up = loser of decisive played GF or reset, or explicitly choose alternative. Never count a system reset BYE as another played loss |
| POLICY-DE-RANK-3-N | Source stageSeed cannot infer second-loss order | Choose second-loss wave, shared rank/ties and/or seed tie-break in same wave; nonpowers of two and BYEs separate tests |
| BIZ-21-18 RR stageSeed | Release complete-match uses stage_participants.stageSeed for RR tie-break | Already corrected in release source; regression ONLY (RR3 1–1–1 cyclic tie, global seed opposite stage seed). No duplicate patch |

**Historical correction/withdrawn distinction:** WEB-004 A52-F001/F002 and BIZ-21-09/12 remain withdrawn; BIZ-21-18 source corrected, not a new implementation gap. R13 owner decision queue does not resurrect them.

## 5. Rechecked model and A50 deterministic conditional fixture

R11 input JSON blob a44147b1da905509277395f7fcaee6331cbd7844 was read and checked again R13 via an independent in-memory JS reproduction of source greedy pairing and exhaustive minimum-repeat enumeration. **11 cases MODEL_CHECKED**, not application test PASS:
- Swiss5/Swiss6 greedy each has 1 repeat; exact optimum 0 after selected BYE, witness 0, deterministic repeated model invocation.
- SW4 forced fallback min 1, fully exhausted history min 2; a globally repeat-free solution is mathematically impossible in those examples.
- BYE picks P4 when only P5 had prior BYE, P5 when all have previous BYE.
- Completed no_contest counts as prior encounter, cancelled does not, in the model.
- DE GF/reset conditional champion/runner pairs (A,D), (A,D), (D,A).

**A50 handoff:** machine-readable R13 CONDITIONAL_ACCEPTANCE_FIXTURES.json contains 18 cases, including actual RR PG state snapshots, conditional TS-A/TS-B outcomes, SE currentRound, Swiss5/6/fallback/BYE-NC and DE GF/reset. Only policies already selected by owner may become mandatory expected outputs. Missing policy means TEST SPECIFICATION / BLOCKED, not automatic PASS or FAIL. A60 reviews actual exact-SHA native results.

**Native TypeScript, PostgreSQL16, HTTP, browser, typecheck:** NOT_EXECUTED by A80. Connector model validation has no process exit code. A50 must report actual environment, command, process exit and logs independently. No physical test DB reset by A80.

## 6. Single collision-free FUTURE code candidate: T051 Swiss pairing

**Candidate:** T051-SWISS-DETERMINISTIC-PAIRING, only if owner signs POLICY-SWISS-PAIRING and POLICY-SWISS-BYE-NC and A00 explicitly frees a later code lane / grants GO.

**Source:** artifacts/api-server/src/domain/tournament/swiss.ts, release blob aa00b4ef445aaff7eb48152eb5d6c2063befbf7a; **tests:** artifacts/api-server/test/swiss.test.ts and optional dedicated optimality test. These files are **not touched** by PR45 (revert-match.ts) or PR42 and PR51 (routes/tournaments.ts + revert-match.integration.test.ts). Reverify wider ownership when actual future GO is issued. This is a conditional code proposal, not R13 work.

**Test first after approval:** conditional Swiss5/6 rematch minima, forced1/exhausted2 fallback, BYE fairness, NC vs cancelled, stage-history isolation, determinism, no duplicate/ghost participants, solver complexity bound approved for supported player counts. If signed policy instead prioritizes score-group consistency over repeat minimization, adapt oracle to policy, never impose silent algorithm priorities.

**Why terminal Swiss code is not this collision-free candidate:** even TS-A 409 guard modifies exactly the frozen PR45 file revert-match.ts and may require route error mapping intersecting A70 PR42/51. T050 Swiss terminal implementation therefore remains a separate future HOLD until A00 resolves composition/ownership and signs TS-A or TS-B. Do not modify both in one patch, do not silently merge/rebase.

**Gate order:** signed owner/HQ policy → later free code lane + A00 GO/explicit SHA → test-first isolated branch and draft PR → A50 native exact-SHA verification → A60 independent verdict → final WEB-005 closeout and separate SWARM-006 final-only process. No code patch initiated here.

## 7. Policy signoff form — awaiting owner/HQ

| Policy ID | Owner signature / date | Selected semantics | Error/UI/compat contract |
|---|---|---|---|
| POLICY-TERMINAL-SWISS | PENDING | TS-A / TS-B not chosen | PENDING |
| POLICY-SE-ROUND | PENDING | actionable / generated not chosen | PENDING |
| POLICY-SWISS-PAIRING | PENDING | repeat / score / legacy priority | PENDING |
| POLICY-SWISS-BYE-NC | PENDING | BYE fairness and NC encounter | PENDING |
| POLICY-DE-GF-RUNNERUP | PENDING | decisive loser or explicit alternative | PENDING |
| POLICY-DE-RANK-3-N | PENDING | loss wave / tie / seed | PENDING |

Control decisions D090, D098, D105 at DECISIONS.md blob 495934d47c43fb491893e696d5fe1f2c4126183b still marked these POLICY_OPEN. No owner signature inferred or supplied.

**Hard STOP:** no source changes, no PR45 modification, no fourth code lane, no merge/cherry-pick/composite, no CI rerun, no SQL/DDL/shared DB, no staging/live/Replit, no SWARM-006 dispatch. A00 receives queue and final handoff; PR45 independent PG16 acceptance remains pending.

**FINAL:** A80_R13_SOURCE_ONLY_COMPLETE / POLICY_SIGNOFF_PENDING / PR45_QA_PENDING / RELEASE_NO_GO.
