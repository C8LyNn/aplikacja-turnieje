# WEB-005 / WAVE 6A — A20 FINAL_HANDOFF

**ROLE:** A20 — Infrastructure / Local Runtime (direct user assignment in this thread)  
**TASK ID:** `W6A-A20-LOCAL-BUILD-FOUNDATION-FINAL`  
**STATUS:** **PARTIAL / OPERATOR_REQUIRED** for full local checkout and actual project preflight; **DONE** for scoped source/test evidence and operator handoff.  
**INTEGRATION VERDICT:** `SOURCE_ONLY_READY_FOR_QA / R0_OPERATOR_REQUIRED / R1_NO_GO / R2_PG16_G0_HOLD`. No release GO.  
**DATE:** 2026-10-19 (Europe/Warsaw)  
**PRIMARY PR:** [Draft #135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) OPEN/DRAFT; **BASE SHA** `1db3734b8988940acc6be8b992420a58fc39624a`; **PRE-FINAL HEAD SHA** `c625c8cbc93869ecbb24919f34148fea38179a76`. This report is added on the same existing A20 branch, so final PR HEAD will advance **by this document only**. Verify post-write HEAD on GitHub.  
**SOURCE BRANCH:** `feat/web005/a20-wave4-local-readiness-20261018`.

## 1. Already completed W6A task — no redundant implementation or tests

Source and test are **unchanged** at pre-final PR #135 HEAD:
- `scripts/qa/web005-local-readiness.mjs` Git blob `5a61ef4c88d57d673c6558b242aed87c479a40d0`.
- `scripts/qa/web005-local-readiness.test.mjs` Git blob `177402bb4d9afaa08840839763764f8e502b0804`.
- `pnpm-lock.yaml` Git blob `97ceb41938b53e8fc98f788ac1aa0c625761a2f2` (source integrity check, **NOT Windows lock SHA256 receipt**).

**W5R exact native Node22 receipt preserved:** `node --test --test-reporter=tap scripts/qa/web005-local-readiness.test.mjs` on two exact Git-blob-verified files: **13/13 PASS, 0 SKIP, real exit 0**; complete [TAP](../W5R/W5R_A20_PR135_NODE22_NATIVE.tap), local SHA256 `32c9dde3711dc1ef0aba9c889a4f720208095baec86a8666877e8bc961751fae`. The SHA256 was **rechecked in this final turn**. **The Node tests were not rerun in W6A** because the dispatch explicitly prohibits duplicate PASS tests without source changes. These are unit tests of **two isolated files**, not a working tournament application.

Existing detailed [W6A full-checkout/operator runbook](./W6A_A20_FULL_CHECKOUT_HANDOFF.md) already includes a non-synced disposable Windows path choice, PowerShell clone/detach exact SHA, `git hash-object` script/test/lock checks, `Get-FileHash` lock SHA256, Node/pnpm version capture, unsafe inherited DB/PG/Replit/deployment/proxy **variable NAMES only**, project `--json` preflight and true exit. **Do not execute that recipe automatically on owner's machine.**

## 2. Execution truth for this final task

| Command or check | Environment / real result | Verdict |
|---|---|---|
| `node --version` | Tooling Linux container: `v22.16.0`, exit `0` | PASS **toolchain in container only** |
| `git --version` | Tooling Linux container: `git version 2.47.3`, exit `0` | PASS tool present |
| `command -v pnpm` | Tooling Linux container: not found | BLOCKED for package scripts |
| `env -i PATH=... HOME=/tmp ... git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git refs/heads/feat/web005/a20-wave4-local-readiness-20261018` | Tooling Linux container: `fatal: Could not resolve host: github.com`; Git exit `128` | FAIL **DNS / clone blocker** |
| `find /mnt/data -maxdepth 4 -type d -name .git` | No checkout with `.git` found in available workspace | NO FULL REPO |
| `sha256sum /mnt/data/web005-a20-native-executor/W5R_PR135_NATIVE_NODE22.tap` | SHA256 identical to published W5R native TAP | PASS **receipt integrity** |
| GitHub connector `get_pr_info`, `fetch_file`, changed-file listing | PR #135 current SHA, script/test/lock blobs and A20 file scope confirmed | PASS source readback |
| `node scripts/qa/web005-local-readiness.mjs --json` on **full** isolated project | **NOT_RUN**; verified full tree/lock absent | **R0 BLOCKED** |
| pnpm DB-free app tests / typecheck, local frontend/API, HTTP/browser | **NOT_RUN**; checkout, pnpm and runtime permissions absent | **R1 NO-GO** |
| PostgreSQL/SQL/C01 integration | **NOT_RUN**, no PG16 G0 permission | **R2 HOLD** |

**Reproduced new app defect:** NONE. **First named failing C01 API assertion:** UNKNOWN. Official [C03 CI](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) whole workflow remains **FAIL: API integration exit 1** despite independently documented narrower DB-free passes; no new C03 CI execution by A20.

## 3. File ownership and collisions

**W6A_FINAL-only modified path:** `docs/web-005/agent-reports/A20/W6A/W6A_FINAL_HANDOFF.md`. Earlier W6A report stays unchanged. NO RUNTIME CODE CHANGES, no tests altered, no extra PR. A40 C03 #134 remains frozen, A50 owns #105, A60 QA, A140 Replit protection. No overlapping changed paths observed with the A20 report. Original C01→C02→C03 must not be re-cherry-picked; C04 not authorized.

## 4. Next mandatory action / operator instruction

**Next owner:** **A00 assigns a named Windows operator** and confirms the proposed disposable, private, non-synced workspace. **Operator + A60** then follow [A20 PowerShell runbook](./W6A_A20_FULL_CHECKOUT_HANDOFF.md) in fresh non-elevated PowerShell, verifying exact detached commit and all three Git blobs first. Report actual `node --version`, `pnpm --version` **or NOT_INSTALLED**, `Get-FileHash pnpm-lock.yaml -Algorithm SHA256`, sanitized variable-name check, `node scripts/qa/web005-local-readiness.mjs --json` with **actual exit** and receipt. Only after source preflight and separately approved dependency review may A60 try explicit DB-free tests; never `pnpm test` (it invokes API DB integration). No assumption of running API, frontend, PostgreSQL or Replit services. A50 owns future opt-in backend `127.0.0.1` bind change; frontend requires explicitly verified loopback listener, not Vite default `0.0.0.0`.

**A00 gate board:** [W6A_A00_GATE_BOARD.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a00-w6a-gate-board-20261019/docs/web-005/agent-reports/A00/W6A_A00_GATE_BOARD.md) — S0 source planning GO; S1 scoped DB-free QA GO; **S2 C04 HOLD; S3 #105 HOLD; R0 OPERATOR_REQUIRED; R1/R2 NO-GO**. SECURITY-DEFERRED unresolved. Nothing here grants protected merge, PG16, SQL, Docker, install, deployment or Replit/Steam/game asset modification.

**END STATUS:** `W6A_A20_PARTIAL_OPERATOR_REQUIRED / SOURCE_ARTIFACT_DONE / RUNTIME_NOT_PROVEN / PG16_HOLD`.
