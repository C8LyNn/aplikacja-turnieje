# WEB-005 — A50 / R23D — C01 V3 actual Windows DB-free native QA evidence

**Agent:** A50 · **Task:** Issue [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) / C01 executor continuation · **Date:** 2026-10-16.  
**Evidence provenance:** User-executed Windows 11 Native Executor V3; original local ZIP `WEB005-C01-WYNIKI-20261016-123424.zip` **reviewed in conversation, NOT uploaded or committed to GitHub** (may contain user-local paths/logs). Summary below derived from its `receipt.json`, `WYNIK.json`, TAP logs and process exits.  
**Verdict:** **`DBFREE_PACK19_26_NATIVE_PASS_292_292 / PACK17_PURE_NOT_EXECUTED_SCANNER_FALSE_POSITIVE / OVERALL_RUNNER_EXIT_2 / API_INTEGRATION_NOT_EXECUTED / RELEASE_NO_GO`**.

## Exact source, tools and environment (from machine receipt)

- **PR60 C01 composite** exact requested AND checked-out HEAD: `fa3261b2c9510e110ac9eba21726812d3401a525` — byte-identical, no merge.
- **Original A50 R23C runner Git blob** `95bc02a33db07cef1f9b837a5493813356d490ac` verified by V3 launcher before running.
- Node **v22.23.3**, pnpm **10.34.7**, PowerShell **7.6.7**, Git **2.51.0.windows.1**, repository workspace TypeScript **5.9.3** (actual `pnpm ... exec tsc --version` exit **0**).
- Lockfile SHA-256 from receipt: `8C30BE5AF6C9A868BF5B24FF3B2CED9CA0B976E66C3366A8E78D9DF8229C39EF`.
- Fresh isolated Windows clone, `git ... checkout --detach fa3261...` **exit 0** (V2 long path blocker now resolved). `pnpm install --frozen-lockfile` **exit 0**, 571 packages in isolated worktree; root dependency preinstall under isolated checkout. No changes to user's preexisting project source or global Node/pnpm.

## Actual executed contract and unit TAP (not projected)

All commands ran with `node --test --test-reporter=tap` or API pnpm exec `node --import tsx --test` on **the same exact C01 checkout**, each returned **exit 0**. Distinguish GitHub CI results from these **new user-machine native process receipts**:

| Pack | Source contract PASS | Non-DB unit PASS | Total | Fail / Skip |
|---|---:|---:|---:|---:|
| 19 | 8 | 26 | 34 | 0 / 0 |
| 20 | 9 | 15 | 24 | 0 / 0 |
| 21 | 7 | 24 | 31 | 0 / 0 |
| 22 | 6 | 31 | 37 | 0 / 0 |
| 23 | 8 | 28 | 36 | 0 / 0 |
| 24 | 10 | 29 | 39 | 0 / 0 |
| 25 | 12 | 32 | 44 | 0 / 0 |
| 26 | 12 | 35 | 47 | 0 / 0 |
| **Total** | **72** | **220** | **292** | **0 / 0** |

**Receipt aggregate:** `tests=292; pass=292; fail=0; skipped=0`. All 16 Pack19–26 command processes emitted complete TAP and exit **0**. This is direct native proof for only these specified packs, NOT a full integration/release QA PASS.

## Precisely identified V3 run stop / safety classification

Next scheduled test was **`qa/pack17/gate-contract.test.mjs`** (pure). The original runner's `AssertUnitOnly` scans raw file text for `TEST_DATABASE_URL`/`TEST_DATABASE_RESET`. These occur as **fixture input strings** in the pure test, not in executable SQL/connection code, so original runner raised `DB_SAFETY_STOP` at local runner line 131 **before starting Pack17Pure**. **Runner exit 2**, verdict `BLOCKED_OR_FAILED`. Thus:
- Pack17Pure **NOT_EXECUTED**, new test exit/TAP **null**.
- Backup strict/profile, Swiss, API typecheck and frontend unit (later sequential suites) **NOT_EXECUTED**.
- No failed feature test was observed. No PostgreSQL/API integration tests, DDL/reset/migration, paid CI or deployment were performed.
- The exact offending test `qa/pack17/gate-contract.test.mjs` Git blob `f59a65509009fbdf74a38239693238704b1af583`, imported pure helper `qa/pack17/gate-contract.mjs` blob `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`. They merely validate TAP completeness and safe test DB configuration using synthetically specified URL/schema; no I/O/SQL operations. Both were independently re-read at exact C01 SHA.

## Narrow V4 correction — prepared, NOT native-tested yet

A Windows V4 package was created as a separate conversation ZIP `WEB005_R23D_C01_TESTY_WINDOWS11_V4_PACK17_PURE_FIX.zip`, **not committed to this repository**:
- Preserves and checks the original A50 runner Git blob unchanged; makes a **new local patched runner copy** only in a fresh scratch directory.
- Replaces **only** the false-positive `AssertUnitOnly` call for **Pack17Pure** with two exact Git blob checks above (test + helper) and aborts on mismatches; `AssertUnitOnly` remains fully intact for all other suite files.
- Continues to use exact immutable C01 SHA, Windows temporary root paths, process-only long-path Git configuration, local Node22/pnpm10, frozen lockfile and safe DB-free suite allowlist. No Pack17 `--full`, no PG16 tests/reset, no database credentials.
- ZIP file integrity and internal SHA256 manifest checked in the ChatGPT container; **PowerShell 7 parser / Windows runtime V4 NOT_EXECUTED**. Only a real subsequent owner-host run can yield V4 PASS/FAIL and downstream test TAP.

**Do not mistake the full native runner exit 2 for Pack19–26 FAIL**: all 292 actually executed tests have valid PASS receipts. This unblocks source contract and unit QA for packs 19–26, but the original [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) *first failing API integration test* is **still unknown**. API integration runs require separate signed A00/A20 physically isolated disposable PG16 + bounded reset GO; no live/prod DB testing or bypass permitted.

**Handoff:** A00/A60 verify the 292 scoped TAP receipts against the original user-provided evidence if needed, evaluate the V4 pinned pure-test correction as source QA, then await new Windows ZIP results. **`COMPOSITE_C01_RELEASE_NO_GO / SWARM006_HOLD`**.
