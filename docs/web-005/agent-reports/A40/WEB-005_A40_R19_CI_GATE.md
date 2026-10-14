# WEB-005 — A40 R19 CI acceptance / Pack19–Pack17 / executable QA gates

**Task:** WEB-005-T010-T017-A40-R19  
**Role:** A40, CI Contract Recovery; **mode:** SOURCE-ONLY / READ-ONLY  
**Authority:** WEB-005_WAVE_R19_AGENT_PROMPTS.md R19.1; Git blob `076b14ca7ea953c818309502cce322c7dd6a7bef`  
**Date:** 2026-10-14 Europe/Warsaw. **Repo:** C8LyNn/aplikacja-turnieje  
**Classification:** SOURCE_VERIFIED / COMMANDS_PREPARED / NO_R19_NATIVE_APP_TEST_BY_A40 / RELEASE_NO_GO / SWARM006_HOLD  
**Source base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. No composite PR SHA exists.

## 1. PRs, exact HEAD, source QA and change provenance

PRs checked as OPEN / DRAFT / UNMERGED, base all equal to release SHA above. The two R19 code lanes were changing during inspection: **re-fetch exact HEAD immediately before A50 executes tests**. A40 has no authority to modify or review-approve their new source.

| Packet / PR | Last verified HEAD at initial R19 publication | R18 A60 evidence and current meaning |
|---|---|---|
| P01 [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | SOURCE_ACCEPTED — one Pack19 source-test matcher change; do NOT duplicate |
| P02 [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136fc3491c9ef18663d9b01396179349` | SOURCE_ACCEPTED — four Pack20/21/25/26 source test files |
| P07 [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | SOURCE_ACCEPTED scoped; **full Pack17 NOT_EXECUTED** |
| P08 [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | SOURCE_ACCEPTED_CONDITIONAL; PG16 runtime missing |
| P09 [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | SOURCE_ACCEPTED_CONDITIONAL; roster Undo race PG16 runtime missing |
| P20 [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | **`d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`** | **New R19 HEAD**; R18 `8710f7fe5946d7f62e366303a97722d4201fc96b` had SOURCE_ACCEPTED_SCOPED with legacy untagged-picks rebind risk OPEN. Independent A30/A60 re-review of NEW SHA needed |
| P21 [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | **`bfa9d075b431185aa8bbf87bf021d64dde8ae22f`** | **New R19 HEAD**; R18 `9866e5d2e73c99e01c2934a38ca1c62455efd2ed` was SOURCE_BLOCKED. New source includes parent and child production changes, plus both focused test files; **A60 source verdict NOT yet verified on new SHA** |

**Actual R18→R19 source delta at this checkpoint:**
- #53: +4 commits vs R18 SHA; `deadlock-bans-picks.ts`, `tournament-query-invalidation.ts`, `tournament-auth-query-cache.test.tsx` changed.
- #54: +5 commits vs R18 SHA; `tournament-detail.tsx`, `stage-progress-view.tsx`, `tournament-detail.rr-readback.test.tsx` changed, and new `stage-progress-view.rr-denied.test.tsx` added. **Do not transfer R18 SOURCE_BLOCKED or any earlier SOURCE_ACCEPTED label to the new SHA without A60 checking both boundaries.** Any future PR47 child conflict is SWARM-006-only ownership; A40 does not merge.

**Independent, original R18 facts:**
- [A60 R18 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`.
- [A60 R18 final handoff gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md), blob `e838d37d15a30beb83dd65ec5189b10df89827b0`: **HANDOFF_NOT_READY**. P21 SOURCE_BLOCKED, P20 LEGACY_ORPHAN_REVIEW_OPEN, 0 native tests, 38 historical WEB004 owner dispositions incomplete, policies unsigned, no owner runtime waiver.
- [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), blob `a54e410eddf12ff9b909cb8a73cfd91d1d91acad`: no approved complete connected checkout/pnpm/physical PG16, **0 native application tests**. A40 has not obtained a new executable host or executed tests in R19.

## 2. Why individual native Actions fail at old Pack19, not at the new feature test

`.github/workflows/tournament-correction-ci.yml` Git blob `e8b70393d311cd80c32ef78b2c16ac7b87d5ec63` executes in one job:
`SE safety → Pack19 → Pack20 → Pack21 → Pack22 → Pack26 → Pack25 → Pack24 → Pack23 → Pack17 --full` (GitHub Node22/pnpm10/Postgres16).

**Three exact source files:**
- Release `qa/pack19/source-contract.test.mjs`, Git blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5`: expects obsolete `/isolationLevel:"repeatable read",readOnly:true/`.
- Actual backend `artifacts/api-server/src/routes/tournament-se-correction-readiness.ts`, blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757`: `{isolationLevel:"repeatable read",accessMode:"read only"}`.
- Existing corrected PR35 test blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e`: recognizes real `accessMode:"read only"`; **does not change backend transaction semantics**.

**Live GitHub Actions job evidence (real run, not A40 authored tests):**
- [PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899), job `115807143959`: Pack19 **8/8 PASS**; Pack20 source **6/7 FAIL**; later gates SKIPPED; overall **FAILURE**.
- [PR53 R18 run 38627584615](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38627584615), job `116070657303`: Pack19 FAIL, downstream Pack20–26/Pack17 SKIPPED; **older R18 SHA, not R19 cache test result**.
- [PR54 R18 run 38626801186](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38626801186), job `116067902963`: Pack19 FAIL, downstream Pack20–26/Pack17 SKIPPED; **older R18 SHA, not R19 RR test result**.
- At initial inspection R19 PR53 `d1aebfc...` Actions run `38631806899` was **IN_PROGRESS**, and PR54 `bfa9d075...` run `38631912235` was **PENDING**. No PASS/FAIL claim was made for these unfinished attempts. Recheck against newest HEAD before adopting logs.

Conclusion: source mismatch is confirmed in source/earlier logs, but latest source PR53/54 functional behavior has **NOT** been executed/certified by these prior short-circuited workflows. **No duplicate PR35/P02 fix; no disabling Pack19/Pack17.**

## 3. Exact frontend test commands for A50 (no Pack19 short-circuit)

**Repository-derived:** Package `artifacts/tournament-manager/package.json` names `@workspace/tournament-manager`; `test/run-tests.mjs`, Git blob `590cd53003fe1b385761c5681389bdc8c7a7d4e6`, recursively discovers `src/**/*.test.tsx` and executes `node --import tsx --import ./test/setup-dom.mjs --test` within package cwd. DOM preload is JSDOM; `TSX_TSCONFIG_PATH` must point to `artifacts/tournament-manager/test/tsconfig.json`. The targeted commands below run the native app test stack directly rather than the earlier CI workflow, without waiving eventual full CI.

**REQUIRED PowerShell preflight on a different disposable *clean full checkout for each PR*** (select exact branch and SHA from live GitHub; PRs can advance). Run at monorepo root, Node22/pnpm10:

~~~powershell
# Example only: PR54 HEAD snapshot (replace with currently verified live HEAD).
$branch = 'fix/web-005/t100-rr-readback-r13'
$sha = 'bfa9d075b431185aa8bbf87bf021d64dde8ae22f'
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0) { throw 'STOP: dirty or unreadable checkout' }
git fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'STOP: fetch failed' }
git -c advice.detachedHead=false switch --detach $sha
if ($LASTEXITCODE -ne 0 -or (git rev-parse HEAD).Trim() -ne $sha) { throw 'STOP: unexpected SHA' }
if ((node --version) -notmatch '^v22\.') { throw 'STOP: Node22 not installed' }
if ((pnpm --version) -notmatch '^10\.') { throw 'STOP: pnpm10 not installed' }
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'STOP: locked install failed' }
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path
~~~

**Focused tests — use ONLY the matching exact per-PR checkout** (the package filter changes cwd; paths use `src/` relative to package):

~~~powershell
# PR54 @ bfa9d075b431185aa8bbf87bf021d64dde8ae22f — two-boundary RR401/403
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx src/components/stage-progress-view.rr-denied.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR54 targeted RTL FAIL: $exit" }

# PR53 @ d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34 — legacy raw untagged match picks rebind
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR53 targeted RTL FAIL: $exit" }
~~~

Both PR53 files existed at inspected HEAD; PR54 `stage-progress-view.rr-denied.test.tsx` is new R19 and has denied cached participant test cases, but **author-written cases ≠ GREEN**. On a real run, collect exact `git rev-parse HEAD`, OS, command, exit code, TAP #tests/#pass/#fail/#skip/#todo, sanitized log URL/checksum, and fresh A60 exact-SHA source verdict. No successful target test is asserted by A40. PR54 parent tests additionally require separate manual legitimate Overview/DE viewing with a denied historical RR and privacy-preserving selected-stage UI; no browser run was performed.

After targeted tests, per same SHA and trusted approved environment:
~~~powershell
pnpm --filter @workspace/tournament-manager run typecheck
if ($LASTEXITCODE -ne 0) { throw 'frontend typecheck FAIL' }
pnpm --filter @workspace/tournament-manager run test
if ($LASTEXITCODE -ne 0) { throw 'frontend full test suite FAIL' }
pnpm --filter @workspace/tournament-manager run build
if ($LASTEXITCODE -ne 0) { throw 'frontend build FAIL' }
~~~
The frontend build uses `scripts/stage-animated-effects.mjs` under pnpm before Vite; using Vite-only build bypasses a required application asset stage.

## 4. Backend API PG16 commands for A50 — **EXECUTION STOP until owner+A20**

API package `artifacts/api-server/package.json` names `@workspace/api-server`, with node/tsx test conventions. These are **real repository-derived test paths**, but R19 A40 did **not** execute them. Fresh independent per-PR checkout, Node22/pnpm10 installed with `pnpm install --frozen-lockfile`.

**Physical safety prerequisite is stronger than a correctly shaped URL:** owner approves one dedicated disposable isolated PostgreSQL 16 instance, test DB physical address/identity, no shared/prod network/database connection, explicit authorization of schema reset/limited DROP scope. Secure `TEST_DATABASE_URL` (NEVER log), `NODE_ENV=test`, `TEST_DATABASE_SCHEMA=tm_test_r19_a50`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`. **No fallback from `TEST_DATABASE_URL` to `DATABASE_URL`.** If missing, **INFRA_BLOCKED / NOT_EXECUTED**, no artificial PASS.

~~~powershell
# ONLY on physically verified test PG16 + owner written reset GO.
$env:NODE_ENV = 'test'
$env:TEST_DATABASE_SCHEMA = 'tm_test_r19_a50'
$env:TEST_DATABASE_RESET = 'DROP_TM_TEST_SCHEMA'
# The isolated TEST_DATABASE_URL must already be securely injected.
# PR41 @ f03cf3d09988a04ba9c2856e205d21f994ff67f1 (Backup B1)
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR41 PG integration FAIL: $exit" }

# SEPARATE clean PR42 checkout @ 021bed269f9ea8ac8ce53caeea44263c098aa2dd
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts
$exit = $LASTEXITCODE
if ($exit -ne 0) { throw "PR42 roster Undo PG integration FAIL: $exit" }
~~~
These commands are alternatives on separate PR checkouts, **not** a combined command in one tree. PR41 requires legal modern/legacy-null vs invalid QP/QPE/OP position/source receipt, 400/zero clone and late rollback parity. PR42 requires stale queued X/newer committed Y -> 409 `UNDO_ACTION_CHANGED`/zero writes/Y preserved and lawful latest Undo 200; source acceptance conditional doesn't replace real PG16 race proof.

## 5. Pack17 fail-closed contract and T017-QA-01

PR40 HEAD `9a8287271299a59fc9291b8d253299a8d109a35d`; exactly 3 changed files:

| File | Git blob |
|---|---|
| `qa/pack17/gate-contract.mjs` | `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` |
| `qa/pack17/gate-contract.test.mjs` | `f59a65509009fbdf74a38239693238704b1af583` |
| `qa/pack17/run-gates.mjs` | `8779ab2c1588cc62a2f3c5f63c57be9b55e86043` |

Prior scoped pure Node helper/contract suite **24/24 PASS, exit0 in earlier waves**, unchanged SHA; **NOT re-executed R19**, and not an app test. `--static` executes only source+helper and prints `RELEASE STOP`; `--integration` adds atomic PG and also stops release. `--full` requires **nine ordered gates**: (1) source TAP1; (2) helper TAP1; (3) PG16 atomic TAP1; (4) workspace typecheck; (5) API unit **three separate TAP subprocess summaries**; (6) API integration TAP1; (7) frontend TAP1; (8) API build; (9) frontend build + Animated Effects. Actual full `node qa/pack17/run-gates.mjs --full` requires approved physical test PG16 and is **NOT_EXECUTED** by A40. Earlier native Pack19–26 steps, API codegen, browser/live safety, future authorized composite SHA and full regression are separately required.

**Open issue T017-QA-01 / pure parser evidence-integrity risk:** `assertCompleteTap` counts `TAP version 13` headers and six `# tests/pass/fail/cancelled/skipped/todo` counters, **without** reconciling `ok`/`not ok` child test records and `1..N` TAP plan against summaries. Historical source-level negative probes proved accepted forged counter-only stdout and `not ok` transcript paired with fabricated passing counters. Real `run-gates.mjs` separately fails on child exit nonzero; **no real Node subprocess false green has been demonstrated**. The A60 R18 signed report did not issue a distinct, documented T017-QA-01 severity/signoff; ask A60 to explicitly classify this finding at PR40 exact HEAD before any code GO.

**Minimal conditional next-code request (NOT authorized in R19):** only if A60 independently confirms severity and A00 provides separate GO, amend existing PR40 `gate-contract.mjs` and focused `gate-contract.test.mjs` to validate authentic native Node TAP plans, record `ok/not ok` nesting, per-child counts and fail-closed contradictory summary; add both forged fixtures and native positive nested TAP cases, especially 3 API-unit summaries; do NOT weaken old gates or rewrite runner. Requires new HEAD and independent A60 review. **A40 created no patch or new PR.**

## 6. Release/handoff classification and owner action

**Native R19 A40 commands:** NONE EXECUTED, exit/TAP **NOT_AVAILABLE**, for lack of an approved complete per-SHA checkout and physically safe PG16. Old GitHub Actions failures are separately cited, not relabeled as new actual app runs. R18 A50 reports 0 executed app tests. `NOT_EXECUTED` ≠ FAIL ≠ PASS.

**A50 single unblock action:** A00/owner connects an approved trusted test PC/VM with actual shell/filesystem, fully cloned per-PR workspaces, Node22/pnpm10/frozen dependencies and permission to execute exact-SHA targeted frontend tests. A20/owner independently approves dedicated disposable isolated PG16 and reset scope for API. A50 sends real sanitized SHA+command+environment+exit/TAP log links to A60.

**Independent A60:** check NEW R19 PR53/54 HEAD source/privacy semantics; PR53 legacy old untagged picks cannot rebind stale private results to new authorization; PR54 lawful Overview/DE despite historical RR403 and manually denied selected-stage stale participants hidden. Review T017-QA-01 severity separately. **Do not self-approve author code**.

**A00/HQ handoff:** exact 21-packet manifest, original 38 WEB004 case mapping (historical 0 PASS/3 external-CI FAIL/33 BLOCKED/2 NOT_RUN), owner-signed policy alternatives and disposition, independent A60 R19 `HANDOFF_READY` or `NOT_READY`, real A50 per-PR runtime evidence or a fresh explicit owner/HQ `HANDOFF_WITH_RUNTIME_TEST_DEBT` waiver only *after* source and policy closure. No auto SWARM-006 dispatch. Even with signed test-debt waiver, full SWARM-006 composite PG16/React/CI/browser remains **RELEASE STOP** before staging/live.

**Final:** `A40_R19_SOURCE_SCOPE_COMPLETE / PACK19_SOURCE_CONFIRMED / PACK17_SOURCE_SCOPED / T017_QA01_A60_DISPOSITION_PENDING / PR53_PR54_R19_NEW_SHA_QA_PENDING / RUNTIME_NOT_EXECUTED_BY_A40 / WEB005_HANDOFF_NOT_READY_ON_LAST_SIGNED_A60_R18 / RELEASE_NO_GO / SWARM006_HOLD`.
