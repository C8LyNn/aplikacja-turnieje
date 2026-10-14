# WEB-005 — A80 R10 / T050 RR Stage-Scoped Reopen Patch

**Agent:** A80 — Stage Lifecycle & Sporting Rules  
**Task:** `WEB-005-T050-A80-R3-RR`  
**Wave:** R10 / 2026-10-14 (Europe/Warsaw)  
**Mode:** GO SOURCE-CODE ONLY / CODE LANE L2  
**Finding:** A52-F019 / T050-L2  
**Status:** PATCH_PROPOSED / RUNTIME_NOT_EXECUTED / INDEPENDENT_QA_PENDING

## 1. Provenance and ownership

- Central R10 instructions: `docs/web-005/WEB-005_WAVE_R10_AGENT_PROMPTS.md` on `chore/web-005/t000-wave1-control`, blob `68cc912f15d158a55e8c80cb5ed823dc20337bfd`.
- Release baseline: `release/tournament-ops-20261013-01`, exact `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (PR #32 OPEN, unmerged).
- R10 branch: `fix/web-005/t050-rr-stage-roster-reopen-r10`, branched directly from release SHA.
- A70 PR #42 MP2A HEAD at preflight: `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`, OPEN DRAFT; changed routes/tournaments.ts and the existing revert integration test, **not** revert-match.ts. R10 assigned sole `revert-match.ts` ownership to A80, with A70 frozen.
- A70 PR #39 MP1: `16053ee132756ca05b6f2cd1f0cabae823905387`, OPEN DRAFT. Neither PR was edited or merged.
- Original production blob `revert-match.ts`: `0cb16ad0d82da754bac0553a946a3513db70e1ee`.

## 2. Source-confirmed defect and smallest change

In terminal multi-stage Round Robin, `shouldReopenRoundRobin` reopened the completed stage/tournament, then executed `UPDATE players SET status='active' WHERE tournament_id=?`. For an SE8→RR4 tournament whose finalization globally marks nonchampions eliminated, this reactivated four **nonqualifiers from prior stage** alongside four RR entrants. This is a source-level gap, not a verified production incident.

The patch keeps the same transaction, row locks, stage/tournament reopening, winner guard and immutable action history. In the existing multi-stage RR branch only:

1. Lock and read member player IDs from `stage_participants` for **the current terminal RR stage**.
2. Reactivate `players` only where `tournament_id` matches AND `players.id IN (stageRoster IDs)`.
3. Require affected-player count equals stage-roster size, then retain the already-existing `reactivatedWinner` check.
4. Continue setting only the current stage membership rows to `active`.

No alternative Revert/Undo pathway was added. Single-stage Round Robin follows the untouched original branch. The prior qualification/downstream guards remain unchanged.

## 3. Test-first evidence and affected files

Sequence of commits:

- `ce72152b8d69aab313a3829a05367f2f45bf87cd`: **test first** — new integration fixture `artifacts/api-server/test/round-robin-terminal-reopen.integration.test.ts`.
- `e6b7cd8191a16640fc6b7c290910897c5217bdb3`: **production fix** — `artifacts/api-server/src/application/matches/revert-match.ts`.

GitHub compare with release: two files; implementation diff +15/-1 production source lines; new integration test 155 lines. No migrations, OpenAPI, routes, generic Undo, or other sporting algorithms changed.

Fixture executes through public HTTP endpoints in a dedicated isolated PostgreSQL schema (when A50 supplies a safe environment):

1. Create SE8→RR4 multi-stage tournament with eight registered players.
2. Play four source-stage SE fixtures, complete the source stage, start RR4; assert exactly four RR entrants and six RR matches.
3. Complete RR4 and terminal stage; establish the four nonqualifiers by set difference between all eight players and RR4 stage members; assert they are globally eliminated.
4. Direct revert of the last RR match; expect HTTP 200, match pending, RR stage and tournament active, both winner IDs null, active-stage pointer points to RR4.
5. Assert exactly four current RR entrants are globally active, four earlier nonqualifiers remain eliminated, and earlier nonqualifier stage membership and seed records are unchanged.
6. Assert RR4 final ranks cleared, stage seeds preserved, result_history unchanged, one original completion action undone and one revert action added.
7. Re-complete the same match and stage; assert one champion among RR4, nonqualifiers still eliminated, two immutable history revisions.

**Existing regression retained:** `artifacts/api-server/test/revert-match.integration.test.ts` already checks single-stage RR reopening and shared Revert/Undo atomicity. The new file deliberately avoids collision with PR #42 modifications to that existing file.

## 4. Commands and actual test status

**Actual application commands in this turn:** NOT_EXECUTED. No approved isolated PostgreSQL16 instance/TEST_DATABASE_URL was provided; no safe runtime database was reset. No assertion of HTTP, PG16 or integrated CI PASS.

**Read-only checks actually performed:** GitHub PR32/PR39/PR42 metadata, exact release blob, migration trigger source (0002/0006), existing integration-test definitions, commit ancestry compare. GitHub compare returned `status=ahead`, `ahead_by=2`, `behind_by=0`, two files.

**For A50 after authorized isolated PostgreSQL16 preflight** (run from `artifacts/api-server` with Node22, pnpm10 and installed locked dependencies):

```bash
export TEST_DATABASE_URL='postgresql://<test-user>:<test-password>@<isolated-test-host>:5432/tournament_test_a80'
export TEST_DATABASE_SCHEMA=tm_test_a80_r10
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
```

Run also existing `./test/revert-match.integration.test.ts` and `./test/match-revision.integration.test.ts` after assessing schema isolation; then `pnpm --filter @workspace/api-server typecheck` from repository root. Record exact tested SHA, command, stdout/stderr, exit code, and database fingerprint without credentials. **Do not execute this example against a shared or production DB.**

## 5. Independent QA / risks / policy

- A60: **INDEPENDENT_QA_PENDING** at the draft PR HEAD. A50: DB HTTP acceptance **BLOCKED/NOT_EXECUTED** until safe isolated PostgreSQL16 is authorized.
- PostgreSQL compatibility trigger `compat_sync_single_stage_participant` in migrations 0002/0006 may update **first-stage membership status** when a current-stage member changes `players.status`; this pre-existing side effect is not part of the narrow A52-F019 fix. The test strictly asserts that earlier **nonqualifier** first-stage records remain unchanged. A60 must compare any unexpected changes to original qualifier records as separate evidence, not auto-expand this PR.
- `POLICY-TERMINAL-SWISS`, `POLICY-SE-ROUND`, `POLICY-SWISS`, `POLICY-DE` remain OPEN. No semantic choice was implemented for them.
- T040 MP2A and MP1 remain separate PRs; future integration must verify Undo-last interactions and resolve overlapping test activity using exact SHA, without bulk copying either branch.

## 6. GO / STOP / handoff

- **GO (fulfilled):** isolated test-first source patch, draft PR candidate, narrow source contract, A50/A60 handoff.
- **STOP:** merge, cherry-pick, release/main modifications, shared/production SQL, CI spending, staging, Replit, SWARM-006.
- **NEXT:** A50 execute in explicitly authorized PG16 isolation; A60 independently review exact PR HEAD and the complete + revert + re-complete fixture; A00 decide later integration order. Do not start a second sporting/lifecycle patch in this code lane automatically.

**Result:** `PATCH_PROPOSED / TEST_FIRST_SOURCE_READY / RUNTIME_NOT_EXECUTED / QA_PENDING / RELEASE_NO_GO`.
