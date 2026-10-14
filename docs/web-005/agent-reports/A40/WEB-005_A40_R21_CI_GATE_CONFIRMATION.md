# WEB-005 — A40 R21 CI GATE CONFIRMATION

**Task/owner:** WEB-005-T010-T017-A40-R21 — A40 CI Pack19/Pack17.  
**Mode:** SOURCE-ONLY, frozen gate review; **R21 decision:** `NO_NEW_CI_EVIDENCE / WAIT_OWNER / RELEASE_NO_GO / SWARM006_HOLD`.  
**Control source:** [WEB-005_WAVE_R21_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R21_AGENT_PROMPTS.md), blob `f90aa01ada90a0a311eb9a8d97d04a5c65c89e45`.  
**Owner decision input:** [WEB-005_R21_OWNER_DECISION_PACKET.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md), blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`, **DRAFT FOR OWNER SIGNOFF; ZERO signed decisions**, not an implement/test/dispatch authorization.  
**Baseline:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Evidence date:** 2026-10-14 Europe/Warsaw.

## 1. Gate state frozen; no new source patch

| Package | Exact current PR HEAD from GitHub readback | Evidence class |
|---|---|---|
| P01 Pack19 [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | A60 scoped `SOURCE_ACCEPTED`, matcher fixed; do not duplicate |
| P02 Pack20–26 [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136fc3491c9ef18663d9b01396179349` | A60 scoped `SOURCE_ACCEPTED`, separate unmerged contract fixes |
| P07 Pack17 [PR40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | A60 scoped `SOURCE_ACCEPTED`; `--full` never verified |
| P08 PG backup [PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | A60 `SOURCE_ACCEPTED_CONDITIONAL`; PG16 test pending |
| P09 PG undo [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | A60 `SOURCE_ACCEPTED_CONDITIONAL`; PG16 race test pending |
| P20 cache [PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | **A60 R20 `SOURCE_ACCEPTED_SCOPED`**; ownerless raw retention `POLICY_OPEN` |
| P21 RR/DE [PR54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | **A60 R20 `SOURCE_ACCEPTED_CONDITIONAL`**; PR47 DE child integration remains |

All readback PRs OPEN/DRAFT/UNMERGED on the same release base. PR47 `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` remains a separate DE/Presentation branch and shares `stage-progress-view.tsx` with PR54. A40 has NOT merged, cherry-picked, rebased or created any composite.

**Independent signed exact-SHA authority:** [A60 R20 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), Git blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`; [A60 R20 machine matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_PACKAGE_MATRIX.json), blob `cc94d51f115ceace001d7354cd20eacbbd623a34`. Overall independent verdict: `HANDOFF_NOT_READY`. A40 does not self-certify.

## 2. Actual CI evidence unchanged — no new qualifying run

- [PR35 Actions 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 source **8/8 PASS**, then Pack20 source **6/7 FAIL**, rest skipped; **overall workflow FAILURE**.
- [PR53 Actions 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899): safety **23/23 PASS**, Pack19 domain **26/26 PASS**, Pack19 source **7/8 FAIL**; later Pack20–26 and Pack17 skipped.
- [PR54 Actions 38631912235](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235): same **23/23, 26/26, 7/8 FAIL**, later Pack20–26 and Pack17 skipped.
- No `pull_request` Actions run for the exact PR36/PR40 HEAD was returned in the inspected first-page commit-run results; `NO_RUN_OBSERVED` is neither PASS nor FAIL.

**Known baseline mismatch:** release `qa/pack19/source-contract.test.mjs` blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5` asserts `readOnly:true`, but unchanged backend readiness route blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757` actually specifies `{isolationLevel:"repeatable read",accessMode:"read only"}`. Already fixed matcher in PR35 blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e`, preserving read-only behavior. A pre-feature Pack19 failure does **not** prove private cache / RR / DE runtime FAIL or PASS. No new P01/P02/P07 code or billable CI rerun authorized.

**Pack17 `--full` remains NOT_EXECUTED:** nine sequential gates — source TAP; helper TAP; isolated PG16 atomic TAP; workspace typecheck; API unit (**3** TAP subprocess summaries); API integration TAP; frontend TAP; API build; frontend build (Animated Effects). `--static` or `--integration` exit 0 still means `RELEASE STOP`. Native workflow Pack19–26, api-spec codegen, real browser checks and future composite QA are separate gates.

## 3. A50 runnable commands: frozen, only AFTER actual owner-provided executor

**Environment gate first:** owner grants actual trusted PC/VM shell and full *clean separate per-SHA* Git checkouts, Node22, pnpm10, `pnpm install --frozen-lockfile`, with each `git rev-parse HEAD` exactly matching the specified 40-character SHA. Native frontend runner is `artifacts/tournament-manager/test/run-tests.mjs`, Git blob `590cd53003fe1b385761c5681389bdc8c7a7d4e6`, with JSDOM preloader `./test/setup-dom.mjs`; run from frontend package CWD through `pnpm --filter`. **Commands below NOT_EXECUTED by A40 R21; no exit/TAP receipt.**

~~~powershell
# At clean monorepo root after exact-HEAD checkout and frozen install:
$env:TSX_TSCONFIG_PATH = (Resolve-Path './artifacts/tournament-manager/test/tsconfig.json').Path

# ONLY on PR54 @ bfa9d075b431185aa8bbf87bf021d64dde8ae22f:
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx src/components/stage-progress-view.rr-denied.test.tsx
if ($LASTEXITCODE -ne 0) { throw "PR54 focused RTL nonzero exit $LASTEXITCODE" }

# ONLY on a DIFFERENT PR53 checkout @ d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34:
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
if ($LASTEXITCODE -ne 0) { throw "PR53 focused RTL nonzero exit $LASTEXITCODE" }
~~~

**After focused test** run frontend typecheck, full frontend test and full frontend `build` (including Animated Effects) *on the same SHA*, and separate browser/UX privacy checks. Capture actual command/checkout/SHA, Node/pnpm, sanitized env, exit, TAP tests/pass/fail/skipped/todo and log permalink. Source-authored tests and an upstream CI red are not the same as feature execution.

**PostgreSQL destructive safety STOP** until A20 + owner separately approve actual *physically isolated disposable PostgreSQL16* test DB, test-only secure `TEST_DATABASE_URL` (never echo), `NODE_ENV=test`, `TEST_DATABASE_SCHEMA=tm_test_*`, written `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` reset-scope consent. No `DATABASE_URL` fallback, production/shared access or unapproved SQL. Then, only on separate exact-SHA checkouts:

~~~powershell
# PR41 @ f03cf3d09988a04ba9c2856e205d21f994ff67f1
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts

# PR42 @ 021bed269f9ea8ac8ce53caeea44263c098aa2dd, other checkout
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts
~~~

**A50 R20 receipt:** [WEB-005_A50_R20_RECEIPT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R20_RECEIPT.md) blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`; real Node/Git preflight but no complete app checkout/pnpm/approved PG; **NATIVE_APP_TESTS=0 / PHYSICAL_EXECUTOR_ENV_BLOCKED**. A40 R21 adds no new tested command or runtime PASS.

## 4. T017-QA-01 and owner gate

`assertCompleteTap` in frozen PR40 `qa/pack17/gate-contract.mjs` Git blob `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` checks TAP headers and counters but does **not** reconcile actual `1..N` plan or `ok/not ok` case records. Earlier A40 synthetic probes found forged counter-only PASS and contradictory `not ok` paired with fabricated PASS counters accepted by the **pure helper**. Real child nonzero exit is separately fail-closed, and no real subprocess false-green was demonstrated. **A60 R20 QA does not explicitly issue a separate independent T017-QA-01 severity/release disposition.** Thus `SOURCE_RISK_KNOWN_UNCHANGED / A60_SPECIFIC_FINDING_NOT_VERIFIED / NO_PATCH_GO`. If A60 later confirms and A00 issues an *individual* code GO, fix only PR40 helper and focused tests with genuine native nested-TAP positive and adversarial negative fixtures; no such GO now.

**[Owner packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md):** UNSIGNED DRAFT. Basket CAS D1–D6, sporting S1–S6, Backup B1–B6, MP2B, Steam/session, ownerless raw cache A/B, original 38 WEB004 provenance O1/O2, real executor EXEC-A/B, physical reset, runtime-debt exception and FINAL_HANDOFF_GO remain `WAIT_OWNER / POLICY_OPEN`. Nine original historical identifiers are `SOURCE_ID_NOT_AVAILABLE`, 29 reconstructed from secondary sources and no signed 38-case dispositions. This is **not** within A40's policy authority.

**Next unblocker:** real owner/HQ decisions with accountable signer and permalink; A00 records decisions and obtains independent A60 gate. Separately A50 gets approved executable environment; A20/owner verifies PG isolation. No more speculative source rework or automatic final handoff. `WEB005_IN_PROGRESS / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
