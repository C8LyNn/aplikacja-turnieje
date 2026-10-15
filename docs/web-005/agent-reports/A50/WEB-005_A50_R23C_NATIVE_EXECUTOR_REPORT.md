# WEB-005 — A50 R23C — NATIVE QA EXECUTOR: FINAL EVIDENCE & HANDOFF

**Task:** `WEB-005-T131-A50-R23C-NATIVE-EXECUTOR` · **Agent:** A50 / Isolated Test Execution & QA Infrastructure · **Date:** 2026-10-15 Europe/Warsaw  
**Final verdict:** **`RUNNER_READY_AWAITING_HOST`** · **A50 newly executed application tests:** **0** · **Release:** `NO_GO` · **SWARM-006:** `HOLD`.  
**Authorization:** non-destructive local runner design/publication only in available host. No production DB, reset, migrations, paid CI, merge, deployment or app PR edits.

## 1. Deliverables — verified GitHub blobs, direct links

- [`WEB-005_A50_R23C_EXECUTOR.ps1`](./WEB-005_A50_R23C_EXECUTOR.ps1), Git blob **`95bc02a33db07cef1f9b837a5493813356d490ac`**. A real PowerShell 7+ script (~17.6 KB) for Windows 11, strict exact-SHA isolated local Git clone, explicit install/run authorization, pnpm frozen lockfile and safe suite executor, per-command sanitized logs and machine receipt.
- [`WEB-005_A50_R23C_OPERATOR_GUIDE.md`](./WEB-005_A50_R23C_OPERATOR_GUIDE.md), blob **`ab0ff6d2ee3f643bc344d9205216170c52201e0a`**. Windows launch commands, local repo mirror, owner gates, log handling and STOPs.
- [`WEB-005_A50_R23C_EXECUTION_PINS.json`](./WEB-005_A50_R23C_EXECUTION_PINS.json), blob **`f6214f71298101f9d7cd8f493c3980107ba46bf6`**. Explicit exact SHA manifest and suite profiles including A40's newly verified composite PR60.
- [A40 exact source composite B1 manifest](../A40/WEB-005_A40_R23C_COMPOSITE_B1_MANIFEST.json), Git blob `43dfdab3c0e347e3b04bb0aa600810c279c66f2d` — independent author evidence, not A50 runtime QA.

**Publication check:** all three A50 files were fetched back using the central GitHub control branch; no original PR35/36/40/55/56/57/58/60 source modified, no new application PR created.

## 2. Current exact source and first A40 composite

| PR | Scope | Exact SHA rechecked during R23C |
|---|---|---|
| [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | A40 composite B1, 14 paths, 6 source packages | `fa3261b2c9510e110ac9eba21726812d3401a525` |
| [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | Pack19 matcher | `7cb283aa82273a1e22daf9051a82311eef53760c` |
| [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | Pack20/21/25/26 matcher | `24fe6c399e3a4fa82c3d96703620097fa941a59a` |
| [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | Pack17 source gate only | `9a8287271299a59fc9291b8d253299a8d109a35d` |
| [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | strict Backup V3 validator | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` |
| [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | Swiss S3/S4 | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` |
| [#58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | raw Backup V2/V3 profile gate | `e8100f7b0c1071c2a98880d4eb7947514fc58185` |

All source candidates are isolated OPEN DRAFT (unmerged) on common release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. A40 PR60's exact Git tree has copies of all 14 verified blob SHAs, without semantic conflict edits. A50 **did not merge or commit a new composite**.

## 3. Physically observed A50 environment: commands vs NOT_EXECUTED

Available local host is a restricted **ChatGPT Linux container**, **not** an owner-authorized Windows11 / PowerShell 7 test PC with full repo. Physical preflight observed:

| Actually executed/check | Outcome |
|---|---|
| `node -v` | `v22.16.0`, process exit 0 |
| `npm -v` | `10.9.2`, process exit 0 |
| `git --version` | `git version 2.47.3`, process exit 0 |
| `tsc -v` | `Version 5.8.3`, process exit 0 — global, **not** pinned workspace semantic typecheck |
| Command discovery `pwsh`, `powershell`, `pnpm`, `docker`, `psql` | Binaries **absent**; these test commands were NOT invoked, no fabricated process exit |
| `find /mnt/data /home/oai/share -maxdepth 4` for `.git`/`pnpm-workspace.yaml`/`pnpm-lock.yaml` | No complete local monorepo found |

**NOT_EXECUTED by A50 R23C:** PowerShell 7 interpreter syntax/runtime smoke (no pwsh); local Git exact-composite clone/checkout, `pnpm install --frozen-lockfile`, Pack19–26 Node runner, Pack17 pure, strict Backup, raw Backup profile gate, Swiss, API/TS typecheck, frontend unit, any PG16/HTTP integration. All **A50 native command exit/TAP/PASS/FAIL/SKIP = null / NOT_EXECUTED**. No typecheck or application PASS was invented.

**Runner static quality check**: published script was fetched byte-for-byte from GitHub; a lightweight JS delimiter/string-comment balance inspection found zero unmatched brackets and it contains explicit profile/composite SHA guard, suite allowlist, fixed CSV `-Suites` handling, lockfile SHA256 recheck, TAP parsing and sanitized log receipt. This is **not a PowerShell parser, Windows execution or native test PASS**. Real Windows11 interpreter execution remains an owner-host gate.

## 4. External real GitHub CI / not an A50 local rerun

Read current exact PR60 metadata, [automatic workflow run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970` and its **actual decoded job logs**:

- Pack19–26 workflow steps: **SUCCESS**.
- Inside full Pack17 automatic workflow: `PASS source contracts`, `PASS gate fail-closed contracts`, `PASS PostgreSQL atomic correction` (8/8 in **GitHub-managed ephemeral PostgreSQL16**), `PASS workspace typecheck`.
- `BLOCKED: API integration tests execution failed exit 1; signal none`, job wrapper `Process completed with exit code 1`. **CI overall = FAILURE**.
- Later Pack17 frontend tests, API build, frontend build **NOT_EXECUTED** due fail-closed stop.
- Targeted Backup strict/profile and Swiss named files are **not proved individually executed** by this workflow. No A50 local test has run, no automatic CI permission extends to separate manual PG16 tests.

This evidence is real external CI **not** a new A50 `NATIVE_QA_EXECUTED` outcome. A40's report has the full 14-blob manifest and automatic CI provenance. The cause of API integration exit 1 is not yet independently isolated; do not label it as a Swiss/Backup failure.

## 5. Runner operational contract and fail-closed boundaries

**Run profile:** `-Profile CompositeA40 -ExpectedSha fa3261b2c9510e110ac9eba21726812d3401a525 -Suites Pack19to26,Pack17Pure,BackupStrict,BackupProfile,Swiss,ApiTypecheck,FrontendUnit -AllowInstall -AuthorizeRun`, with full local source/work/evidence path arguments. **Other SHA => hard STOP for first composite.** Individual profiles PR56/57/58 create their own separate clean exact checkout.

**Isolation and tools:** Node22 major, pnpm10 major, Git commit preflight, new local clone, detached HEAD equality, clean worktree, existing `package.json`/`pnpm-workspace.yaml`/`pnpm-lock.yaml`, lockfileVersion9 and lock SHA256 before/after `pnpm install --frozen-lockfile`. Tests run with database environment variables stripped from each child process; production DATAbase URLs are never selected. Test-only file allowlist also rejects direct destructive `resetTestSchema/dropTestSchema` imports.

**Safe groups:** Pack19–26 contracts+specific DB-free unit files; Pack17 `gate-contract.test.mjs` only (NEVER `run-gates.mjs --full`); Backup strict-policy, Backup profile-gate, Swiss, API `tsc` typecheck, five nondestructive frontend unit files. `ApiTypecheck` does not create/migrate a DB. Missing files on composite/custom are `SKIP_NOT_IN_THIS_SHA`, never PASS. Nonzero command aborts after writing full sanitized output to evidence.

**Evidence:** new unique `<EvidenceRoot>\WEB005_A50_<profile>_<unique>\receipt.json` plus timestamped `NN_step.log`. Receipt preserves exact SHA, file SHA256, tool versions, full process argv/exit, parsed TAP tests/pass/fail/skipped, aggregate TAP, log filenames and hashes, failure class (`ENVIRONMENT_FAILURE` / `SOURCE_CONTRACT_FAILURE` / `FEATURE_TEST_FAILURE` / `TYPECHECK_FAILURE` / specific SHA/lock/DB stops). All error output retained after best-effort secret masking, logs local and not committed to repo. Runner returns 0 if all selected available safe suites pass, 3 if partially missing, 2 on fail/blocker/no tests; neither 0 nor prior CI means deployment approval.

## 6. A00 required permissions / future physical execution gate

A00/owner must **provide one trusted Windows11+PowerShell7+ PC/VM shell and filesystem**, authorized complete local mirrored source Git objects for current exact PR60 (or individual PRs), installed Node22/pnpm10/Git, two disjoint isolated work/evidence directories, and **explicit test-only permission plus approval for frozen pnpm install/lifecycle scripts**. Operator reviews/authenticates runner, invokes the [guide's exact commands](./WEB-005_A50_R23C_OPERATOR_GUIDE.md), then shares `receipt.json` and access-controlled sanitized logs with A00/A60. **No background work is promised by A50; execution requires an actual authorized host process.**

**Dedicated PG16 gate remains separate and NOT GRANTED.** PR55 Basket CAS calls `resetTestSchema`/`dropTestSchema` (destructive `DROP SCHEMA CASCADE`). Pack17 `--full` similarly requires independently documented physically isolated disposable PostgreSQL16, only test role, exact `TEST_DATABASE_URL`/`tm_test_*`, written owner+A20 reset scope and independent QA. These commands are **not in this runner** and are STOP pending distinct GO.

**No merge/rebase/cherry-pick, no production SQL/DDL, no paid CI, no staging/live, and no SWARM-006 activation.**

**A50 FINAL R23C: `RUNNER_READY_AWAITING_HOST / ZERO_A50_NATIVE_RUNS / COMPOSITE_SHA_PINNED / CI_INTEGRATION_EXIT_1_EXTERNAL / PG16_STOP / RELEASE_NO_GO / SWARM006_HOLD`.**