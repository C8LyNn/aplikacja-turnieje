# WEB-005 — WAVE5_HANDOFF / A10 — Source Registry & Dependencies

**Task:** `WEB005-WAVE5-A10-SOURCE-REGISTRY` | **Status:** `DONE` for registry / `BLOCKED` for unconditional integration | **2026-10-18** | READ-ONLY application.

**Base SHA:** C01 `fa3261b2c9510e110ac9eba21726812d3401a525` → C02 `a5bfd07b822c223fd995604dc2e228935ab81498`; **HEAD SHA candidate:** C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`. **A10 changed code files:** `NO CODE CHANGES`. **PR:** no new application PR, docs-only artifact.
**Canonical machine manifest:** [51 tracked exact-SHA WEB-005 PRs](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB005_A10_WAVE5_SOURCE_MANIFEST.json) — source manifest blob `a717c9ceb9260b2d8dc57809612206ec2db5a728`.
**Verdict:** `WAVE5_REGISTRY_DONE / C03_CANDIDATE_QA_PENDING / FULL_API_FAIL / PG16_G0_NO_GO / NO_UNCONDITIONAL_READY_FOR_INTEGRATION / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Working candidate C01 → C02 → C03

| Composite | Exact HEAD | Verified source and QA | Outstanding |
|---|---|---|---|
| C01 [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | A60-accepted 426/426 native DB-free historical PASS | Original API integration exit1 unknown |
| C02 [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | 5/5 original source blobs; A40 static 15/15 | Full CI API exit1, integrated QA pending |
| **C03 [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134)** | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | A40 exact PR100 source replacement 2/2; official Actions #39133034753 **typecheck PASS + 20 adapter named tests PASS** | **Overall CI FAILURE API integration exit1**, A60 independent C03 acceptance pending; importer NOT_WIRED |

**C03 diff:** 1 commit ahead of C02, 0 behind, precisely two files: `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` Git blob `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` and `artifacts/api-server/test/backup-preclone-adapter.test.ts` blob `51b658b1775f88c5d00ff721247ec6ede49feb86`. They match exact PR100. **Do not integrate PR100 or its ancestor PR66 again.**

## 2. Readiness manifest

All 51 scoped PRs OPEN/DRAFT/UNMERGED in the captured GitHub snapshot (33 historical P01–P33 + 18 later composites/source/test PRs; excludes unrelated CC-001 and documentation-only support). Legacy SHA retained, no fabricated packet IDs.

| READY FOR QA | READY FOR INTEGRATION | NEEDS FIX | BLOCKED |
|---:|---:|---:|---:|
| 11 | 0 | 2 | 38 |

| PR | Exact HEAD | Decision |
|---|---|---|
| [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | **READY FOR QA — exact C03 independent A60 tests required** |
| [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) | `2dd3e9f546ed2dc2d8ba662d36adcd859cf99288` | **READY FOR QA — now 13 authored local preflight cases; native on latest SHA NOT_EXECUTED** |
| [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) | `35449b148aa782139a5327164cb6ed5d6aa3bfdd` | **READY FOR QA — 18/18 native PASS on exact SHA, full CI API FAIL, independent A60 pending** |
| [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) | `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` | **READY FOR QA — nested provenance 21 tests authored; actual native TAP pending, 2 C03 path overlaps** |
| [#118](https://github.com/C8LyNn/aplikacja-turnieje/pull/118) | `c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e` | **READY FOR QA — Swiss 2/2 new + 4/4 inherited A60 isolated PASS** |
| [#131](https://github.com/C8LyNn/aplikacja-turnieje/pull/131) | `1d8e8105ea7b601866ee9f7cd607d05bd241372a` | **READY FOR QA — dense-history/stage-local Swiss test-only; native not executed** |
| [#119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) | `b650a8e8de1841802c60f2af356bf0b404bd8018` | **READY FOR QA — Undo parser 11/11 A60 isolated PASS, DB/HTTP untested** |
| [#132](https://github.com/C8LyNn/aplikacja-turnieje/pull/132) | `fd3726aaa8c16a49b6ecd60e5b5e98782880f38e` | **READY FOR QA — earlier 15/15 pure PASS; later match-series test/current full tests pending** |
| [#102](https://github.com/C8LyNn/aplikacja-turnieje/pull/102) | `b2bbfd2bac32c81f2876138bf53273e61eccac0b` | **READY FOR QA — Swiss ancestor; A60 4/4 isolated PASS, do not double-apply** |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | **READY FOR QA — 12 synthetic PASS + 4 SKIP, browser not executed** |
| [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | **READY FOR QA historical — already in C03 verbatim; do not duplicate** |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | **NEEDS FIX — A60 reproduced Promise-returning `async exists` incorrectly marking absent static file** |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `3beba777627fa01ad46e83984915234a5d230046` | **NEEDS FIX — A60 proved Basic Authorization credential redaction gap, Wave4 only fixed process flush** |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `133e67fc079affabeb22c92f04237f13db1f06e2` | **BLOCKED — A140 21 transfer decisions, zero live transfers approved, published source not attested** |
| [#130](https://github.com/C8LyNn/aplikacja-turnieje/pull/130) | `295783b8d7af907a5adfe3c6a3c1d199e29408e9` | **BLOCKED — 10 authored frontend CAS tests, native not executed, server absent** |
| [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` | **BLOCKED — CAS frontend unmounted/OFF, persisted ETag/If-Match and T055 server absent** |
| [#89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) | `8b1b708d4b24cd94de4d15b2beed516b21da711a` | **BLOCKED — P0 physical PG16 fixture/authority, G0_NO_GO** |
| [#128](https://github.com/C8LyNn/aplikacja-turnieje/pull/128) | `da63a9adad4128d0e610474f72107b8f9eea1098` | **BLOCKED — PG16 design-only operator plan, never executed** |

## 3. Conflict DAG, parent/duplicate resolution

- **#60→#101→#134**: C03 already copies only PR100 two source/test blobs. C02/#101 ↔ #134 direct 2-path overlap resolved at *source level* in C03, not runtime acceptance; PR100 ↔ #134 is same data.
- **#64→#104**: old action-provenance source/test are still present in C03; new #104 has 2 overlapping paths, with 21 authored tests still requiring actual execution. This is the **next potential** integration patch only after A60/A50.
- **#100→#129**: new one-file 18-test Backup ingress boundary child; not a real authenticated importer or exportBackupV3 integration; whole #129 CI failed despite 18/18 target PASS.
- **#57→#102→#118→#131 Swiss**: #102 and #118 both touch `swiss.ts`; #131 test-only; include highest accepted source once. PR61 separate PG16 caller test.
- **#42→#119→#132 Undo**: roster source+parser and dependent tests; full transaction/HTTP/PG16 LIFO proof missing. Different from pure Backup action-provenance #104.
- **#63→#130 Basket CAS**: #130 test-only, client feature OFF, backend/migration unresolved.
- **later release→#103→#120 presentation**: async `exists` defect #103, 4 tests SKIP #120; Replit/live HTTP not tested.
- **#60 vs #105**: inherited Pack17 `run-gates.mjs` conflict; updated process flush in #105 did NOT repair Basic credential redaction; root C01 first failing API assertion still unknown.
- **A140 #116 and A20 #135**: QA/offline-only paths disjoint from C03 source, but later GitHub release ≠ Replit published bytes. Historic 15 direct file conflicts remain unresolved; no Replit sync.

## 4. Concrete next integration sequence for A40/A60

1. **Freeze exact C03** `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` and run A60 independent native combined adapter/provenance TAP + full workspace typecheck in approved isolated checkout. Do not start C04 before this acceptance. Preserve existing `CI_FAILURE_API_EXIT1` separately.
2. A20/A60 **real current preflight #135** SHA `2dd3e9f546ed2dc2d8ba662d36adcd859cf99288`; 13 authored cases on latest HEAD require native Node TAP. Earlier 11/11 V8 and 10/10 prototype do **not** certify this version. Enforce loopback-only Vite/API and record Node/pnpm/lock hash.
3. Then **PR104 two-file incremental provenance** onto C03 only after real 21/21 (or honest failures) and independent A60 security review; no duplicate parent #64 source.
4. Separate Swiss #118+#131 and Undo #119+#132 after targeted complete QA. Use PG16 only after A00/operator G0 and physical isolation; not an automatic part of C03.
5. PR129 only test-source intake with 18/18 native on its own SHA; PR130 stays CAS test-only/backend OFF; #103 async exists and #105 Basic log disclosure need minimal owner fixes and retests.
6. A140 source protection: GitHub later release SHA `1db3734b8988940acc6be8b992420a58fc39624a`, Replit workspace reported `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`, old published checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`; published bytes NOT_ATTESTED. PR116: 21 preservation entries, 0 approved live transfers, Steam auth/migrations/games preserved.
7. A00 final go requires authentic C01 API first failing TAP or certified PG16 reproduction, safe E2E tournament create→roster→stage→match→result, Undo, frontend bracket/stream and 38 WEB004 historical cases (9 original IDs missing). A60 Wave4 26/26 DB-free PASS plus 30/30 source-static are NOT full E2E.

## 5. WAVE5_HANDOFF contract / actual tests

**Actual A10 actions:** GitHub PR statuses/HEAD snapshots (51/51 records), `compare_commits(C02,C03)` 1 ahead/0 behind with exactly 2 files, two direct blob `fetch_file` SHA-1 matches, read-only GitHub Actions logs #39133034753/#39133733273, dependency/path comparisons. **App native tests by A10:** `NOT_EXECUTED`; API/SQL/PG16/browser: `NOT_EXECUTED`; no manually started CI.
**Actual external receipts:** [C03 GitHub Actions #39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) typecheck and named pure adapter tests PASS, full FAIL API exit1; [PR129 Actions #39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273) 18/18 native PASS but full FAIL; [A60 Wave4](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB005_WAVE4_HANDOFF.md) 26/26 native DB-free + 30/30 source-only PASS, E2E not run.
**Readiness for integration:** `CONDITIONAL` for continued isolated verification/possible future approved C04 source; **`NO`** for immediate protected merge, deploy or SWARM006. **Next owners:** A40 next composite; A60 independent C03 QA; A20 local preflight; A50 first real API failure; A70/A80/A90/A110/A120 component QA; A140 preserve live; A00 owner GO/STOP.
**Stop:** NO CODE CHANGES, no game edits, merge, rebase, SQL/migration, destructive DB, Docker, GitHub→Replit live sync, paid CI rerun or SWARM006.
