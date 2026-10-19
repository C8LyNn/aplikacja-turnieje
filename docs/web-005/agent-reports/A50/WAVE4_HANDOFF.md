# WEB-005 — A50 / WAVE4_HANDOFF — C01 API RECOVERY

**AGENT / TASK:** A50 Backend/API · `WEB-005-A50-WAVE4-C01-API-RECOVERY`  
**STATUS:** `PARTIAL` (confirmed diagnostic output-loss defect fixed and DB-free regressed; actual API integration root cause still BLOCKED).  
**BASE SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` — original immutable C01.  
**PRE-WAVE4 HEAD SHA:** `259f8be0190e131e577fdc22425c236d292e9dae`.  
**WAVE4 CODE SHA:** `6c711e1f8bc2d78932239f2a2ddf14196af4ebb5`.  
**FINAL HEAD SHA:** read from [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) after this documentation commit.  
**BRANCH:** `fix/web005-c01-api-first-failure-evidence` (existing PR #105; separate Variant B [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) untouched).  
**CHANGED PATHS WAVE4:** `qa/pack17/run-gates.mjs`, NEW `qa/pack17/run-gates-exit.test.mjs`, this `docs/web-005/agent-reports/A50/WAVE4_HANDOFF.md`.

## Confirmed defect vs still-unknown failure

Original [C01 Actions run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`, has `BLOCKED: API integration tests execution failed exit 1; signal none` and no accessible named failing TAP assertion; two later different-SHA API integration CI jobs `117669533771` and `117669487576` also exit 1 with no named `not ok`. **NO justified claim that all three share the same underlying API defect.**

In original and pre-WAVE4 Pack17, immediately calling `process.exit(status)` after printing buffered stdout/stderr could truncate the **last diagnostic line**, as independently reproduced in a synthetic local Node22 pipe test: four old-mode `console.error('A50_END_SENTINEL');process.exit(1)` trials with a 2 MiB queued stderr payload each lost the marker; four `process.exitCode=1` trials retained it and still returned exit 1. **This proves a diagnostic flush bug in the same Node process pattern**, not that the original API integration test failure is explained or repaired.

**Narrow source correction:** `run-gates.mjs` now throws a controlled `GateFailure` on failing subprocess/out-of-order gate/incomplete TAP, unwinds `main()` and sets `process.exitCode` at the outermost catch. Node drains output naturally; the sequence immediately stops and subsequent gates do **not** execute. The earlier PR #105 first-`not ok` redacted extractor is preserved; full successful TAP is no longer dumped into shared Actions logs. The actual subprocess exit status is propagated for a nonzero status; failures with no positive numeric status remain fail-closed as 1. All PG16 gates and test selectors remain unchanged.

## TEST COMMANDS / REAL RESULTS

1. `node --check qa/pack17/run-gates.mjs` — **PASS** (Node `v22.16.0`).
2. `node --check qa/pack17/run-gates-exit.test.mjs` — **PASS**.
3. `node --test --test-reporter=tap qa/pack17/run-gates-exit.test.mjs` using synthetic non-database `--static` temporary workspaces — **3/3 PASS, 0 FAIL/SKIP, process exit 0**:
   - first gate fails after 2 MiB synthetic output: first redacted failing TAP preserved, exit 1, no second gate;
   - second gate fails: exit 1, no false `STATIC-ONLY PASS`;
   - both static gates pass: exit 0, real complete TAP summaries.
4. Test log: `wave4_pack17_static_gate_tap.log` SHA256 `4a3ec44b8f4d7fa5248356991180ddc485f7d53dd913c70ed10893bcee82d676`. Locally re-created exact published Git object byte identities:
   - `run-gates.mjs`: Git blob `55b21d3752403e99feb2ac35a9e6cd1838576746`;
   - `run-gates-exit.test.mjs`: Git blob `084bdbd86301f25b6392d608b15b03ad157625c8`;
   - existing imported `gate-contract.mjs`: `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`;
   - existing `failure-evidence.mjs`: `e8a6310305d78fe0c3dad857b9760a80388b6c09`.

**NOT TESTED:** full C01 PG integration; application API route behavior; Docker/PG16/SQL; migrations; images/paid GitHub CI; protected merge; deploy. No new API product code patch: **first real failing integration test name/assertion is still absent**.

## CONFLICTS / INTEGRATION CONSTRAINTS / NEXT STEP

PR #105 remains **OPEN/DRAFT** on exact C01 baseline. A40 PR #101 and A140 PR #116 are not touched; no known path collision in Wave4. Variant B PG16 PR #89 is independent and remains blocked for destructive test execution; the new synthetic `--static` tests are not a license to run it.

**NEXT OWNER:** A60 independently review exact PR #105 source and new 3-case regression; A40/A10 record diagnostic-only candidate; A00/A20/operator must retrieve an authentic full original private integration TAP or explicitly approve a physically isolated disposable PG16 reproduction with approved destructive-fixture safety. **Then** A50 can classify APPLICATION vs FIXTURE vs ENVIRONMENT and author the minimal API/fix PR if a real defect is demonstrated.

**FINAL:** `WAVE4_HANDOFF / DIAGNOSTIC_FLUSH_DEFECT_FIXED_DB_FREE / API_ROOT_CAUSE_UNCONFIRMED / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
