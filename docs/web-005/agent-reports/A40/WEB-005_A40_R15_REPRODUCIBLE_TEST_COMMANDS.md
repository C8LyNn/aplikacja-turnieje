# WEB-005 A40 — R15 Reproducible Test Commands and CI Gate Contract

**TASK:** WEB-005-T010-T017-A40-R15  
**ROLE/MODE:** A40 — CI Contract Recovery, READ ONLY / TEST GUIDANCE  
**SOURCE OF AUTHORITY:** WEB-005_WAVE_R15_AGENT_PROMPTS.md R15.1, blob e6950cbff7e521ed9b3ff774e7787e8d598a966d  
**REPOSITORY:** C8LyNn/aplikacja-turnieje  
**DATE:** 2026-10-14, Europe/Warsaw  
**STATUS:** SOURCE_CONFIRMED + INSTRUCTIONS_ONLY; all commands below are **NOT_EXECUTED by A40 in R15**. No PR branch, application file, workflow, CI job or database modified.  
**RELEASE:** NO-GO. SWARM-006 HOLD.

## 1. Exact GitHub pins, deliberately NOT a composite tree

All listed PRs checked live as OPEN/DRAFT/UNMERGED; base for each is release/tournament-ops-20261013-01 at **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.

| PR | Exact HEAD SHA | Head branch | Target author test paths under artifacts/tournament-manager/ |
|---|---|---|---|
| #43 | 96a6068f69027574ac76e18d4d5a2c444b5a914a | fix/web-005/t110-ux042-file-reader-r10 | src/hooks/use-tournament-csv-file-reader.test.tsx |
| #47 | f09a13623faca8d7ab29b09a2c5b43907c2acd0b | fix/web-005/t100-presentation-pr-a-r11 | src/components/stage-progress-view.test.tsx; src/pages/public-stage-views.test.tsx; src/pages/tournament-audience.test.tsx |
| #50 | 5457a74187edc263730c3a4b25a663bdf5531ee9 | fix/web-005/t110-ux045-backup-preview-r12 | src/components/backup-restore-dialog.test.tsx; src/hooks/use-scoped-backup-preview.test.tsx |
| #52 | cce73ec47445102b216b3f8eceb4ec9de67eb1a7 | fix/web-005/t110-ux046-stage-modal-r13 | src/components/tournament-stages-panel.test.tsx |
| #53 | 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979 | fix/web-005/t080-s2a-private-auth-query-cache-r13 | src/lib/tournament-auth-query-cache.test.tsx |
| #54 | dbba0eb82920b4f324866b1b983e1211459f52ec | fix/web-005/t100-rr-readback-r13 | src/pages/tournament-detail.rr-readback.test.tsx |

The test file paths were independently confirmed in actual per-PR changed-file listings. The commands use pnpm's filter to execute **from package root**, so test paths are **src/**-relative. Do not execute a test from PR A after switching to PR B, and never infer acceptance of one HEAD from another.

Other pinned CI prerequisite branches:

- P01 / PR #35: **7cb283aa82273a1e22daf9051a82311eef53760c**, fix/web-005/t010-pack19-contract (Pack19 source-contract matcher).
- P02 / PR #36: **85ad0b86136fc3491c9ef18663d9b01396179349**, fix/web-005/t015-pack20-26-contracts.
- P07 / PR #40: **9a8287271299a59fc9291b8d253299a8d109a35d**, fix/web-005/t017-pack17-fail-closed.

## 2. Reproducible bootstrap — A50 executes in a FRESH, disposable per-PR working copy

This is a **PowerShell** runbook; commands below are grounded in repository scripts at the pinned SHA. A40 did not execute them. The operator must have an authorized, clean checkout and must not reuse a working tree with unfinished changes.

~~~powershell
# Start at repository root of a disposable, independent checkout.
# Choose exactly ONE PR branch and matching exact SHA from §1.
$branch = 'fix/web-005/t110-ux046-stage-modal-r13'  # example: PR #52
$sha = 'cce73ec47445102b216b3f8eceb4ec9de67eb1a7'

$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Git status failed' }
if ($dirty.Count -ne 0) { throw 'STOP: working tree is not clean' }
git fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
git -c advice.detachedHead=false switch --detach $sha
if ($LASTEXITCODE -ne 0) { throw 'Detached checkout failed' }
if ((git rev-parse HEAD).Trim() -ne $sha) { throw 'STOP: SHA mismatch' }
if (-not ((node --version) -match '^v22\.')) { throw 'Node 22 required' }
if (-not ((pnpm --version) -match '^10\.')) { throw 'pnpm 10 required' }

pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Locked install failed; do not continue' }

# Grounded in artifacts/tournament-manager/test/run-tests.mjs.
# This path is absolute so tsx aliases follow the same test-specific tsconfig.
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path
~~~

**Do not** use production secrets, DATABASE_URL, a shared PostgreSQL instance, GitHub Actions reruns or an integration branch for these frontend-only tests. Preserve package-lock and workspace supply-chain safety rules; do not bypass minimumReleaseAge or frozen lockfile.

## 3. Targeted real Node/tsx/JSDOM test commands — choose ONE after matching exact checkout

These commands are run **at repository root** after the bootstrap above. Each uses the native package's actual test stack: Node --import tsx, --import ./test/setup-dom.mjs, --test and TAP output. Node resolves the JSDOM preloader from the filtered package's CWD. None calls the root CI workflow or Pack19 first.

~~~powershell
# PR #43 / HEAD 96a6068f69027574ac76e18d4d5a2c444b5a914a
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/hooks/use-tournament-csv-file-reader.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR43 RTL FAIL: exit $exit" }
~~~

~~~powershell
# PR #47 / HEAD f09a13623faca8d7ab29b09a2c5b43907c2acd0b
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/stage-progress-view.test.tsx src/pages/public-stage-views.test.tsx src/pages/tournament-audience.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR47 RTL FAIL: exit $exit" }
~~~

~~~powershell
# PR #50 / HEAD 5457a74187edc263730c3a4b25a663bdf5531ee9
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/backup-restore-dialog.test.tsx src/hooks/use-scoped-backup-preview.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR50 RTL FAIL: exit $exit" }
~~~

~~~powershell
# PR #52 / HEAD cce73ec47445102b216b3f8eceb4ec9de67eb1a7
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/tournament-stages-panel.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR52 RTL FAIL: exit $exit" }
~~~

~~~powershell
# PR #53 / HEAD 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR53 RTL FAIL: exit $exit" }
~~~

~~~powershell
# PR #54 / HEAD dbba0eb82920b4f324866b1b983e1211459f52ec
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR54 RTL FAIL: exit $exit" }
~~~

Once a targeted command has actually passed, A50 may separately run the broader **frontend-only** gates **on that SAME exact SHA**, provided the workspace is correctly installed:

~~~powershell
pnpm --filter @workspace/tournament-manager run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Frontend typecheck FAIL' }
pnpm --filter @workspace/tournament-manager run test
if ($LASTEXITCODE -ne 0) { throw 'Frontend full tests FAIL' }
pnpm --filter @workspace/tournament-manager run build
if ($LASTEXITCODE -ne 0) { throw 'Frontend build FAIL' }
~~~

**Build caveat (SOURCE_CONFIRMED):** frontend build calls scripts/stage-animated-effects.mjs which obtains pnpm from npm_execpath, builds the animated-effects workspace and copies its output. Execute via **pnpm run build**, not by directly invoking the effects script without its package-runner environment. A build that fails here is its own recorded failure, not a reason to silently skip the gate. Full browser/live rendering remains a separate acceptance dimension.

**Risk for #53 from central R15:** other auth-dependent React Query keys and an existing AuthProvider-only fixture may require targeted negative tests. Those findings belong to A100/A50/A60; the table above is not a security/source-acceptance verdict.

## 4. Exact proven historic CI obstacle; per-PR feature tests were not reached

Repository workflow .github/workflows/tournament-correction-ci.yml runs Pack19 and Pack20–26 *before* Pack17 --full. Existing unmerged release-based feature PRs inherit baseline Pack19 test blob **8d5e8466cbc651a510acf3c072fac4d6821b56b5** expecting an obsolete **readOnly:true** source string. The actual route blob **bcd4413c1df18aef8bcc3399a9272fd3e6332757** configures **{isolationLevel:"repeatable read",accessMode:"read only"}**. PR35 changes only the matcher (new blob **5726986dca6a6fd7309bb883eb1106d2d19fb14e**), retaining read-only semantics.

| PR / exact run | Observed native job result | Classification |
|---|---|---|
| #35 / [38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) | Pack19 8/8 PASS; Pack20 6/7 FAIL; later Pack17 skipped | P01 SCOPED_PASS only; FULL_CI_FAIL |
| #43 / [38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415) | Pack19 7/8 FAIL; later Pack17 skipped | OLD_BASELINE_PACK19_FAIL; feature RTL NOT_EXECUTED |
| #47 / [38596198607](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38596198607) | same old Pack19 FAIL; later gates skipped | OLD_BASELINE_PACK19_FAIL |
| #50 / [38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147) | same old Pack19 FAIL; later gates skipped | OLD_BASELINE_PACK19_FAIL |
| #52 / [38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) | same old Pack19 FAIL; later gates skipped | OLD_BASELINE_PACK19_FAIL |
| #53 / [38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795) | same old Pack19 FAIL; later gates skipped | OLD_BASELINE_PACK19_FAIL |
| #54 / [38606249912](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606249912) | same old Pack19 FAIL; later gates skipped | OLD_BASELINE_PACK19_FAIL |

The complete GitHub job step results were inspected. Job logs for #43 and #53 explicitly say **not ok 1 - transaction is explicitly read-only and snapshot isolation**, with the incorrect old regex. **No actual target frontend RTL, build, browser or full Pack17 PASS is established by any of these workflow failures.**

No source-contract regression *new to R15* was confirmed beyond the already recorded P01/P02 mismatch and existing Pack17 TAP issue T017-QA-01.

## 5. Pack17 source contract: what A50 may actually run

**PR40 exact HEAD:** 9a8287271299a59fc9291b8d253299a8d109a35d. Exactly three Pack17 files, with blob SHAs: gate-contract.mjs **eae350a60a684d7b14af3e481baf7bd6c4a2b2fc**, gate-contract.test.mjs **f59a65509009fbdf74a38239693238704b1af583**, run-gates.mjs **8779ab2c1588cc62a2f3c5f63c57be9b55e86043**. Existing 24 authored Node contract tests have historical R14 local **24/24 PASS, exit 0** at these blob SHAs; this is NOT new R15 execution and NOT --full.

On a disposable checkout pinned to this exact PR40 SHA:

~~~powershell
node --test --test-reporter=tap qa/pack17/gate-contract.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'Pack17 source helper contracts FAIL' }
node qa/pack17/run-gates.mjs --static
if ($LASTEXITCODE -ne 0) { throw 'Pack17 --static FAIL' }
# Even exit 0 here means STATIC-ONLY PASS / RELEASE STOP.
~~~

**Pack17 --full** demands nine ordered source/PG/application gates:

1. Source contracts: 1 complete nonempty Node TAP summary.
2. Fail-closed helper contract tests: 1 complete Node TAP summary.
3. PostgreSQL atomic correction: 1 Node TAP summary against isolated PG16.
4. Workspace typecheck.
5. API unit suite: **3** independent Node TAP summaries (three child commands in API package test:unit script).
6. API integration suite: 1 Node TAP summary.
7. Frontend test suite: 1 Node TAP summary, no skipped/todo.
8. API build.
9. Frontend build including Animated Effects stage.

**Not folded into --full:** previous workflow Pack19–26 contracts, standalone api-spec codegen, browser/live checks, composite multi-PR integration. Each remains a separate release requirement. A successful --static or mock runner output is never release approval.

**Physical PostgreSQL preflight — BLOCKED unless A20/A50 and owner provide verification:** dedicated disposable PG16, no shared/prod network/DB, test-only URL securely injected without printing credentials, NODE_ENV=test, TEST_DATABASE_SCHEMA matching tm_test_*, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA; explicit authorization for DROP SCHEMA CASCADE limited to that isolated target. Test-looking URL is NOT physical isolation. After approval, run in PR40 root:

~~~powershell
$env:NODE_ENV = 'test'
$env:TEST_DATABASE_SCHEMA = 'tm_test_pack17'
$env:TEST_DATABASE_RESET = 'DROP_TM_TEST_SCHEMA'
# A50 securely injects an ACTUAL verified disposable TEST_DATABASE_URL (never echo it).
node qa/pack17/run-gates.mjs --full
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "Pack17 full FAIL: exit $exit" }
~~~

**Strict fail-closed expected negative cases:** no mode; missing/unsafe DB config; skipped, todo, cancelled, failed or zero tests; missing TAP header; missing mandatory summary counter; mismatched number of TAP child summaries (especially API unit 3); out-of-order or omitted gate; any nonzero subprocess exit. Any such result **MUST NOT** be accepted as full PASS.

**Known open parser gap T017-QA-01 (SOURCE_CONFIRMED from prior R10–R14 synthetic probes):** assertCompleteTap currently counts TAP headers and summary counters but does not independently reconcile each ok/not ok test record or the plan. A crafted counter-only stdout or a not ok record with fake # pass 1 / # fail 0 is wrongly accepted by that pure parser. No real Node subprocess false green has been demonstrated. **A60 independently triages**. No A40 code patch, no downgrade, no unsupported release PASS.

## 6. Evidence handoff acceptance schema

A50 must publish for each actual run: **PR ID, exact 40-char HEAD SHA, package cwd, command line, OS, Node version, pnpm version, frozen dependency result, sanitized env/preflight, exit code, #tests/#pass/#fail/#skipped/#todo per TAP subprocess, resulting log URL/file checksum, BLOCKED reasons**. Do not mark PASS if tests did not run.

A60 independently verifies source and output on the exact same SHA and records SOURCE_ACCEPTED / FAIL / NOT_EXECUTED / BLOCKED without self-certifying author-written fixtures. Missing A60 signed verdict is PENDING, not automatic PASS.

**Final eventual SWARM-006-only dependency note (NOT EXECUTED):** after WEB-005 formally closes and owner/HQ authorizes a single handoff, integrator assembles P01 Pack19 + P02 Pack20–26 + P07 Pack17 with functional PRs on a controlled composite SHA; runs actual source and application CI, isolated PostgreSQL, frontend, codegen, Animated Effects and browser checks on that composite. A40 did **not** cherry-pick, merge, create a composite branch, run paid CI or start SWARM-006.

**A40 next action:** publish R15 handoff and exact report URL to A00; A50 runs targeted PR-specific tests in an authorized checkout; A60 accepts or rejects exact-SHA evidence and reviews T017-QA-01. **RELEASE_NO_GO**.
