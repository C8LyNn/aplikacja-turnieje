# WEB-005 — W6A_FINAL_HANDOFF / A10

**Agent / Task:** A10 — Source Registry & Governance / `WEB005-W6A-A10-FINAL-SOURCE-CLOSEOUT`  
**Date:** 2026-10-19 (Europe/Warsaw) · **Status:** `DONE` (A10 registry), `CONDITIONAL` (DB-free candidate planning), `HOLD` (C04, runtime, release).  
**Mode:** read-only source checks / append-only documentation. No app code changes.  
**Prior canonical report:** [A10 W6A immutable source delta](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/W6A_A10_IMMUTABLE_SOURCE_DELTA.md). [Owner A00 W6A gate board](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a00-w6a-gate-board-20261019/docs/web-005/agent-reports/A00/W6A_A00_GATE_BOARD.md).
**Final A10 label:** `W6A_A10_DONE / PR129_CONDITIONAL_SOURCE_PASS / C03_FROZEN / PR105_INDEPENDENT_NEW_SHA_QA_PENDING / FULL_CHECKOUT_OPERATOR_REQUIRED / C04_NOT_AUTHORIZED / API_INTEGRATION_FAIL / PG16_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Exact PR BASE and HEAD SHA — final source snapshot

All ten selected PRs `OPEN / DRAFT / UNMERGED` in GitHub metadata at time of this report. A concurrent HEAD advance requires a new delta receipt; previous full registry and historic SHA are not overwritten.

| PR | BASE SHA | HEAD SHA |
|---|---|---|
| [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | `fa3261b2c9510e110ac9eba21726812d3401a525` |
| [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `a5bfd07b822c223fd995604dc2e228935ab81498` |
| [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` |
| [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | `35449b148aa782139a5327164cb6ed5d6aa3bfdd` |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `039e139bfb0dcd6012adb9c1b84f967b5ea799e7` |
| [#142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | `1db3734b8988940acc6be8b992420a58fc39624a` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` |
| [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) | `1db3734b8988940acc6be8b992420a58fc39624a` | `6dae0a532632b6d9c17247c5c28cc17a827a7f6f` |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `1db3734b8988940acc6be8b992420a58fc39624a` | `e89798e5a553c738428d61e37a20dc72685f7e8e` |

## 2. What changed since A10's published W6A source delta

- **C01→C02→frozen C03 and PR129 unchanged:** #60 `fa3261b2c9510e110ac9eba21726812d3401a525` → #101 `a5bfd07b822c223fd995604dc2e228935ab81498` → #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`. PR129 exact `35449b148aa782139a5327164cb6ed5d6aa3bfdd` still contains precisely the future test-only addition; no C04 exists. PR66/PR100 ancestors **ALREADY IN C03, DO NOT REAPPLY**.
- **#105 diagnostics current `039e139bfb0dcd6012adb9c1b84f967b5ea799e7`:** previous A10 snapshot `52db060c13999f4664fa51d2c965c264a045bc2d` → one **documentation-only** new commit adding `docs/web-005/agent-reports/A50/W6A_FINAL_HANDOFF.md`, no new code/test blob modifications (Git compare ahead 1 / behind 0). A50's test-first quote-aware redactor blob remains `6978ff19a40cc9f43413599d6a319ee26b7f80b5`, new negative test `6e4d9f230f1c6abd70d18127d1721978bb2cb5ec`.
- **#135 preflight current `6dae0a532632b6d9c17247c5c28cc17a827a7f6f`:** previous A10 snapshot `c625c8cbc93869ecbb24919f34148fea38179a76` → one **documentation-only** new commit adding `docs/web-005/agent-reports/A20/W6A/W6A_FINAL_HANDOFF.md`, no source/test change (Git compare ahead 1 / behind 0). Two original source/test blobs `5a61ef4c88d57d673c6558b242aed87c479a40d0` / `177402bb4d9afaa08840839763764f8e502b0804` still pinned.
- #142 remains a distinct pure routing package from newer release, **not** in C03; #120 is its sibling; #116 is A140's eight-zone STOP_NO_AUTO_COPY provenance gate. C03/release diverge, including protected Unity/WebGL game and frontend paths. None may enter C03+129 by automatic branch copy.

## 3. Exact C03→C04 one-file allowlist + A60 independent acceptance

| Criterion | Evidence and disposition |
|---|---|
| Frozen parent | C03 #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` |
| Candidate PR | #129 `35449b148aa782139a5327164cb6ed5d6aa3bfdd`, BASE PR100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`; 4 commits ahead/0 behind, aggregate one added file |
| **ONLY proposed path** | `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts` |
| Git blob SHA-1 | **`643fcc876d793b9d86c5d3700f599c4eab88c8db`** |
| File at C03 | **ABSENT** (authenticated GitHub 404); exact addition one file, no code path replacement |
| A60 independent SOURCE review | **`CONDITIONAL SOURCE PASS`** on exact #129 blob and 4 same direct imported source blobs shared with C03. [A60 W6A report](https://github.com/C8LyNn/aplikacja-turnieje/blob/07f849f95aafb16375a244e7c979b5264f09d196/docs/web-005/agent-reports/A60/W6A_A60_ACCEPTANCE_MATRIX.md) |
| #129 own native CI | 18/18 targeted tests PASS and typecheck PASS at [Actions 39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273), but **whole CI FAIL** on inherited API integration exit1 |
| Actual combined C03+#129 native/typecheck | **`NOT_RUN`**; no combined tested SHA |
| A00 authorization | **`NOT_GRANTED`**; A40 [W6A C04 plan](https://github.com/C8LyNn/aplikacja-turnieje/blob/6279aaf412fcabd737fee5cc52c9d89e121c270b/docs/web-005/agent-reports/A40/W6A_A40_C04_TEST_ONLY_GATE.md) is PREPARATION, not permission to create C04 |
A60 verified exact four direct imported blobs: adapter `0465e11b2420fa00f2de5cc14fa4d81858c76ff0`, profile `518526d8d9ff2cef368261788e12c9f8290754f5`, Backup V3 `78d86246302fc8840696fd14c05c840304bc9f97`, strict policy `595c68b87a5361623bef6293519ed668e9d4e493`. This proves source compatibility only. PR129 test has no import/export authorization, but transitive DB package installation/runtime remains unverified. **No whole-branch cherry-pick, no #66/#100 reapply, no more than one new test file.**

## 4. Outstanding QA and runtime blocks

- **#105 security:** A50 personally executed native Node22 test-first RED (3 PASS, 7 FAIL, exit1) then GREEN new 10/10 PASS, combined redaction 33/33 PASS exit0 and runner exit suite 3/3 PASS exit0. Previous A30 **5 FAIL / 10** quoted-negative verdict applies to **older** #105 `be2b9557e7c555925b1c1e64755042e35c536932`; A30/A60 inspected W6A reports were published before new patch and contain **no independent PASS** for current #105 `039e139bfb0dcd6012adb9c1b84f967b5ea799e7`. Gate `READY_FOR_INDEPENDENT_QA`, NOT security PASS, NOT included with PR129. Whole PR105 shares inherited C03 Pack17 runner path.
- **#135 full checkout:** A20 actual earlier `node --test scripts/qa/web005-local-readiness.test.mjs` on two Git-verified files Node22 **13/13 PASS, exit0**; real full monorepo preflight `NOT_RUN`, separate partial tree CLI exit2/BLOCKED, no complete pnpm installation/lock SHA256 receipt. [A20 W6A operator handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/c625c8cbc93869ecbb24919f34148fea38179a76/docs/web-005/agent-reports/A20/W6A/W6A_A20_FULL_CHECKOUT_HANDOFF.md) => `OPERATOR_REQUIRED`, NOT working local app.
- **C03 full workflow** [Actions 39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753): **FAIL / API integration exit1**, first authentic failing TAP assertion UNKNOWN. Independent combined C03+129 tests, PG16 G0-G4 and browser/HTTP/Replit live `NOT_RUN`; no release authority.

## 5. W6A_FINAL_HANDOFF execution facts and next owner

**Changed paths A10:** ONLY this new `docs/web-005/agent-reports/A10/W6A_A10_FINAL_HANDOFF_20261019.md` on existing A10 documentation branch. No code/test, SQL/migration, games/Unity, frontend, active PR head, merge or deploy changes.
**Actual A10 actions:** GitHub PR exact HEAD/BASE/state read-only checks (10 PRs), `compare_commits` for #105/#135 docs-only deltas, exact Git blob/path check on PR129, inspection of A20/A30/A40/A50/A60 reports. **A10 executed no shell/Node test command: `NOT_RUN / N/A exit and TAP`. A10 pnpm, PostgreSQL, API, browser, CI rerun: `NOT_RUN`.** Others' PASS/FAIL receipts attributed above to owners and immutable SHA.
**Next owners:** A30 + A60 — independent latest #105 negative/exit QA; A20 + Windows operator — verified full isolated checkout; A40 — maintain one-file immutable plan and C03 freeze; A00 — issue explicit separate S2 GO/HOLD only after gates, never inferred here. If a future C04 is separately authorized, only A40 creates it and A60 tests the NEW composed exact SHA.
**Integration decision:** A10 `DONE`, source-only preparation `CONDITIONAL`, code composite/runtime/PG16/release/Steam/Replit/SWARM006 `HOLD`. Do not manufacture a C04 SHA or claim success of a test never run.
