# WEB-005 — A20 / DEVELOPMENT FIRST / WAVE 5 — WAVE5_HANDOFF

**Agent / Task ID:** A20 — Infrastructure / Local Runtime, `WEB005-A20-WAVE5-LOCAL-RUNTIME`  
**Status:** **PARTIAL** — local source preflight source fix and DB-free tests completed; full isolated application checkout/API/frontend runtime **NOT VERIFIED**.  
**Mode:** NON-DESTRUCTIVE / A20-OWNED PR #135 ONLY. **No Docker, PG16, SQL, migrations, package installation, actual API/Vite start, merge, deploy or Replit live write.**  
**BASE SHA:** `1db3734b8988940acc6be8b992420a58fc39624a` (`release/tournament-ops-20261013-01`).  
**WAVE 5 source-repaired HEAD SHA at report authoring:** `2dd3e9f546ed2dc2d8ba662d36adcd859cf99288` — this report commit itself necessarily advances PR HEAD; check its final GitHub metadata.  
**PR:** [#135 — A20 local test readiness](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) (OPEN/DRAFT); separate earlier [#128 disposable PG16 design](https://github.com/C8LyNn/aplikacja-turnieje/pull/128) is also OPEN/DRAFT but untouched.

## 1. Actual source change closing a concrete local-readiness defect

Original #135 preflight blocked inherited `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*`, `NODE_OPTIONS`, and dotenv, but **did not block `DEPLOYMENT_TASK` or `API_PROXY_TARGET`**. The source at BASE `artifacts/api-server/src/deployment-task.ts` [blob `9eb60690cd43caf381a88fc0bc3075159636ffa2`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/deployment-task.ts) dispatches `DEPLOYMENT_TASK=series_v1_reset` and migration alternatives before starting API; Vite [blob `4c833bf13a03b28174f9202dc0498f1f5d25d3ea`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/tournament-manager/vite.config.ts) uses `API_PROXY_TARGET` to direct the `/api` proxy, defaulting to localhost when unset. Hence inherited values must fail admission before a DB-free/local launch sequence.

On **A20's existing PR #135 branch only**, changed:
- `scripts/qa/web005-local-readiness.mjs` — deny inherited `DEPLOYMENT_TASK` and `API_PROXY_TARGET` variable names without ever reading or printing their values.
- `scripts/qa/web005-local-readiness.test.mjs` — two synthetic regression tests: `series_v1_reset` denied, foreign API proxy denied, secret value redacted.

**No application implementation, fixture, API, frontend, Replit or other agents' branch modified.** Files under `docs/web-005/agent-reports/A20/WAVE5/` are documentary scope. `SECURITY-DEFERRED` findings remain OPEN; these two guards do NOT secure an actually running server on their own.

## 2. Real executions, environment and test results — segregated evidence

| Check / command | Actual environment | Result | Evidence class |
|---|---|---|---|
| `node --version` | Isolated tool container, **NOT operator Windows** | `v22.16.0` | ACTUALLY EXECUTED |
| `npm --version` / `corepack --version` | Isolated tool container | `10.9.2` / `0.32.0` | ACTUALLY EXECUTED |
| `pnpm --version` | Isolated tool container | **NOT INSTALLED**; version unavailable | ACTUALLY CHECKED (BLOCKER to package tests) |
| `git --version` | Isolated tool container | `2.47.3` | ACTUALLY EXECUTED |
| `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` | Isolated tool container | FAILED: DNS `Could not resolve host: github.com`; therefore no full Git checkout | ACTUALLY EXECUTED; NETWORK BLOCKED |
| `node --test /mnt/data/web005_wave4_work/scripts/qa/web005-local-readiness.test.mjs` | Isolated tool container, separate earlier A20 local prototype source **NOT byte-identical to #135** | **10/10 PASS** / zero failures | NATIVE NODE TEST, **NOT** EXACT #135 |
| Exact PR #135 modified source + exact updated test contents, **13 named cases** | Restricted V8 JavaScript evaluator, mocked filesystem, crypto digest stub; no actual Node module import, Git workspace, network or DB | **13/13 PASS**, includes two NEW env poison cases | EXACT GH SOURCE / **EMULATED**, NOT NODE-NATIVE |
| `node ...web005-local-readiness.mjs --json --root=/mnt/data/web005_wave4_work` | Isolated tool container, incomplete local non-Git folder | **exit 2 / BLOCKED**, expected; source manifests/lock absent and inherited `NODE_PATH` present; no secret values logged | ACTUALLY EXECUTED negative CLI check, NOT full-checkout preflight |
| `node --test scripts/qa/web005-local-readiness.test.mjs` on fresh exact #135 checkout | Not available in this container (no Git clone/DNS) | **NOT RUN** | NEXT A60 / OPERATOR |
| Workspace `pnpm` unit, typecheck, build; Vite/API boot; PG16 integration | No approved isolated complete checkout or installed pnpm/dependencies | **NOT RUN** | NO APP PASS CLAIM |

**Precise test interpretation:** `13/13` only certifies test logic in **virtual V8** against GitHub bytes; native `10/10` is on an **older, different local prototype**. Neither is a `pnpm` application suite, CI result or exact-commit native `node --test` PASS.

## 3. Reproducible operator recipe — exact checkout, no live writes

All steps below are **for a separately approved operator** in a **new disposable directory** (not Replit live, project production, G: synchronized material, or an agent's shared workspace). Repository CLI access was unavailable here because DNS to GitHub was blocked. No command below was executed on the user's workstation.

### Phase A: obtain an immutable checkout, verify without installing

```powershell
# Use a new approved, private, NON-SYNCED checkout directory.
$src = Join-Path $env:TEMP 'web005-wave5-a20-<unique-id>'
git clone --no-checkout https://github.com/C8LyNn/aplikacja-turnieje.git $src
git -C $src fetch origin feat/web005/a20-wave4-local-readiness-20261018
git -C $src checkout --detach <EXACT_PR135_HEAD_SHA_FROM_GITHUB>
git -C $src rev-parse HEAD               # must equal reviewed PR #135 HEAD
node --version                           # record exact v22.x
pnpm --version                           # record exact pnpm, expected 10.x; do not auto-install
git -C $src status --short
Set-Location $src
node --test scripts/qa/web005-local-readiness.test.mjs
node scripts/qa/web005-local-readiness.mjs --json
```

**Preflight FAIL means STOP** — clear/test inherited `NODE_PATH`, database URLs, PG/libpq env, Replit vars, `DEPLOYMENT_TASK` and `API_PROXY_TARGET` in an isolated child environment; never copy real secrets. Check `.env` paths and use the actual lockfile SHA output. Do not invoke `pnpm install` as a side effect of preflight.

### Phase B: offline dependencies only in the approved disposable checkout

Operator must separately authorize any installation, even if offline: `pnpm install --offline --frozen-lockfile` changes local files/`node_modules`, may run lifecycle scripts and requires a populated trusted cache. Node `v22.16.0` was available in the tool container, **not** a check of the operator workstation. Existing root package.json does not pin a `packageManager` version; lockfile v9 is source-confirmed, runtime dependency parity is PENDING. No fallback to online install, lockfile rewrite or Replit npm environment is implied.

**Only after dependencies and import-safety review** attempt DB-free candidates: `pnpm --filter @workspace/api-server run test:deadlock-game-catalog`, `pnpm --filter @workspace/api-server run test:marvel`, `pnpm --filter @workspace/db run test:schema-catalog-comparison`, `node --test lib/db/test/development-reset-config.test.mjs`, `pnpm run typecheck`. Do **not** use `pnpm test`, since the root API `test` script also runs `test:integration`.

### Phase C: loopback-only preview and API binding dependency

**Frontend-only candidate**, after independently approved install/launch and no inherited endpoint secrets:

```powershell
$env:PORT = '5173'                                # Vite config requires PORT
$env:API_PROXY_TARGET = 'http://127.0.0.1:8080'  # set intentionally ONLY after clean preflight
pnpm --filter @workspace/tournament-manager exec vite --config vite.config.ts --host 127.0.0.1 --port 5173 --strictPort
```

The CLI command is **proposed, NOT RUN**; operator must inspect the **effective listener 127.0.0.1** and absence of other listeners. It **bypasses the package `dev` script's animated-effects staging** (which has local filesystem writes), so a visual preview may have missing staged effects; no claim of full frontend parity. Vite source contains `server.host: '0.0.0.0'` and `allowedHosts:true`; command-line override plus actual socket observation are necessary rather than assuming port isolation. The `API_PROXY_TARGET` exception is a **reviewed, deliberate localhost-only value**, not an inherited value; if backend absent API features will fail and UI smoke must be reported `PARTIAL`.

**Critical API blocker:** at frozen BASE `artifacts/api-server/src/index.ts` [blob `31b1ba194f1aa84d17787af70618e3f3664f5dec`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/index.ts) uses `app.listen(port, callback)` with **no host parameter**; `PORT` and an external shell env alone **cannot bind that Express listener strictly to `127.0.0.1`**. Do not start API with production credentials or assume it is host-only. **Next owner A50** should review a small opt-in local `API_BIND_HOST=127.0.0.1` (or equivalent) startup-binding change and a negative test, without changing live default accidentally. Another admissible option is a separately reviewed physically isolated container namespace with explicit port acceptance; no host-routing workaround is authorized here. Also unset `DEPLOYMENT_TASK` before any future normal API startup; it selects scripts with migration/reset effects.

## 4. Ready now vs held for PG16 / integration

- **Now / DB-free:** static manifest/preflight checks, code-only regression/shape tests, independent frontend pure/unit tests after approved dependency setup, design of localhost-only frontend preview.
- **HOLD / dependent:** real API startup with strict loopback, API integration first-root-cause and full lifecycle, S1 schema reset/CASCADE, four S2 dynamic DBs, two Drizzle `push --force`, source-hook FORCE DROP, any DB migration/reset. Original [C01 #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) and [source-hardening #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) are still unmerged Draft; only separately approved disposable PG16 setup/test/cleanup can change execution scope. Previous [A20 #128](https://github.com/C8LyNn/aplikacja-turnieje/pull/128) is **design only**.

**Conflict scope:** #135 is A20-owned. A40 #101/#134, A50 #105/#89, A140 #116 remain separate; no their code/branches modified, no merge/deploy. `SECURITY-DEFERRED` remains an **open** backlog; preflight patch is **two guards only**, not broad security certification.

**INTEGRATION READINESS:** **CONDITIONAL for DB-free source checks**, **NO for full API/frontend/PG16 integration**. **NEXT OWNER:** A60/operator for exact-commit Node/pnpm/integration-free execution and verified frontend-only preview; A50 for API bind-host / confirmed root cause; A00 for explicit scoped PG16 permissions if needed.
