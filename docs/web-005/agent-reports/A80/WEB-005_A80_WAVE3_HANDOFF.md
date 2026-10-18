# WEB-005 — A80 / DEVELOPMENT FIRST WAVE 3 — WAVE3_HANDOFF

**ROLE:** A80 — Stage Lifecycle & Sporting Rules  
**TASK:** ISOLATED SWISS CONTRACT TESTS (>16, dense history, stage-local rematches/BYE, determinism)  
**STATUS:** DONE — SOURCE TEST-ONLY PUBLISHED / NATIVE TESTS NOT_EXECUTED / INDEPENDENT A60 QA PENDING  
**DATE:** 2026-10-18 Europe/Warsaw  
**RELEASE:** NO_GO / SWARM006_HOLD

## Scope, exact SHA, PR and paths

Shared [WAVE 3 Google Doc](https://docs.google.com/document/d/10cKgkk3XZTwudRMIQ620Q5DAYEsMZIb8zmqgBoRnmEE/edit), revision at intake: AHj4eMTrCpik1b_34kpVSOeHszrwCE6CsDl3e897_AOfhRJsYsAgc0fwqYIGmreQVVhjFasL8HaT_S3G2QoM_KPkkVm3YmuqqYRxdXrx6XE. It authorizes only isolated tests for A80; **explicitly forbids implementation edits of PR118/102**.

**New [Draft PR #131](https://github.com/C8LyNn/aplikacja-turnieje/pull/131)**  
- Branch: test/web-005/a80-wave3-swiss-contracts
- **BASE SHA:** c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e — unchanged [PR #118](https://github.com/C8LyNn/aplikacja-turnieje/pull/118)
- **HEAD SHA:** 1d8e8105ea7b601866ee9f7cd607d05bd241372a
- HEAD is one commit ahead / zero behind base; remains OPEN DRAFT / UNMERGED.
- **Changed paths:** exactly ONE **new test-only file**, artifacts/api-server/test/swiss-wave3-contract-regression.test.ts; Git blob **21fdc8e071eeb523038963cb04247f3fa52cc280**; 209 added lines (210 lines including final newline).
- **NO CODE CHANGES** to application implementation, public API, Swiss source swiss.ts, existing tests, routes, DB, migrations, games, A40/A140-owned files.
- The test is stacked only to avoid repeating parent implementation diff: release → PR57 @ a57fe31c1bc123c5217b3f58bcdd34750c64c5c6 → PR102 @ b2bbfd2bac32c81f2876138bf53273e61eccac0b → PR118 @ c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e → **PR131 @ 1d8e8105ea7b601866ee9f7cd607d05bd241372a**. Sibling PR61 @ 8c26778c94cd6c96987f3986b651066024f10d4a remains separate.

## Added Swiss contract cases (source assertions only)

1. **Dense history, size 18/32/64/65/66/128:** reproducible seeded completed no_contest/walkover previous opponents; score-banded groups of four; reverse standings/players/history yields identical pairings; count/round/match numbers, each participant exactly once, one BYE only for odd roster, no score-gap degradation when zero-gap pairing is feasible. The 66/128 fixtures deliberately exercise the >64 participant boundary where PR118 triple-local search is disabled and its bounded 2-pair fallback remains.
2. **Stage A/B with shared 21 players:** stage B history has completed walkover, completed no_contest and cancelled; a completed BYE for player 21 in earlier stage A is deliberately NOT passed to B generator. Stage-B-only BYE=21; knowingly *incorrect* A+B history gives BYE=20. This proves the caller-side input contract is observable, **NOT** that swiss.ts can itself validate stageId.
3. **Same-stage BYE exhaustion:** 19 entrants each with a stage-local BYE, bottom player with an additional BYE; selection=18, then after another BYE for player18 selection=17.
4. **Status semantics:** pending, cancelled and postponed paired matches do not change resulting pairings; completed no_contest and walkover do count as prior paired opponents. Historical BYE does not invent an opponent for an even roster.

**Existing separate integration cover:** [PR61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) is the real two-stage HTTP/PostgreSQL test, source PASS WITH CONDITIONS from [A60 R23C](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR61_A80_SOURCE_QA.md), but actual PG16 runtime still NOT_EXECUTED. PR131 does not change, run or supersede that test; it is a DB-free contract-only child.

## Test commands and results (accurate scope)

| Test / check | Command or mechanism | Result |
|---|---|---|
| Exact Git source readback | GitHub fetch at HEAD 1d8e8105... | **VERIFIED**, new test blob 21fdc8e0..., expected cases present |
| PR diff/change isolation | GitHub compare vs PR118 + changed-file list | **VERIFIED**, 1 added test file / no production source |
| Pure Swiss Node test | From artifacts/api-server: node --import tsx --test --test-concurrency=1 ./test/swiss-wave3-contract-regression.test.ts | **NOT_EXECUTED** — complete source checkout and frozen pnpm workspace dependencies not available in agent's local runtime |
| Existing source regression | node --import tsx --test --test-concurrency=1 ./test/swiss.test.ts ./test/swiss-fallback-adversarial.test.ts ./test/swiss-three-pair-regression.test.ts | **NOT_EXECUTED** |
| API-server typecheck | At monorepo root: pnpm --filter @workspace/api-server typecheck | **NOT_EXECUTED** |
| Real two-stage PG16/HTTP | PR61 requires physically isolated owner/A20-approved disposable PG16 and reset permission | **NOT_EXECUTED / NOT AUTHORIZED FOR A80** |

**No PASS claim for unexecuted TypeScript tests.** Native Node binary 22.16.0 was visible in the local runtime, but neither a complete connected GitHub checkout nor the package-managed TypeScript test environment was accessible. An outbound Git clone probe could not resolve github.com (exit 128), so no safe exact-source native test could be started. No SQL/Docker/migration attempt was made. [GitHub Actions run #39128638617](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39128638617) on exact PR131 HEAD **COMPLETED FAILURE**. Job 117679002167 failed the inherited Pack19 snapshot matcher: source assertion expects `isolationLevel:"repeatable read",readOnly:true` but the existing source uses `isolationLevel:"repeatable read",accessMode:"read only"`. Remaining source packs/static/DB gates were skipped and the new Swiss unit test was **NOT_EXECUTED** by this CI run. This inherited correction-qa failure is NOT a Swiss-specific TAP test PASS or FAIL. No manual CI rerun or bypass.

## Conflicts and independent ownership

Preflight inspected current exact PR HEADs: #57 a57fe31..., #61 8c26778..., #102 b2bbfd2..., #118 c2b5bc..., #101 (A40) a5bfd07b822c223fd995604dc2e228935ab81498, #116 (A140) a0f1d8066bbcf4e4b602cb587aebf599e327d067, as well as #119/#120/#103/#104/#100. Changed-file preflight: A40 PR101 changes Backup preclone/provenance files and report, A140 PR116 changes source-preservation script/test and report, and neither owns the new Wave 3 Swiss test path. **No changed-path collision / no conflicting file write.**

New PR131 modifies no source file of PR118 or PR102, and no A40/A140 branch was modified. A10/A40 should not blindly include the complete stacked ancestry twice in composite C02. Current Issue [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) assigns C02 integration to A40/A10; [#77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) assigns independent QA/registry to A60/A10. This handoff does not perform their work.

## NEXT OWNER

**A60:** review new exact-SHA PR131 source assertions, especially consistency of synthetic dense-history scores with intended unit-test scope, the stage A/B negative contamination witness, source fallback boundary 64/65/66/128 and deterministic reordering. Execute native test/typecheck when an authorized complete checkout exists, record real TAP/process exits, and report PASS/FAIL/NOT_RUN by scope. Any actual feature defect requires a new explicit GO outside Wave 3; do not amend PR118/102 in this wave.

**A10:** append exact SHA + new test-only path to manifest, record parent DAG and conditional QA.  
**A40:** review as optional DB-free test-only C02 input **after independent QA**, without changing the already owned PR101 branch.  
**A00:** keep release/integration/PG16/security gates separate; R23H G0 and SWARM006 remain HOLD.

**FINAL:** WAVE3_HANDOFF_PUBLISHED / A80_DONE_TEST_ONLY / PR131_OPEN_DRAFT / NATIVE_TESTS_NOT_EXECUTED / INDEPENDENT_A60_PENDING / NO_MERGE_NO_DEPLOY_NO_DB / RELEASE_NO_GO.
