# WEB-005 — A50 — R15 EXECUTION OR DEFINITIVE BLOCKER

**AGENT:** A50 — Test Infrastructure & Execution  
**TASK:** `WEB-005-T133-A50-R10` · **WAVE:** R15 · **DATE:** 2026-10-14 (Europe/Warsaw)  
**MODE:** TEST/SAFETY ONLY; zero code implementation GO, zero merge/release/SQL adoption.  
**CENTRAL DOCUMENT:** `docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md`, Git blob `e6950cbff7e521ed9b3ff774e7787e8d598a966d`.  
**SOURCE BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**VERDICT:** `P0_ENVIRONMENT_BLOCKED / RUNTIME_NOT_EXECUTED / INDEPENDENT_QA_PENDING / RELEASE_NO_GO`.

## 1. PUBLICATION R14 — receipt restored

Retrospectively published the actual R14 report at [WEB-005_A50_R14_HANDOFF.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R14_HANDOFF.md). It records **zero app tests executed**, 10 actual local subprocess calls (exit `0`×4, `2`×2, `127`×3, `128`×1), Node/Git presence, absent pnpm/Docker/psql/checkout/PG16, and the fact that its launcher was only planned/guard-tested. **This does not retroactively upgrade prior R14 PASS or release readiness.**

## 2. Current GitHub source state and exact SHAs

All **21 PRs #34–54** independently checked with GitHub: `OPEN DRAFT`, not merged, each base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; no composite integration SHA. Full head SHA and one `run_state=NOT_EXECUTED` per PR: [R15_TEST_MATRIX.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a50-r15-evidence-20261014/docs/web-005/agent-reports/A50/WEB-005_A50_R15_TEST_MATRIX.json). No candidate PR code was modified by A50.

Frontend prioritized (separate SHAs): #43 CSV, #47 DE presentation, #50 backup preview, #52 stage modal, #53 auth private cache, #54 RR readback. PG16/API pending (separate isolated executions): #39, #41, #42, #44, #45, #46, #48, #49, #51; security HTTP #34/#37; Pack19 #35 and Pack17 full #40 pending.

R15 GitHub Actions evidence remains that PR52 run `38605694664`, PR53 `38606179795`, PR54 `38606249912` failed **upstream** at historical Pack19 assertion `readOnly:true` vs `accessMode:"read only"`, fixed only in separate PR35. Those runs do **not** prove target RTL ran or passed/failed; do not waive required future integrated release gates.

## 3. Actual current environment and commands

**Actual environment:** Linux container; Node `v22.16.0` and Git `2.47.3`; no pnpm, Docker, psql, pwsh, full monorepo Git checkout, trusted user-PC shell/QueenBridge, owner-authorized disposable PostgreSQL16 or verified reset-scope consent.

**Actual R15 subprocesses: 15; unexpected: 0.**
- `node --version` **exit 0**, `git --version` **exit 0**.
- `pnpm --version`, `docker --version`, `psql --version`, `pwsh --version` **exit 127** (binary not installed).
- `git -C /mnt/data rev-parse HEAD` **exit 128** (no checkout).
- `python3 /mnt/data/WEB-005-A50-R14/Run-R14-Frontend.py --pr N --kind target` for each N in `43,47,50,52,53,54`: **6× exit 0 PLAN_ONLY**, *no React process spawned*.
- Same PR53 launcher with `--execute` missing repo/out/approval: **exit 2** (fail closed).
- Same PR53 launcher with `--execute --repo /mnt/data/checkout-not-present --out /mnt/data/evidence-r15 --approval-file /mnt/data/no-approval.json`: **exit 2** (fail closed).

Totals `exit 0:8; exit 2:2; exit 127:4; exit 128:1`; evidence: [R15_LOCAL_EXECUTION.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a50-r15-evidence-20261014/docs/web-005/agent-reports/A50/WEB-005_A50_R15_LOCAL_EXECUTION.json). **Native application: 0 executed, exit=null, TAP=null, browser=null, DB snapshots=null.** Environment/launcher safety checks do not count as application PASS, FAIL, or independent QA.

## 4. PR53 source finding — must reproduce, not declare runtime FAIL

Checked PR53 HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`:
- `artifacts/tournament-manager/src/context/auth-context.tsx`: `AuthProvider` calls `useQueryClient()`.
- Existing `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx`: wrapper renders `<AuthProvider>{children}</AuthProvider>` **without** `QueryClientProvider`.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`: `isTournamentAuthQuery` matches first key only when URL begins `/api/tournaments/<id>`. It does not match other key families.
- Noncanonical R14-R01 `["tournaments",id,"player-bans"]` and R14-R02 `["matches",matchId,"game-picks"]` require distinct negative tests and in R02 a valid match→tournament mapping. Blindly clearing all matches cache is forbidden. Neither R01/R02 runtime scenario has been executed here.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` has **8 top-level test declarations** at current PR53 SHA, while baseline R14 central instructions mentioned 9. Counts of *runtime tests* can be established only by TAP.

**Classification:** wrapper and matcher behavior `SOURCE_CONFIRMED`; likely failed existing auth fixture `STATIC_INFERRED / TEST_NOT_EXECUTED`; privacy behavior impact `HYPOTHESIS` pending A30/A60 and real test. A50 makes no application patch, no S2B code GO.

## 5. Definitive unblocker and executable packet

Owner/A00 supplies a **supported actual shell/filesystem execution mechanism** into a trusted Windows PC or approved isolated VM with full clean, separate pinned checkouts for PR43/47/50/52/53/54, Node22/pnpm10 and frozen pnpm deps (installation authorized separately), external evidence directory, and specific out-of-band-verified A00 approval per SHA. GitHub connector alone does not mount this user machine.

**Immediately after access:** run **PR53 existing auth test FIRST**, then PR53 dedicated cache suite, PR43/47/50/52/54 suites, typechecks/builds, and full frontend regression where authorized. Single published [PowerShell runner](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a50-r15-evidence-20261014/docs/web-005/agent-reports/A50/Run-R15-Frontend.ps1) and [owner runbook](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a50-r15-evidence-20261014/docs/web-005/agent-reports/A50/WEB-005_A50_R15_OWNER_RUNBOOK.md) include exact SHA guard, commands, expected logging, consent, and refusal paths. **PowerShell execution of that script was NOT_VERIFIED here** because `pwsh` is absent; actual PC operator must check it before reliance.

For PG16, A20 and owner first attest a separate disposable instance plus dedicated test-only role (no superuser/role creation/replication/bypass RLS), database/schema `tm_test_*`, verifiable reset scope and explicit GO. Then execute each PR's positive/negative and zero-write snapshots on individual SHAs. Without those conditions STOP — no shared/prod DATABASE_URL and no mutations.

A60 to receive native command, actual HEAD, Node/pnpm/PG version, TAP including skipped, exit, credential-sanitized logs and DB before/after evidence. A10 to register exact published links, blob SHA and receipt status. No self-countersign or background execution.

## 6. STOP / release disposition

No target React tests, API/HTTP tests, PG16 integration, CI rerun, pack17 --full, merge/rebase/cherry-pick, deploy, staging, SQL migration, shared DB mutation, secret output or SWARM-006 launch performed in this task. `QA_ACCEPTED_FULL=false`, `RUNTIME_VERIFIED_FULL=false`, `RELEASE_NO_GO`.

**NEXT ACTION / OWNER:** A00 enables the above trusted, authorized executor and asks A50 to run real tests when available. A60 independently verifies exact SHA findings. SWARM-006 remains deferred until WEB-005 formally closes and HQ/owner separately approves final handoff.
