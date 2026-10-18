# WEB-005 — W5R / A10 — DELTA SOURCE REGISTRY & HANDOFF

**Task ID:** `WEB005-W5R-A10-SOURCE-PROVENANCE`  
**Role:** A10 — Source Registry & Dependencies  
**Status:** `DONE` — read-only verification + append-only registry; no code changes  
**Date:** 2026-10-18 · **Dispatch:** [W5R Master Dispatch](https://docs.google.com/document/d/1yKUPtfE0dC9a0nRAdi35OnYPDIZUN46u3bCkN2KeDTw/edit)  
**Base:** C01 `fa3261b2c9510e110ac9eba21726812d3401a525` → C02 `a5bfd07b822c223fd995604dc2e228935ab81498` → **C03 HEAD** `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`.
**Scope:** focused delta against A10 [WAVE 5 JSON manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB005_A10_WAVE5_SOURCE_MANIFEST.json) and [late PR135 addendum](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB005_A10_WAVE5_LATE_SHA_ADDENDUM_20261018.md), not another full R23H audit. Historical 51-PR registry and P01–P33 SHA immutable.
**Werdykt:** `W5R_A10_DELTA_READY / C03_SOURCE_PASS / C03_READY_FOR_DB_FREE_QA / PR135_READY_FOR_DB_FREE_QA / PR103_NEEDS_FIX / PR105_NEEDS_FIX / API_FULL_FAIL / PG16_G0_NO_GO / REPLIT_NO_SYNC / RELEASE_NO_GO`.

## 1. Live PR HEAD snapshot and W5R categorization

All eight PRs were re-read from GitHub as **OPEN / DRAFT / UNMERGED**. Below SHA values are exact 40-character HEADs captured for this report. A future HEAD update requires a new pinned QA receipt.

| PR / stream | Full HEAD SHA | Base SHA | W5R status | Evidence / why |
|---|---|---|---|---|
| [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **HOLD** | C01 original full API integration exit1; first failing assertion unknown |
| [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **HOLD** | C02 baseline; source copied, inherited failed API integration |
| [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | `a5bfd07b822c223fd995604dc2e228935ab81498` | **READY FOR DBFREE QA** | C03 SOURCE PASS (A60), 20/20 targeted adapter CI PASS + typecheck PASS, overall API workflow FAIL |
| [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) | `cfa69565ccf6bedb4f8e3e3b4be948132fb727ba` | `1db3734b8988940acc6be8b992420a58fc39624a` | **READY FOR DBFREE QA** | 13 authored preflight tests; native exact-head execution pending A20 |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `3beba777627fa01ad46e83984915234a5d230046` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **NEEDS FIX** | Basic Authorization credential redaction gap; original API first failure unproven |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `1db3734b8988940acc6be8b992420a58fc39624a` | **NEEDS FIX** | Async Promise-returning exists incorrectly classified by synchronous route policy |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | **HOLD** | Test-only child of #103; 12 synthetic PASS/4 SKIP historical, no live/browser integration |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `133e67fc079affabeb22c92f04237f13db1f06e2` | `1db3734b8988940acc6be8b992420a58fc39624a` | **HOLD** | A140 preservation source only; published Replit bytes not attested, NO_SYNC |

## 2. Since WAVE5 manifest: exact SHA delta / no silent rewrites

- **C01 #60, C02 #101, C03 #134, #105 diagnostics, #103 policy, #120 tests, #116 Replit:** HEAD SHA **UNCHANGED** relative to A10 WAVE 5 machine manifest.
- **Preflight #135:** WAVE5 JSON recorded older `2dd3e9f546ed2dc2d8ba662d36adcd859cf99288`. The existing A10 WAVE5 late addendum registered new HEAD `cfa69565ccf6bedb4f8e3e3b4be948132fb727ba`. It is STILL CURRENT. Exact Git compare `2dd3e9f...→cfa69565...`: 1 new commit, ahead1/behind0; one new documentation file `docs/web-005/agent-reports/A20/WAVE5/WAVE5_HANDOFF.md`, **no source/test modifications**. No new runtime source diff after addendum.
- PR #135 currently owns `scripts/qa/web005-local-readiness.mjs`, `scripts/qa/web005-local-readiness.test.mjs` and A20 WAVE4/WAVE5 docs, not A40 C03 files. **13 authored tests** at exact preflight test blob Git SHA-1 `177402bb4d9afaa08840839763764f8e502b0804`; earlier V8/prototype PASS does **not** equal exact native Node TAP PASS. A20 must execute it in approved isolated checkout.
- A140 #116 remains at WAVE5 registered `133e67fc079affabeb22c92f04237f13db1f06e2`; Replit *workspace* is not proof of actual *published* bytes. Zero approved live transfer, no overwrite.

## 3. C03 exact source, parent and changed-file DAG

**C01→C02→C03:** `#60@fa3261b2... → #101@a5bfd07b... → #134@80bb4ca7...`. Git `compare_commits(C02,C03)` shows **ahead 1 / behind 0 / exactly 2 modified paths**. Both files are byte-identical Git blobs of PR #100, which in turn descends from PR #66 that is already in C02.

| C03 replaced path | Old C02 Git blob SHA-1 | New C03 / PR100 Git blob SHA-1 |
|---|---|---|
| `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` | `c02ca0aa877017456142f081eff9e9f877522ca2` | `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` |
| `artifacts/api-server/test/backup-preclone-adapter.test.ts` | `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d` | `51b658b1775f88c5d00ff721247ec6ede49feb86` |

**DO NOT REAPPLY PR66 OR PR100.** Source conflict C02↔PR100 was resolved only by these exact C03 blobs; that is not a passed runtime integration. The module remains a pure adapter **NOT_WIRED** to actual Backup importer.
- **Next source collision:** PR #104 child of PR64 modifies the *other* two old C02/C03 Backup action-provenance source/test paths. It remains **outside C03**; requires native 21-case TAP and independent A60 review before any successor; no parent wholesale cherry-pick.
- **Other stacked paths retained outside C03:** #57→#102→#118→#131 Swiss (`swiss.ts` overlap #102/#118); #42→#119→#132 roster Undo; #63→#130 disabled Basket CAS; #103→#120 presentation tests; #100→#129 one-file Backup boundary tests. Old **15 direct conflict pairs** retain historical unresolved status.
- **C03 vs A20 #135 / A140 #116:** zero intersection of PR-local modified paths (separate `scripts/qa/web005-local-*` and `scripts/qa/a140-*`/docs). No file collision does NOT establish runtime compatibility or authorize copying from different GitHub release ancestry.

## 4. Strict QA ledger — no PASS invented

| Target / exact SHA | SOURCE QA | Native / CI evidence | Incomplete / FAIL |
|---|---|---|---|
| C03 #134 `80bb4ca7...` | A60 `C03_SOURCE_PASS`, exactly 2 matching PR100 blobs, scope no games/live/SQL | [GitHub Actions #39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753): **20/20 adapter target PASS, workspace typecheck PASS**, verified by independent A60 | **FULL WORKFLOW FAIL** on API integration exit1; independent A60 local pnpm/monorepo rerun NOT_RUN, real E2E/PG16 NOT_RUN |
| Preflight #135 `cfa69565...` | Source/test unchanged after prior late addendum, 13 authored current cases | Earlier author V8 11/11 and prototype Node 10/10 relate to older/nonidentical proof | **Current exact-head Node `node --test` NOT_RUN** by A10, A20 native receipt pending |
| Route #103 `9fb85b2c...` | Independently reproduced async `exists()` failure on pure policy | Prior 10/10 author pure tests do not cover Promise-negative | **NEEDS FIX**, A120 test-first source delta + A60 negative QA, no live host wiring |
| Diagnostics #105 `3beba777...` | A60 previous source finding: `Authorization: Basic` payload may remain unredacted in shared failure logs | Prior pure diagnostics/exit flush runs, but not Basic-negative accepted | **NEEDS FIX**, A50 test-first redaction delta then A30/A60 re-review; first authentic API `not ok` UNKNOWN |
| Presentation #120 | Test-only child of #103 | 12 synthetic PASS / 4 SKIP historical | Exact browser/direct-load and live Replit NOT_RUN |
| Replit #116 | Source preserve-only and transfer-gate manifest | No attested published tree | **HOLD / NO_SYNC**, no transfer authorized |

**A10 executed:** metadata HEAD readback 8 PRs, diff `compare_commits(C02,C03)` and `compare_commits(#135 previous,current)`, read-only `fetch_file` for both C03 blobs and existing A60 evidence; all source assertions passed. **No application tests, local Node TAP, pnpm, PostgreSQL, SQL, browser, live Replit or manual CI were executed by A10.**

## 5. Minimal actionable decisions for A40 / A60 / A20 / A00

1. **A40:** keep C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` FROZEN; do not create C04 or reapply PR100. Preserve 2-blob audit and A140 no-copy boundary; choose next minimum source composition only after A60 receipts.
2. **A60:** exact C03 source and targeted CI ACCEPTED, full API still FAIL. Validate new #135 native TAP when A20 has credible isolated runner; independently inspect future A50 Basic redaction and A120 async-exists fixes at their **new exact SHA**, not the current old SHA.
3. **A20:** for #135 `cfa69565ccf6bedb4f8e3e3b4be948132fb727ba`, run real `node --test scripts/qa/web005-local-readiness.test.mjs` only in trusted isolated, DB-free workspace; log Node version, exit and TAP. If unavailable, return a grounded `NOT_RUN/ENV_BLOCKED` and operator instructions; never call this environment READY on static source checks.
4. **A50:** fix Basic redaction in owned `qa/pack17` only with synthetic negative test-first vector; no product bug/root-cause claim until actual first failure TAP is obtained in separately approved PG16.
5. **A120:** fix pure #103 Promise/sync contract and test absent `.ttf/.wasm/.js` fail closed; do not alter #120 without explicit dependency review and never wire it into Replit hosting under W5R.
6. **A140/A00:** preserve Replit published versus workspace provenance, Steam/admin permissions, migrations and game assets. PG16 G0 remains HOLD; no protected merge, deployment or SWARM-006.

## 6. W5R_HANDOFF contract

**Agent:** A10 · **Task ID:** `WEB005-W5R-A10-SOURCE-PROVENANCE` · **Status:** DONE for current registry. **Base/HEAD SHA:** full table §1; primary base `a5bfd07b822c223fd995604dc2e228935ab81498`, primary HEAD `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`. **Modified paths:** ONE new docs Markdown only, `NO CODE CHANGES`. **PR/Issue:** no new code PR; handoff via Issue #75.
**Tests and env:** `NOT_RUN` native tests/SQL/PG16; tool-backed read-only exact SHA and diff metadata inspection only; verified existing automated run #39133034753 is `FAILURE` as a whole. **Defects:** confirmed #103 async exists and #105 Basic credential redaction; first API assertion/root cause unconfirmed. **Conflicts:** no C03 reapply, future PR104 overlaps 2 files, older 15 pairs unresolved. **Integration verdict:** `SOURCE_ONLY / READY_FOR_DB_FREE_QA`, not READY_FOR_INTEGRATION or release. **Next owner:** A40, A60, A20, A50, A120; final GO/NO-GO A00.

**STOP:** No merge/rebase, deploy, Replit live sync, PostgreSQL/SQL, games, production edits or unauthorized QA execution.
