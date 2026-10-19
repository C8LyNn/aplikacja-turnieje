# WEB-005 — A50 / WAVE 6A — QUOTED BASIC CONFIDENTIALITY FIX

**ROLE:** A50 — Backend / API / diagnostics owner.  
**TASK:** `WEB-005-A50-W6A-QUOTED-BASIC-REDACTION`  
**STATUS:** `DONE` — targeted source correction and actual DB-free tests; **independent A30/A60 acceptance PENDING**.  
**INTEGRATION VERDICT:** `READY_FOR_QA` for diagnostic-only source; `BLOCKED` for C01 full API integration and working-app runtime.  
**Date:** 2026-10-19. **Mode:** role-scoped non-destructive QA and source only.  
**C01 immutable BASE SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` — [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60), untouched.  
**Pre-W6A A50 PR #105 HEAD:** `be2b9557e7c555925b1c1e64755042e35c536932`.  
**W6A tested code/test checkpoint:** `4a2c398625490a228a18769e1097442aabb2da4a`.  
**Final HEAD after this report:** use the HEAD of [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105); no self-referential exact SHA embedded.  
**Branch:** `fix/web005-c01-api-first-failure-evidence` (A50-owned, separate from C03, routing and PG16); PR remains Draft / unmerged.

## 1. Confirmed vs unknown — independent A30 input

Source [A30 W5R independent confidentiality acceptance](https://github.com/C8LyNn/aplikacja-turnieje/blob/22d12222104907ab08e8bcc18033dcdf7f5f11f6/docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md) evaluated prior A50 exact SHA `be2b9557e7c555925b1c1e64755042e35c536932` and reported **FAIL**: five of ten additional security-negative cases failed because the previous Basic regex only matched bare tokens. In particular `Authorization: Basic "YTpi"`, `Authorization: Basic 'YTpi'`, quoted Proxy-Authorization, a `not ok` test name and a stderr diagnostic could expose the **synthetic** token. This is a genuine source-level log-redaction defect, NOT a verified real secret incident or original API runtime failure.

Original C01 [Actions run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) still reports API integration **exit 1**, but the first genuine failing TAP assertion/file/stack is **UNKNOWN** and no authenticated original complete private TAP has been retrieved. The quoted Basic patch does **not** fix or classify that API integration failure.

## 2. Minimal patch and exact files

**Only W6A changed paths before this report:**
1. `qa/pack17/failure-evidence.mjs`: one regex line, explicit alternation for double-quoted, single-quoted and ordinary Basic token. Preserves existing `[REDACTED]` placeholder, scheme labels, TAP identity/counters, 400-char cap, URL/DSN/Bearer masking. No changes to gate control or exit logic. **Published Git blob SHA-1 `6978ff19a40cc9f43413599d6a319ee26b7f80b5`.**
2. `qa/pack17/failure-evidence-w6a.test.mjs`: ten real Node `node:test` synthetic cases, quoting and stdout/stderr, Proxy-Authorization, JSON-like value, previous ordinary Basic, DSN and Bearer, counter and no-fabricated-failure controls. **Published Git blob SHA-1 `6e4d9f230f1c6abd70d18127d1721978bb2cb5ec`.**
3. This report, `docs/web-005/agent-reports/A50/W6A_A50_QUOTED_BASIC_FIX.md`.

**Unchanged and byte-verified input blobs:** old 16-case parser test `3ea61402b55cad03fa284bfbf39313c23dca4bb7`, W5R seven-case test `5628bbc38a56b793363417d5db39ca05d0517ca0`, Pack17 runner `55b21d3752403e99feb2ac35a9e6cd1838576746`, runner exit 3-case test `084bdbd86301f25b6392d608b15b03ad157625c8`, gate contract `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`. Every local input's `git hash-object` was compared with GitHub exact blobs.

**Explicit exclusions:** no modifications in C01 app/fixture, C02 PR101, frozen C03 PR134, A20 PR135 scripts, routing PR142, PG16 B PR89, migrations/SQL, frontend, Replit live, CI workflows, games or assets. No second code PR created.

## 3. Real test-first native Node execution — no database

**Execution:** Linux isolated local `/mnt/data/web005_w6a_a50/qa/pack17`, Node `v22.16.0` and Git `2.47.3`; synthetic credentials only, no inherited DB/prod variables used in test child actions. The local helper/test files matched the exact GitHub Git blob hashes.

| Test | Actual native command | Exit | TAP |
|---|---|---|---|
| **RED** old exact helper with new 10 negative cases | `node --test --test-reporter=tap failure-evidence-w6a.test.mjs` | **1** | **3 PASS / 7 FAIL**, 0 skip |
| **GREEN** patched helper with same cases | same | **0** | **10 PASS / 0 FAIL**, 0 skip |
| **GREEN FULL REDACTION** old 16 + W5R 7 + W6A 10 | `node --test --test-reporter=tap failure-evidence.test.mjs failure-evidence-w5r.test.mjs failure-evidence-w6a.test.mjs` | **0** | **33/33 PASS**, 0 fail/skip/cancel/todo |
| **GREEN RUNNER** actual synthetic Pack17 `--static` exit/STOP suite | `node --test --test-reporter=tap run-gates-exit.test.mjs` | **0** | **3/3 PASS**, real internal child exits 1/1/0 as asserted; 0 skip |
| Syntax | `node --check failure-evidence.mjs`, `node --check failure-evidence-w6a.test.mjs` | **0 each** | Syntax accepted |

**Verifiable locally captured TAP SHA256 (source artifacts, no credentials):**
- RED: `95d261b8f3e328255a38b01a5e6cc5e8af542cbc352326eabdf5ad30c645436b`, file `RED_A30_QUOTED_BASIC.tap`.
- GREEN new 10: `3edee9b7b2df0b13555daef0e428fe088acf4cbd053885ab80a79758727a0450`, file `GREEN_A30_QUOTED_BASIC.tap`.
- GREEN full 33: `dc1ebd8aeb934cad4506e9f0117d0d2ac005ff05a4fab01d17a949d4aec844a7`, file `GREEN_FULL_REDACTION.tap`.
- GREEN runner 3: `7672eec0a06dbf3a765f3be21ddc2959755fa130bd0055e4aa35fd7fc4bdf6a9`, file `GREEN_RUNNER_EXIT.tap`.

**NOT_RUN:** PostgreSQL, API integration, Docker, CI workflow, migrations/Drizzle, browser E2E, complete monorepo typecheck, native Windows owner PC Node v22.23.3, live deployment, merge. This narrow source correction does **not** establish exhaustive confidentiality against malformed or third-party log serializations. Independent A30 and A60 testing on this final HEAD required.

## 4. Opt-in local API bind: proposal only / NOT IMPLEMENTED

An earlier source review identified a backend `app.listen(port)` broad-bind risk. A50 proposes, **only under a future separate A00-approved backend-runtime task**, an explicit local-only bind to `127.0.0.1` using a disposable test workspace, operator-selected port, and a dedicated negative network-exposure test; reject inherited production DB, secret and deployment-task environment. Do not change app runtime, assume host defaults are safe, or start the API in W6A. This is a **proposal**, not a code patch or confirmed loopback-only app.

**OPERATOR_REQUIRED** if A00/A20 elect a future complete local app checkout/start: select brand-new isolated path unrelated to native Windows PGDATA/live Replit, pin exact SHA+lockfile digest, verify Node/pnpm, audit names (never values) of inherited DB/PG/REPLIT/DEPLOYMENT_TASK variables, obtain separate local-bind/start permission. No operator evidence received or executed here.

## 5. C01 PG16/first assertion remains blocked

Preferred no-execution option: obtain original authenticated full C01 TAP+stderr and real first failed `not ok` assertion. Only if genuinely unavailable and explicitly approved by A00+A20+operator can a **fresh, physically isolated disposable PG16** G0–G4 be considered after verifying real cluster/roles/identity, separate source/fixture risk gating (unchanged C01 CREATE-then-FORCE-DROP danger), SQL ledger, all four S2 slots and two Drizzle FORCE pushes. Variant B PR89 is a **different source SHA**, not exact historical C01 reproduction. No G0 is granted and no operation is performed.

**Future required receipt:** source and selected variant SHA, signed phase and operator approval, physical cluster system ID, actual test command, named first failing test, assertion/stack, stdout/stderr private TAP SHA256, true child exit/signal, reviewed redacted extract, source-level application/fixture/environment classification.

## 6. Dependencies / handoff / ownership

- **A30** — rerun the exact quoted Basic A30 synthetic security-negative oracle on new PR105 SHA; independent confidentiality PASS/FAIL. Prior 5/10 FAIL **remains historical fact** and is NOT overridden by A50 green tests.
- **A60** — independent exact SHA native DB-free 33+3 execution and review for exit/skip and unmodified production/SQL; no claim of full app QA.
- **A10** — record new SHA and source scope; status `READY_FOR_QA`, no blind inclusion of PR105 in C03 and no C04 permission.
- **A40** — keep C03 frozen; Pack17 PR105 has shared file ancestry and requires explicit composition review, not an app behavior fix.
- **A00** — final two-track SOURCE-only vs runtime HOLD gate decision, physical operator prerequisite to any further API integration.
- **Conflicts:** no file overlap with other active agents' owned paths; no code changes outside A50 `qa/pack17/failure-evidence*`.

**Final:** `W6A_A50_QUOTED_BASIC_SOURCE_FIXED / DBFREE_33_PLUS_3_PASS / PENDING_INDEPENDENT_A30_A60 / C01_FIRST_FAILED_APP_TEST_UNKNOWN / SOURCE_READY_FOR_QA / RUNTIME_HOLD / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
