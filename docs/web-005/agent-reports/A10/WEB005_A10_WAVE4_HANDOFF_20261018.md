# WEB-005 — A10 / WAVE4_HANDOFF — Integration Readiness

**ROLE:** A10 — Source Registry & Governance · **TASK:** WEB005-WAVE4-A10-REGISTRY · **STATUS:** DONE (read-only application, docs-only publication) · **Date:** 2026-10-18.

**BASE SHA:** C01 `fa3261b2c9510e110ac9eba21726812d3401a525` → C02 `a5bfd07b822c223fd995604dc2e228935ab81498`; later GitHub release `1db3734b8988940acc6be8b992420a58fc39624a` (different from Replit live). **CHANGED PATHS:** NO CODE CHANGES; this A10 report only. **PR:** no new application Draft PR.
**VERDICT:** `WAVE4_A10_SOURCE_REGISTRY_READY / C02_QA_PENDING / PR100_CONDITIONAL_FIRST_PATCH / NEEDS_FIX_103_105 / PG16_G0_NO_GO / REPLIT_NO_SYNC / RELEASE_NO_GO`.

## 1. Exact SHA manifest and readiness — 22 verified OPEN DRAFT UNMERGED PRs

| PR | Exact HEAD SHA | Base SHA | Queue | Description / scoped evidence |
|---|---|---|---|---|
| [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **BLOCKED** | C01 source, original API exit1 |
| [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **HISTORICAL** | Undo parent #119 |
| [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **HISTORICAL** | Swiss parent #102 |
| [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **BLOCKED** | Basket CAS client OFF, 43 authored tests no native |
| [#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **HISTORICAL** | Original provenance already in C02; partial successor #104 |
| [#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **HISTORICAL** | Original adapter already in C02; partial successor #100 |
| [#89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) | `8b1b708d4b24cd94de4d15b2beed516b21da711a` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **BLOCKED** | PG16 fixture P0, G0_NO_GO |
| [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | `7490c974b7c84404559fd590bd09817a71c2134f` | **READY CONDITIONAL** | 20/20 targeted CI PASS, full CI API exit1 |
| [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **BLOCKED** | C02 exists, 5 exact blobs, overall CI FAIL |
| [#102](https://github.com/C8LyNn/aplikacja-turnieje/pull/102) | `b2bbfd2bac32c81f2876138bf53273e61eccac0b` | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | **READY QA** | A60 isolated 4/4, ancestor of #118 |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `1db3734b8988940acc6be8b992420a58fc39624a` | **NEEDS FIX** | A60 confirms async exists incorrectly maps missing resource to static |
| [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) | `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | **NEEDS QA** | 21 authored, native NOT_EXECUTED; C02 2-file overlap |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `259f8be0190e131e577fdc22425c236d292e9dae` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **NEEDS FIX** | 16/16 pure; Basic auth log redaction gap unchanged |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `a0f1d8066bbcf4e4b602cb587aebf599e327d067` | `1db3734b8988940acc6be8b992420a58fc39624a` | **BLOCKED** | 8/8 synthetic; actual Replit checkpoint unverified |
| [#118](https://github.com/C8LyNn/aplikacja-turnieje/pull/118) | `c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e` | `b2bbfd2bac32c81f2876138bf53273e61eccac0b` | **READY QA** | A60 isolated 2/2 new +4/4 inherited PASS |
| [#119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) | `b650a8e8de1841802c60f2af356bf0b404bd8018` | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | **READY QA** | A60 isolated parser 11/11 PASS, DB/HTTP not run |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | **NEEDS QA** | 12 synthetic PASS/4 SKIP; depends on unwired #103 |
| [#128](https://github.com/C8LyNn/aplikacja-turnieje/pull/128) | `da63a9adad4128d0e610474f72107b8f9eea1098` | `1db3734b8988940acc6be8b992420a58fc39624a` | **BLOCKED** | PG16 operator design only; no environment launched |
| [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) | `a8a04f7f6656ec02c2baa0ac1027b39192da743d` | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | **READY QA** | 14/14 isolated V8 TS-erasure (not native TAP) |
| [#130](https://github.com/C8LyNn/aplikacja-turnieje/pull/130) | `34346eeed607df1d8cbc3bea0c3fb33874f2fc6f` | `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` | **BLOCKED** | 8 authored CAS tests, CI fails Pack19, target not run |
| [#131](https://github.com/C8LyNn/aplikacja-turnieje/pull/131) | `1d8e8105ea7b601866ee9f7cd607d05bd241372a` | `c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e` | **READY QA** | Swiss test-only, native NOT_EXECUTED |
| [#132](https://github.com/C8LyNn/aplikacja-turnieje/pull/132) | `0d49af511600b8d6199fcd915f62bc1995bfd6fe` | `b650a8e8de1841802c60f2af356bf0b404bd8018` | **READY QA** | 15/15 pure parser isolated PASS; HTTP/DB not run |

*READY CONDITIONAL* means eligible for a separate A40 source QA composition only, **not** a merger or release. *READY QA* is even narrower. Prior original PR SHA records remain immutable; new test-only children have not replaced their parents in release.

## 2. Changed-file collisions, duplication and supersession

- **C02 #101 vs #100:** 2 shared changed paths: `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`, `artifacts/api-server/test/backup-preclone-adapter.test.ts`. C02 holds the older PR66 version; #100 supersedes that implementation only, not the parent provenance. Patch only the child source/test diff after review.
- **C02 #101 vs #104:** 2 shared paths: `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts`, `artifacts/api-server/test/backup-v3-action-provenance.test.ts`. C02 holds older PR64 version. Source correction #104 has 21 tests AUTHORED, native missing. Do not cherry-pick entire PR64 history.
- **Swiss direct overlap:** #102 and #118 modify `artifacts/api-server/src/domain/tournament/swiss.ts`. Dependency is **PR57 → PR102 → PR118 → PR131**; #131 adds ONLY `artifacts/api-server/test/swiss-wave3-contract-regression.test.ts`, 209 lines, zero production code. Do not apply #57/#102 twice. PR61 is separate, potentially DB-destructive caller test.
- **Undo:** **PR42 → PR119 → PR132**. #119 replaces unvalidated persisted Undo roster snapshots with allowlisted parser and touches `artifacts/api-server/src/application/players/tournament-roster.ts`; #132 adds `artifacts/api-server/test/roster-undo-wave3-boundaries.test.ts` and docs ONLY. These are not duplicates of Backup action-provenance #104.
- **Backup tests:** **PR66 → PR100 → PR129**. #129 adds just `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts` (14 synthetic tests); cannot independently qualify real import/issuer or be included before #100.
- **Frontend CAS:** **PR63 → PR130**, new `artifacts/tournament-manager/src/lib/stage-basket-cas-wave3.test.ts` (8 tests AUTHORED). CAS server persisted revision, strong ETag GET/If-Match PUT and T055 migration are absent; feature OFF. No backend code change.
- **Presentation:** later GitHub release → #103 → #120, two route presentation test files. PR103 is UNWIRED and fails async-exists negative test; PR120's 4 source/React tests SKIP. No claim of real live HTTP fix.
- **A140 #116:** independent `scripts/qa/a140-source-preservation.mjs`, own test and docs: **zero direct changed-file intersection** with C02/#100/#104/#118/#119/#129/#130/#131/#132. Replit published-tree SHA and Steam/migration preservation still not verified; no automatic sync.
- **CI #105:** new WAVE3 HEAD `259f8be...` changes **docs only** compared with `30314bab...`; the diagnostic `failure-evidence.mjs` Git blob remains `e8a6310305d78fe0c3dad857b9760a80388b6c09` with confirmed `Authorization: Basic ...` leak. Needs actual source/privacy fix; 16/16 positive tests do not cover this defect.
- **Legacy:** 15 older overlapping PR pairs remain unresolved. See [original A10 conflict DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_CONFLICT_DAG.json). Not re-audited because no new reason to repeat R23H.

## 3. Exact QA ledger, separating results from execution gaps

| Feature | Actually observed PASS / FAIL | NOT EXECUTED or restricted |
|---|---|
| #100 Backup adapter | Automatic named 20/20 and workspace typecheck PASS; full workflow API integration FAILED | Combined C02 successor QA |
| #118 Swiss | Independent A60 isolated 2/2 new + 4/4 inherited PASS | Full monorepo typecheck/PG16; own CI fails inherited Pack19 |
| #119 Undo parser | A60 isolated 11/11 PASS, isolated strict tsc PASS | Route JSON parse, DB transaction, LIFO races, rollback |
| #132 Undo extra test | A70 isolated 15/15 PASS, isolated tsc PASS after corrected expected test result | Full repo, HTTP and PG16 tests |
| #120 Presentation | A60 12 synthetic PASS / 4 source tests SKIP, exit0 | Browser live and full checkout tests |
| #103 Routing | A60 authored 10/10 pure PASS **plus independent async predicate negative FAIL** | Real Replit adapter/browser/live |
| #105 Diagnostics | A50 + A60 16/16 pure Node PASS on identical source blobs; **Basic auth redaction negative FAIL** | First actual API integration failing assertion unknown, PG16 not run |
| #104 Undo provenance | A70 10/10 static source checks, 21 tests written | Full native 21-test TAP/typecheck NOT_EXECUTED |
| #129 Backup profile seam | A90 14/14 V8 TS-erasure synthetic PASS | Native Node TAP, actual parser/issuer/importer NOT_EXECUTED |
| #130 Basket CAS | 8 tests written; auto run 39128460321 failed inherited Pack19 | Target tests NOT_EXECUTED, server CAS missing |
| #131 Swiss stage/BYE | WAVE3 source only (18/32/64/65/66/128 cases) | Native TAP/typecheck NOT_EXECUTED |
| #116 Replit | 8/8 synthetic inventory-tool PASS; intentional CLI HOLD/exit2 | Authentic published-source comparison NOT_ATTESTED |
| #101 C02 | 5 exact blobs and A40 15/15 static PASS | Actual full CI API integration exit1, independently accepted end-to-end C02 NOT TESTED |

## 4. A40 integration queue — minimize opened work

1. **FIRST conditional patch:** #100 over C02 #101 **only its own two source/test paths**, after A00 scope permission; A60 confirmed source with conditions/20 targeted CI cases. Freeze source old/new blob SHA and run combined pure test + typecheck on NEW composite. Do not change A40 active branch from A10.
2. **SECOND after tests:** #104 nested authority denial, only its own two source/test files after A50 executes 21 actual tests and A60 independent QA. No importer connection, no implicit Backup release.
3. **Separate Swiss batch:** latest algorithm #118 and new regression contract #131, preserving #57/#102 ancestry. Required first: #131 native TAP/typecheck; >16 dense history/65 BYE/stage locality, no unverified global optimality claims.
4. **Separate Undo batch:** #119 + #132, including route-level malformed `JSON.parse` handling as a narrow future bugfix ticket, plus transaction/race QA when physically safe PG16 available.
5. **Test-only review without a new composite:** #129 Backup boundary (native tests), #130 Basket CAS (native tests, backend blocked), #128 operator PG16 plan (design). Avoid creating new branches just to accumulate unexecuted synthetic tests.
6. **Needs-fix before future wiring:** #103 sync boolean guard + async negative test; #105 shared CI Basic credential redaction negative test and code fix. #120 full four source tests need full checkout; #116 needs attested published Replit checkpoint. Do not update live.
7. **Hard STOP:** PG16 #89 P0/G0, D01–D04 unresolved; 38 WEB-004 cases have nine missing original IDs; issuer/auth/Undo/rollback security not wired; original C01/C02 API integration exit1 root cause still unknown. No `FINAL_HANDOFF_GO`.

## 5. WAVE4_HANDOFF contract — evidence and next owners

**Agent:** A10. **Task:** WEB005-WAVE4-A10-REGISTRY. **Status:** DONE for registry, C02 integration BLOCKED. **Base SHA:** C01 `fa3261b2...`, C02 `a5bfd07b...`; **HEAD SHA:** see 22 exact rows, plus docs commit. **Changed files:** one new A10 Markdown, NO CODE CHANGES. **Test commands/results:** A10 read GitHub PR metadata and compared dependencies/paths; **A10 executed NO native app, Docker, SQL, CI or browser tests**. Results in §3 are prior actual receipts with owners, not new A10 PASS. **PR:** no code PR; this report. **Conflicts:** C02/#100 (2 paths), C02/#104 (2), Swiss #102/#118 (1), old 15, Replit ancestry. **Next owner:** A40 source candidate and QA composite; A60 exact-SHA independent combined QA; A50 first real C01 failure; A80 Swiss; A70 Undo; A110 CAS; A140 published-source manifest; A00 owner GO/STOP.
**Boundaries:** no merges, rebase, application/game edits, production data, migration, destructive SQL, Docker, CI rerun, live/Replit deploy or SWARM-006.
