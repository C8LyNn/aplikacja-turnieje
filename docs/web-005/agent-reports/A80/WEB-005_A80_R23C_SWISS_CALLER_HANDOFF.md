# WEB-005 — R23C / A80 Swiss Caller Stage-Scope Handoff

**TASK:** WEB-005-T050-A80-R23C-SWISS-CALLER  
**Agent:** A80 — Stage Lifecycle & Sporting Rules  
**Mode:** TEST-FIRST BACKEND SOURCE (conditional caller fix)  
**Date:** 2026-10-15 Europe/Warsaw  
**Verdict:** SWISS_CALLER_SOURCE_READY_FOR_QA — current callers were already stage-scoped; new independently reviewable test-only Draft PR, NOT a production fix nor executed acceptance.  
**Release / SWARM006:** NO MERGE / NO DATABASE CHANGE / RELEASE_NO_GO / SWARM006_HOLD.

## 1. Actual GitHub source result

- **[NEW Draft PR #61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61)** (test-first stage-scope integration oracle only).
- **PR #61 HEAD:** 8c26778c94cd6c96987f3986b651066024f10d4a.
- **Head branch:** fix/web-005/t050-swiss-caller-stage-scope-r23c.
- **PR base:** **[PR #57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57)**'s exact unchanged HEAD a57fe31c1bc123c5217b3f58bcdd34750c64c5c6 at fix/web-005/t051-swiss-pairing-policy-r22. PR #57 in turn targets the release commit 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.
- **Stacked, isolated DAG:** release@1fdc401d → PR57@a57fe31c → PR61@8c26778c. Git compare relative to PR57: +1 commit, zero behind, exactly one new file. PR61 does not silently replicate PR57's two source diffs into a second release-targeting PR and does NOT merge its parent.
- **Only added file:** [artifacts/api-server/test/swiss-caller-stage-scope.integration.test.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/8c26778c94cd6c96987f3986b651066024f10d4a/artifacts/api-server/test/swiss-caller-stage-scope.integration.test.ts), blob **7a15d5aa14d394eede4b54aed87ec109064ea479**; 337 new test lines.
- **No production source change** was necessary or made in R23C. This is genuine new backend test source, not a claim that a missing runtime filtering implementation was produced. Existing implementation is already correctly stage scoped; a speculative edit of shared files would add integration collisions without repairing a demonstrated defect.

## 2. Full caller inventory and stage-boundary proof

A60's [R22 late independent PR57 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md), blob ca3d4b5e2ac53208898c09c3f77a1da8816ecfa8, classified S3/S4/S4-H as SOURCE_ACCEPTED_SCOPED_CONDITIONAL (native tests NOT_EXECUTED) and independently confirmed the same caller scope. PR57 remains OPEN DRAFT at its reviewed exact SHA.

**Existing production call sites (release source; PR57 changes only swiss.ts and swiss.test.ts):**

1. artifacts/api-server/src/application/stages/stage-lifecycle.ts, blob e344fd4198e081a3a4574d976829665bea71fb6a: generateStageMatches when starting a stage Swiss uses generateSwissPairings({ players: stage participants, standings computed with zero matches, previousMatches: [], round: 1 }). This cannot leak history from stage A into stage B at initial B start.
2. artifacts/api-server/src/routes/tournaments.ts, blob 6767e7ac6c4d43cf39faa8a61534bdb92b898e14: one generateSwissPairings call in generateSwissRound helper (approx. lines 564–579) uses the completedMatches passed from caller. Initial compatibility tournament start supplies [] (approx. lines 1500–1516); next round endpoint loads allMatches with **WHERE matchesTable.stageId = stage.id** (approx. lines 1723–1733) and calls generateSwissRound(stagePlayers, allMatches, ...). Standings and previous pairing histories are both computed from that same stage-restricted set.
3. PR57's pure generateSwissPairings({ players, standings, previousMatches, round }) receives StandingsMatch without stageId; **caller-side filtering is an essential precondition** and is source-verified for the production entrypoints above, not enforced by that DTO if a future caller is introduced.

**S3/S4 contract remains:** owner-selected SCORE_GROUP_FIRST lexicographic sum of match-win gap then rematches; deterministic exact DP for <=16 non-BYE entrants and documented greedy/up-to-four-swap fallback for larger fields (not globally optimal); BYE minimum completed count **in current stage** then lowest current standing; formal completed played/no_contest/walkover count as prior opponent; cancelled and incomplete do not; BYE has no phantom opponent; no standings/Buchholz or advancement change.

## 3. Test-first R23C regression and exact A60 review target

PR61 new integration test (test authored, NOT_EXECUTED) verifies:

- Two separate consecutive Swiss stages A and B within one tournament, five shared player IDs, and an actual system BYE in stage A.
- Complete A, start B, finish B round 1; derive expected B round 2 using **B's own persisted matches only** and PR57's trusted S3/S4 pairing algorithm.
- Add a **test-only adversarial completed foreign-stage A BYE** for the player due B round 2 BYE. The counterfactual tournament-wide history changes the chosen BYE; the real B generate-round endpoint is required to produce the original stage-B-only pairings, not the contaminated ones. This intentionally fabricated test-only historical extra match is an isolation stress fixture, NOT legal sport event replay or application code.
- Exactly one BYE for odd five; stable match numbers/roster; no missing/duplicate stage B participants; stage A remains completed, stage B and tournament remain active with currentRound=2.
- A separate deterministic 4-player completed walkover/no_contest prior-opponent case, cancelled ignored, and synthetic 32/65-player source regression for >16 bounded fallback and odd roster without duplicates.
- Existing PR57 swiss.test.ts additionally covers repeated BYEs within a single stage, exhaustion fairness, Swiss4/5/6 matchups. PR61 does **not** claim to replace these tests or prove future TS-B after revert.

**A60 checklist:** validate the two-Swiss-stage A→B plan and 5→5 qualification fixture accepted by actual stage plan contract, endpoint/header/status safety, original completed stage A adversarial test-only injected row and whether DB check/trigger permits it, exact compared expected winner/bye, scores/cancelled semantics and input shuffle determinism. A failure in test setup is a **source-level test fix needed**, not a runtime application feature failure. Issue precise SHA and code hunk for any correction and keep self-review separate. Do not label authored assertions PASS.

## 4. Shared-file collisions explicitly preserved for future composite

Inspected changed filenames for all open PRs #34–57. **routes/tournaments.ts** is also modified in PR #39, #42, #44, #46 and #51. **stage-lifecycle.ts** has no changed-file overlap among these PRs but its current first-round caller requires no correction. PR57 owns swiss.ts and swiss.test.ts, not touched by PR61. PR61 introduces only its **new test file**.

A10/A00 must register DAG edge PR57 → PR61 and external shared-route overlap owners above. No route/stage-lifecycle code was edited, no authority for resolving other agents' conflicts was assumed. If A60 later identifies actual stage-scope leakage in a different active caller, require narrow A00 file/hunk GO before modifying shared source; this R23C PR does not fix hypothetical leakage.

**API impact:** no new endpoint, DTO, response, status code, schema, SQL migration, stage completion mutation or existing API behavior change. Real GET/POST route pairings remain subject to the previously verified stage filter. Future S1 TS-B atomic reopen and S2 generated currentRound/actionableRound remain different source lanes and are not affected by this test-only commit. No DE S5/S6 source change.

## 5. Actual tests, CI and STOP

- **A80 native app tests:** NOT_EXECUTED; actual full per-SHA pnpm10 checkout and authorized physically isolated disposable PostgreSQL16/reset not available in this environment. No actual native Node TAP or process exit code asserted.
- **Explicit conditional safe preflight for A50:** owner/A20 must authorize a physically isolated disposable PG16 database; explicitly set safe TEST_DATABASE_URL (never production DATABASE_URL fallback), TEST_DATABASE_SCHEMA=tm_test_a80_r23c, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA, with written permission for DROP SCHEMA CASCADE; full exact PR61 stacked checkout, Node22/pnpm10 frozen lockfile. The authored fixture imports getSafeTestDatabaseConfig and resetTestSchema; **do not execute on an unverified host**.
- **Required commands once authorized**: from artifacts/api-server run node --import tsx --test --test-concurrency=1 ./test/swiss-caller-stage-scope.integration.test.ts; from repo root run pnpm --filter @workspace/api-server typecheck. Capture real exit/TAP/version/redacted DB fingerprint/stage before-after snapshots/PR61 exact SHA. PG16 NOT_EXECUTED without actual output.
- **Observed Actions on PR61 exact HEAD:** [GitHub run 38736645076](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736645076) completed **FAILURE** at inherited Pack19 snapshot source matcher (`readOnly:true` assertion expected, release instead contains `accessMode:"read only"`). Exact job 116427513762; preceding existing SE safety unit tests completed successfully, downstream Pack20–26 and release gates skipped. The new Swiss caller PG integration test was **NOT_EXECUTED** in this workflow. This is not an observed Swiss feature failure or PASS; PR35 contains a separate isolated Pack19 fix and was not merged into this PR.
- **Independent new QA verdict:** PENDING A60 R23C exact PR61 HEAD; existing A60 R22 acceptance is limited to PR57 prior SHA and does not certify this new test.
- **HARD STOP:** no merge/rebase/cherry-pick, no WEB005 composite, destructive DB operations, paid CI manual rerun, production SQL, staging/live or SWARM-006 activation. Release gate remains NO_GO.

**Final R23C verdict:** **SWISS_CALLER_SOURCE_READY_FOR_QA (existing caller source verified; regression test published, native execution/A60 review pending)**. If A60 rejects the adversarial test setup, amend only after a separately authorized exact source change; do not assert integrated runtime acceptance.
