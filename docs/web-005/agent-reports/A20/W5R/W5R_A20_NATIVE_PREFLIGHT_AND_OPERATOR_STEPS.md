# WEB-005 / WAVE 5R — A20 NATIVE PREFLIGHT & OPERATOR STEPS

**Task ID:** W5R-A20-LOCAL-EXECUTOR-READINESS  
**Role:** A20 — Infrastructure / Local Runtime  
**Status:** **PARTIAL** — **source preflight check performed, native exact-commit test BLOCKED due to missing trusted checkout**.  
**Integration verdict:** `READY_FOR_QA` for **A20 source-only preflight**, `BLOCKED` for **native full-checkout execution**, `NO_GO` for PostgreSQL-integrating or running full application.  
**Mode:** isolated tooling / read-only to repository source outside the A20-owned report; no Docker, SQL, migrations, install, server startup, Replit live, merge, deploy.  
**Execution date:** 2026-10-18.

## 1. Verified upstream exact identity

- **A20 source PR:** [Draft #135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135), OPEN/DRAFT. Inspected **pre-report HEAD** `cfa69565ccf6bedb4f8e3e3b4be948132fb727ba`, **BASE SHA** `1db3734b8988940acc6be8b992420a58fc39624a` (`release/tournament-ops-20261013-01`). The current report is added on the existing isolated A20 branch, creating a new documentation-only HEAD; the inspected **code** blob IDs below remain pinned.
- **Exact script Git blob SHA-1:** `5a61ef4c88d57d673c6558b242aed87c479a40d0` — `scripts/qa/web005-local-readiness.mjs`.
- **Exact synthetic tests Git blob SHA-1:** `177402bb4d9afaa08840839763764f8e502b0804` — `scripts/qa/web005-local-readiness.test.mjs`.
- **Before-report changed paths #135:** `docs/web-005/agent-reports/A20/WAVE4/WEB005_LOCAL_TEST_READINESS.md`, `docs/web-005/agent-reports/A20/WAVE5/WAVE5_HANDOFF.md`, and two `scripts/qa/web005-local-readiness*.mjs`; report path `docs/web-005/agent-reports/A20/W5R/W5R_A20_NATIVE_PREFLIGHT_AND_OPERATOR_STEPS.md` is newly added. **NO APPLICATION CODE CHANGES** in W5R.
- **No file collision:** Draft [C03 #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) edits only two backup-adapter paths; [A50 #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) edits A50/pack17 paths; [A140 #116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) edits A140/a140-source-preservation paths. Their exact changed-file lists were read; none intersects this A20 report.

## 2. Actually executed vs NOT_RUN — do not upgrade simulation to native

| Action / actual environment | Result | Evidence classification |
|---|---|---|
| `node --version` — isolated temporary model tool container | **exit 0**, `v22.16.0` | Real native command; **not user's Windows workstation** |
| `git --version` — same container | **exit 0**, `git version 2.47.3` | Real native command |
| `command -v pnpm` / `pnpm --version` — same container | **pnpm unavailable**; no package installation attempted | Confirmed environment blocker |
| `env -i PATH=... HOME=/tmp GIT_TERMINAL_PROMPT=0 git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git refs/heads/feat/web005/a20-wave4-local-readiness-20261018` | **exit 128**, `Could not resolve host: github.com` | Real native command using stripped environment, no credential leaks |
| `node --test scripts/qa/web005-local-readiness.test.mjs` at exact #135 HEAD | **NOT_RUN**, full source checkout/file not present in isolated container | **Native test blocker**; must not infer PASS |
| Exact GitHub source+13 test functions invoked in isolated V8 with mocked filesystem and digest stub | **13/13 emulated PASS**, 0 FAIL, two added inherited-env negatives included; source blobs matched names listed above | **Simulated** — no Node test runner, no native TAP/exit, no real filesystem |
| GitHub Actions check for pinned #135 head `cfa69565...` | **No workflow runs and no combined status checks returned** | Source-side absence of CI evidence; NOT PASS |
| pnpm workspace, frontend, API, build, C01/C03 integration, Docker/PostgreSQL | **NOT_RUN** | No installed pnpm/full checkout or scoped infra permission |

**Diagnosis:** exact PR135 test source **has not been proven natively runnable** from this agent's isolated container. The absence of DNS and full checkout is a complete, reproducible reason for `NATIVE_NODE_TEST_BLOCKED`, rather than a defect in its test assertions. There is **no source-confirmed broken #135 code requiring another PR**. Do **not** claim `NATIVE_TEST_PASS`.

## 3. Short operator Windows recipe — source pin, clean environment, no DB connections

Operator prerequisites: one **brand-new, non-synced, disposable** worktree outside Replit live, Windows PGDATA, production workspaces or any A40/A140 active branch. No PostgreSQL credentials. No automatic dependency installation, Docker or server startup. Review any shell policy before use.

```powershell
# Step 1 — checkout in a fresh standalone path (choose a unique directory yourself)
$target = Join-Path $env:TEMP 'web005-a20-w5r-isolated'
git clone --no-checkout https://github.com/C8LyNn/aplikacja-turnieje.git $target
git -C $target checkout --detach cfa69565ccf6bedb4f8e3e3b4be948132fb727ba
git -C $target rev-parse HEAD   # must equal pinned source commit above
Set-Location $target

# Step 2 — runtime/toolchain receipt (no install)
node --version                 # Node 22.x expected
pnpm --version                 # if missing: record NOT_AVAILABLE; do not auto-install
git status --short
Get-FileHash pnpm-lock.yaml -Algorithm SHA256
git hash-object scripts/qa/web005-local-readiness.mjs
git hash-object scripts/qa/web005-local-readiness.test.mjs
# Both git hash-object values must match the two recorded blob IDs.

# Step 3 — report only blocked environment variable NAMES, NEVER values
$unsafe = Get-ChildItem Env: | Where-Object {
  $_.Name -match '^(PG|SCHEMA_COMPARE_|REPLIT_|DOTENV_CONFIG_)' -or
  $_.Name -in @('DATABASE_URL','TEST_DATABASE_URL','NEON_DATABASE_URL',
      'DIRECT_URL','DEVELOPMENT_DATABASE_URL','PRODUCTION_DATABASE_URL',
      'DEPLOYMENT_TASK','API_PROXY_TARGET','NODE_OPTIONS','NODE_PATH','REPL_ID')
}
$unsafe | ForEach-Object { $_.Name }
if ($unsafe) { throw 'STOP: inherited DB/production/deployment/proxy variables present' }

# Step 4 — exact native test first. No pnpm or PG16 required.
node --test scripts/qa/web005-local-readiness.test.mjs
$nativeExit = $LASTEXITCODE
if ($nativeExit -ne 0) { throw "STOP: native Node tests exit $nativeExit" }

# Step 5 — inspect actual project source without DB/network writes
node scripts/qa/web005-local-readiness.mjs --json
$preflightExit = $LASTEXITCODE
if ($preflightExit -ne 0) { throw "STOP: source preflight exit $preflightExit" }
```

Record: date/operator, HEAD from `git rev-parse`, exact Node/pnpm versions, `Get-FileHash` lock SHA256, Git blob IDs, native full TAP with true exit, preflight JSON status, unexpected local `.env` **path names only**. **No real secrets in the report.** The `node --test` tests use isolated synthetic files under OS temp and delete only their own files.

**If clone DNS/auth fails:** `BLOCKED`; do not substitute a random cached tree, a live Replit directory or old test file. On a **separately verified exact source checkout**, Git objects can be checked offline with the recorded SHA/blob IDs. An already-existing exact checkout is admissible only if ownership/clean status/hash are independently confirmed.

**DB-free expansion only after this pass, with separate operator acceptance:** if pnpm dependencies already exist and imports are reviewed, run *selected* `test:deadlock-game-catalog`, `test:marvel`, `test:schema-catalog-comparison` or typecheck. Avoid root `pnpm test`: API `test` also runs integration. Any `pnpm install` modifies disk, can run lifecycle hooks and requires separately authorized disposable environment/cache.

**Loopback-only optional app preview:** Frontend Vite source has default `host:'0.0.0.0'` and `allowedHosts:true`, so do **not** start its default `pnpm dev` blindly. Obtain separate approval, use explicit Vite `--host 127.0.0.1`, and observe effective listener. This is NOT full frontend parity because `dev` normally stages animated-effects. Backend `app.listen(port, callback)` has no host parameter: localhost-only API binding needs A50's reviewed opt-in patch or physically isolated network. No such server was started. Parent `DEPLOYMENT_TASK` must never be inherited.

## 4. Exact responsibilities / blockers / integration handoff

| Issue | Current evidence | Next owner |
|---|---|---|
| Native test of exact #135 | **BLOCKED**: source checkout absent, GitHub DNS unavailable; Node 22 available; no pnpm. | **A60 / named Windows operator** to execute steps 1–5 |
| Native lock/install and frontend DB-free smoke | **NOT_RUN**; full checkout and pnpm dependency cache absent; Vite default broad-bind | **A60/A120/operator** after isolated setup and network binding review |
| Strict loopback API | Source uses `app.listen(port,...)` with no explicit host | **A50** (own API code scope) |
| C03 full test | [C03 #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) source separate; centralized CI includes full API integration exit 1 | **A60/A50/A40**, not A20's preflight |
| PG16 destructive fixtures | [C01 #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) and [B candidate #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) remain DRAFT; `DROP DATABASE WITH FORCE`, `CASCADE`, Drizzle force not authorized | **A00 + named operator + security/QA** only after separate scoped approval |
| SECURITY-DEFERRED | P0/P1 remain **OPEN**; DB-free test process is not a PG16 no-touch certificate | **A00/A30** as backlog |

**W5R HANDOFF — status:** `PARTIAL / SOURCE_ONLY_READY_FOR_QA / NATIVE_EXECUTOR_BLOCKED / NO_CODE_CHANGES / PG16_HOLD / RELEASE_NO_GO`.  
**Next action:** receive an authentic Windows exact-commit native TAP + JSON receipt for PR #135, not another paper R23H audit. No speculative infrastructure GO.
