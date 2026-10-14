# WEB-005 — A40 R17: executable targeted QA commands + Pack17 TAP gate

**TASK** \`WEB-005-T010-T017-A40-R17\` · **ROLE** A40 / CI Contract Recovery · **MODE** SOURCE-ONLY · **DATE** 2026-10-14 Europe/Warsaw  
**PLAN** R17.1, central blob \`c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff\`.  
**SOURCE BASE** \`release/tournament-ops-20261013-01\` = \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**EVIDENCE CLASS** SOURCE_CONFIRMED / TEST_COMMANDS_PREPARED / APP_RUNTIME_NOT_EXECUTED.  
**RELEASE** NO-GO. No application patches, shared database action, billed CI, merge, composite branch or SWARM-006 handoff.

## 0. R16 provenance first

A40 R16 original delivery could not be found or substantiated, so no retrospective R16 "PASS" is claimed. The [R16 recovery notice](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R16_RECOVERY_STATUS.md) was published in R17 and bears **R16_ARTIFACTS_UNAVAILABLE**. It is not an original R16 test or patch. Historical R15 command guide is [here](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R15_REPRODUCIBLE_TEST_COMMANDS.md).

## 1. Exact live refs and classification

Every PR below was fetched on 2026-10-14 as OPEN/DRAFT/unmerged, all based on \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

| PR | HEAD SHA | Scope; existing test files to use |
|---|---|---|
| [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | Auth private cache: \`src/lib/tournament-auth-query-cache.test.tsx\`; **existing** \`src/hooks/use-tournament-auth.test.tsx\` |
| [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` | RR readback: \`src/pages/tournament-detail.rr-readback.test.tsx\` |
| [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` | Lifecycle: \`src/components/tournament-stages-panel.test.tsx\` |
| [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | CSV: \`src/hooks/use-tournament-csv-file-reader.test.tsx\` |
| [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | DE: \`src/components/stage-progress-view.test.tsx\`, \`src/pages/public-stage-views.test.tsx\`, \`src/pages/tournament-audience.test.tsx\` |
| [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | Backup: \`src/components/backup-restore-dialog.test.tsx\`, \`src/hooks/use-scoped-backup-preview.test.tsx\` |

**Grounding of invocation:** In this exact repository, \`artifacts/tournament-manager/package.json\` declares package \`@workspace/tournament-manager\`. Its \`test\` script calls \`node ./test/run-tests.mjs\`. That runner discovers \`src/**/*.test.ts(x)\` and launches \`node --import tsx --import ./test/setup-dom.mjs --test [files]\` with package cwd and \`TSX_TSCONFIG_PATH\` set to the package's \`test/tsconfig.json\`; \`setup-dom.mjs\` initializes JSDOM. Verified unchanged source blobs: runner \`590cd53003fe1b385761c5681389bdc8c7a7d4e6\`, DOM \`bf46cc0aede7964c0fc310b3c94a4fe1cd136e9e\`, tsconfig \`f628782936ed2bf4d2359d273e42de307ba6ed55\`. \`pnpm --filter ... exec\` executes within selected package root; therefore paths below are \`src/\` relative.

**R17 A40 did not run any of these Node/React tests**, because no permitted full application checkout/pnpm environment with reproducible dependencies was furnished. The following is an executable runbook for A50/authorized owner, not a PLAN-mode PASS.

## 2. ONE minimally useful executable A50 path (P20 / PR53)

Run **only on a fresh, isolated, clean, complete repository checkout**; no integration merge/cherry-pick. The P20 branch must remain pinned to the exact SHA above (this is the pre-amendment HEAD; if it changes, A50 must recheck the actual content/expected test scope). Example PowerShell at monorepo root:

~~~powershell
$sha = '6a8f0c3e5775eb056df75ebdd7b33df7cbc78979'
$branch = 'fix/web-005/t080-s2a-private-auth-query-cache-r13'
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -ne 0) { throw 'STOP: repository checkout not clean' }
git fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'STOP: git fetch failed' }
git -c advice.detachedHead=false switch --detach $sha
if ($LASTEXITCODE -ne 0 -or (git rev-parse HEAD).Trim() -ne $sha) { throw 'STOP: wrong HEAD' }
if ((node --version) -notmatch '^v22\.') { throw 'STOP: Node 22 required' }
if ((pnpm --version) -notmatch '^10\.') { throw 'STOP: pnpm 10 required' }
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'STOP: frozen dependency install failed' }
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path

# REAL React/Node test process; this command bypasses earlier Pack19 CI sequence,
# but DOES NOT waive Pack19/Pack20–26 or Pack17 for future integrated release.
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
$nativeExit = $LASTEXITCODE
Write-Output "PR53 exact-SHA native React exit=$nativeExit"
if ($nativeExit -ne 0) { throw "PR53 targeted React FAIL (exit $nativeExit); capture TAP" }
~~~

**Why both files?** PR53 adds new cache tests, but existing \`use-tournament-auth.test.tsx\` mounts \`AuthProvider\` without \`QueryClientProvider\`; PR53 auth changes introduce React Query client use. This is a **SOURCE_CONFIRMED fixture compatibility risk**, *not* a proven runtime failure or a verified privacy leak. Running both identifies regression that the new author fixture alone might miss. The noncanonical \`["tournaments",id,"player-bans"]\` and \`["matches",matchId,"game-picks"]\` cache-key coverage is **A100/A30/A60 owned**, including safe match→tournament mapping; this test cannot certify an unimplemented S2B amendment.

**Expected evidence/result classification:** successful actual native run: \`RUNTIME_VERIFIED_TARGETED\` **only** for tested exact SHA and cases; failed assertion/nonzero exit: \`FAIL\` with test name/stack; missing module/tsx/JSDOM/tsconfig/frozen dependencies: \`INFRA_BLOCKED\`; no execution: \`NOT_EXECUTED\`. Always capture real logs, Node/pnpm versions, 40-character git SHA, count of tests/pass/fail/skipped/todo, *actual* exit code. Do not infer from authored 7/9 case names that they passed.

## 3. Remaining exact per-SHA targeted invocations

For each line: repeat the isolated checkout + frozen install + absolute \`TSX_TSCONFIG_PATH\` preflight above, replacing \`$branch\` and \`$sha\` with the branch/ref for that PR. Execute only the line matching its current HEAD. All commands below are **NOT_EXECUTED by A40**.

~~~powershell
# PR54 @ dbba0eb82920b4f324866b1b983e1211459f52ec
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx

# PR52 @ cce73ec47445102b216b3f8eceb4ec9de67eb1a7
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/tournament-stages-panel.test.tsx

# PR43 @ 96a6068f69027574ac76e18d4d5a2c444b5a914a
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/hooks/use-tournament-csv-file-reader.test.tsx

# PR47 @ f09a13623faca8d7ab29b09a2c5b43907c2acd0b
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/stage-progress-view.test.tsx src/pages/public-stage-views.test.tsx src/pages/tournament-audience.test.tsx

# PR50 @ 5457a74187edc263730c3a4b25a663bdf5531ee9
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/backup-restore-dialog.test.tsx src/hooks/use-scoped-backup-preview.test.tsx
~~~

Then, on each *same SHA* and when practical, independently run broader frontend-only checks:
~~~powershell
pnpm --filter @workspace/tournament-manager run typecheck
if ($LASTEXITCODE -ne 0) { throw 'frontend typecheck FAIL' }
pnpm --filter @workspace/tournament-manager run test
if ($LASTEXITCODE -ne 0) { throw 'frontend full-suite FAIL' }
pnpm --filter @workspace/tournament-manager run build
if ($LASTEXITCODE -ne 0) { throw 'frontend build FAIL' }
~~~
\`build\` executes \`scripts/stage-animated-effects.mjs\` via pnpm context and stages Animated Effects; direct Vite-only build is **not** equivalent. No UI browser parity is implied by RTL PASS.

## 4. Actual GitHub CI root-cause/provenance

**P01:** release Pack19 source test blob \`8d5e8466cbc651a510acf3c072fac4d6821b56b5\` expects literal \`readOnly:true\`. Real route \`artifacts/api-server/src/routes/tournament-se-correction-readiness.ts\`, blob \`bcd4413c1df18aef8bcc3399a9272fd3e6332757\`, specifies \`{isolationLevel:"repeatable read",accessMode:"read only"}\`. PR35 \`7cb283aa82273a1e22daf9051a82311eef53760c\` corrects ONLY this source assertion (new blob \`5726986dca6a6fd7309bb883eb1106d2d19fb14e\`), does not weaken actual read-only DB handling.

- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 source contract 8/8 PASS; then Pack20 source 6/7 FAIL, overall CI FAILURE.
- [PR53 run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795): Pack19 source 7/8 FAIL on old matcher, Pack20 and Pack17 skipped. Other isolated release-based PRs share this baseline obstruction. This is \`OLD_BASELINE_PACK19_FAIL\`, **NOT** test execution of PR53's private-cache changes.
- PR36 P02 \`85ad0b86136fc3491c9ef18663d9b01396179349\`: narrow corrections to Pack20/21/25/26 test contracts; unmerged. No PR36-head workflow run found in current check.
- PR40 P07 \`9a8287271299a59fc9291b8d253299a8d109a35d\`: 3 Pack17 files, unmerged; no PR40-head workflow run found. No *current R17* physical full runtime test.

Final integrated native workflow *cannot* be certified by any of these separate runs. **Future SWARM-006-only dependency** after formal final handoff: P01 Pack19 source matcher, P02 Pack20–26, P07 Pack17 and all functional PRs resolved/assembled by authorized integrator; execute the entire actual workflow on *that* combined pinned SHA. A40 **does not** create or test a composite.

## 5. Pack17 test evidence and known TAP caveat

PR40 runner \`qa/pack17/run-gates.mjs\` git blob \`8779ab2c1588cc62a2f3c5f63c57be9b55e86043\`, helper \`gate-contract.mjs\` \`eae350a60a684d7b14af3e481baf7bd6c4a2b2fc\`, author test \`gate-contract.test.mjs\` \`f59a65509009fbdf74a38239693238704b1af583\`.

**Historical** A40 pure local author-contract test (prior waves, unchanged blobs): 24/24 PASS. **R17 new execution:** NOT_EXECUTED; no full repo/pnpm10/physical isolated PG16. A60 R15 signed \`SOURCE_ACCEPTED\` for P07 exact HEAD but no A50 real application runtime evidence.

**Exactly 9 ordered Pack17 \`--full\` gates:** (1) source contract TAP 1, (2) helper tests TAP 1, (3) isolated PostgreSQL16 atomic test TAP 1, (4) workspace typecheck, (5) API unit TAP **3 separate summaries**, (6) API integration TAP 1, (7) frontend suite TAP 1, (8) API build, (9) frontend build (Animated Effects). Earlier Pack19–26, API codegen, browser parity, multi-PR composition and release gate are **not implied** by \`--full\`. \`--static\` success still prints **STATIC ONLY / RELEASE STOP**.

**PG16 safety:** nonproduction *physically isolated* disposable database approved by owner/A20/A50; dedicated secure \`TEST_DATABASE_URL\` (never echo), \`NODE_ENV=test\`, \`TEST_DATABASE_SCHEMA=tm_test_*\`, explicit \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\`; permission for schema DROP/RESET and verified actual isolated target. No environment such as this was provided to A40, so \`--full\` is **BLOCKED/NOT_EXECUTED**, not failed/passed.

**T017-QA-01 SOURCE_CONFIRMED:** \`assertCompleteTap\` counts TAP headers + 6 \`#\` summary counters and validates arithmetic, but does **not** independently compare \`ok\` / \`not ok\` record lines or \`1..N\` TAP plan to those counters. In previous genuine source-level synthetic probes, a **counter-only** document and a \`not ok 1\` record alongside fabricated zero-fail counters were accepted. This is a pure parser evidence-integrity defect: no demonstrated false PASS from an actual Node process, and \`run-gates.mjs\` independently blocks child nonzero exit. Exact A60 disposition required. A40 has **NO CODE GO** to patch it.

**Strict fail-closed expectation:** any missing mode/source directory, unsafe/missing DB env, skipped/todo/cancelled/failed/zero tests, missing summary/header, incomplete TAP child summaries, any nonzero process exit, omitted/out-of-order gate MUST block release. The two forged-TAP cases are known **current exceptions to source validator safety**, not ACCEPTED expected positives. Do NOT suppress this in release signoff.

## 6. Evidence/actions and STOP

**A50 one deliverable:** execute the PR53 minimal two-file command above on an approved full per-SHA Node22/pnpm10 checkout, return *real* \`git rev-parse HEAD\`, command, sanitized environment, console TAP output, child exit code, file/log permalink. If missing checkout/deps, return one concrete owner-action \`INFRA_BLOCKED\` (not another PLAN-only mock test). For PostgreSQL another separate physical-isolation approval is mandatory.

**A60:** independently decide T017-QA-01 severity/release blocker and source acceptance at exact HEAD (P20 PR53 remaining noncanonical cache coverage, owner A100; P21 PR54 mixed RR403 UI owner A120); only exact independently measured results qualify \`RUNTIME_VERIFIED\`. A40 neither self-certifies nor changes app code.

**A00:** receives the R16 status gap plus this R17 report; manages actual owner-supplied test workstation and separate S2B/other code ownership. No cross-PR merge, manual paid CI rerun, staging/live or SWARM-006 prior to formal complete WEB-005 closeout.

**Final:** \`SOURCE_ONLY / R16_ARTIFACTS_UNAVAILABLE / REAL_APP_TESTS_NOT_EXECUTED_BY_A40 / P07_RUNTIME_PENDING / RELEASE_NO_GO / SWARM006_HOLD\`.
