# WEB-005 — A40 / WAVE 5R — NEXT COMPOSITION DECISION

**Task ID:** `WEB-005-A40-W5R-C03-INTEGRATION-FREEZE`  
**Role:** A40 — Integration Lead  
**Date:** 2026-10-18, Europe/Warsaw  
**Status:** **DONE (assigned freeze/DAG/decision); NEXT_COMPOSITION_NOT_AUTHORIZED**  
**Integration verdict:** `SOURCE_ONLY / READY_FOR_QA / WORKING_CANDIDATE_NO / RELEASE_NO_GO`  
**Source code changes by A40 W5R:** **NONE**. This document exists on an isolated **documentation-only** branch, not on PR #134.

Authority: [WAVE 5R MASTER DISPATCH](https://docs.google.com/document/d/1yKUPtfE0dC9a0nRAdi35OnYPDIZUN46u3bCkN2KeDTw/edit). Its A40 instructions explicitly require keeping C03 frozen and **NOT** creating C04 now.

## 1. Frozen identity / immutable lineage

| Candidate | GitHub PR | Exact HEAD SHA | Parent/base SHA | Status |
|---|---|---|---|---|
| C01 | [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | OPEN/DRAFT, full API gate FAIL |
| C02 | [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | C01 exact SHA above | OPEN/DRAFT |
| **C03 frozen** | [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`** | C02 exact SHA above | **OPEN/DRAFT/UNMERGED**, NO C04 |

C03 tree: `16776e0a00e715d8c272292499164c2589c9fed1`. C02→C03 = 1 commit ahead, 0 behind, exactly TWO modified paths. Previously independently verified Git blobs and currently rechecked HEADs:
- `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` → `0465e11b2420fa00f2de5cc14fa4d81858c76ff0`;
- `artifacts/api-server/test/backup-preclone-adapter.test.ts` → `51b658b1775f88c5d00ff721247ec6ede49feb86`.

These two blobs are verbatim from [PR #100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`, stacked on PR #66 (already in C02). **Never reapply PR #66 or #100**. C03 is a **pure source candidate**: no importer wiring, authenticated issuer, historical Undo/CAS permission, release or Replit deployment.

## 2. Actual QA evidence — source pass != working application

[GitHub Actions C03 exact-SHA run #39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753), job `117691909864` **COMPLETED FAILURE**. Independently recorded by A60 in [WAVE5_HANDOFF](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB005_WAVE5_HANDOFF.md):
- **20/20 named backup-preclone targeted tests PASS** at actual C03 SHA (not merely parent PR100);
- **workspace typecheck PASS**, source/fail-closed gates PASS;
- **overall workflow FAIL**, actual `BLOCKED: API integration tests execution failed exit 1; signal none`;
- first named failing API assertion/root cause **UNKNOWN**; browser, full create→players→stages→matches→results, Replit and full isolated PostgreSQL16 acceptance **NOT_TESTED**.

A40 W5R personally executed **read-only GitHub operations only**: 18 current PR metadata/head checks; exact PR-file list checks for #134/#129/#104/#102/#118/#131/#119/#132/#103/#120/#63/#130/#105/#135/#116; read-backs of #129 test blob, C03 and PR104 provenance blobs, A140 manifest; comparison against A10/A60 published evidence. **No new local process-level `node --test`, `pnpm`, typecheck, end-to-end, Docker, PostgreSQL or SQL execution by A40. Exit/TAP for A40 local commands: NOT_RUN / N/A.** Native CI evidence above is independently attributed to GitHub/A60, not newly claimed as A40 local tests.

## 3. Source registry and collision/dependency DAG

Current exact PR heads rechecked OPEN/DRAFT:
- **#129 A90 Backup test-only:** `35449b148aa782139a5327164cb6ed5d6aa3bfdd` (base PR100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`), **one new test file** `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`, blob **`643fcc876d793b9d86c5d3700f599c4eab88c8db`**; zero direct conflicts with C03. PR129's own exact CI #39133733273 had **18/18 ingress tests + 20/20 adapter tests PASS**, full API workflow FAIL. A60 decision **CONDITIONAL TEST_ONLY**; not import acceptance.
- **#104 A70 nested provenance:** `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f`, parent #64 `7837e412626e88761c70f1a2ceeb822d7ed101e1`. Its provenance source Git blob `0c53833de5597a6809c8b21255e89de174c6f298` differs from the frozen C03 original `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c`; the provenance implementation and test require **TWO existing-file replacements**, not a second ancestor cherry-pick. **21 authored tests native exact-head still NOT_PROVEN**. Exclude pending A60.
- **Swiss:** #57 `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` → #102 `b2bbfd2bac32c81f2876138bf53273e61eccac0b` → #118 `c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e` → #131 `1d8e8105ea7b601866ee9f7cd607d05bd241372a`; #102/#118 overlap in `artifacts/api-server/src/domain/tournament/swiss.ts`, PR131 one new test only. A80 reports 37/37 isolated native component tests PASS; independent complete child/combined C03 QA and PG16 stage caller still pending. Defer to independent sporting batch, no double inclusion of Swiss source.
- **Roster Undo:** #42 `021bed269f9ea8ac8ce53caeea44263c098aa2dd` → #119 `b650a8e8de1841802c60f2af356bf0b404bd8018` → #132 `fd3726aaa8c16a49b6ecd60e5b5e98782880f38e`. Different dependency from pure #104 Backup provenance. A70 has 17/17 component DB-free PASS; HTTP LIFO/rollback + actual Undo source wiring are NOT accepted. Exclude.
- **Frontend route:** #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` → #120 `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab`; async/Promise-returning `exists` misclassifies missing assets as static, A120-owned source fix pending. 4 browser/source tests skipped; live routing not wired. **NEEDS_FIX**.
- **Basket CAS:** #63 `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` → #130 `295783b8d7af907a5adfe3c6a3c1d199e29408e9`, backend conditional revision/ETag/If-Match not ready; feature remains OFF. **BLOCKED**.
- **Pack17 diagnostics:** #105 `3beba777627fa01ad46e83984915234a5d230046` based on original C01; changes inherited `qa/pack17/run-gates.mjs`, Basic Authorization log redaction issue still needs verified A50 fix. Never treat as confirmed API application root cause. **NEEDS_FIX**.
- **Local executor:** #135 `cfa69565ccf6bedb4f8e3e3b4be948132fb727ba` based on newer release `1db3734b8988940acc6be8b992420a58fc39624a`, tooling only; native exact-HEAD 13-case result pending A20. No whole-release rebase into C03.
- **Live preservation:** #116 `133e67fc079affabeb22c92f04237f13db1f06e2`, later-release ancestry; NO cross-domain copy.

A10 Wave5 [51-PR registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB005_A10_WAVE5_HANDOFF_20261018.md): **11 READY_FOR_QA / 0 READY_FOR_INTEGRATION / 2 NEEDS_FIX / 38 BLOCKED** at its frozen snapshot. New A10 **W5R delta registry** has not been accepted/verified here. Historical 15 overlapping packet pairs remain separately unresolved; no assertion of 15 new W5R conflicts.

## 4. Strict A140 live no-copy boundary

A140 [#116 sparse manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/133e67fc079affabeb22c92f04237f13db1f06e2/docs/web-005/agent-reports/A140/WEB-005_A140_WAVE4_TRANSFER_CANDIDATES.json), exact blob `ff02554928d645b4966c16ea351b824bd2bf5011`: 21 reviewed path decisions, **zero production-ready live transfers**, two source-only review candidates, one narrow A120 CSS hunk candidate, two reported-identical no-copy. Real served published tree = **UNVERIFIED**, Replit agent-reported editable HEAD `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`; prior publish failed. Blacklist:
- never bulk-copy `artifacts/tournament-manager/src/App.tsx`, `vite.config.ts`, `.replit`, `pnpm-lock.yaml`, artifact TOML, `artifacts/api-server/src/routes/index.ts`;
- protect Steam catalog mutations/organizer/admin auth (ungated release source), no PR34 path without A30 and DB approval;
- protect `public/portfolio/`, `public/stream/animated-effects/`, Unity/WebGL, Core Clash, Evolution, minigames and all hashed bundles/loaders;
- no migration 0030/0031 reconciliation, SQL, DB change or live re-publish without separate owner signoff.

No claim of live route/browser byte parity is made.

## 5. SINGLE minimal subsequent source-only composition **PROPOSAL, NOT EXECUTION**

**Proposed first new delta (ONLY AFTER required acceptance): add exactly PR129's ONE NEW test file to a fresh, disposable descendant of immutable C03 `80bb4ca7...`, with Git blob `643fcc876d793b9d86c5d3700f599c4eab88c8db`.** Rationale: PR129 is test-only, its source path is disjoint with C03, has a clean explicit dependency PR100 already represented in C03, and has its own 18/18 native test receipt; it makes regression safety more inspectable without changing unqualified behavior or importer wiring. This is an A40 plan, **not C04 authorization or creation**.

Required before creating that composite:
1. **A10 W5R** immutable allowlist/parent/paths, reverify PR129 HEAD and exact test blob.
2. **A60 W5R** independent negative/source QA of PR129 and compatibility of C03 modules; no inherited PR100/PR66 duplication; clear *test-only* acceptance.
3. **A20/A50/A60** actual DB-free combined run on the eventual new composite exact SHA: original 20 preclone and 18 ingress test names + existing provenance suite and workspace typecheck, preserve all TAP/exit evidence. An overall API integration exit1 still remains a release blocker, never waived.
4. **A00** scoped source-only GO if required by current dispatch; **do not** represent this as release/full API/real backup import readiness.
5. If either #129 or native executor QA fails, **NO NEW COMPOSITE**; return exact failure to A90/A20. Keep PR104 and all Swiss/Undo/route/CAS stacks separate until accepted.

**STOP/CLOSE:** C03 HEAD and PR#134 remain frozen. No C04, PR base retarget, merge, rebase, new application code, migrations, production SQL, PostgreSQL/Docker, live Replit, Steam auth or games were touched in W5R. The W5R docs-only branch is *not* a production integration candidate. Next owners: A10 immutable eligibility; A60 independent acceptance; A20 operator-native preflight; A50 first authentic C01 API failure; A140 live preservation; A00 scoped decision.

`W5R_A40_DAG_COMPLETE / C03_FROZEN / NEXT_PR129_TEST_ONLY_CONDITIONAL / COMBINED_C03_TARGET_PASS_BUT_WORKFLOW_API_FAIL / LIVE_NO_COPY / RELEASE_NO_GO / SWARM006_HOLD`.
