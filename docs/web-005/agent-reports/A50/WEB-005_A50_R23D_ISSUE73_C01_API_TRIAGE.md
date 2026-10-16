# WEB-005 — R23D / A50 — Issue #73: C01 API integration first-failure triage

**Agent:** A50 — Isolated Test Execution & QA Infrastructure · **Date:** 2026-10-16 · **Priority:** P0  
**Issue:** [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) · **Dispatcher:** [R23D](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Verdict:** **`C01_API_ROOT_CAUSE_UNCONFIRMED / FIRST_FAILURE_NOT_RECOVERABLE_FROM_AVAILABLE_LOG / NATIVE_REPRO_NOT_EXECUTED / A20_TEST_PG16_GO_REQUIRED / C02_HOLD`**. No defect fix PR is justified by available causal evidence.

## 1. Verified exact candidate, isolation and workflow provenance

- [Composite draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60), **OPEN/DRAFT/UNMERGED**, exact HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; first C01 composite contains six source PRs and 14 transferred paths according to A40 manifest.
- **Automatically triggered**, not rerun by A50: [GitHub Actions run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`, final `FAILURE`. Decoded real job log: **6,437 lines, 423,864 characters**. Zero run artifacts returned.
- Independently reproduced the following evidence **by inspecting the exact source and scanning the full decoded job log in a read-only diagnostic script** (not executing API feature tests):
  - Pack19–26 workflow steps `success`; Pack17 `PASS source contracts` at line 2629, `PASS gate fail-closed contracts` at 2787, `PASS PostgreSQL atomic correction` at 2899 (**8/8 TAP** in GitHub's own ephemeral test PG16), `PASS workspace typecheck` at 2921.
  - `>>> GATE API unit tests` line **2923**, `Running 59 unit test files.` line **2928**.
  - The available log **does NOT contain** `PASS API unit tests` or `>>> GATE API integration tests` and **does NOT contain `not ok`**, completed API integration TAP, first failing test filename/assertion/stack, or a test evidence artifact.
  - Log line **5177**, exact runner message: `BLOCKED: API integration tests execution failed exit 1; signal none`; GitHub wrapper line **5179**: `Process completed with exit code 1.` Earlier positive unit-subtest output ends at line 5176; timestamps jump from about **12:40:07 UTC** to **12:42:48 UTC**.
  - **Classification:** the **wrapper labels API integration exit 1**, but the accessible log has a discontinuity and cannot identify the first failing test. It is **not** evidence that any particular negative PostgreSQL constraint log, Swiss or Backup validator failed. The missing unit/integration summaries cannot be silently promoted to PASS. The CI run itself is unambiguously **FAILURE**, and subsequent frontend/API/frontend-build stages were NOT_EXECUTED.

## 2. Native runner and data safety: source-level facts

At exact PR60 SHA:
- `qa/pack17/run-gates.mjs`, Git blob **`8779ab2c1588cc62a2f3c5f63c57be9b55e86043`**, defines ordered Pack17 gates, invokes `spawnSync` with UTF-8 and a 64 MiB maxBuffer and aborts on nonzero exit/signal/incomplete TAP. Its API unit gate is `pnpm --filter @workspace/api-server run test:unit` and API integration gate `pnpm --filter @workspace/api-server run test:integration`.
- `artifacts/api-server/test/run-tests.ts`, Git blob **`da4188446aba4696f97eb7831fee0cc5824d212f`**, discovers all *.integration.test.ts and runs `node --import tsx --test --test-concurrency=1 ...` with inherited stdio. `package.json` blob **`bf931f87a7b0d5532b949f44c7e091878fe6db52`** confirms the command.
- Local A50 host currently provides Node 22, Git, but **does not have pnpm10, a full clean checked-out C01 source tree, frozen workspace dependencies or a documented disposable PG16 host with reset consent**. Executing `test:integration` would invoke database fixture/schema reset; **STOP**. A50 performed only connector/source/log inspections. Native command/exit/TAP for a new A50 API integration run: **`NOT_EXECUTED / null / null`**.
- **No A50 SQL, DDL, schema reset, CI rerun, merge, Replit live query, game changes, deploy, or release mutation.**

## 3. Independent QA corroboration and limits

[A60 R23D independent #73 triage](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23D_ISSUE73_C01_FIRST_FAILURE_TRIAGE.md), exact report blob **`534baf62abaf251b07bd3c359366979bb7aafd92`**, independently reached `C01_API_ROOT_CAUSE_NOT_CONFIRMED` from the same immutable run. This A50 record is an execution/environment and exact-log evidence report; it does **not** claim to supersede independent A60 QA or certify a proposed code fix.

## 4. Executable first-failure reproduction contract (after separate written A00 + A20 GO only)

**P0 unblocker:** Supply A50 a **trusted full clean checkout pinned to `fa3261b2c9510e110ac9eba21726812d3401a525`**, Node22, pnpm10, `pnpm install --frozen-lockfile`, sanitized log storage, and A00 test authorization. Before **any** API integration command, A20 + owner must attest physically separate disposable **PostgreSQL 16** host/volume/database/test-only role, dedicated `TEST_DATABASE_URL`, allowed `tm_test_*` schema and **explicit bounded DROP/RESET GO**. No `DATABASE_URL` fallback.

On that approved disposable test host, recommended first-failure capture (all **NOT_EXECUTED in this A50 run**):

```powershell
git rev-parse HEAD   # exact composite SHA required
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run test:integration *> C:\WEB005\evidence\C01_api_integration_raw.log
$integrationExit = $LASTEXITCODE
Write-Output "API_INTEGRATION_EXIT=$integrationExit"
```

The operator must record exact full `test:integration` process exit, time, entire TAP summary, **the FIRST `not ok` plus nearest stack context**, repository+dependency SHA, sanitized (redacted) logs, schema identity and before/after fixture fingerprints. Preserve raw logs in restricted local evidence storage; verify sanitization **before sharing**. STOP immediately on non-test DB target/secret/PG permission anomaly. If full suite fails, isolate the failing integration file in a **fresh disposable schema** and compare against an **unchanged release baseline under the same isolated infrastructure**; do not blanket skip, increase timeouts, cherry-pick patches, modify game code or launch paid CI.

Only after an evidenced first failing assertion can an owner authorize a narrow test-first correction on a new DRAFT PR with exact SHA and renewed A60 independent regression QA. Root-cause classes (fixture, environment, API behavior, harness) remain **UNKNOWN**, not fixed.

**Handoff to A00/A40:** Issue #75 C02 integration depends on this first-failure triage and source QA; currently **`C02_START_STOP`** absent a causal classification. **RELEASE_NO_GO / SWARM006_HOLD**.
