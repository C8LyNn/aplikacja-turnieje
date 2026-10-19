
## Immutable W6A source snapshot / A10

**Task:** `WEB005-W6A-A10-IMMUTABLE-SOURCE-DELTA` · **Role:** A10 — Source Registry & Governance · **Status:** DONE / read-only docs · **Date:** 2026-10-19.
**Document:** `docs/web-005/agent-reports/A10/W6A_A10_IMMUTABLE_SOURCE_DELTA.md`; **dispatch:** https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit.
**W6A_HANDOFF verdict:** `SOURCE_DELTA_READY / C03_FROZEN / ONE_FILE_PR129_ALLOWLIST_PREPARED / A60_COMBINED_QA_PENDING / A00_C04_NOT_AUTHORIZED / API_FULL_FAIL / PG16_G0_HOLD / REPLIT_NO_SYNC / RELEASE_NO_GO`.

## 1. Exact source BASE and HEAD SHA (10 active Draft PRs)

All ten PRs are `OPEN/DRAFT/UNMERGED` at the captured GitHub snapshot. Concurrent SHA changes require later re-verification before integration.

| PR | Full HEAD SHA | Full BASE SHA | Source branch → base branch |
|---|---|---|---|
| [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | `integration/web-005/r23c-composite-b1-20261015` → `release/tournament-ops-20261013-01` |
| [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `fa3261b2c9510e110ac9eba21726812d3401a525` | `integration/web-005/c02-dbfree-pure-source-20261018` → `integration/web-005/r23c-composite-b1-20261015` |
| [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | `a5bfd07b822c223fd995604dc2e228935ab81498` | `integration/web-005/wave4-c03-pr100-dbfree-20261018` → `integration/web-005/c02-dbfree-pure-source-20261018` |
| [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) | `35449b148aa782139a5327164cb6ed5d6aa3bfdd` | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | `test/web-005/a90-wave3-raw-preclone-strict-boundary` → `fix/web-005/t060-development-first-sync-validator-ports` |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `52db060c13999f4664fa51d2c965c264a045bc2d` | `fa3261b2c9510e110ac9eba21726812d3401a525` | `fix/web005-c01-api-first-failure-evidence` → `review/web005-c01-api-recovery-base` |
| [#142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `fix/web-005/a120-w5r-route-async-exists-20261018` → `feat/web-005/a120-development-first-static-route-policy-20261018` |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `1db3734b8988940acc6be8b992420a58fc39624a` | `feat/web-005/a120-development-first-static-route-policy-20261018` → `release/tournament-ops-20261013-01` |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `test/web-005/a120-wave2-presentation-route-reload-20261018` → `feat/web-005/a120-development-first-static-route-policy-20261018` |
| [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) | `c625c8cbc93869ecbb24919f34148fea38179a76` | `1db3734b8988940acc6be8b992420a58fc39624a` | `feat/web005/a20-wave4-local-readiness-20261018` → `release/tournament-ops-20261013-01` |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `e89798e5a553c738428d61e37a20dc72685f7e8e` | `1db3734b8988940acc6be8b992420a58fc39624a` | `feat/web005-a140-development-first-preservation-20261018` → `release/tournament-ops-20261013-01` |

## 2. W5R→W6A change log, without overwriting history

- C01 #60 `fa3261b2c9510e110ac9eba21726812d3401a525`, C02 #101 `a5bfd07b822c223fd995604dc2e228935ab81498`, C03 #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`, test PR129 #129 `35449b148aa782139a5327164cb6ed5d6aa3bfdd` remain the frozen input chain. Preserve the earlier A10 51-PR source registry and original packet SHA.
- PR #135 is currently `c625c8cbc93869ecbb24919f34148fea38179a76`, later than the last W5R snapshot. A20 W5R independently executed **native Node 22 preflight 13/13 PASS, exit 0** on file blobs script `5a61ef4c88d57d673c6558b242aed87c479a40d0` and test `177402bb4d9afaa08840839763764f8e502b0804`. Its **full workspace project preflight failed closed with exit 2** in an incomplete copy; Node/pnpm full monorepo, app startup and DB-free suite remain `OPERATOR_REQUIRED / NOT_RUN`.
- PR #105 is now `52db060c13999f4664fa51d2c965c264a045bc2d`. Previous A30 security-reviewed SHA `be2b9557e7c555925b1c1e64755042e35c536932` had **10 confidentiality negative tests, 5 PASS / 5 FAIL, genuine exit 1** for quoted Basic synthetic logs, while A60 on that old SHA got **23/23 standard supported patterns PASS + 3/3 true exit/STOP PASS**. A50 subsequently authored a **new quoted Basic test-first patch** (`qa/pack17/failure-evidence.mjs` blob `6978ff19a40cc9f43413599d6a319ee26b7f80b5`, `failure-evidence-w6a.test.mjs` blob `6e4d9f230f1c6abd70d18127d1721978bb2cb5ec` at observed revision `4a2c398625490a228a18769e1097442aabb2da4a`). **New exact-HEAD A30+A60 independent acceptance is PENDING; old FAIL and narrow PASS cannot be inherited or erased.**
- #142 `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` was accepted by A60 **17/17 native source-only PASS** on byte-verified source, but has no actual Replit/hosting adapter. #120 is sibling on original #103, not descendant of #142. #116 changed after prior A10 registry and remains A140 NO_COPY, published Live bytes UNKNOWN.

## 3. Exact C01 → C02 → C03 provenance

Git compare C02 `a5bfd07b822c223fd995604dc2e228935ab81498` → C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`: **ahead1 / behind0 / TWO modified source/test files**, matching PR100 exactly; PR66 parent is already incorporated in C02. **DO NOT REAPPLY #66 OR #100**.
| C03 changed file | New Git blob SHA-1 |
|---|---|
| `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` | `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` |
| `artifacts/api-server/test/backup-preclone-adapter.test.ts` | `51b658b1775f88c5d00ff721247ec6ede49feb86` |
C03 [official Actions 39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753): **full workflow FAILURE: API integration exit1**, workspace typecheck PASS and some DB-free contracts PASS. Historical targeted adapter 20/20 PASS reported, but A60 W5R did not independently reauthenticate standalone 20/20 TAP from the decoded combined log. **No full E2E/PG16/release PASS; first failing real API assertion UNKNOWN.**

## 4. One-file immutable #129 allowlist: prepared, NOT approved for C04

| Admission field | Exact source/QA state |
|---|---|
| Frozen parent | C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` |
| Test PR #129 and its own parent | HEAD `35449b148aa782139a5327164cb6ed5d6aa3bfdd` / PR100 BASE `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` |
| **ONLY future allowed path** | **`artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`** |
| Git blob SHA-1 | **`643fcc876d793b9d86c5d3700f599c4eab88c8db`** |
| Path at C03 | **ABSENT (authenticated GitHub fetch 404)**; old blob `null`, propose **ADD 1 file only** |
| PR129 compare to PR100 base | **4 commits ahead / 0 behind, ONE added file, 371 lines**; cherry-pick of full ancestry FORBIDDEN |
| Required PR100 source already in C03 | adapter `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` and test `51b658b1775f88c5d00ff721247ec6ede49feb86` |
| PR-specific native tests | [Actions 39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273): **18/18 native PASS**, typecheck PASS; **entire workflow API integration FAIL** |
| Independent A60 #129 negative/source acceptance **for C03 successor** | **PENDING**; earlier acceptance only CONDITIONAL_TEST_ONLY |
| Actual combined C03+129 TAP/typecheck and integrated SHA | **NOT_RUN / NO_C04_EXISTS** |
| Operator environment preflight | **OPERATOR_REQUIRED** (trusted complete Node22/pnpm checkout, sanitized environment), not yet READY |
| A00 separate permission to create C04 Draft | **NOT_GRANTED** by W6A dispatch |
| Gate | `ALLOWLIST_READY_FOR_QA / CODE_COMPOSITION_HOLD` |
**Enforce exact path-only change:** reject additional file, all code/route/migration/package/lock/Steam/game/Unity/Replit/OBS changes, and parent #66/#100 duplication. Never assume no source overlap means compatible runtime or permission to merge.

## 5. Excluded source packages and active conflicts

- PR142 direct diff from #103 contains **2 paths** (modified `scripts/deployment/static-route-policy.mjs`, added `scripts/deployment/static-route-policy.async-exists.test.mjs`), but standalone source-only port would need **3 blobs** (plus original inherited test). Blobs: helper `1b023671cd68116bb3876d1ef11d057c28a59265`, original test `e6d3312f1ed951dacf307b9bfda42a9b655071c4`, new async test `d1f86241b55dd9198bfdb8528d97fc9c02d7b113`. C03 lacks router helper (404). #120 is sibling; no implicit port/live wiring.
- PR105 full C01-based diff overlaps inherited C03 `qa/pack17/run-gates.mjs` (C03 blob `8779ab2c1588cc62a2f3c5f63c57be9b55e86043`; prior PR105 `55b21d3752403e99feb2ac35a9e6cd1838576746`). C03 lacks `failure-evidence.mjs`; no blind full PR cherry-pick. Independent A30+A60 approval must precede any standalone proposal.
- Other HOLD lanes: PR104 overlaps two C03 Backup action-provenance/test files, Swiss #57→#102→#118→#131, Undo #42→#119→#132, disabled CAS #63→#130. **15 historic file-conflict pairs still OPEN**.

## 6. GitHub release divergence / A140 no-copy

- Later GitHub release `1db3734b8988940acc6be8b992420a58fc39624a` **diverged** from C03; compare C03→release `ahead=1 / behind=3`, 23 changed release-side paths including **18 Unity/WebGL files** under `artifacts/tournament-manager/public/prototypes/minigames/core-clash-unity/`, game pages, `App.tsx`. These are **out of scope**.
- Current A140 #116 `e89798e5a553c738428d61e37a20dc72685f7e8e` has eight STOP_NO_AUTO_COPY zones: Steam/admin auth, PG16 migrations, OBS/stream, static/SPA, Unity/game assets, portfolio, Animated Effects, Replit config/lockfile. Reported Replit *workspace* SHA `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776` does not certify published bytes. **0 live transfers authorized**.

## 7. W6A_HANDOFF contract — work completed and pending

**Changed files by A10:** ONLY this `docs/web-005/agent-reports/A10/W6A_A10_IMMUTABLE_SOURCE_DELTA.md` document on docs branch; **NO CODE CHANGES, NO NEW CODE PR**. Base/HEAD full SHA table in §1; frozen candidate C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`.
**A10 actual checks:** GitHub `get_pr_info`/pull listing, `compare_commits` ancestry of C02/C03, PR100/129, PR103/142, C03/release, `fetch_file` Git SHA-1 and 404 absence checks. **A10 native test command/environment/exit/TAP: `NOT_RUN / N/A`** (read-only A10 coordination). **A10 SQL/PG16, pnpm, API/server, browser, CI trigger, Replit: `NOT_RUN`.**
**External receipts are SHA scoped, not A10 tests:** A20 13/13 Node preflight exit0/full project exit2; A60 old-head #142 17/17 and #105 23/23+3/3 PASS; A30 old-head quoted Basic 5/10 PASS+5 FAIL true exit1; PR129 own 18/18 PASS/whole CI FAIL; C03 whole CI FAIL.
**First failed app test:** UNKNOWN first named TAP despite genuine API integration exit1. **Next owner:** A60 (#129 source-negative review and new #105 QA), A30 (new #105 confidentiality), A20/operator (fully isolated checkout), A40 (one-file C04 plan only, no code), A00 (separate explicit C04 source GO, future PG16 physical approval).
**Integration verdict:** `SOURCE_ONLY / ONE_FILE_ALLOWLIST_PREPARED / READY_FOR_QA / C04_NOT_AUTHORIZED / RELEASE_NO_GO / SWARM006_HOLD`.
**STOP:** no merge/rebase, SQL/PG16, Docker, package install, live deploy/sync, game/Unity/OBS/assets code changes.
