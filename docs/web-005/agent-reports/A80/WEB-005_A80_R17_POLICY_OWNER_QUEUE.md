# WEB-005 / A80 — R17 SPORT POLICY OWNER QUEUE

**Task:** WEB-005-T050-T051-A80-R10 | **Role:** Stage Lifecycle & Sporting Rules | **Mode:** SOURCE ONLY.
**Wave/date:** R17, 2026-10-14 Europe/Warsaw.
**STATUS:** OWNER_SIGNOFF_REQUIRED / POLICY_OPEN / PR45_SOURCE_ACCEPTED_CONDITIONAL / PG16_NOT_EXECUTED / RELEASE_NO_GO.
**Central order:** WEB-005_WAVE_R17_AGENT_PROMPTS.md, Git blob c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff.
**Release base:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.
**PR45 P12:** a7a87bc019731191dbfa44bee6939e3fa25e27f4, OPEN DRAFT, unmerged.
**R16:** [A80 R16 evidence recovery status](./WEB-005_A80_R16_DELIVERY_STATUS.md) = R16_ARTIFACTS_UNAVAILABLE. This is not an original R16 owner signature/report.
**Prior actual decisions:** [R15 unsigned policy packet](./WEB-005_A80_R15_SPORTING_OWNER_DECISIONS.md), exact Git blob f2bd36a8a6f210c35a508dcd76c5cdfff9ed4aeb. No verified new owner selections in DECISIONS.md @ 6c63bd42824bfffc56d2c55f7923c6b6c61c4127.

## 1. Signature A — terminal Swiss safety (P0 invariant)

**SOURCE_CONFIRMED:** RevertMatch terminal-reopen handling exists for Single Elimination and Round Robin; equivalent terminal Swiss branch is missing. Consequently a required finished Swiss match may be reset pending while the tournament and stage stay completed and their winner/status remain stale (STATIC_INFERRED, not PostgreSQL reproduction).

**Invariant:** completed terminal Swiss must not contain a required pending match. Match/stage/tournament status, winner IDs, completedAt, activeStageId, player and membership status, immutable history, action log and revision must stay consistent transactionally.

| Exclusive owner choice | API and persisted state | Compatibility/correction cost |
|---|---|---|
| TS-A — DENY_409 | On completed terminal Swiss Revert return controlled HTTP 409 with SIGNED external domain error; **zero writes**, including action_history, match results/revision, stage/tournament, winners, versions, membership ranks. | Minimal fail-closed containment but organizer cannot edit a finalized Swiss via existing Revert endpoint. Client needs consistent explanatory error and separate approved correction procedure; no phantom Undo action. |
| TS-B — ATOMIC_REOPEN | Under canonical locks and action/CAS guards, one transaction resets match pending, stage+tournament active, winner IDs null, terminal completedAt cleared, activeStageId restored and **only terminal-roster players** globally active. Result history remains append-only. On failure every write, including audit/versions, rolls back. | More code and PG16 verification. Must define what to do with prior stage_completed log/Undo LIFO, winner reconciliation, correction UI, client caches, qualification/route downstream and trigger side effects. Re-finalization after correction must work. |

**Common acceptance:** played, walkover, no_contest (terminal match winner may be null, unlike tournament champion), system BYE remains protected; stale match revision, action changed concurrently, unauthorized actor, other stage already started/qualification committed, SE8→Swiss4 prior nonqualifier preservation, injected fault after reset/early writes, full before-after table snapshots and one coherent audit interpretation. A successfully rejected TS-A operation must not increment any version/revision.

**OWNER / HQ SIGNATURE (required, blanks intentional):**
- POLICY-TERMINAL-SWISS selected: [ ] TS-A DENY_409  [ ] TS-B ATOMIC_REOPEN
- Stable HTTP/domain error + correction UX: ____________________
- Direct Revert vs Global Undo latest-action CAS and stage_completed audit resolution: ____________________
- Signer, date, DECISIONS ID: ____________________
- Implementation GO / file ownership / exact baseline: **NOT GRANTED by this signature alone**.

## 2. Signature B — SE currentRound interpretation

**Source witness:** SE4 R1 result A and result B generate R2 slot [winnerA,winnerB]. Revert R1 first feeder clears only R2 slot1; source currentRound remains 2 although R1 is again actionable.

**SELECT ONE:** [ ] EARLIEST_ACTIONABLE — stage/tournament currentRound rewinds to 1; [ ] MAX_GENERATED — currentRound remains 2 and a separately defined actionableRound=1 is exposed to UI/API/Host. Preserve other R2 slot and locked downstream integrity. Product owner must specify whether the public API and bracket display label represent generated round or playable round.

Signer/date/DECISIONS ID: ____________________

## 3. Signatures C and D — Swiss pairing, BYE, NC and fallback

**Source witnesses:** Swiss5 R3 ranked [1,5,3,4,2], BYE P2: greedy (1,5),(3,4) repeats 3–4; witness (1,4),(3,5) has zero repeats. Swiss6 ranked [1,5,3,4,2,6]: greedy (1,5),(3,2),(4,6) repeats 4–6; witness (1,4),(2,6),(3,5) zero repeats. The zero-repeat matching exists, so that repeat is **avoidable**, not a universal requirement. Conversely SW4 forced-history fixture minimum repeats = 1 and fully exhausted K4 history minimum = 2: fallback must not promise impossible zero repeats.

**C — SELECT objective:** [ ] MINIMUM_REMATCHES_FIRST (then score-bands, deterministic tie-break) [ ] SCORE_BAND_FIRST (with policy-stated repeat allowance) [ ] KEEP_CURRENT_GREEDY (explicit product acceptance of avoidable repeats) [ ] OTHER with exact objective: __________. Sign maximum solver effort and deterministic sorting.

**D — SELECT BYE/NC semantics:** retain current lowest-ranked without prior BYE, then bottom ranked when all previously had BYE, or specify changed fairness scope; choose whether completed no_contest counts as previous encounter (current pairing source: yes) while excluded from win/Buchholz and whether cancelled remains ignored (current source: yes). Resolve walkover/seeded edge cases without changing standings in the same implicit patch.

Signer/date/DECISIONS ID for both: ____________________

## 4. Signatures E/F — Double Elimination GF runner-up and ranking 3–N

**Source:** terminal DE stage preview sorts winner first, then all nonchampions by stageSeed. That cannot generally ensure that decisive GF loser is second or later ranking reflects second-loss elimination. In DE4: if GF A>D and Reset is system BYE, champion=A, runner=D; if GF D>A then played Reset A>D, champion=A, runner=D; if played Reset D>A, champion=D, runner=A. A reset BYE is not a played second loss.

**E SELECT runner-up:** [ ] loser of decisive played GF/Reset (normal competition interpretation) [ ] other explicitly named rule __________; handle walkover and reset BYE without phantom loss.

**F SELECT 3–N:** [ ] second-loss/elimination wave, shared ties per wave [ ] second-loss wave then deterministic stageSeed within wave [ ] seed order irrespective of second-loss (explicit choice) [ ] other __________. Require 3, 4, 6, 8, 9, 17 entrants and BYE tests; do not silently derive full classification from seed only.

Signer/date/DECISIONS ID: ____________________

**Historical disposition:** BIZ-21-18 RR stageSeed has existing release-source fix; regression only, no new patch. WEB-004 A52-F001/F002 and BIZ-21-09/12 are WITHDRAWN and remain withdrawn.

## 5. PR45 standalone RR8→RR4 physical acceptance — owner/ A50/ A60 handoff

**Independently available evidence:** [A60 R15 exact-SHA 21-package matrix](../A60/WEB-005_A60_R15_PACKAGE_MATRIX.json), blob 2f3e3575da341cac87c1a54e8fee09ff41d8cecb, P12 labels PR45 **SOURCE_ACCEPTED_CONDITIONAL** at a7a87bc019731191dbfa44bee6939e3fa25e27f4, runtime NOT_EXECUTED_PG and RELEASE_NO_GO. GitHub PR45 review API returns zero reviews; this **does not negate** the separate original A60 report. [A50 R15 original receipt](../A50/WEB-005_A50_R15_RECEIPT.md) documents no native app tests due missing full checkout/pnpm/PG16 execution host. GitHub PR45 workflow [38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) failed prerequisite old Pack19; later release gates were skipped, not feature FAIL.

**SOURCE_CONFIRMED patch predicate:** original Revert reactivated all tournament players; PR45 replaces it with locked current terminal RR stage participant IDs and tournament ID with count parity. [PR45 dedicated integration fixture](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7a87bc019731191dbfa44bee6939e3fa25e27f4/artifacts/api-server/test/round-robin-terminal-reopen.integration.test.ts) blob e429e8d04ef08f662dcff0239b8d30c2124a6bfc. It is a written test, **not** an execution report.

**SAFE PREFLIGHT, A50 only:** clone/check out exact PR45 SHA, Node22 + pnpm10 frozen lock/deps, physically isolated authorized disposable PostgreSQL16 dedicated test DB, TEST_DATABASE_URL explicitly set with no production fallback, unique TEST_DATABASE_SCHEMA=tm_test_a80_r17, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA and written owner/schema DROP authorization. Helper drops the named schema CASCADE; name guards are not physical isolation. No credentials/log secrets. A80 performed no DB action.

**Commands (in artifacts/api-server, independent sequential test-runner processes; execute only after preflight):**

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

**Additional non-DB workspace command at root:**

    pnpm --filter @workspace/api-server typecheck

**Definitive positive/negative physical oracle:** SE8 eight entrants, four winners qualify, four lose/are excluded; start terminal RR4 with exactly those 4 entrants, complete six RR matches, complete tournament with exactly one winner. Snapshot tournament/status/winner/activeStageId, both stages including earlier stage membership, players global statuses, terminal memberships, match + revision, result_history and action_log. Direct Revert terminal last RR match on **standalone PR45** expected 200, match pending, terminal stage and tournament active, winner IDs null, current activeStageId=RR4, all 4 final RR stage members globally active, original four nonqualifiers **remain eliminated** and earlier nonqualifier membership unchanged; RR stageSeed/roster unchanged and final ranks reset; result_history immutable and one submission action marked undone + one Revert audit event. Re-complete and finalize: one RR4 winner, four original nonqualifiers still eliminated, second ordered history revision. Negative stale/unauthorized/double Revert should not produce partial writes.

**Observe possible compatibility trigger effect:** first-stage earlier *qualifiers* may have their membership status projected from global players.status by migration 0002/0006. Snapshot and report these rows independently; do not equate "earlier nonqualifiers unchanged" with "all previous-stage rows unchanged".

**A70/A120 interface:** stage_completed may be most recent action, while standalone PR45 direct Revert expects 200. PR42 and PR51 Global Undo latest-action/history rules are separate. Strict Direct Revert CAS/completion ID and Host/UI presentation policy are not signed. No composited PR branch, no overriding another agent's action or stage/standings UX. A60 owns separate exact-SHA acceptance; A80 cannot certify native PASS.

**Required A50 evidence:** exact SHA, command and real OS exit code, Node/pnpm/PG versions, schema+redacted DB host fingerprint, tests pass/fail/skip, snapshots and direct accessible log link. Missing environment => BLOCKED/NOT_EXECUTED. A60 independently checks that exact PR45 SHA, including side effects and history. No composite result invented.

## 6. Exactly one conditional priority after signatures

**Recommendation to A00, CONDITIONAL not policy selection:** after an owner chooses a terminal Swiss variant, prioritize safeguarding the terminal completion invariant ahead of discretionary Swiss optimization/ranking reworks, **provided** independent native evidence demonstrates the specific unsafe transition. If TS-A is signed, the smallest possible later request is a test-first terminal Swiss Revert 409 zero-write guard in artifacts/api-server/src/application/matches/revert-match.ts with a **new dedicated** test/terminal-swiss-revert.integration.test.ts. If TS-B is signed, STOP this minimal guard and scope a separate multi-table atomic-reopen+audit correction. Neither option is selected here and neither gets R17 code GO.

**Conflicts/ownership:** revert-match.ts belongs to existing PR45; any new error/route mapping intersects A70 PR42/PR51 edits of artifacts/api-server/src/routes/tournaments.ts and shared revert tests. Do not edit these files or rebase/cherry-pick; future A00 must specify exclusive file ownership, base SHA and test-first code GO. R17 lanes belong to A90, A70 and A100 exclusively.

**STOP:** all A80 app code, new PR, merge, deployments, CI rerun, SQL/DDLs, shared/prod reset, SWARM-006 interim/final activation. **Release NO-GO.**
