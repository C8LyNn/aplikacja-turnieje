# WEB-005 — A70 / DEVELOPMENT FIRST / WAVE 3 — test-only scope preflight

**ROLE:** A70 — Match Lifecycle & Undo  
**TASK:** WAVE3 T040 — Undo regression boundary tests  
**STATUS:** DONE / TEST_ONLY / NO CODE CHANGES / NO PG16  
**Date:** 2026-10-18, Europe/Warsaw  
**Exact base:** [PR #119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) HEAD `b650a8e8de1841802c60f2af356bf0b404bd8018`  
**Isolated branch:** `test/web-005/t040-wave3-undo-regression-boundaries`

## Exclusive allowed paths — published before new test implementation

1. NEW `artifacts/api-server/test/roster-undo-wave3-boundaries.test.ts` — pure test-only synthetic input validation and missing/stale/replay provenance boundary for existing parser at PR #119.
2. NEW `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE3_HANDOFF.md` — this preflight and final succinct handoff.

Both target paths verified absent at base. **NO changes** to `tournament-roster.ts`, `roster-undo-payload.ts`, PR #119/#104, A40 #101 or A140 #116. PR #101's changed files (preclone adapter + action provenance and tests) do not overlap these new A70 files.

## Testing boundary and non-goals

Pure parser tests can establish fail-closed malformed persisted objects, permitted historical fields, clone/CAS-looking token rejection, deterministic repeated parsing and lack of input mutation. They **cannot establish server idempotence**, stale global latest Undo 409, actor authorization, MVCC lock behavior or SQL rollback. Those are database-backed functional invariants and remain **NOT_EXECUTED/PG16_HOLD**, even if the pure test suite passes. Existing PR #42/#119 PG16 integration definitions should remain unchanged and must be run only when a disposable physically isolated PG16 executor is separately approved.

The `undo-last` HTTP route currently performs `JSON.parse(lastAction.undoPayload)` outside the roster-service parser; invalid raw JSON is a distinct failure path and not automatically handled by this new pure suite. Note it as a potential future route task; **do not edit routes** in WAVE3.

**WAVE3_HANDOFF final fields:** ROLE | TASK | STATUS | BASE SHA | HEAD SHA | CHANGED PATHS | TEST COMMANDS + RESULTS | PR/LINK | CONFLICTS | NEXT OWNER.

**STOP:** no game logic/assets, production SQL/PG16/Docker, migrations, merge, live deploy, Replit sync or SWARM-006.

## WAVE3_HANDOFF — FINAL EXECUTION RECEIPT

| Contract field | Confirmed value |
|---|---|
| ROLE | A70 — Match Lifecycle & Undo |
| TASK | `WEB-005-T040-A70-WAVE3-UNDO-REGRESSION` — pure boundary test-only |
| STATUS | **DONE — ISOLATED_PURE_TEST_15_PASS**, full integration **NOT_RUN** |
| BASE SHA | PR #119 `b650a8e8de1841802c60f2af356bf0b404bd8018` (unchanged, OPEN DRAFT) |
| HEAD SHA | Source/tests before final report: `d3fcdf1b3cd962efb58e9de3b1888e54f297f43a`; final new HEAD is the **report-update commit** (must verify live PR #132 head) |
| CHANGED PATHS | Exactly **two NEW** files: `artifacts/api-server/test/roster-undo-wave3-boundaries.test.ts`; `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE3_HANDOFF.md`. **NO CODE CHANGES** to parser, roster service, route or any existing files. |
| PR/LINK | [DRAFT #132](https://github.com/C8LyNn/aplikacja-turnieje/pull/132) — stacked **test-only** child of PR #119; 0 merge, no PR119/104 writes |
| CONFLICTS | No file overlap with active A40 #101 or A140 #116, nor #119/#104 source files. Historical source LIFO/PG transactional behavior outside test-only scope |
| NEXT OWNER | **A60** independent test quality/source QA on final SHA; **A10** append-only register #132 under #119; **A40** do not cherry-pick into C02 before owner/QA; **A50/A20** later isolated PG16 integration only with explicit safe operator GO |

### Source & test provenance

- Exact existing PR119 pure parser Git blob: `8acb76e19a49274dcaa07349b7c7aeb1c2d330fd`, **unchanged**.
- New additional test source Git blob: `6a07b5f77a41793e7ea10887632cc4b35cccd579`. The first test commit `ca0f8af2484eb74074094e54e4b8b9a2856723b6`; a test-only correction `d3fcdf1b3cd962efb58e9de3b1888e54f297f43a`. No application implementation commits.
- Container-local source and new test were individually canonical Git-hash checked against the exact above blobs. **Only the test import specifier** was changed in the executable copy (from the repo-relative extensionless `../src/application/players/roster-undo-payload` to local native-Node `../src/roster-undo-payload.ts`); all assertions/fixtures otherwise identical to the GitHub file.
- First actual native run `node --experimental-strip-types --test /mnt/data/t040_wave3_localqa/test/roster-undo-wave3-boundaries.test.ts`: **EXIT 1 / TAP 14 PASS, 1 FAIL**. That failure was a faulty assertion treating `Number.NaN` after `JSON.stringify` as invalid when JSON has normalized it to legal `seed:null`; **not** proof of a parser bug. Original raw test log SHA256 `3bce4c8962dd15b563c1d0fccee2d1280cf7798001a93d678c2de337c9ae26a6`.
- Corrected **test expectation only** and reran **the same command** with Node `v22.16.0`: **EXIT 0 / TAP 15 PASS, 0 FAIL, 0 SKIP, 0 CANCEL**. Corrected raw TAP log SHA256 `9ac48de7d261bf2f1436d11271ef0e278db87b6baba556e1055d804e40ea492a`.
- `tsc --strict --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022 /mnt/data/t040_wave3_localqa/src/roster-undo-payload.ts`: TypeScript `5.8.3`, **EXIT 0** for the existing pure parser. **Not** whole-repo typecheck; not test-file typecheck.
- Full `pnpm --filter @workspace/api-server typecheck`, `pnpm --filter @workspace/api-server exec node --import tsx --test ...`, HTTP/API server, true repeated Undo/409 status, concurrent stale transaction, SQL rollback, PG16, browser: **NOT_EXECUTED**.

### Coverage and non-authorized paths

The 15 new pure test blocks check deterministic repeated parsing, legal modern and sparse historical snapshots, absence of input mutation, missing identity/prevData, stale/foreign source CAS keys, action-type mismatch, status/tenant/identity injection, invalid and boundary integer IDs, corrupted raw JSON syntax, `__proto__` injection, invalid nested snapshots, nullable scalar behavior, and simulated caller interruption *before DB writes*. Passing these does **not** prove HTTP replay/idempotence, actual `UNDO_ACTION_CHANGED` or rollback; those conditions are covered by existing PR42/PR119 authored integration fixtures and await owner-approved **physically isolated PG16** test execution.

**Source-confirmed limitation (no code patch permitted):** `undo-last` route invokes `JSON.parse(lastAction.undoPayload)` **before** roster service parsing. A corrupted raw JSON string therefore throws before the new guarded parser, with HTTP error mapping not established by this test. The JSON NaN→null transformation is an ordinary JSON serialization property and cannot be reconstructed as NaN by downstream parser. Any route-level remediation is separate future GO.

**Integration / security status:** Independent A60 exact new SHA review **PENDING**. WAVE 3 performs no R23H broad audit, does not resolve earlier full-app A50 test debt, and never authorizes integrating this stacked test candidate independently into C02. **No game files, SQL, Docker, schema/migrations, merge, live/Replit, paid CI or SWARM-006.**

**Final verdict:** `WAVE3_HANDOFF / DONE / NO_CODE_CHANGES / PURE_15_OF_15_PASS / FULL_APP_QA_NOT_RUN / RELEASE_NO_GO / SWARM006_HOLD`.


---

## WAVE4_HANDOFF — 2026-10-18 · match result validation / Undo integration readiness

**AGENT | TASK | STATUS:** A70 Match Lifecycle & Undo | WEB-005-T040-A70-WAVE4-SERIES-PARITY | **PARTIAL — DB-FREE TESTS DONE / FULL UNDO RUNTIME NOT EXECUTED / NO PRODUCTION CODE CHANGES**.

**Existing candidate reused to reduce PR proliferation:** [PR #132](https://github.com/C8LyNn/aplikacja-turnieje/pull/132), OPEN DRAFT; Wave4 starting HEAD **0d49af511600b8d6199fcd915f62bc1995bfd6fe**, PR base [#119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) **b650a8e8de1841802c60f2af356bf0b404bd8018** (both PR119 and PR104 remain unchanged). New Wave4 test addition commit **999dbf3ec52a3feb02586f2bf2934b9bf822f4a1**; use live PR132 HEAD **after this handoff commit** as the final SHA. Original release PR42 exact parent **021bed269f9ea8ac8ce53caeea44263c098aa2dd**.

**WAVE4 CHANGED PATHS (relative to WAVE3 HEAD, exact allowlist prepublished on PR132):**
1. **NEW** `artifacts/api-server/test/match-lifecycle-series-parity.wave4.test.ts` — Git blob **4576094c48a73aa35c5ccf487794d79dee2a8e83**, six pure node:test blocks.
2. **EXISTING A70-owned documentation** `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE3_HANDOFF.md` — only this Wave4 append. **NO CODE CHANGES** to `series-result.ts`, `complete-match.ts`, `revert-match.ts`, roster Undo, routes, PR119/104, A40/140 source, DB or games.

**Source contract:** production pure `artifacts/api-server/src/domain/match/series-result.ts` blob **3aa22ad7b4b5acb887a5d45e5f338dbd20e63a1a** is imported by **both** `complete-match.ts` and `revert-match.ts`. Older `test/series-result.test.ts` blob **b1f1a291af213bfc4f134c338f4070ec2e402125** exercised example BO1/3/5/7 cases; new W4 unit tests add exhaustive and boundary coverage without duplicating the existing DB integration suite.

**Actual test execution (verified identical canonical Git blob before local import adjustment):**
- Source byte-for-byte local Git blob SHA **3aa22ad7b4b5acb887a5d45e5f338dbd20e63a1a**; new test original byte-for-byte local blob **4576094c48a73aa35c5ccf487794d79dee2a8e83**. Native Node isolated copy changed **only** the test import specifier to `../src/series-result.ts` to resolve the same untouched function in a minimal workspace; all assertions/data remain identical.
- Node v22.16.0: `node --experimental-strip-types --test /mnt/data/t040_wave4_localqa/test/match-lifecycle-series-parity.wave4.test.ts`: **EXIT 0; TAP 6 tests / 6 PASS / 0 FAIL / 0 SKIP**, raw log SHA256 **fa4c726f6c723620e8b8c855e579a9b499c6768842f2a3422de9a51db08168ff**.
- TypeScript v5.8.3: `tsc --strict --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022 /mnt/data/t040_wave4_localqa/src/series-result.ts`: **EXIT 0**, isolated shared domain module only; not the complete application/test typecheck.
- W4-S01: 1056 legal BO1–63 completed score configurations derive exactly one consistent winner; W4-S02: 590 premature/tied checks rejected; W4-S03: all BO1–63 simultaneous threshold and overrun cases rejected; W4-S04: negative/noninteger/NaN/infinite inputs rejected; W4-S05: repeated validation deterministic and input remains frozen; W4-S06: int32 PG bestOf edge numerically stable.
- Earlier WAVE3 15/15 pure parser result remains historical separate evidence; **WAVE3 tests were NOT rerun as part of WAVE4**.
- **PROPOSED for A50 after owner/A20 approval (NOT EXECUTED):** `pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts`; require explicitly isolated PG16 TEST_DATABASE_URL, dedicated disposable schema, and signed scoped reset permission; capture real response counts/SQL snapshots. **NOT EXECUTED:** complete monorepo `pnpm --filter @workspace/api-server typecheck`, API routes, genuine Complete → Revert → Complete, repeated Direct Revert/Undo 200/409, CAS revision conflicts, PostgreSQL LIFO transactions, rollback/fault injection, C01/C02 or Replit/live. Existing original `revert-match.integration.test.ts` contains such source-authored scenarios, but their physical PG16 test receipts are still missing. No such results are asserted as PASS.

**ISSUES / CONFLICTS / NEXT OWNER:** There is no file conflict with A40 PR101 or A140 PR116. Existing PR51/PR42 both change `routes/tournaments.ts` and `test/revert-match.integration.test.ts`, so no new writes were made to those files. The route's earlier source-confirmed malformed Undo JSON behavior still requires a separately reserved route owner/GO; this test candidate neither fixes nor masks it. **A60** independently review final PR132 SHA and provenance/scope; **A10** update exact manifest for PR132 child of PR119/42; **A40** consider it only after QA, avoid cherry-pick conflicts and retain C01 failures; **A50/A20** later run actual integration/rollback only in approved disposable PostgreSQL16. No unapproved source composite merge.

**Final A70 verdict:** `WAVE4_HANDOFF / PARTIAL / SOURCE_TEST_ONLY / DB_FREE_SERIES_TEST_6_PASS / FULL_APP_AND_UNDO_RUNTIME_NOT_TESTED / INDEPENDENT_A60_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
