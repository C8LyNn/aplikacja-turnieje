# WEB-005 — W5R / A20 NATIVE EXECUTOR UNBLOCK

**Task ID:** `W5R-A20-NATIVE-EXECUTOR-UNBLOCK`  
**Role:** A20 — Infrastructure / Local Runtime  
**Date:** 2026-10-18 (Europe/Warsaw)  
**Outcome:** **READY — exact native Node22 preflight unit tests** / **BLOCKED — full checkout project preflight and pnpm application suites**. No claim of full app or E2E PASS.  
**Mode:** non-destructive A20 scope; no SQL, Docker, migrations, dependency installs, API/Vite service startup, Replit live modifications, merge or deployment.

## A. Source and custody: exact SHA

- Repo: [C8LyNn/aplikacja-turnieje](https://github.com/C8LyNn/aplikacja-turnieje)
- [Draft PR #135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135), OPEN. **Base commit:** `1db3734b8988940acc6be8b992420a58fc39624a` (`release/tournament-ops-20261013-01`).
- **PR HEAD/source commit tested:** `30de20c791b099d748068f5257fa5f533ab96652`. Documentation-only TAP/report commits added later to this same A20 branch; no changes to either code blob.
- **Exact source/test bytes fetched via authenticated GitHub connector** at that commit and reconstructed on disk. **Local `git hash-object` matches remote exact Git blob SHA-1:**
  - `scripts/qa/web005-local-readiness.mjs` → `5a61ef4c88d57d673c6558b242aed87c479a40d0` (7,229 bytes, UTF-8).
  - `scripts/qa/web005-local-readiness.test.mjs` → `177402bb4d9afaa08840839763764f8e502b0804` (5,609 bytes, UTF-8).
- Local additionally recorded SHA256: script `47411d22488a1ad6fdb55b9ca284c9e5166c41eae6d659cfaa2225ca60d8d3d6`; test `9c3f9e3f5418c46df05320e9b8104edc0f19f4919a27ed590b252f1eb8463f02`.
- **No full monorepo clone.** Only two GitHub-integrity-proven PR files were reconstructed in a fresh, isolated folder. This is sufficient for the dependency-free native `node --test` of these source files, **not** sufficient for the project-root real preflight.

## B. Native execution — authentic Node.js TAP

**Executor:** isolated Linux tooling container (not user's Windows workstation), `node v22.16.0`, `git 2.47.3`, `pnpm NOT_INSTALLED`. The container's outbound GitHub hostname DNS was unavailable; GitHub connector source fetch used instead.

**Command actually run:**

```bash
cd /mnt/data/web005-a20-native-executor
env -i PATH="$PATH" HOME=/tmp LANG=C.UTF-8 \
  node --test --test-reporter=tap scripts/qa/web005-local-readiness.test.mjs \
  > W5R_PR135_NATIVE_NODE22.tap 2>&1
# captured actual exit code via shell $? immediately: 0
```

**Actual native test receipt:**

```text
TAP version 13
1..13
# tests 13
# suites 0
# pass 13
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 88.931606
exit_code=0
```

**Complete byte-exact TAP** published as [W5R_A20_PR135_NODE22_NATIVE.tap](./W5R_A20_PR135_NODE22_NATIVE.tap). The published TAP Git blob `6e16c18237b3d188b2d75d34c0c240854fd30ddb` exactly matched the local TAP's `git hash-object`, with **SHA256** `32c9dde3711dc1ef0aba9c889a4f720208095baec86a8666877e8bc961751fae` (2,198 bytes).

13 cases include: positive source fixture; missing or drifted lock; redacted production DSN; `PG*`/Node loader environment; local `.env` filename rejection; invalid JSON/package/test scripts; Node major warning; Vite loopback source; explicit inherited `DEPLOYMENT_TASK` and `API_PROXY_TARGET` denial. **This is a real Node22/TAP PASS, not V8 simulation.**

**Additional actual CLI test (partial, not a full checkout):**

```bash
env -i PATH="$PATH" HOME=/tmp LANG=C.UTF-8 \
  node scripts/qa/web005-local-readiness.mjs --json
# actual exit 2; report status BLOCKED
```

Expected seven absent project files: root and three package manifests, pnpm-workspace.yaml, pnpm-lock.yaml, Vite config. This is **a legitimate fail-closed CLI result on a partial source folder**, not evidence of app failure or a bug in the script. No native full-checkout source preflight has run.

**GitHub CI:** no verified PR #135 head native CI result is substituted for this locally captured TAP; A20's native command is the actual evidence. Do not extrapolate to C01/C03 API integration.

## C. Concrete PowerShell operator recipe — fresh Windows checkout

**Purpose:** obtain a full private, non-synced checkout for actual source preflight on user's PC. Requires **Node 22**; `pnpm` is *not* required for the first two native Node commands, but it is required for package suites. Run in a newly opened shell with no production or Replit secrets. Do not use the live folder.

```powershell
$ErrorActionPreference = 'Stop'
$sourceCommit = '30de20c791b099d748068f5257fa5f533ab96652'  # tested script blobs
$root = Join-Path $env:TEMP ("web005-a20-" + [guid]::NewGuid().ToString('N'))
git clone --no-checkout https://github.com/C8LyNn/aplikacja-turnieje.git $root
if ($LASTEXITCODE -ne 0) { throw 'STOP: clone failed' }
git -C $root checkout --detach $sourceCommit
if ($LASTEXITCODE -ne 0) { throw 'STOP: checkout failed' }
if ((git -C $root rev-parse HEAD).Trim() -ne $sourceCommit) { throw 'STOP: SHA mismatch' }
Set-Location $root

# Confirm actual code identity before executing, with no credentials printed.
$expectedScript = '5a61ef4c88d57d673c6558b242aed87c479a40d0'
$expectedTests  = '177402bb4d9afaa08840839763764f8e502b0804'
if ((git hash-object scripts/qa/web005-local-readiness.mjs).Trim() -ne $expectedScript) { throw 'STOP: script blob drift' }
if ((git hash-object scripts/qa/web005-local-readiness.test.mjs).Trim() -ne $expectedTests) { throw 'STOP: test blob drift' }
node --version
pnpm --version  # if unavailable, record NOT_INSTALLED; Node unit tests may still run
Get-FileHash pnpm-lock.yaml -Algorithm SHA256

# Report env variable NAMES only; never print secret VALUES.
$unsafe = @(Get-ChildItem Env: | Where-Object {
    $_.Name -match '^(PG|SCHEMA_COMPARE_|REPLIT_|DOTENV_CONFIG_)' -or
    $_.Name -in @('DATABASE_URL','TEST_DATABASE_URL','NEON_DATABASE_URL',
      'DIRECT_URL','DEVELOPMENT_DATABASE_URL','PRODUCTION_DATABASE_URL',
      'DEPLOYMENT_TASK','API_PROXY_TARGET','NODE_OPTIONS','NODE_PATH','REPL_ID')
})
$unsafe | ForEach-Object { $_.Name }
if ($unsafe.Count -gt 0) { throw 'STOP: inherited database/deployment/proxy environment' }

# Exact native test, no pnpm, database or server needed.
$tap = Join-Path $root 'W5R_PR135_NATIVE_NODE22.tap'
node --test --test-reporter=tap scripts/qa/web005-local-readiness.test.mjs 2>&1 | Tee-Object -FilePath $tap
$nodeExit = $LASTEXITCODE
if ($nodeExit -ne 0) { throw "STOP: native unit test failed, exit $nodeExit" }

# Full checkout read-only preflight; do NOT run pnpm test here.
node scripts/qa/web005-local-readiness.mjs --json
$preflightExit = $LASTEXITCODE
if ($preflightExit -ne 0) { throw "STOP: project preflight BLOCKED, exit $preflightExit" }
```

**Note for Windows operator:** `pnpm --version` will fail when not installed; in that case record `NOT_INSTALLED` and continue the direct native Node test, but stop *before* any pnpm-dependent workspace suite. Do not automatically enable Corepack, install pnpm, or run lifecycle scripts on unverified source. The operator should also record `git status --short`, platform, stdout/TAP, actual two exit codes and the lockfile SHA256, without sharing environment secret values. Source checkout/auth requires ordinary approved GitHub access, not copying tokens into commands.

An alternative to cloning on Windows is an independently checked existing immutable checkout, only if the exact commit/tree, two blob hashes and absence of production secrets are confirmed; **never use Replit live**.

## D. DB-free vs PG16/API integration and loopback prerequisites

**DB-FREE NOW (when exact approved dependencies are already available):** `node --test scripts/qa/web005-local-readiness.test.mjs`, the read-only preflight CLI, `pnpm --filter @workspace/api-server run test:deadlock-game-catalog`, `pnpm --filter @workspace/api-server run test:marvel` (transitive imports first review), `pnpm --filter @workspace/db run test:schema-catalog-comparison`, `node --test lib/db/test/development-reset-config.test.mjs`, `pnpm run typecheck`. **Only the first two Node commands were actually executed in this task (native test PASS and partial preflight BLOCKED); remaining candidates NOT_RUN.** `pnpm install` is a state-changing step requiring separately approved disposable checkout and trusted offline cache.

**PG16/API HOLD:** root `pnpm test` invokes API `test:integration`; `pnpm --filter @workspace/api-server run test:integration`, destructive C01 S1/S2 PG16 fixtures, schema migrations, `DROP ... FORCE`, `CASCADE`, Drizzle `push --force`, full API/E2E lifecycle need **separately authorized physically isolated disposable PG16** plus independently reviewed source. Draft #60/#89 are not authorization. Windows native PG16, Replit and production are **not test targets**. `SECURITY-DEFERRED` remains OPEN.

**FRONTEND preview candidate, only after separate local disposable setup approval:** Vite source defaults `0.0.0.0`/`allowedHosts:true`; run a reviewed CLI override with `--host 127.0.0.1 --port 5173 --strictPort` and `PORT=5173` after the preflight, then verify actual listening sockets. Bypassing the package's `dev` staging can omit animated effects; avoid false visual parity claims. Any `API_PROXY_TARGET` for a future preview must explicitly equal an **approved local loopback endpoint** and must not be inherited during preflight.

**BACKEND on loopback:** existing `artifacts/api-server/src/index.ts` calls `app.listen(port, ...)` with **no host**. Do not launch it on the Windows host believing it is loopback-only; **A50** must explicitly implement and validate a local opt-in bind host, or owner must approve a network-isolated runner. `DEPLOYMENT_TASK` must remain absent for normal app startup, otherwise startup may select DB-affecting deployment tasks. No frontend or backend was launched here.

## E. Handoff to owners / status

- **STATUS:** `READY` — native preflight unit-test code at exact GitHub blobs (13/13, exit 0); `BLOCKED` — full monorepo native preflight / pnpm app suites (no full checkout or pnpm); `NO-GO` — PG16/full E2E.
- **W5R changes:** only A20-owned TAP and this report in the existing Draft PR #135. Source/test scripts unchanged from tested SHA; **no additional PR or app code changes**.
- **Next A60 + named Windows operator:** run full-checkout source preflight and selected DB-free app tests, capture exact SHA/TAP/lock hash with no inherited credentials.
- **Next A50:** safe API loopback binding contract and first real failing API integration assertion in separate authorized PG16 context.
- **Next A00/A40:** treat #135 as native unit-test PASS for tooling **only**, not full app candidate PASS; do not merge/deploy based on this evidence. `SECURITY-DEFERRED` remains OPEN.
