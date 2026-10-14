# WEB-005 — A80 R22 Swiss S3/S4 IMPLEMENTATION RECEIPT

**TASK:** WEB-005-T050-T051-A80-R22-SWISS-PAIRING
**ROLE:** A80 — Stage Lifecycle & Sporting Rules
**MODE:** GO SOURCE CODE L1; TEST FIRST; exact two files ONLY
**DATE:** 2026-10-15 Europe/Warsaw
**RESULT:** SOURCE_PATCH_PUBLISHED / NATIVE_TEST_NOT_EXECUTED / A60_R22_INDEPENDENT_QA_PENDING / NO_MERGE / SWARM006_HOLD.

## 1. Real implementation — repository and signed owner policy

- **New standalone draft [PR #57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57)**, branch fix/web-005/t051-swiss-pairing-policy-r22.
- **Exact PR head commit:** a57fe31c1bc123c5217b3f58bcdd34750c64c5c6.
- **Base release commit:** 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.
- **First test-only commit:** ef6d2de1c4d2a2bcc7f0a0dfb181d094ceb73696.
- **Second implementation commit:** a57fe31c1bc123c5217b3f58bcdd34750c64c5c6.
- **Exactly two modified application files** (independently confirmed from PR #57 file listing and Git compare; 2 commits ahead, 0 behind):
  1. artifacts/api-server/test/swiss.test.ts — blob 150d34619abb83d12bb351a7aedb6e377d5d1332.
  2. artifacts/api-server/src/domain/tournament/swiss.ts — blob 5e7fa424371c10a0360e471bb050afa7096d361b.
- Label/status in PR description: R22_NEW_SOURCE_CANDIDATE / OPEN DRAFT / not merged.

**Authorization:** [R22 central wave](../../WEB-005_WAVE_R22_AGENT_PROMPTS.md), blob f616bca63a441bc2a4eead64ff67586e57e2b6ca, AGENT A80 L1 precise two-file GO, and [owner-delegated sporting decisions](../../WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md), blob e5a779a372a38d198e6c56375f560b878dac0df1, S3-B SCORE_GROUP_FIRST, S4-A stage-scoped BYE, S4-H-A completed NC/walkover encounters. S1 TS-B atomic completed Swiss and S2/DE S5/S6 are explicitly NOT part of this R22 code lane.

**Duplicate/ownership preflight:** inspected all 21 PR #34–54 changed-file lists and new #55/#56; no other open candidate changed either file above. Sibling PR #55 T055 test-only and #56 Backup strict-profile use different files, no accidental shared edits.

## 2. Concrete S3 matching algorithm

Source takes existing generateSwissPairings({ players, standings, previousMatches, round }) contract unchanged; input StandingsProjection.matchWins is the trusted competitive score proxy (no invented points and no Buchholz/scoring mutation). Active entrants sorted by standing.rank, then seed, then numeric ID for deterministic ties.

**Lexicographic objective:**
1. MINIMIZE SUM over chosen pairs of absolute difference between their matchWins (score group proximity first).
2. On equal sum, MINIMIZE count of completed previous-opponent rematches.
3. On equal objectives, stable standing/seed/ID order and lowest available partner deterministic choice.

**Exact path:** bitmask dynamic programming for up to 16 **non-BYE entrants**; at most 2^16 states, deterministic optimal tuple (gap, repeats) for those sizes. No extra global scores, changes to match result policy or randomness.

**Bounded fallback:** for 18+ non-BYE entrants, deterministic greedy score-first pairing followed by at most FOUR strictly improving cross-pair swaps. Runtime is polynomial and always produces complete pairs, but **does NOT claim globally optimal gap/rematch score for large fields**. No unbounded solver loop. A60 should judge bounded fallback/fixture constraints against the signed owner game design and any upper participant count. If a stronger guarantee is required, a later distinct GO and algorithm scope must be authorized.

**Test-first source fixtures authored:** equal score tie matching, explicit SCORE_GROUP_FIRST accepts score-near rematch over cross-group zero-repeat, Swiss5/Swiss6 zero-rematch available within tied point groups, forced Swiss4 one/two minimum repeats, reversed standings/previous history deterministic, fallback with 64 and 65 entrants, no duplicate entrants, complete pairs and one odd BYE. These test assertions were committed BEFORE the algorithm in a separate test commit.

**Note:** the old test expectation "avoid immediate rematch when any alternative exists" was intentionally replaced with "avoid rematch when SCORE_GROUP distance stays tied", as the former contradicts owner-signed SCORE_GROUP_FIRST. This is a policy-driven change, not an accidental regression. Regressions must still ensure avoidable rematches within equal score cost are avoided.

## 3. S4 BYE / NC / cancelled stage-safe semantics and caller evidence

**BYE choice:** for odd number of active players, count completed system BYEs in **the current stage** from supplied previousMatches. Choose minimum count; zero-count eligible entrants always precede previously awarded BYEs. Within minimum count, choose lowest current standing (with stable seed/ID ordering). Once every player has at least one BYE, minimum count then lowest standing determines repeats. Exactly one BYE; BYE has no opponent.

**History:** completed played, completed no_contest with both player IDs, and completed walkover with both IDs all count as previous encounters for avoidance; cancelled/pending/in-progress/postponed do not; BYE is a separate counter and never creates a phantom opponent. No changes to matchWins/Buchholz or advancing policies.

**Verified production caller stage boundary on exact release SHA:**
- artifacts/api-server/src/routes/tournaments.ts, blob 6767e7ac6c4d43cf39faa8a61534bdb92b898e14: next Swiss round fetches allMatches WHERE matchesTable.stageId === stage.id (approx. lines 1723–1733), then calls generateSwissRound(stagePlayers, allMatches,...). Starting R1 passes [] (approx. lines 1500–1516). Same route helper passes those matches directly to generateSwissPairings (approx. lines 564–594).
- artifacts/api-server/src/application/stages/stage-lifecycle.ts, blob e344fd4198e081a3a4574d976829665bea71fb6a: initial stage Swiss round generateSwissPairings is called with previousMatches [] inside generateStageMatches.

Thus no need to edit routes/tournaments.ts or stage-lifecycle.ts within L1. **Boundary limitation:** StandingsMatch type carries no stageId, so the pure function trusts its input to be stage-filtered; future callers must prove the same invariant. The R22 test documents this provenance, does not claim a raw previousMatch from a foreign stage is intrinsically detectable in this API.

## 4. Executed QA versus submitted verification

**Actual local application checkout:** unavailable. No trusted complete monorepo checkout with Node22/pnpm10 frozen dependencies in this agent runtime; no complete @workspace context. **A80 did not execute** application native Swiss tests or TypeScript typecheck; there are no app test exit codes or TAP logs to claim. Previous [A50 R21](../A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md) documents 0 native app tests. Unit tests authored in GitHub are NOT actual PASS.

**Future exact PR57 native QA, only on complete checkout with frozen dependency installation:**

    cd artifacts/api-server
    node --import tsx --test --test-concurrency=1 ./test/swiss.test.ts

**From repository root:**

    pnpm --filter @workspace/api-server typecheck

Expected A50 evidence: tested PR57 HEAD a57fe31c1bc123c5217b3f58bcdd34750c64c5c6, actual shell commands/process exits and TAP, Node/pnpm versions, target file blobs, stable seed/ID and payload fixtures, no database access required for pure Swiss unit tests. If frozen deps/checkout unavailable -> NOT_EXECUTED, never green-by-author.

**Automatic GitHub Actions:** [run #38646317948](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646317948), at PR57 exact HEAD, completed FAILURE: setup/locked deps succeeded, existing SE safety unit step succeeded; **Pack 19 snapshot source matcher** failed because expected readOnly:true whereas existing release has accessMode:"read only". All later Pack20–26 and Static/database release gates skipped. The Swiss test added by PR57 is not shown executed in the workflow. This inherited known CI matcher is addressed by separate draft PR35 and does NOT prove Swiss-specific FAIL or PASS. No manual or paid rerun was requested by A80.

**Independent QA:** [A60 R21 owner gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob 47dc44f980734ce68dd63769ba3f25ad60dc899f, reviewed old 21 PRs on unchanged SHA, **not new PR57**. A60 R22 exact-SHA source/fixture review of PR57 **PENDING**; cannot self-certify independent pass. PR57 body includes the source review/test request. Fresh revisions after this head would need new A60 review.

## 5. Conflict, remaining backlog, release STOP

- **Out of R22 L1 scope:** Swiss completed terminal TS-B atomic reopen (A70 R23), SE generated/actionable pointer, DE GF/reset runner-up and 3–N ranks (A120 R23), T055 optimistic CAS production writes/DB migration, portable Backup V3 integration/DDL, public Direct Revert MP2B Host CAS, Steam/session and PR53 ownerless raw cache.
- Existing PR45 RR terminal reactivation remains unchanged at a7a87bc019731191dbfa44bee6939e3fa25e27f4, independent conditional source accepted only and physical PG16 NOT_EXECUTED.
- Historical WEB-004 R2 38-case provenance/disposition (29 secondary IDs, nine unavailable) requires A10/owner; no invented PASS or WONT_FIX.
- Owner EXEC-B preference to leave unexecuted tests to SWARM-006 does not waive current source QA or authorize final handoff. SWARM-006 requires separate owner FINAL_HANDOFF_GO after WEB-005 closeout, and must execute composite tests before release.

**Next precise A00 action:** register new P22?/R22 L1 standalone [PR57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) into 21-pr existing manifest as a **new** candidate without renumbering old packages; request independent A60 R22 exact-SHA code/test review (especially score priority/large-field fallback), A50 native test when authorized checkout exists, and only later decide whether source repairs need separate GO. No merge; no SWARM-006.

**FINAL:** PR57_R22_SOURCE_PATCH_PUBLISHED / TEST_FIRST_TWO_COMMITS / APP_NATIVE_TEST_NOT_EXECUTED / A60_R22_PENDING / RELEASE_NO_GO / SWARM006_HOLD.
