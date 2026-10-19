# WEB-005 — W6A / A00 FINAL SCOPE DECISION AND HANDOFF

**Task:** WEB005-W6A-A00-SCOPE-DECISION  
**Role:** A00 — HQ / Orchestration, determined only from previous direct user assignment in this conversation  
**Date:** 2026-10-19, Europe/Warsaw  
**Main companion:** [W6A_A00_GATE_BOARD.md](./W6A_A00_GATE_BOARD.md)  
**Central dispatch:** https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit  
**Status:** **A00 task DONE; swarm WAVE 6A in progress / NOT CLOSED**.

## 1. Decision issued now

- **GO:** parallel, isolated **read-only/source-only** W6A work by A00/A10/A20/A30/A40/A50/A60/A120; role-scoped DB-free Node tests of exact verified bytes in an environment with no inherited production/DB/PG/Replit variables.
- **CONDITIONAL GO:** planning one future **C03→C04 test-only** package consisting solely of PR #129's new Backup ingress test blob, subject to A10 immutable allowlist, A60 dedicated source-negative/compatibility sign-off and A40 verification. No branch/commit for C04 yet.
- **NO-GO:** using PR #105 as accepted confidential diagnostics because independent A30 tests show five failing quote-form cases. A60's 23/23 supported-format + 3/3 gate-exit tests do not override that finding.
- **NO-GO:** any assumption that current synthetic/partial native preflight proves the whole local app boots. A20 13/13 actual native tests cover precisely the two committed preflight files; full checkout, dependencies, Vite/API/browser and PG16 not executed.
- **NO-GO:** production merge, C04 construction (pending separate A00 order), paid/manual CI dispatch, PostgreSQL/Docker migrations/resets, Replit live sync, Steam-admin/catalog activation or any game/Unity asset modification.
- **SWARM-006:** HOLD; it is a possible later QA/release/integration handoff, not available now.

**Gate S (DB-free source progression):** `S0_PLANNING_GO / S1_SCOPED_TESTS_GO / S2_C04_CREATION_HOLD`.  
**Gate R (locally running app):** `R0_OPERATOR_REQUIRED / R1_LOCAL_APP_NO_GO / R2_PG16_G0_HOLD`.  
**Overall:** `W6A_ACTIVE_NOT_CLOSED / RELEASE_NO_GO`.

## 2. HQ acceptance of historical W5R evidence, preserving scopes

**Verified:**
- A20 W5R native preflight 13/13 PASS, Node v22.16, pinned script blob `5a61ef4c88d57d673c6558b242aed87c479a40d0`, test blob `177402bb4d9afaa08840839763764f8e502b0804`. Full checkout CLI on partial files exit 2 BLOCKED. PR135 current HEAD `cb261868f68b5bab3559398e514013dbd2a21078`.
- A60 W5R independent 17/17 PR142 pure route, 23/23 PR105 supported-form redact, 3/3 runner exit tests (43/43 targeted, isolated verified Git blobs, not full app).
- A30 W5R independently ran added security-negative 10-case suite (5 PASS, 5 FAIL, exit 1) on PR105 HEAD `be2b9557e7c555925b1c1e64755042e35c536932`. Known quoted synthetic Basic credential not redacted; no verified actual secret theft. Standard Basic supported cases PASS. A30 confidentiality FAIL wins for affected scope.
- A40 W5R source-only plan exists: frozen C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`, PR129 `35449b148aa782139a5327164cb6ed5d6aa3bfdd` proposed as ONE FILE, not created. Independent combined C03+129 acceptance pending.
- Replit A140 NO_COPY: PR116 `e89798e5a553c738428d61e37a20dc72685f7e8e`, eight STOP categories and actual live published bytes UNKNOWN; no deploy permitted.
- C03 official CI [39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) full result FAILURE with API integration exit1 and authentic first `not ok` still unavailable.

**Not received or not yet evidenced as new W6A closure:**
- A50 fixed new head for quote-style Basic.
- A30 independent acceptance of that **new** head.
- A60 independently rerun new corrected head and approve exact C03+129 negative compatibility.
- A10 W6A registry with updated source allowlist and inheritance.
- A20/operator full isolated monorepo native preflight and verified lock, explicit valid local loopback bind.
- A40 new immutable signed-ready composition gate after A10+A60.
- A120 real HTTP/browser evidence (only acceptance-contract preparation authorized).

They must be **NOT_RECEIVED / NOT_RUN** until actual artifacts appear; do not treat dispatch or requested task as proof of completion.

## 3. Ordered W6A closure plan

**Parallel lane A — defects:** A50 implement small test-first redaction quote-form correction and publish new SHA + authentic RED/GREEN native Node receipts. A30 independently re-run quote/Proxy/TAP/stderr negative cases. A60 independently validate the same new SHA plus prior 23+3 supported and exit tests. A10 updates provenance. If still failing, mark #105 EXCLUDED / HOLD; do not block unrelated DB-free work.

**Parallel lane B — source composition readiness:** A10 pin #129 one-file blob and C03 collision/ancestry; A60 independently confirm exact PR129 negative suite is valid with C03 code and that provenance remains unchanged; A40 produce narrow allowlist and ask A00 for separate authorization. A00 must issue a new explicit permission before anyone creates C04, and must require combined actual DB-free TAP/typecheck after a new SHA exists. Parent PR100/66 is already in C03. PR104, Swiss, Undo, CAS, route helper and Replit are excluded from this C04.

**Parallel lane C — local build foundation:** A20 provides a safe full-checkout operator runbook, independent Windows disposable folder, exact code/hash and pnpm lock, no inherited DB variables and no default API startup. Named Windows operator executes only if independently instructed/approved and reports full-checkout native preflight output. A120 drafts a local preview HTTP status/MIME/SPA contract. A50 can prepare a separate *proposal* for opt-in API 127.0.0.1 bind; W6A alone gives no permission to start broadly listening services.

**HQ gate sync:** A00 reviews delivered receipts in the order A50→A30/A60 and A10→A60→A40, with A20 operator environment evidence separate. At no point should one green source test be used to skip a failing independent security negative or unrun integration.

## 4. Named operator requirement (Windows desktop)

**OWNER ACTION REQUIRED — not executed remotely by A00.**

The operator should review and use the [A20 W5R isolated PowerShell recipe](https://github.com/C8LyNn/aplikacja-turnieje/blob/cb261868f68b5bab3559398e514013dbd2a21078/docs/web-005/agent-reports/A20/W5R/W5R_A20_EXECUTOR_UNBLOCK.md) only in an explicitly chosen **new disposable folder** unrelated to Windows native PG16, Replit and active code worktrees. Pin exact source commit, check Git blobs/lock SHA256, Node22, sanitized variable *names* only, execute scoped native `node --test` and read-only source preflight; report actual exit/TAP. Do NOT run root `pnpm test` (DB-integrating), auto Corepack/npm install, `pnpm dev`, API startup or any schema reset under this authorization. Full checkout and app startup remain separate gates.

When safe isolated local frontend/server is later approved, check Vite effective `127.0.0.1` rather than existing broad `0.0.0.0` source default; backend `app.listen(port,...)` requires explicit local bind or network-isolated environment. PostgreSQL use requires independent owner/operator G0–G4 with destructive-fixture review and explicit separate permission. Never target existing PG16 Windows port 5432 by default.

## 5. W6B — proposed sequence, NOT activated

After W6A closure and full verified worktree (or documented blocker accepted by owner), issue a **new** W6B dispatch:

1. A20 + operator: verify exact full clone, Node22/pnpm lock/cache provenance, reviewed disposable environment, selected DB-free typecheck/build/test command list and approved local loopback hosting controls.
2. A40: compose an explicitly approved exact source/test diff in separate candidate after A10/A60 and A00 S2 GO, never protected branch merge.
3. A60: independently execute combined exact-SHA typecheck, DB-free native TAP, route/asset tests; collect genuine outputs and record all skips. Maintain C01/C03 API failure status.
4. A120: evaluate local actual HTTP 404/MIME, SPA refresh and stream/portfolio/game asset fingerprints on *approved* isolated preview; no Replit live changes.
5. A50: investigate authentic first C01 API integration TAP; if absent, ask owner for separately authorized physically isolated PG16 G0–G4, not part of automatic W6B start.
6. A00: only once all evidence is received, decide further GO/CONDITIONAL/NO-GO, preserving R23H P0/P1 deferred security holds and Replit NO_COPY.

**The target is a genuinely testable local build, not merely accumulating more Draft PRs.** A working API/DB-backed tournament flow cannot be claimed without real, separately authorized end-to-end evidence.

## 6. W6A_HANDOFF — machine-readable fields in prose

- **ROLE:** A00
- **TASK:** WEB005-W6A-A00-SCOPE-DECISION
- **STATUS:** DONE (A00 documentation and decision); W6A swarm IN_PROGRESS
- **BASE SHA:** A00 docs previous W5R report `a85751e086dcd9cc29cfc8bc8fd34a2940069434` (docs-only branch created from this); source integration base `#101 a5bfd07b822c223fd995604dc2e228935ab81498`.
- **FROZEN SOURCE HEAD:** C03 #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`.
- **A00 CHANGED PATHS:** `docs/web-005/agent-reports/A00/W6A_A00_GATE_BOARD.md` and this `docs/web-005/agent-reports/A00/W6A_A00_SCOPE_DECISION.md`. No product files or tests altered.
- **TEST COMMANDS A00:** NOT_RUN native shell/Node/TAP, pnpm/typecheck/PG16/browser/HTTP. Verified through connected Google Drive Docs and GitHub PR/CI/docs reads only. No claimed local checkout.
- **PRs:** existing #60/#101/#134/#129/#105/#142/#103/#120/#135/#116 remain Draft on checked snapshot; no PR created/merged by A00.
- **FIRST FAILED API TEST:** UNKNOWN. C03 Actions API integration exit1 full FAIL; no waiver.
- **CONFLICTS:** PR129 test-only one added path (conditional), PR66/100 parent already in C03, #105 inherited Pack17 files and redaction FAIL, #142/#120 sibling new release ancestry, eight Replit STOP areas.
- **NEXT OWNER:** A50, A30, A60, A10, A40, A20 + named Windows operator, A120. A00 receives signed receipts.
- **VERDICT:** `W6A_ACTIVE / S0_GO / S1_SCOPED_GO / S2_HOLD / S3_105_NEEDS_FIX / R0_OPERATOR_REQUIRED / R1_NO_GO / R2_PG16_G0_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

**This HQ report does not waive any previous STOP. No SQL, PG16 execution, protected merge, Replit sync/deploy, CI dispatch, real credential processing or game asset changes were performed.**
