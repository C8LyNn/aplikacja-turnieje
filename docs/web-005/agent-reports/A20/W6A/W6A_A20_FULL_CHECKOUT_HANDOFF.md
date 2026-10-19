# WEB-005 — WAVE 6A / A20 — FULL CHECKOUT & LOCAL EXECUTOR HANDOFF

**Task ID:** `W6A-A20-LOCAL-BUILD-FOUNDATION`  
**Role:** A20 — Infrastructure / Local Runtime (direct user assignment in this thread)  
**Status:** `PARTIAL / OPERATOR_REQUIRED`. Existing native unit-test receipt **PRESERVED**; trusted full monorepo checkout **BLOCKED in this executor**.  
**Integration verdict:** `SOURCE_ONLY_READY_FOR_QA` for A20's preflight scripts; `BLOCKED` for full-checkout preflight and workspace DB-free suites; `NO_GO` for running full API/PG16/browser/live.  
**Date:** 2026-10-19  
**Authority:** [W6A MASTER DISPATCH](https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit). **No C04 creation, PG16 permission, install, merge or deploy is implied.**

## 1. Exact source and ownership

- [A20 Draft PR #135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) remains **OPEN/DRAFT** at source-inspection HEAD `cb261868f68b5bab3559398e514013dbd2a21078`; **base SHA** `1db3734b8988940acc6be8b992420a58fc39624a` (release/tournament-ops-20261013-01). Report publication on the same A20 branch advances the PR HEAD by **documentation only**; use PR metadata for its post-publication HEAD.
- Test code at that inspected commit is **unchanged from the previously proven W5R native run**:
  - `scripts/qa/web005-local-readiness.mjs`: exact Git blob SHA-1 `5a61ef4c88d57d673c6558b242aed87c479a40d0`.
  - `scripts/qa/web005-local-readiness.test.mjs`: exact Git blob SHA-1 `177402bb4d9afaa08840839763764f8e502b0804` (13 cases).
- `pnpm-lock.yaml` source Git blob `97ceb41938b53e8fc98f788ac1aa0c625761a2f2`; actual **lock SHA256 on a Windows checkout NOT MEASURED**. Root `package.json` does **not** pin a `packageManager` field; operator must record the installed pnpm version rather than assume one.
- C01 #60 `fa3261b2c9510e110ac9eba21726812d3401a525` → C02 #101 `a5bfd07b822c223fd995604dc2e228935ab81498` → C03 #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` remain other agents' distinct draft branches. A50 #105 `be2b9557e7c555925b1c1e64755042e35c536932` and A140 #116 `e89798e5a553c738428d61e37a20dc72685f7e8e` are separate. **No integration/composition/source changes** in this A20 W6A report.
- **Changed paths W6A:** only this A20-owned report, `docs/web-005/agent-reports/A20/W6A/W6A_A20_FULL_CHECKOUT_HANDOFF.md`. No runtime, frontend, backend, game, Replit or other agents' files modified.

## 2. Actual execution receipts; do not duplicate W5R PASS

| Executed check / environment | Actual result | Verdict |
|---|---|---|
| `node --version` in isolated tool Linux container | `v22.16.0`, exit 0 | Node22 available **here**, not verified on operator Windows |
| `git --version` in same container | `2.47.3`, exit 0 | Native Git available |
| `command -v pnpm` | **not installed** (no pnpm executable) | `BLOCKED` for pnpm suites |
| `timeout 12s env -i PATH=... HOME=/tmp LANG=C.UTF-8 GIT_TERMINAL_PROMPT=0 GIT_CONFIG_NOSYSTEM=1 git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git refs/heads/feat/web005/a20-wave4-local-readiness-20261018` | **exit 128**, `Could not resolve host: github.com` | No trusted complete Git checkout possible via direct Git in this container |
| Local file inventory of `/mnt/data` and known prior A20 working paths | Prior **TAP only** present; no `.git` + `pnpm-lock.yaml` complete checkout | Exact monorepo execution **NOT_RUN** |
| `sha256sum /mnt/data/web005-a20-native-executor/W5R_PR135_NATIVE_NODE22.tap` | `32c9dde3711dc1ef0aba9c889a4f720208095baec86a8666877e8bc961751fae`; equals previously published W5R TAP SHA256 | Previous genuine native `node --test` **13/13 PASS, exit 0** verified as historical evidence, **NOT RERUN in W6A** |
| GitHub connector exact file reads at #135 SHA | Both prior source/test Git blob IDs match above; full lock blob confirmed | Real source/read-only verification, **not** checkout/runtime test |

**W6A-native test command:** `node --test scripts/qa/web005-local-readiness.test.mjs` **NOT_RERUN** (explicit W6A dispatch: previous W5R 13/13 is already complete). **Full checkout command** `node scripts/qa/web005-local-readiness.mjs --json`: **NOT_RUN**, since a trusted full checkout is unavailable. **pnpm unit/typecheck, frontend/backend, API integration/PG16/E2E:** **NOT_RUN**.

**Preserved authentic TAP:** [W5R_A20_PR135_NODE22_NATIVE.tap](../W5R/W5R_A20_PR135_NODE22_NATIVE.tap), Git blob `6e16c18237b3d188b2d75d34c0c240854fd30ddb`, 13/13 PASS exit0, 0 FAIL, 0 SKIP. This was native testing of **two byte-verified PR135 source files**, not a full monorepo test; no source byte drift found.

## 3. OPERATOR_REQUIRED — copy-safe PowerShell recipe for private Windows machine

**Precondition:** the human operator independently confirms that **`$env:LOCALAPPDATA\Temp` is a permissible non-synced scratch location** and is unrelated to Windows PGDATA, Replit live, any existing production checkout, or an active agent branch. If unverified, **STOP; choose a specifically approved private scratch root instead**. Run in a **fresh ordinary (non-elevated)** PowerShell terminal, do not insert/copy production passwords/tokens into commands, never use an existing live checkout as a fallback.

```powershell
$ErrorActionPreference = 'Stop'
$pin = 'cb261868f68b5bab3559398e514013dbd2a21078'  # latest source SHA verified before W6A report
$parent = Join-Path $env:LOCALAPPDATA 'Temp\WEB005-A20'
# STOP first if this parent is synced, production-owned, contains PGDATA, or otherwise not operator-approved.
$root = Join-Path $parent ('checkout-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $parent -Force | Out-Null
git clone --no-checkout https://github.com/C8LyNn/aplikacja-turnieje.git $root
if ($LASTEXITCODE -ne 0) { throw 'STOP: cannot clone trusted repository' }
git -C $root checkout --detach $pin
if ($LASTEXITCODE -ne 0) { throw 'STOP: cannot checkout pinned commit' }
if ((git -C $root rev-parse HEAD).Trim() -ne $pin) { throw 'STOP: wrong exact commit' }
Set-Location $root
if ((git hash-object scripts/qa/web005-local-readiness.mjs).Trim() -ne '5a61ef4c88d57d673c6558b242aed87c479a40d0') { throw 'STOP: script blob mismatch' }
if ((git hash-object scripts/qa/web005-local-readiness.test.mjs).Trim() -ne '177402bb4d9afaa08840839763764f8e502b0804') { throw 'STOP: tests blob mismatch' }
if ((git hash-object pnpm-lock.yaml).Trim() -ne '97ceb41938b53e8fc98f788ac1aa0c625761a2f2') { throw 'STOP: lockfile blob mismatch' }

# Toolchain & lock receipts; pnpm is optional for the first two Node-only steps.
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v22\.') { throw 'STOP: expected Node 22' }
$pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpmCmd) { pnpm --version } else { Write-Output 'pnpm NOT_INSTALLED: pnpm-dependent tests HOLD' }
Get-FileHash pnpm-lock.yaml -Algorithm SHA256
git status --short

# List only variable NAMES; never show or export secret VALUES.
$unsafe = @(Get-ChildItem Env: | Where-Object {
    $_.Name -match '^(PG|SCHEMA_COMPARE_|REPLIT_|DOTENV_CONFIG_)' -or
    $_.Name -in @('DATABASE_URL','TEST_DATABASE_URL','NEON_DATABASE_URL',
      'DIRECT_URL','DEVELOPMENT_DATABASE_URL','PRODUCTION_DATABASE_URL',
      'DEPLOYMENT_TASK','API_PROXY_TARGET','NODE_OPTIONS','NODE_PATH','REPL_ID')
})
$unsafe | ForEach-Object { $_.Name }
if ($unsafe.Count -ne 0) { throw 'STOP: inherited DB/PG/production/Replit/deployment variables' }

# Preflight unit tests are optional to rerun (13/13 previously native PASS);
# for W6A a new exact local FULL-CHECKOUT preflight is the important gate.
$receipt = Join-Path $parent ('preflight-' + [guid]::NewGuid().ToString('N') + '.json')
node scripts/qa/web005-local-readiness.mjs --json | Tee-Object -FilePath $receipt
$preflightExit = $LASTEXITCODE
Write-Output ('preflight exit=' + $preflightExit)
if ($preflightExit -ne 0) { throw 'STOP: preflight BLOCKED — inspect receipt without secrets' }
```

**Record privately:** chosen directory and ownership, date, `git rev-parse HEAD`, two script Git blobs and lock blob, actual `Get-FileHash` SHA256 lock, Windows Node/pnpm versions, complete unredacted preflight JSON only where safe, true exit, source warnings (Vite default broad bind). Send **redacted receipt with variable NAMES only** to A20/A60. `SOURCE_PREFLIGHT_OK_DB_FREE_ONLY` is **not** proof of working frontend/API or protected PG isolation.

**If the operator has no GitHub access / cannot verify the path:** `OPERATOR_REQUIRED / BLOCKED`; no substitution with cached live/Replit tree. Do not automatically install pnpm, modify lockfile, run `pnpm install` or connect to any database to bypass this gate. A Git clone writes only to the newly approved scratch directory; never force cleanup from a guessed directory.

## 4. Test selection & local loopback boundary

**DB-free candidates only after actual full-checkout preflight PASS and existing dependency review:** `pnpm --filter @workspace/api-server run test:deadlock-game-catalog`, `pnpm --filter @workspace/api-server run test:marvel` (review imports first), `pnpm --filter @workspace/db run test:schema-catalog-comparison`, `node --test lib/db/test/development-reset-config.test.mjs`, `pnpm run typecheck`. Each = **NOT_RUN in W6A**. No installation authorized in this task. **Never run root `pnpm test`** — API's root `test` includes DB-dependent integration.

**Future frontend-only preview:** conditional on new operator approval for local setup/build and installed deps. Vite source at PR135 uses `host: '0.0.0.0'`, `allowedHosts: true`, so future CLI must explicitly bind `--host 127.0.0.1` and operator must inspect **actual listening sockets**. A standalone Vite CLI bypasses the `dev` animated-effects staging; browser/asset parity remains unverified. No frontend start performed here.

**Backend:** `artifacts/api-server/src/index.ts` uses `app.listen(port, callback)` with **no bind-host argument**, meaning Windows host-local execution is not proven loopback-only. A50 owns any opt-in bind-host change or a separately approved physical network-isolation approach. A20 must NOT start it based on PORT alone. `DEPLOYMENT_TASK` is excluded for safety.

**PG16/API HOLD:** no native Windows PG16 use, no unapproved PostgreSQL/Docker, no migration/reset/DROP/CASCADE/Drizzle force, no production/Replit credentials. Full API lifecycle, E2E and C01 original API integration failing assertion remain **UNKNOWN/BLOCKED**. SECURITY-DEFERRED backlog stays OPEN; R23H was not relaunched. C03 full Actions integration failure must not be mislabeled green.

## 5. Dependencies, conflicts, next owner

- **Reproduced defect in W6A:** none; **confirmed executor blocker** is DNS failure (exit128) and pnpm absence, not a test code failure.
- **File overlaps:** none with A40's frozen #134 adapter (two paths), A50's #105 pack17, A140's #116 live-preservation. No new C04, no cherry-pick, no code edits.
- **Next owner:** **named Windows operator + A60** to provide full-checkout preflight JSON/exit, lock SHA256, installed Node/pnpm and selected DB-free receipts. A00 decides whether/when to approve state-changing local install or any later isolated PG16 work. A50 owns backend safe localhost binding.
- **Gate S:** `SOURCE_ONLY_READY_FOR_QA / OPERATOR_REQUIRED`. **Gate R:** `HOLD`. No merge/deploy/Steam/live/PG16 scope has changed.
