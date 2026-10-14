# WEB-005 — A40 R20 CI gate / exact-SHA execution runbook

**Task:** WEB-005-T010-T017-A40-R20 · **Role:** A40 Pack19/Pack17 CI · **Mode:** SOURCE ONLY  
**Authority:** [WEB-005_WAVE_R20_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md), Git blob dabf0146a08ef8488400df9268b52210662cbb63  
**Date:** 2026-10-14 Europe/Warsaw · **Repo:** C8LyNn/aplikacja-turnieje  
**Disposition:** SOURCE_CONTRACT_VERIFIED / NATIVE_APP_TESTS_NOT_EXECUTED / A60_R19_PR53_PR54_VERDICT_NOT_VERIFIED / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD

## 1. Live immutable source pins

All listed pull requests are OPEN/DRAFT/UNMERGED, target the **same** release base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, and do **not** form an integrated tree.

| Package | PR / actual HEAD | Independently supported status |
|---|---|---|
| P01 Pack19 | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) `7cb283aa82273a1e22daf9051a82311eef53760c` | A60 R18 SOURCE_ACCEPTED (one test matcher file), not entire workflow |
| P02 Pack20–26 | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) `85ad0b86136fc3491c9ef18663d9b01396179349` | A60 R18 SOURCE_ACCEPTED (four source test files), not runtime |
| P07 Pack17 | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) `9a8287271299a59fc9291b8d253299a8d109a35d` | A60 R18 SOURCE_ACCEPTED scoped; physical PG/full gates NOT_EXECUTED |
| P08 Backup | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | SOURCE_ACCEPTED_CONDITIONAL, PG16 pending |
| P09 Undo | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | SOURCE_ACCEPTED_CONDITIONAL, PG16 X/Y race pending |
| P20 private cache | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | R19 PATCH_REVISED, requires **A30/A60 current-SHA** review; previous A60 R18 SHA `8710f7fe5946d7f62e366303a97722d4201fc96b` not transferable |
| P21 RR/DE | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | R19 PATCH_REVISED, requires **A60 current-SHA two-boundary** review; previous R18 SOURCE_BLOCKED cannot be used as a current verdict |

**Independent provenance at inspection:** [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) Git blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`; [A60 R18 final gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) blob `e838d37d15a30beb83dd65ec5189b10df89827b0`, verdict HANDOFF_NOT_READY. A60 R19 new independent report was **NOT FOUND** in control folder, searched R19/A60 branches or PR40 review comments. This bounded negative search is NOT evidence that the agent did no work elsewhere. Do not replace independent signoff with this A40 report.

[A50 R19 actual receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), blob `412117e31c297353b35a3c21fbd616d41754d4b6`: Node v22.16.0/Git 2.47.3 environment preflight, no full app checkout/pnpm/test dependencies or approved isolated PG16; **native app tests = 0, ENV_BLOCKED**. No new A40 R20 runtime test command was executed and **no TAP/exit/app test PASS** is claimed.

## 2. Why isolated GitHub Actions show FAIL before feature tests

**Source root cause:** baseline `qa/pack19/source-contract.test.mjs` blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5` asserts obsolete `/isolationLevel:"repeatable read",readOnly:true/`. Backend `artifacts/api-server/src/routes/tournament-se-correction-readiness.ts` blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757` actually uses `{isolationLevel:"repeatable read",accessMode:"read only"}`. Existing PR35 blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e` changes only source assertion to the real Drizzle transaction option; route unchanged. **No new P01 patch authorized or needed.**

Native `.github/workflows/tournament-correction-ci.yml` runs `SE safety → Pack19 → Pack20 → Pack21 → Pack22 → Pack26 → Pack25 → Pack24 → Pack23 → Pack17 --full`. First failure stops the remaining dependent steps.

| Exact run / head | Job and real observed result | What it does NOT prove |
|---|---|---|
| [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899), `7cb283aa...` | job `115807143959`: Pack19 source **8/8 PASS**, subsequent Pack20 source **6/7 FAIL**, overall FAILURE | No full CI PASS, no Pack17 runtime |
| [PR53 run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899), `d1aebfca...` | job `116085315511`: safety **23/23 PASS**, Pack19 domain **26/26 PASS**, Pack19 source **7/8 FAIL**, downstream skipped | No PR53 private-cache native test result |
| [PR54 run 38631912235](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235), `bfa9d075...` | job `116085745327`: same **23/23, 26/26, 7/8 FAIL**, downstream skipped | No PR54 parent/child RTL or browser result |

The PR53/54 job logs in earlier R19 A40 inspection explicitly contain `not ok 1 - transaction is explicitly read-only and snapshot isolation`, then the old `readOnly:true` regex mismatch. Their respective **target feature tests were SKIPPED**, not PASS or FAIL. PR36/40 returned no PR-head automatic Actions runs in this check; that is neither red nor green evidence.

## 3. Executable targeted React tests, independently on exact PR53/PR54 SHA

**Source grounding:** `artifacts/tournament-manager/package.json` names `@workspace/tournament-manager`. Native `test/run-tests.mjs` blob `590cd53003fe1b385761c5681389bdc8c7a7d4e6` runs Node `--import tsx --import ./test/setup-dom.mjs --test` from the frontend package root and sets `TSX_TSCONFIG_PATH` to `test/tsconfig.json` for JSDOM/alias resolution. The commands below use the identical test stack, avoiding the unrelated earlier Pack19 workflow gate. They are **instructions to A50**, not tests A40 has executed.

**Preflight PowerShell at monorepo root** on a fresh **complete clean disposable checkout** (run **separately** for each PR, never a composite; verify GitHub live HEAD before running):

~~~powershell
# PR54 example; for PR53 set the different branch and SHA below.
$branch = 'fix/web-005/t100-rr-readback-r13'
$sha = 'bfa9d075b431185aa8bbf87bf021d64dde8ae22f'
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0) { throw 'STOP: missing/dirty checkout' }
git fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'STOP: fetch failed' }
git -c advice.detachedHead=false switch --detach $sha
if ($LASTEXITCODE -ne 0 -or (git rev-parse HEAD).Trim() -ne $sha) { throw 'STOP: exact SHA mismatch' }
if ((node --version) -notmatch '^v22\.') { throw 'STOP: Node22 absent' }
if ((pnpm --version) -notmatch '^10\.') { throw 'STOP: pnpm10 absent' }
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'STOP: lockfile install failed' }
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path
~~~

**PR54 current HEAD `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`:** production parent plus selected child change and new test path exist. Must test lawful Overview/DE despite denied RR 401/403, manually selected denied RR hiding old React Query `data` despite `error`, local retry, valid N→N+1 readback. No browser evidence has been captured by A40.

~~~powershell
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx src/components/stage-progress-view.rr-denied.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR54 focused RTL FAIL: $exit" }
~~~

**PR53 current HEAD `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`:** use *different* fresh checkout `$branch='fix/web-005/t080-s2a-private-auth-query-cache-r13'`, `$sha='d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34'` and repeat all preflight steps above. Focus legacy raw untagged picks A→B credentials, disappearing/reappearing owner list, no stale display before authorized GET, preserved unrelated B and AuthProvider query fixture. A30/A60 own acceptance, not A40.

~~~powershell
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR53 focused RTL FAIL: $exit" }
~~~

Each actual A50 run must preserve: `git rev-parse HEAD`, OS, Node/pnpm, exact command, frozen dependency state, exit code, unmodified TAP `tests/pass/fail/skipped/todo` for each subprocess, sanitized log permalink/hash. **Skipped, zero, missing, nonzero or unexecuted does not equal PASS.** After focused results separately run the native frontend `pnpm --filter @workspace/tournament-manager run typecheck`, `run test`, `run build` **on the same exact SHA**; build invokes Animated Effects stage, not Vite-only. Manual browser/visual privacy verification is another required gate.

## 4. PG16 only after physical A20/owner confirmation: real PR41 and PR42 tests

API `artifacts/api-server/package.json` names `@workspace/api-server`; both integration test paths verified among actual PR changed files, NOT guessed. On **each separate** PR checkout, clean/pinned, Node22/pnpm10 frozen deps as above, and only after owner/A20 verifies a **physically isolated disposable PostgreSQL16 dedicated test DB** (test-looking URL and schema alone do not prove isolation), specifically authorizes `DROP SCHEMA ... CASCADE` reset restricted to isolated `tm_test_*`:

~~~powershell
# SECURITY STOP unless physically verified target identity and signed owner reset scope.
$env:NODE_ENV = 'test'
$env:TEST_DATABASE_SCHEMA = 'tm_test_web005_a50_r20'
$env:TEST_DATABASE_RESET = 'DROP_TM_TEST_SCHEMA'
# TEST_DATABASE_URL must be securely injected; never echo credentials.
# No DATABASE_URL fallback, no shared DB, no production!
~~~

**PR41 P08 HEAD `f03cf3d09988a04ba9c2856e205d21f994ff67f1`:** real `test/stage-basket-route-execution.integration.test.ts` tests Backup B1 source/receipt validity under isolated Postgres. Record modern/legacy-null positive, invalid QP/QPE/OP 400/zero-clone and rollback at exact SHA.

~~~powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR41 PG16 integration FAIL: $exit" }
~~~

**PR42 P09 HEAD `021bed269f9ea8ac8ce53caeea44263c098aa2dd`:** **other checkout**, same DB safety gate. Real `test/revert-match.integration.test.ts` includes roster Undo LIFO path; A70/A60 independently specify stale queued X / committed newer Y -> 409 `UNDO_ACTION_CHANGED`, zero writes, Y persists, lawful latest 200.

~~~powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR42 PG16 integration FAIL: $exit" }
~~~

**R20 A40 physically executed PostgreSQL tests = 0.** No host, database, reset permission or native TAP provided; status `ENV_BLOCKED / NOT_EXECUTED`. An owner-provided dedicated host and separately approved DB are distinct prerequisites.

## 5. Pack17 nine-gate contract, exact current source and T017-QA-01

P07 `PR40@9a8287271299a59fc9291b8d253299a8d109a35d` has exactly 3 changed files, unchanged from R19:

| File | Current Git blob |
|---|---|
| `qa/pack17/gate-contract.mjs` | `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` |
| `qa/pack17/gate-contract.test.mjs` | `f59a65509009fbdf74a38239693238704b1af583` |
| `qa/pack17/run-gates.mjs` | `8779ab2c1588cc62a2f3c5f63c57be9b55e86043` |

`node qa/pack17/run-gates.mjs --static` has only source tests and self-tests and prints `RELEASE STOP`, even if exit0. `--integration` also is not full. The `--full` run requires nine ordered gates:
1. source-contract tests: one complete Node TAP
2. gate-contract tests: one complete Node TAP
3. atomic correction Postgres16: one complete Node TAP
4. workspace typecheck
5. API unit: **three complete TAP summaries** (three Node test processes)
6. API integration: one TAP
7. frontend tests: one TAP
8. API build
9. frontend build, including Animated Effects

All must execute at exact approved SHA; missing process, child nonzero, failed/skipped/todo/zero tests, incomplete TAP must stop. `--full` does **not** integrate prior Pack19–26 source suites, separate API codegen, browser privacy, combined PR regression or deployment acceptance. Historical A40 source helper **24/24** pure author-contract tests PASS in prior waves, not new R20 or real full app validation. Pack17 `--full` **NOT_EXECUTED**, needs isolated PG16 + dependencies.

**T017-QA-01 status — SOURCE-PROVEN RISK, independent A60 severity NOT VERIFIED.** Unchanged `assertCompleteTap` source recognizes `TAP version 13` and summary `# tests/pass/fail/cancelled/skipped/todo`, but does not reconcile top-level `1..N` plan and individual `ok`/`not ok` records with counters. Earlier A40 focused pure synthetic probes found it accepts (a) header+internally consistent PASS counters with no case records and (b) `not ok` with forged PASS counters. No actual Node subprocess false green was demonstrated, because real runner separately rejects nonzero child exits. **A60 has not been located signing a specific R19/R20 severity or release verdict for this issue; therefore this is NOT an A60-confirmed release blocker and NO patch authorization exists.** Ask A60 for precise independently linked finding/severity, then A00 can separately decide a future fix-specific GO on existing PR40, with native nested TAP positive cases and forged negative regression; **do not edit now**.

## 6. Owner request and final-only handoff STOP

**One A50 environment unblock:** A00/owner must provide one approved trusted connected PC/VM with actual full **per-SHA** repository checkouts, Node22, pnpm10 and frozen dependencies and a writable test shell; A50 executes and returns actual native TAP/exit for PR53 and PR54. Separate A20/owner PG16 identity and schema reset authorization for PR41/42.

**A60 independent acceptance:** publish exact R19 current-SHA PR53 and PR54 source/privacy results, independent `T017-QA-01` classification, and formal handoff gate. Original WEB-004 38 historical cases = 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN. A10 R19 reconstructed **29 authentic IDs**, nine still `SOURCE_ID_NOT_AVAILABLE` and no per-case signed owner dispositions; cannot transform 21 PRs into 38 accepted cases or silently sign unknown rows. Owner/HQ still needs explicit Basket/sport/Backup/Revert/Steam/session/cache policy decisions.

Even if native per-PR tests stay blocked, `HANDOFF_WITH_RUNTIME_TEST_DEBT` is **not automatic**, must be explicitly signed **after** source and 38-case/policy gates close, preserving hard future SWARM-006 composite PG/RTL/CI/browser `RELEASE STOP`. Independent A60 prior signed handoff verdict is NOT_READY; no new signed GO was found during A40 investigation. **Do not initiate SWARM-006.**

**A40 R20 closing classification:** `CI_SOURCE_CHECK_DONE / DOCUMENTED_TEST_COMMANDS_NOT_EXECUTED / T017_SOURCE_RISK_A60_CONFIRMATION_PENDING / NO_CODE_CHANGES / OWNER_EXECUTOR_REQUIRED / WEB005_HANDOFF_NOT_READY_LAST_SIGNED / RELEASE_NO_GO / SWARM006_HOLD`.
