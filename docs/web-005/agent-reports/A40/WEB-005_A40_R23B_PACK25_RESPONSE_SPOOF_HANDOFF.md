# WEB-005 — R23B / A40 — Pack25 Response Spoof Fix

**Task:** `WEB-005-T015-A40-R23B-PACK25-RESPONSE-SPOOF`  
**Authority:** NARROW TEST-FIRST SOURCE FIX; existing PR36, exactly one allowed test file.  
**Date:** 2026-10-15 Europe/Warsaw  
**Agent:** A40 — CI Pack Recovery  
**Result:** **`PACK25_RESPONSE_SPOOF_FIXED_SOURCE_READY_FOR_QA`** — scoped source acceptance candidate ONLY; new independent A60 exact-SHA review mandatory. **RELEASE_NO_GO / SWARM006_HOLD.**

## 1. Source provenance and final immutable refs

- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) is **OPEN / DRAFT / UNMERGED** on base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Authorized starting HEAD **`4be68fdd48ee3529029dc4dd2952780ba37853e7`**. Final checked HEAD **`24fe6c399e3a4fa82c3d96703620097fa941a59a`**.
- Sole modified path between authorized starting SHA and R23B final: **`qa/pack25/source-contract.test.mjs`**. Prior blob `f9d3eff6b18e74ebe00d6ec8c9a1b0628f081ee1`; new Git blob **`f38fe8b7af53a43ae560fe26fed1682ddcb7f608`**.
- [A60 independent R23A report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23A_PR36_CI_PACK20_26_INDEPENDENT_QA.md), Git blob **`b03f151d3a5208f3e3db8d17bd6990dc568e22e7`**, identified **`P36-P2-01`**: regex on raw response text could count a commented-out complete `return` after real `return result;`.
- **No edits** to Pack19/20/21/26/17, production API endpoint, migrations, workflow, PR35 or other PRs. No merge, rebase, force push or shared commit. Entire PR36 continues to contain the four previously authorized test-contract paths.

## 2. Test-first commit history

1. **RED regression commit:** [`daef47233a630152e131e9c6b86d48f5530b6e0c`](https://github.com/C8LyNn/aplikacja-turnieje/commit/daef47233a630152e131e9c6b86d48f5530b6e0c), file blob `ad6f75455d59c8df9d28a6b89a62f8c7793cb819`. Adds inside the original Pack25 source test three `assert.throws` cases for `//`, `/* ... */`, and multiline `/*\n...\n*/` false returns. The **original raw regex would wrongly accept** them. Native repo Pack25 test on this intermediate SHA **NOT_EXECUTED**; independently constructed *synthetic* local Node reproduction is genuinely RED (3 FAIL, exit **1**) on old matcher.
2. **GREEN implementation commit:** [`24fe6c399e3a4fa82c3d96703620097fa941a59a`](https://github.com/C8LyNn/aplikacja-turnieje/commit/24fe6c399e3a4fa82c3d96703620097fa941a59a), new blob **`f38fe8b7af53a43ae560fe26fed1682ddcb7f608`**. The same Pack25 file is the only change. Retains old invariants, adds bounded code-only return recognition and negative branch/duplicate/extra-field fixtures. No new dependencies.

## 3. Mechanism / why it closes P36-P2-01

Instead of `source.matchAll(/\breturn .../g)` over arbitrary text, Pack25 now:
1. Masks line/block comments, single/double-quoted strings, and backtick literals (preserving line breaks and source offsets) to prevent fake source from being interpreted as executable code.
2. Requires exactly one named `const outcome = await db.transaction(async tx => {` callback in the SE readiness route.
3. Locates the actual callback's closing brace by matching nested braces in the masked code; requires a following transaction options object and closing call.
4. Demands that this callback ends with `const impactRiskReport = deriveSeCorrectionImpactRiskReport(impactGraph);` followed **directly** by the final `return { ...result, ... };` — no conditional/wrong-branch return between these expressions.
5. Checks the return contains **exactly four distinct shorthand fields**: `actionPlan`, `diagnostic`, `impactGraph`, `impactRiskReport`, independent of order; no missing, duplicate, additional or `impactGraph: undefined` property.

Original positive route is **unchanged**, as are source contracts for read-only/repeatable-read transaction and no SE write route. The masked-code mechanism is a **deliberately bounded lexical test**, not a TypeScript AST parser: no new dependencies installed, and this source-level guard is intentionally strict to the current callback shape.

## 4. Test execution matrix — measured vs NOT_EXECUTED

| Execution | Scope/provenance | Observed result | Actual exit | Evidence |
|---|---|---|---|---|
| `node --test --test-reporter=tap /mnt/data/web005_r23b_red_probe.test.mjs` | **SYNTHETIC** old Pack25 regex on three representative comments | **0/3 PASS, 3 FAIL** — expected RED, false acceptance reproduced | **1** | TAP SHA256 `c39ebe77ef424363c27b3838a41f126177c31b1a6d763522b4c0c55c05144ee7` |
| `node --test --test-reporter=tap /mnt/data/web005_r23b_green_probe.test.mjs` | **SYNTHETIC** bounded lexer/callback matcher, 20 positive/negative fixtures | **20/20 PASS**, zero fail/skip/todo/cancelled | **0** | TAP SHA256 `9f1ad3bc3bdb1154bd4905f0f4fc7ef41d4f8de686e7ac10119bf6cb47ca8be2` |
| `node --test --test-reporter=tap /mnt/data/WEB-005-T015-A40-R3-fixture.test.mjs /mnt/data/WEB-005-T015-A40-R4-response-fixture.test.mjs` | **SYNTHETIC** earlier transaction & response contract regression tests | **19/19 PASS**, zero fail/skip/todo/cancelled | **0** | TAP SHA256 `ea92ad1ee7f5a725da4daacd3dfead33851f15a65f69473823cf998ed74e88a6` |
| `node --check /mnt/data/web005_r23b_green_probe.test.mjs` | local synthetic file syntax | accepted | **0** | Node v22.16.0 |
| In-memory evaluations of current **real GitHub backend route text**, blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757`, plus 14 controlled mutants | **SOURCE_EVALUATION**, not `node --test` | **15/15 expected classifications**; proper positive original/reordered, reject missing/undefined/dup/extras/comments/wrong function/conditional/string/template | **N/A** | Connector source readback at final PR36 HEAD |
| Transaction-options previous fix | **SOURCE_VERIFIED**: Pack20/21/26 blobs unchanged, Pack25 `withoutComments(server)` matcher retained | no changes to previous snapshot source logic | **N/A** | Compare/immutable blob checks |
| `node --test qa/pack25/source-contract.test.mjs` on a complete exact-PR36 checkout | Native real repository test | **NOT_EXECUTED** | **N/A** | No approved full monorepo checkout in executor; GitHub raw DNS unavailable in container |
| Pack19–26 native combined suite, API unit, PG16, Pack17 `--full` / CI | Real integrated workspace and release gates | **NOT_EXECUTED** | **N/A** | No merge/paid CI/PG execution authorized |

**IMPORTANT:** The synthetic fixtures contain corresponding reproductions of the source logic, not byte-for-byte extracted complete native project tests; a source evaluator also is NOT an executed Node suite. Do not upgrade them to a production/integration PASS. At final readback the PR36 current-head GitHub PR-triggered run list was **empty**, not GREEN.

## 5. Mandatory A50 / A60 follow-up and residual risks

**A60:** independently review **PR36 HEAD `24fe6c399e3a4fa82c3d96703620097fa941a59a`**, the RED/GREEN commit pair and the sole modified Pack25 blob. Confirm the comment, wrong-branch and four-shorthand invariants; investigate residual TS lexical cases (especially slash-regex literals, complex templates and unusual transaction callback refactors) before independent `SOURCE_ACCEPTED`. A source-only acceptance, if granted, does **not** approve full SE correction, database isolation, release or SWARM006.

**A50 on a trusted, full, clean, per-SHA PR36 checkout** (from monorepo root, Node22):
~~~powershell
git rev-parse HEAD    # must equal 24fe6c399e3a4fa82c3d96703620097fa941a59a
node --test --test-reporter=tap qa/pack25/source-contract.test.mjs
$code=$LASTEXITCODE
if($code -ne 0){throw "Pack25 source contract FAILED: $code"}
node --test --test-reporter=tap qa/pack20/source-contract.test.mjs qa/pack21/source-contract.test.mjs qa/pack25/source-contract.test.mjs qa/pack26/source-contract.test.mjs
$code=$LASTEXITCODE
if($code -ne 0){throw "Pack20/21/25/26 source contracts FAILED: $code"}
~~~
Capture actual command, immutable HEAD, Node version, exit code, independent TAP test/pass/fail/skipped/todo and sanitized log link. Existing full Pack19–26/Pack17 release gates remain unchanged. PR35 is separate and unmodified; combined native QA remains future, explicitly authorized disposable overlay/CI work.

**Residual limits:** lexical masking is intentionally not a full TypeScript parser or control-flow proof. The strict rule only certifies the *current* named transaction's syntactically final response, not arbitrary code semantics or PostgreSQL runtime. If a legitimate refactor changes transaction naming/callback shape or direct-final-return ordering, the contract **fails closed** and must be independently revised, not weakened. Code-like text inside regex literals and advanced template interpolation may require future AST-grade guard; this is disclosed to A60. Other source-gate static limitations and Pack17 TAP evidence risk remain independent.

**Final R23B:** **`PACK25_RESPONSE_SPOOF_FIXED_SOURCE_READY_FOR_QA`**, P36-P2-01 covered by scoped code/negative fixtures, **A60 re-review pending**, **RELEASE_NO_GO / SWARM006_HOLD**. No merge, rebase, PR35 modification, SQL, paid workflow rerun, deploy or SWARM-006 startup.
