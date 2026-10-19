# WEB-005 — WAVE 6A / A40 — C04 TEST-ONLY SOURCE GATE

**Task ID:** `WEB005-W6A-A40-C04-TEST-ONLY-GATE`  
**Role identity:** A40 — Integration Lead, from direct user assignment in this thread.  
**Master dispatch:** https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit  
**Date:** 2026-10-19 (Europe/Warsaw)  
**Task status:** `DONE` for required independent freeze + one-file planning + handoff.  
**Execution status:** `HOLD / OPERATOR_REQUIRED` for any C04 creation or combined native tests.  
**Verdict:** `SOURCE_ONLY_PLAN_READY / C03_FROZEN / A10_ALLOWLIST_PENDING / A60_PR129_NEGATIVE_PENDING / A00_C04_GO_NOT_GRANTED / RELEASE_NO_GO`.

This document supersedes neither C03's immutable source nor [A40's previous W5R integration decision](https://github.com/C8LyNn/aplikacja-turnieje/blob/b22cb7e600e42d4068088b7cebaa8f298021eb74/docs/web-005/agent-reports/A40/W5R_A40_INTEGRATION_DECISION.md). It records **one** candidate manifest and the evidence still missing before **any** C04 commit. No C04 branch, commit, PR, merge or release was created in W6A.

## 1. Fresh immutable identities — no ancestor replay

| Component | Draft PR | Exact 40-character HEAD SHA | Base SHA | Status at readback |
|---|---|---|---|---|
| C01 | [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | OPEN/DRAFT |
| C02 | [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN/DRAFT |
| **C03 FROZEN** | [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`** | `a5bfd07b822c223fd995604dc2e228935ab81498` | OPEN/DRAFT/UNMERGED |
| PR100 adapter | [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | `7490c974b7c84404559fd590bd09817a71c2134f` | OPEN/DRAFT |
| PR66 prior adapter | [#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | C01 `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN/DRAFT |
| **PR129 test-only** | [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) | **`35449b148aa782139a5327164cb6ed5d6aa3bfdd`** | PR100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | OPEN/DRAFT |

GitHub `compare_commits(C02,C03)`: **ahead 1, behind 0**, exactly two modified preclone paths. Immutable C03 Git blobs:
- `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`: **`0465e11b2420fa00f2de5cc14fa4d81858c76ff0`**; same Git blob retrieved independently on PR100.
- `artifacts/api-server/test/backup-preclone-adapter.test.ts`: **`51b658b1775f88c5d00ff721247ec6ede49feb86`**.

C03 inherits PR66 via C02 and exact newer PR100 adapter bytes at C03. Never apply their commits/paths again. `compare_commits(PR100,PR129)` = **ahead 4, behind 0** commits but aggregate **only ONE added path**. **Never cherry-pick the four historical commits or copy entire PR129 branch**.

## 2. SINGLE C03→C04 CANDIDATE MANIFEST — PLANNED ONLY

```json
{
  "schema": "WEB005-W6A-A40-C04-TEST-ONLY-MANIFEST-V1",
  "mode": "PROPOSAL_ONLY_NO_COMMIT",
  "source_base_commit": "80bb4ca7a9a359fbe76dbab1478a1af16ded0174",
  "source_base_pr": 134,
  "source_parent_sha": "6e198dc2c24cff651f8e75898c6e6e97eec9b0e4",
  "candidate_pr": 129,
  "candidate_head_sha": "35449b148aa782139a5327164cb6ed5d6aa3bfdd",
  "allowlist": [
    {
      "operation": "ADD_ONLY_IF_ABSENT",
      "path": "artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts",
      "mode": "100644",
      "git_blob_sha": "643fcc876d793b9d86c5d3700f599c4eab88c8db"
    }
  ],
  "deny_other_changed_paths": true,
  "deny_parent_reapplication": ["PR66", "PR100", "C01", "C02"],
  "runtime_importer_wiring": false,
  "database_or_production_permission": false,
  "c04_creation_authorized": false
}
```

The candidate test file is **15,502 UTF-8 characters** in GitHub `fetch_file`, registered `test(...)` **18 times**, and imports `node:test`, `node:assert/strict`, `backup-v3-profile-gate`, `backup-v3`, and `backup-preclone-adapter`. C03 source readbacks confirm **all three application modules already exist**: profile-gate blob `518526d8d9ff2cef368261788e12c9f8290754f5`, validator `78d86246302fc8840696fd14c05c840304bc9f97`, preclone adapter `0465e11b2420fa00f2de5cc14fa4d81858c76ff0`. Existing C03 Backup action-provenance source and test remain `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c` and `f65d0be0fec76a7daca2331e5bbd6d6fdbf79a6c`.

**C03 candidate destination is ABSENT** at the proposed test path (GitHub content 404 at frozen SHA). No extra source/helper/file additions are needed by the *static import list*. This is **source/path verification**, not proof that the unassembled combination executes. The test imports no Node filesystem/process/network/database packages in its import declarations; no `process.env` assignment or `process.exit(...)` was found in A40's read-only text scan. **This bounded source scan is not a native test, side-effect proof, or full security audit.**

## 3. Latest other PRs and explicit exclusion decisions

| PR / scope | Exact SHA rechecked | A40 decision |
|---|---|---|
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) diagnostics | `be2b9557e7c555925b1c1e64755042e35c536932` (base original C01) | **EXCLUDE / NEEDS FIX**: [A30 independent W5R](https://github.com/C8LyNn/aplikacja-turnieje/blob/22d12222104907ab08e8bcc18033dcdf7f5f11f6/docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md) quoted-Basic confidentiality negative **5/10 FAIL**, despite A60 23/23 supported redaction + 3/3 runner PASS. Requires new A50 SHA, A30 and A60 independent PASS |
| [#142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) route sync async-exists fix | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5`; parent #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | **EXCLUDE FROM C04**: A60 independently **17/17 native DB-free PASS** on pure helper, but C03 lacks helper and old test; requires **THREE** separate exact source/test blobs. Real host UNWIRED; do not drag newer release |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) presentation | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | **EXCLUDE**: sibling child of #103, **NOT #142 child**, old synthetic 12 PASS and 4 SKIP; live/browser E2E not certified |
| [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) nested action-provenance | `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` | **EXCLUDE**: two inherited C03 provenance source/test blobs must be replaced, not an additive test-only change; 21-case exact-native independent evidence incomplete |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) Replit protection | `e89798e5a553c738428d61e37a20dc72685f7e8e`, base newer release `1db3734b8988940acc6be8b992420a58fc39624a` | **NO COPY**: eight STOP categories; real published Replit bytes UNKNOWN, live transfers 0 approved |
| [#135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) local preflight | `cb261868f68b5bab3559398e514013dbd2a21078`, based on newer release | **EXCLUDE**: A20 owns runbook/executor; genuine Node **13/13 PASS** for utility alone, full monorepo preflight **exit 2 BLOCKED** on partial checkout, never a working build |

Swiss #57→#102→#118→#131 (same `swiss.ts` updated twice), Undo #42→#119→#132, disabled Basket CAS #63→#130 and real Backup issuer/Undo/Revert/CAS grants remain outside source-only candidate scope, regardless of isolated component green tests. No whole newer-release rebase, route wiring, Undo writes, feature activation or auth changes.

**A140 blacklist:** `artifacts/tournament-manager/src/App.tsx`, Vite, `.replit`, `pnpm-lock.yaml`, `.replit-artifact/artifact.toml`, API `routes/index.ts`, Steam admin/catalog auth, PostgreSQL migrations 0030/0031, `public/portfolio`, `public/stream/animated-effects` and OBS overlay, Unity/WebGL build, Core Clash and other games/assets. **Eight STOP_NO_AUTO_COPY groups**, Replit tracked workspace ≠ attested published tree. No production/live transfer is authorized.

## 4. Actual W6A checks and test truth table

| Check executed / source | Environment & command | Result (exact) |
|---|---|---|
| A40 GitHub direct readback | `get_pr_info` on all requested C01/C02/C03/PR100/PR66/PR129 and #105/#142/#103/#120/#104/#116/#135 | PASS source identities and open/draft statuses at snapshot; **API metadata, not native execution** |
| A40 GitHub C02→C03 ancestry | `compare_commits(C02,C03)` | PASS 1 ahead, 0 behind, exactly 2 modified files |
| A40 GitHub PR100→PR129 ancestry | `compare_commits(PR100,PR129)` | PASS 4 ahead, 0 behind, exactly 1 ADDED test path; **do not port 4 commits** |
| A40 direct candidate blob/import and C03 prerequisites | `fetch_file` exact SHA and source text scan | **11/11 bounded source/path invariants true**, 2 W6A external acceptance docs absent at inspected known branches; no claim of native test PASS |
| A40 local runtime availability | `node --version` | `v22.16.0`; process **exit 0** |
| A40 local Git availability | `git --version` | `2.47.3`; process **exit 0** |
| A40 local dependency check | `command -v pnpm` | `pnpm` **NOT_PRESENT / lookup exit 1** |
| A40 complete private checkout check | `test -e /mnt/data/aplikacja-turnieje/pnpm-lock.yaml` | NO checkout at inspected path; no authorized full workspace |
| **A40 native project TAP and `pnpm typecheck`** | Full pinned repo/pnpm not available | **NOT_RUN**; no TAP/process-exit claim |
| C03 historical exact Actions | [#39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) | **COMPLETED FAILURE**; typecheck PASS, API integration true **exit 1**, first failing named assertion UNKNOWN. Historical 20/20 target adapter receipt ≠ independent standalone CI TAP reauthentication |
| PR129 historical exact Actions | [#39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273) | **COMPLETED FAILURE**; targeted ingress 18/18 and typecheck PASS per A90/A60 prior receipts, full API workflow FAIL; **not combined C03+129 QA** |
| C03 + PR129 exact new SHA runtime | No successor exists | **NOT_RUN**, no PASS and no Git HEAD to cite |

**Additional missing acceptance at this A40 read snapshot:** dedicated W6A `W6A_A10_IMMUTABLE_SOURCE_DELTA.md` and `W6A_A60_ACCEPTANCE_MATRIX.md` were **NOT_FOUND** at inspected known control/report branches. This is not proof the agents have not published elsewhere; A00 must obtain their actual signed latest evidence. Previously A60 labelled PR129 **CONDITIONAL TEST_ONLY** on its own SHA, not definitive combined candidate GO.

## 5. C04 creation STOP/GO gates — in order

- **G1 / A10 SOURCE:** signed exact HEAD and one-file allowlist for `C03@80bb4ca7...` + `PR129@35449b14...`; verify candidate blob still `643fcc876d793b9d86c5d3700f599c4eab88c8db`, no C03 SHA drift, parents/ownership/no game paths. **PENDING**.
- **G2 / A60 INDEPENDENT:** exact PR129 18-case negative test review, no DB/IO/privilege/positive importer authority, inherited C03 dependency compatibility and test harness prerequisites. An old native receipt on separate PR129 HEAD is not new-composite PASS. **PENDING**.
- **G3 / A20 EXECUTOR:** verified complete disposable monorepo checkout, Node22 and compatible installed pnpm, exact commit/lockhash/env scrub, no inherited PG/DATABASE/REPLIT/DEPLOY secrets, no broad API bind. Owner/operator logs genuine preflight command JSON and exits. **OPERATOR_REQUIRED / BLOCKED**.
- **G4 / A00 PERMISSION:** a **new explicit C04 SOURCE-ONLY GO** with exact candidate manifest and owned branch scope. **NOT_GRANTED** by W6A dispatch.
- **G5 / A40 CONSTRUCTION, ONLY AFTER G1–G4:** isolate an unshared child of immutable C03; add **ONLY** 100644 candidate blob. Verify `git diff --name-status C03...HEAD` equals exactly `A\tartifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`; new Git object exact blob matches; create one Draft PR targeting C03 disposable branch. If anything else changes, **STOP**.
- **G6 / A60 COMBINED EXACT-NEW-SHA QA:** execute DB-free native TAP and workspace typecheck on the **actual new commit**, record tests/exits/skip and review against original C03; preserve the original API integration red gate. **NOT_RUN UNTIL NEW SHA EXISTS**.

**Prescribed future DB-free commands (NOT RUN now)**, in a certified sanitized isolated full source checkout with dependency availability:
```sh
git rev-parse HEAD
git status --porcelain
node --version
pnpm --version
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-preclone-adapter.test.ts
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-v3-ingress-boundary.wave3.test.ts
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-v3-action-provenance.test.ts
pnpm run typecheck
```
A60 must keep **actual** TAP/exit per command, **zero unexpected SKIP**, verify exact hashes and real tests; do **not** run root `pnpm test` / `test:integration` / `qa/pack17/run-gates.mjs --full` under DB-free-only permission because they reach database integration/unsafe test reset. Never set a database URL to overcome missing tests.

## 6. OPERATOR_REQUIRED and source→runtime boundary

**Operator action (owned by A20, not automatically executed by A40):** create a fresh physically unrelated Windows directory/worktree pinned to a verified SHA; check lockfile SHA256, exact `git rev-parse HEAD`, native Node22/pnpm, and **names-only** inspection of `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*`, `REPLIT*`, `DEPLOYMENT_TASK*` before running A20's read-only preflight. Use A20's [W5R executable operator instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/cb261868f68b5bab3559398e514013dbd2a21078/docs/web-005/agent-reports/A20/W5R/W5R_A20_EXECUTOR_UNBLOCK.md) and future W6A signed update. Do **not** point tooling at native Windows PG16, Neon, unknown databases, Replit live, working project folders, or production secrets. No package installs, service start, physical PG16 or browser preview without separate owner permission.

**Permanent split:** GATE S **source-only planning** remains `CONDITIONAL/HOLD` for missing G1/G2/G4; GATE R **locally running full app** remains `NO_GO` (no certified full checkout, API first failure still unknown, no PG16, HTTP/browser/UI/live runtime acceptance). This W6A activity authorizes neither C04 creation nor W6B execution or SWARM-006.

## 7. Publication scope & final handoff

**Modified by A40 in this W6A:** only `docs/web-005/agent-reports/A40/W6A_A40_C04_TEST_ONLY_GATE.md` on existing A40-owned documentation branch `docs/web005-a40-w5r-integration-decision-20261018`. **No modification** of PR134 C03 HEAD/base, PR129, PR105, PR142, Replit, SQL, migrations, package lock, runner code, test source, games/assets or protected branches. No C04 created, no new application PR.

**Owner sequence:** A10 immutable manifest G1 → A60 independent PR129 source/negative G2 → A20 + Windows operator full checkout G3 → A00 exact source GO G4 → A40 controlled future 1-blob candidate G5 → A60 exact-new-SHA DB-free QA G6 → A00 later separate runtime/PG16/live release decisions.

**Final status:** `W6A_A40_DOCUMENT_DONE / C03_FROZEN / ONE_FILE_PR129_CANDIDATE_PINNED / C04_HOLD / OPERATOR_REQUIRED / C01_API_FAIL_EXIT1_UNKNOWN / REPLIT_NO_COPY / PG16_G0_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.
