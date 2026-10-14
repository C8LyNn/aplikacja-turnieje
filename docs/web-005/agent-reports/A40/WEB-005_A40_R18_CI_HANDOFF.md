# WEB-005 — A40 R18: CI handoff, targeted native test commands, Pack17 TAP risk

**Task:** WEB-005-T010-T017-A40-R18  
**Role/mode:** A40 — Pack19/17 CI gate · SOURCE-ONLY, NO CODE GO  
**Central plan:** WEB-005_WAVE_R18_AGENT_PROMPTS.md R18.1, source blob `fd08cedcbd2db3222e4a444403180414d1666f6c`  
**Repository:** C8LyNn/aplikacja-turnieje  
**Evidence date:** 2026-10-14 Europe/Warsaw  
**Disposition:** SOURCE_CONFIRMED / COMMANDS_PREPARED / RUNTIME_NOT_EXECUTED_BY_A40 / RELEASE_NO_GO / SWARM006_HOLD.  
**Scope:** inspect existing PRs, native scripts, independent A60 R17 results and failing CI; provide safe executable per-SHA guidance. No edits to application code, runner, workflow, CI re-run, PR branch, main/release or database.

## 1. Live HEAD/base and independent QA R17

All live PRs below were inspected OPEN, DRAFT, not merged, based individually on `release/tournament-ops-20261013-01` = `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Snapshots are not a composite SHA. **Re-fetch HEAD before each execution** because A70/A100/A120 have concurrent scoped R18 source GO.

| Package | PR | Latest HEAD at A40 readback | Provenance/verdict |
|---|---|---|---|
| P01 | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | Existing Pack19 matcher fix; A60 R17 scoped source accepted |
| P02 | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136fc3491c9ef18663d9b01396179349` | Existing Pack20–26 contracts; A60 R17 scoped source accepted |
| P07 | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | A60 R17 source accepted scoped; Pack17 --full NOT_EXECUTED |
| P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | A60 R17 SOURCE_ACCEPTED_CONDITIONAL; PG16 pending |
| P09 | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | **`021bed269f9ea8ac8ce53caeea44263c098aa2dd`** | **R18 new HEAD**, replacing R17 `25b09f1a48a85ae882b817118f5d8c23bffbe383`; old SOURCE_BLOCKED verdict cannot be transferred; A60 review pending |
| P10 | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | React CSV |
| P14 | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | React DE/Audience |
| P17 | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | React Backup preview |
| P19 | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | React stage lifecycle |
| P20 | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | **`8710f7fe5946d7f62e366303a97722d4201fc96b`** | **R18 new HEAD, A60 new-SHA review pending**; old R17 known-owner-only verdict cannot be inherited |
| P21 | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | **`9866e5d2e73c99e01c2934a38ca1c62455efd2ed`** | **R18 new HEAD (additional tests), A60 new-SHA review pending**; old R17 verdict cannot be inherited |

**Independent original A60 R17 QA:** [A60 R17 signed report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), blob `ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d`; [21-packet matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json), blob `cc6f24f582d216e99d8870d0e3519ff497fd8ad3`. Separate [A50 R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md), blob `da3b9892a2675748263091c6193306c61995ce27`, records Node/Git preflight only, no complete checkout/pnpm/physically isolated PG16 and **0 native RTL/API/PG16 executions**. A40 does not turn scoped source acceptance or authored tests into runtime PASS.

**R18 scope warning:** At inspected R18 PR42 intermediate HEAD `d39a0c7ef7e32d8554a7d41c4fb33fb9c725b410`, `tournament-roster.ts` blob `b47bc6e1452173fbc65b236909efe01aebf76116` now visibly contains `latestUndoable` under `undoTournamentRosterAction`; no runtime/semantic endorsement by A40, and R17's A60 verdict cannot classify this new HEAD. Independent new exact-SHA A60 review is required.


**Concurrent R18 HEAD readback at report finalization:** PR42 progressed from an intermediate `d39a0c7ef7e32d8554a7d41c4fb33fb9c725b410` to **`021bed269f9ea8ac8ce53caeea44263c098aa2dd`** (+1 commit, route status handling); PR53 from `8f959733258aed0cab15298dd0684ca068045e6f` to **`8710f7fe5946d7f62e366303a97722d4201fc96b`** (+7 commits since R17, ownership logic and expanded tests); PR54 from `dbba0eb82920b4f324866b1b983e1211459f52ec` to **`9866e5d2e73c99e01c2934a38ca1c62455efd2ed`** (+1 commit, tests). These are separate author lanes; A40 neither authored nor approved them. **All new heads demand fresh A60 exact-SHA review, native tests still NOT_EXECUTED by A40.**


**Late R18 PR53 source-only snapshot update:** PR53 advanced another **3 commits** from intermediate `3947508b70a5125a0d1b194be4bec4927740d382` to verified `8710f7fe5946d7f62e366303a97722d4201fc96b`; compare changed **only** `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` (66 changed lines), and does **not** establish test PASS or source acceptance. A60 must sign the newest exact HEAD.

## 2. CI obstruction: SOURCE_CONFIRMED, not target-feature FAIL

Native GitHub workflow `.github/workflows/tournament-correction-ci.yml`, blob `e8b70393d311cd80c32ef78b2c16ac7b87d5ec63`, configures Node 22 / pnpm 10 / postgres:16 and runs sequential:
`SE safety → Pack19 → Pack20 → Pack21 → Pack22 → Pack26 → Pack25 → Pack24 → Pack23 → Pack17 --full`.

**Release baseline:** `qa/pack19/source-contract.test.mjs` Git blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5` contains the obsolete source regex `/isolationLevel:"repeatable read",readOnly:true/`. Actual unchanged application route `artifacts/api-server/src/routes/tournament-se-correction-readiness.ts` blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757` uses `{isolationLevel:"repeatable read",accessMode:"read only"}`. Existing **PR35** fixes *only* matcher, blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e`. **No duplicate P01 patch, no weakening read-only behavior.** PR36 separately updates four Pack20/21/25/26 source tests, unmerged.

**Real, independently viewed run/job logs:**
- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899), job `115807143959`: safety 23/23 PASS; Pack19 domain 26/26 PASS, source **8/8 PASS**; Pack20 domain 15/15 PASS, source **6/7 FAIL** on another inherited old assertion. Later packs and Pack17 SKIPPED. Overall FAILURE.
- [PR41 run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), job `116056098551` at latest P08 SHA: safety **23/23 PASS**, Pack19 domain **26/26 PASS**, Pack19 source **7/8 FAIL**; log contains `not ok 1 - transaction is explicitly read-only and snapshot isolation` and obsolete `readOnly:true` regex. Later gates SKIPPED; this is NOT a Backup B1 test.
- [PR53 run 38622961390](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38622961390), job `116054859202` at latest R17 P20 SHA: same **23/23, 26/26, then 7/8 FAIL** on the same obsolete Pack19 assertion. Later gates SKIPPED; this is NOT a private-cache RTL test.
- No PR36-HEAD, PR40-HEAD or current PR42-HEAD PR-triggered Actions run appeared in the checks made; absence of a run is NOT CI PASS or source QA.

**Classification rule:** `OLD_BASELINE_PACK19_FAIL` = unrelated prerequisite source-test mismatch; `FEATURE_TEST_FAIL` only if actual relevant test invoked, failed and supplied log/exit at exact SHA; `NOT_EXECUTED` for downstream skipped feature gates; `INFRA_BLOCKED` for unavailable checkout/dependencies/isolated PG. No undocumented workaround such as skipping P01/P02 or creating a WEB-005 composite release tree.

## 3. Root-correct native frontend test setup — executable A50 runbook

**SOURCE-CONFIRMED** runner `artifacts/tournament-manager/test/run-tests.mjs` Git blob `590cd53003fe1b385761c5681389bdc8c7a7d4e6` scans `src/**/*.test.tsx`, sets package cwd and `TSX_TSCONFIG_PATH`, then starts `node --import tsx --import ./test/setup-dom.mjs --test [files]`; the DOM preloader `test/setup-dom.mjs` initializes JSDOM. Package filter from `package.json`: `@workspace/tournament-manager`. The commands below execute *real* Node tests directly and avoid the earlier CI Pack19 step. This **does not waive** eventual Pack19–26 and Pack17 full gate.

**Reproducibility preflight:** A50 (or approved owner executor) uses a dedicated, clean and complete checkout for **each** exact PR SHA. In PowerShell from repo root, with the branch/SHA chosen from table above; no composite/rebase, no shared/production DB for frontend-only tests:

~~~powershell
$branch = 'fix/web-005/t080-s2a-private-auth-query-cache-r13' # example PR53
$sha    = '8710f7fe5946d7f62e366303a97722d4201fc96b'
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0) { throw 'STOP: repository not clean' }
git fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'STOP: fetch failed' }
git -c advice.detachedHead=false switch --detach $sha
if ($LASTEXITCODE -ne 0) { throw 'STOP: checkout failed' }
if ((git rev-parse HEAD).Trim() -ne $sha) { throw 'STOP: HEAD mismatch' }
if ((node --version) -notmatch '^v22\.') { throw 'STOP: Node 22 required' }
if ((pnpm --version) -notmatch '^10\.') { throw 'STOP: pnpm 10 required' }
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'STOP: frozen install failed' }
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path
~~~

**Exact targeted commands (from repository root, with matching HEAD, one branch at a time; paths are relative to filtered package cwd):**

~~~powershell
# PR53 current R18 HEAD 8710f7fe5946d7f62e366303a97722d4201fc96b
# Critical both newly authored cache tests and existing AuthProvider compatibility fixture:
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx

# PR54 current R18 HEAD 9866e5d2e73c99e01c2934a38ca1c62455efd2ed
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx

# PR52 HEAD cce73ec47445102b216b3f8eceb4ec9de67eb1a7
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/tournament-stages-panel.test.tsx

# PR43 HEAD 96a6068f69027574ac76e18d4d5a2c444b5a914a
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/hooks/use-tournament-csv-file-reader.test.tsx

# PR47 HEAD f09a13623faca8d7ab29b09a2c5b43907c2acd0b
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/stage-progress-view.test.tsx src/pages/public-stage-views.test.tsx src/pages/tournament-audience.test.tsx

# PR50 HEAD 5457a74187edc263730c3a4b25a663bdf5531ee9
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/components/backup-restore-dialog.test.tsx src/hooks/use-scoped-backup-preview.test.tsx
~~~

The paths were confirmed from actual changed-file lists (PR53 now has `src/hooks/use-tournament-auth.test.tsx` modified and wrapped in QueryClientProvider, matching A60 R17 source evidence). **After each targeted run**, preserve `$LASTEXITCODE` immediately and record TAP test/pass/fail/skip/todo. Run, independently on *same SHA*, `pnpm --filter @workspace/tournament-manager run typecheck`, `run test`, `run build`. The normal frontend `build` invokes `scripts/stage-animated-effects.mjs` via pnpm before Vite: do not replace with Vite-only. Browser manual checks remain independent.

**A50 one first decisive run:** exact-HEAD PR53 two-file command above, no API/DB dependency. It tests both new cache logic and older AuthProvider fixture; no runtime outcome is implied by authored test definitions. If R18 PR53 HEAD changes, first refetch test paths and pin new SHA rather than executing stale code.

## 4. Exact API target commands, physically isolated PG16 **ONLY AFTER** owner/A20 approval

API package `artifacts/api-server/package.json` names `@workspace/api-server`; its integration convention is `node --import tsx --test --test-concurrency=1`. Per-PR changed test paths were checked live (not guesses). On **separate** complete checkouts pinned to the current corresponding PR HEAD, with Node22/pnpm10 and frozen deps:

~~~powershell
# ONLY after independent physical safety verification and explicit written reset GO:
$env:NODE_ENV='test'
$env:TEST_DATABASE_SCHEMA='tm_test_web005_a50'
$env:TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
# TEST_DATABASE_URL must be securely supplied to an actually dedicated, physically
# isolated, disposable PostgreSQL16 test instance. Never echo or log credentials.
# No DATABASE_URL fallback, production database or shared schema is permitted.

# PR41 f03cf3d09988a04ba9c2856e205d21f994ff67f1  (Backup B1)
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts

# PR42 021bed269f9ea8ac8ce53caeea44263c098aa2dd  (Undo roster, latest R18 SHA)
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts

# PR39 (Cancel/Restore, obtain exact HEAD again before execution)
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/match-revision.integration.test.ts

# PR44
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/session-revocation-race.integration.test.ts

# PR45
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/round-robin-terminal-reopen.integration.test.ts

# PR46
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/tournament-delete-revocation.integration.test.ts

# PR48
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts

# PR49
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/auth-organizer-revocation-r12.integration.test.ts

# PR51
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts
~~~

The API test suites can reset a `tm_test_*` schema (e.g., `DROP SCHEMA ... CASCADE`) and may trigger migrations; test-looking URLs and env validators do NOT establish physical separation. **No A40 PG commands executed**. A50/A20 must verify target identity, isolation, schema scope, explicit owner reset consent and no overlap with production before any command above. Save sanitized env, actual stdout/exit/TAP; absent permission/environment = `BLOCKED / NOT_EXECUTED`. For PR42 any changed R18 HEAD requires new A60 signoff even if a test subsequently passes.

## 5. Pack17 --full: final STOP gate, no green substitution

P07 PR40 exact HEAD `9a8287271299a59fc9291b8d253299a8d109a35d`, files: `qa/pack17/gate-contract.mjs` blob `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`, `gate-contract.test.mjs` blob `f59a65509009fbdf74a38239693238704b1af583`, `run-gates.mjs` blob `8779ab2c1588cc62a2f3c5f63c57be9b55e86043`.

**Historical scoped Node unit tests only:** 24/24 PASS at this exact unchanged blob set (prior A40/A60 wave, Node22, exit0). **R18 A40 new native tests:** NOT_EXECUTED. **Pack17 --full with physical PG:** NOT_EXECUTED.

`node qa/pack17/run-gates.mjs --static` completes only 2 source/helper gates and explicitly prints `RELEASE STOP`; `--integration` adds only the atomic PG gate and still prints `RELEASE STOP`. **`--full` requires exactly 9 ordered checks**: (1) source-contract TAP summary 1; (2) helper TAP 1; (3) disposable PostgreSQL atomic-correction TAP 1; (4) workspace typecheck; (5) API unit **3 distinct TAP child summaries**; (6) API integration TAP 1; (7) frontend TAP 1; (8) API build; (9) frontend build including Animated Effects. Any nonzero subprocess, missing summary, skipped/todo/cancelled/zero tests or omitted gate must block full PASS. The safe helper validates `NODE_ENV=test`, `TEST_DATABASE_URL` test-looking PG URL, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` and `TEST_DATABASE_SCHEMA=tm_test_*`; it **does not verify physical isolation**, for which A20/owner remains prerequisite.

**Separately mandatory:** previous native workflow Pack19–26, OpenAPI/api-spec codegen parity, browser QA and actual integrated-composite regression under future authorized SWARM-006 (not in this wave). No `--static`/mock/synthetic unit TAP PASS can be advertised as full APP RELEASE PASS. Future handoff with runtime debt must have **explicit owner/HQ waiver**, and remain release **NO-GO** until full post-integration tests pass.

## 6. T017-QA-01 — exact source risk and conditional code request

The P07 helper `qa/pack17/gate-contract.mjs` function `assertCompleteTap` is **SOURCE_CONFIRMED** to read `TAP version 13` headers and six `# tests/pass/fail/cancelled/skipped/todo` counters but **not** validate any real `ok ...`, `not ok ...` records or a top-level `1..N` plan. Thus a forged transcript with just `TAP version 13` and internally consistent PASS counters, or one containing `not ok 1` but fabricated `# pass 1` / `# fail 0`, can be accepted by this **pure parser**. This has been reproduced in earlier A40 source-level synthetic probes; see A40 R14/R13 reports. The actual `run-gates.mjs` separately checks child process exit/signal **nonzero is blocked**; no real falsified successful child output or production bypass is proven.

**Independent A60 R17 source verdict:** P07 `SOURCE_ACCEPTED` scoped with 24/24 historical unit tests; **no explicit separate T017-QA-01 disposition** found in the signed R17 QA report. Hence A40 does **not** declare this independently approved release blocker nor grant code GO.

**One narrowly scoped conditional next-code request, *only if A60 confirms the defect/severity and A00 expressly grants new GO*:**
- Modify ONLY existing P07 PR40 `qa/pack17/gate-contract.mjs` and matching `qa/pack17/gate-contract.test.mjs` on its verified exact HEAD; no new PR, no unrelated runner rewrite or reduction of test requirements.
- Within each expected TAP child summary, reconcile explicit TAP plan `1..N`, actual per-test `ok`/`not ok` records and summary counters according to native Node TAP including nested subtests. Require at least N authentic successful records, reject any test failures/contradictions, zero-record counter-only, missing/mismatched plan and incomplete child. Maintain existing skip/todo/nonzero/duplicate guard behavior, and avoid false rejection of genuine nested Node TAP.
- Add narrow negative regression fixtures for both forged cases and positive fixtures for actual Node22 TAP layouts, including 3-subprocess API-unit output.
- Re-run focused source helper tests plus approved isolated full gate and require new independent A60 exact-SHA review. **Until confirmed/GO: NO PATCH, T017-QA-01 QA_PENDING.**

## 7. GO/STOP, owner decisions and next concrete actions

**A40 done:** source & GitHub CI verification, per-SHA frontend and PG16 command mapping, TAP parser source risk, documented blocker separation. **No code diff, no R18 test execution, no invoiceable CI rerun.**

**A50 actual unblock:** A00/owner provides one trusted approved full repo checkout + Node22/pnpm10 installed with frozen deps and exact per-PR test GO; A50 executes PR53 two-file frontend test first, stores HEAD/env/exit/TAP and associated link. For API tests physical dedicated disposable PG16 plus A20 preflight and written reset permission is separate. Missing access = explicit `INFRA_BLOCKED`, not mock green.

**A60 exact next verdicts:** review newly changed R18 PR42 HEAD; independent conditional T017-QA-01 decision; re-evaluate PR53/PR54 when new authored commits appear and publish exact links. Existing R17 conditional source QA is NOT full runtime acceptance.

**A00/HQ:** policy decisions and final-only manifest required. Optional `HANDOFF_WITH_RUNTIME_TEST_DEBT` requires a **fresh, explicit owner/HQ authorization**, with SWARM-006 holding a full composite runtime STOP release gate. A40 cannot authorize handoff or initiate SWARM-006.

**STATUS:** `A40_R18_SOURCE_COMPLETE / REPORT_PUBLISHED / P07_RUNTIME_NOT_EXECUTED / T017_QA01_A60_DISPOSITION_PENDING / WEB005_RELEASE_NO_GO / SWARM006_HOLD`.
