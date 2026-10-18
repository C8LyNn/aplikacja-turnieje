# WEB-005 — A40 / W5R — INTEGRATION DECISION

**Task ID:** `WEB005-W5R-A40-NEXT-INTEGRATION-PREPARATION`  
**Role:** A40 — Integration Lead  
**Date:** 2026-10-18, Europe/Warsaw  
**Status:** **DONE — decision/document only; C04 NOT AUTHORIZED / NOT CREATED**  
**Integration verdict:** `C03_FROZEN / NEXT_TEST_ONLY_CONDITIONAL / RELEASE_NO_GO / PG16_HOLD / REPLIT_NO_SYNC`  
**Source-code changes by A40 in this task:** NONE. The only authored file is this isolated Markdown report.

## 1. Canonical frozen C01→C02→C03 (fresh HEAD verification)

| Layer | PR | Full 40-character HEAD SHA | Full base SHA | PR state |
|---|---|---|---|---|
| C01 | [#60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | OPEN/DRAFT |
| C02 | [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN/DRAFT |
| **C03 (FROZEN)** | [#134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`** | `a5bfd07b822c223fd995604dc2e228935ab81498` | OPEN/DRAFT/UNMERGED |

GitHub compare `C01...C02`: ahead1/behind0, **5 added files**. `C02...C03`: ahead1/behind0, **2 modified files** (preclone adapter and its test). Git source blobs on C03:
- `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts` = `0465e11b2420fa00f2de5cc14fa4d81858c76ff0`.
- `artifacts/api-server/test/backup-preclone-adapter.test.ts` = `51b658b1775f88c5d00ff721247ec6ede49feb86`.

Both are identical to [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) HEAD `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` source/test blobs; C02 already contains historical PR66. **Do not cherry-pick PR66, PR100, C01 or C02 again**; use immutable C03 HEAD for eventual successor.

### Exact-C03 CI and limits

[GitHub Actions #39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753), job `117691909864`: **COMPLETED FAILURE**, workspace typecheck PASS, DB-free source/fail-closed gates PASS, **API integration exit 1**; first failing API TAP assertion remains UNKNOWN. Earlier independent A60 receipts reference targeted Backup adapter **20/20 PASS**, but the [A60 W5R final review](https://github.com/C8LyNn/aplikacja-turnieje/blob/e0375536cc77b97b92bb7b9d0f7bb53f80dbc9e1/docs/web-005/agent-reports/A60/W5R_A60_FINAL_QA.md) expressly notes that a standalone 20/20 target TAP section was **not reauthenticated from the decoded combined C03 CI log**. Avoid inflating this into a fresh local C03 run. Full API/HTTP/PG16/browser/release E2E **NOT PASS**.

## 2. Current exact PR register (fresh GitHub metadata)

| Component | Exact PR HEAD | Exact PR base | W5R disposition |
|---|---|---|---|
| [#142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) A120 async exists fix | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` | #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | **A60 SOURCE_ONLY PASS 17/17**, separate port; no host wiring |
| [#103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) original static classifier | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | newer release `1db3734b8988940acc6be8b992420a58fc39624a` | original async bug, superseded for helper bytes by #142 |
| [#120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) presentation test-only sibling | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | sibling, **not child of #142**; 12 PASS/4 SKIP earlier; NOT actual browser/host acceptance |
| [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) A50 diagnostics | `be2b9557e7c555925b1c1e64755042e35c536932` | C01 `fa3261b2c9510e110ac9eba21726812d3401a525` | **HOLD** despite A60 23/23+3/3 PASS: A30 quoted Basic redaction security-negative **5 FAIL/10**, see below |
| [#129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129) A90 test-only | `35449b148aa782139a5327164cb6ed5d6aa3bfdd` | #100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | **A60 CONDITIONAL TEST_ONLY**, one new exact test file, no production behavior |
| [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) A70 provenance hardening | `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` | #64 `7837e412626e88761c70f1a2ceeb822d7ed101e1` | **HOLD**, two C03 provenance/test paths need replacement, 21 native exact-source suite not accepted |
| [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) A140 Replit preservation | `e89798e5a553c738428d61e37a20dc72685f7e8e` | newer release `1db3734b8988940acc6be8b992420a58fc39624a` | **STOP_NO_AUTO_COPY**, no published-byte attestation |

All listed PRs were OPEN/DRAFT at readback. This table supersedes previously published W5/W5R historical HEAD values; do not reuse old #105 or #116 refs.

## 3. Path collision and ancestry DAG — explicit controlled handling

```text
release old 1fdc401d… ----> #60 C01 fa3261b2… ----> #101 C02 a5bfd07b… ----> #134 C03 80bb4ca7… [FROZEN]
                                  |                    |                        |
                                  |                    |  #64 provenance       +-- #129 test-only ONE FILE (candidate)
                                  |                    |      \                   +-- #104 replaces TWO existing provenance/test files (HOLD)
                                  +-- #105 qa/pack17    +-- PR66 adapter
                                      diagnostic lane           \-- #100 newer adapter ALREADY INCLUDED in C03
                                      (A30 FAIL; HOLD)

release newer 1db3734b… ---> #103 static helper ----> #142 async fix (A60 source PASS)
                                              ----> #120 presentation tests (SIBLING, not #142 child)
                           \----> #116 A140 Replit no-copy docs/tooling (DO NOT TRANSFER)

Swiss separate: #57 --> #102 --> #118 --> #131 (overlapping swiss.ts, PG stage caller HOLD)
Roster Undo separate: #42 --> #119 --> #132 (DB/HTTP LIFO HOLD)
CAS separate: #63 --> #130 (backend ETag/If-Match missing, feature OFF)
```

**C03 vs newer release ancestry:** GitHub compare `C03...release@1db3734b8988940acc6be8b992420a58fc39624a` has **ahead1 / behind3**, common merge-base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, and 23 changed paths including Unity/Core Clash WebGL assets, frontend App routes and minigames. **NEVER cherry-pick the entire newer-release line** to obtain #103/#142/#116; it would drag protected game assets and UI divergence.

**#142 sibling/ancestry:** compare #103→#142 ahead2/behind0, two PR-local changed paths: `scripts/deployment/static-route-policy.mjs` modification, plus `scripts/deployment/static-route-policy.async-exists.test.mjs` addition. PR #120 is a *separate sibling* on #103 with exactly two added presentation tests. Neither #142 nor #120 is in C03. A direct C03 file fetch confirmed **BOTH `scripts/deployment/static-route-policy.mjs` and `scripts/deployment/static-route-policy.test.mjs` DO NOT EXIST in C03**. Therefore a future #142-only port would require **THREE exact new files**: final helper blob `1b023671cd68116bb3876d1ef11d057c28a59265`, original #103 test blob `e6d3312f1ed951dacf307b9bfda42a9b655071c4`, new #142 test blob `d1f86241b55dd9198bfdb8528d97fc9c02d7b113`. Do NOT copy #103's older buggy helper or PR120 tests accidentally. This helper remains UNWIRED, not a production static 404 fix.

**#129 path and ancestry:** single PR129 test-only file `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`, Git blob **`643fcc876d793b9d86c5d3700f599c4eab88c8db`**. Exact C03 file fetch returns 404 (absent), so **one added path, zero direct overlap** with C03's two modified preclone paths. Parent PR100 is already present verbatim at C03. PR129's own [CI #39133733273](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273) recorded **18/18 native ingress tests PASS and workspace typecheck PASS**, but full API workflow FAIL. A60 labelled #129 **CONDITIONAL TEST_ONLY** in Wave5 report; independent signed *combined C03+129* approval/testing is still outstanding.

**#104 path collision (relative to C03 full tree):** `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts` C03 blob `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c` versus PR104 blob `0c53833de5597a6809c8b21255e89de174c6f298`; corresponding `test/backup-v3-action-provenance.test.ts` also requires replacement. This collides with **inherited C03 tree paths**, despite PR134 local diff having only its own two preclone files. Must apply child-delta once, never recopy #64/ancestors or its docs blindly; native 21 tests and A60 negative acceptance required.

**#105 path collision:** PR105's **full PR-local** 11-path diff from C01 contains `qa/pack17/run-gates.mjs` and `qa/pack17/failure-evidence.mjs` plus tests/reports, touching Pack17 code inherited by C03. A50 *W5R increment* since earlier PR105 head changed only three A50-owned paths, but **is NOT** a standalone port onto frozen C03; whole historical Pack17 dependency and contracts must be reviewed after redaction fix. Do not reapply C01.

**#116:** seven A140-only paths, disjoint from C03 Backup modules, but based on newer release. Direct path disjointness does not imply deployed Replit parity. No import into C03.

## 4. Independent QA decisions — critical conflict resolved conservatively

- **A60 final [W5R report](https://github.com/C8LyNn/aplikacja-turnieje/blob/e0375536cc77b97b92bb7b9d0f7bb53f80dbc9e1/docs/web-005/agent-reports/A60/W5R_A60_FINAL_QA.md), source blob `af1a681f422d4c057ab12ae1790c870a178ce1b6`:** exact #142 helper/test source **17/17 native PASS, exit0**, pure strict sync boolean exists fails closed for Promise/thenable/reject/throw while preserving SPA and static 404 decisions. **ACCEPTED FOR SOURCE_ONLY QA COMPOSITION**, **not host/live**.
- **A60 exact #105** supported patterns **23/23 redaction native PASS + 3/3 exit/STOP PASS**, all exit0; A60 narrow *source* approval is **NOT** exhaustive diagnostic secrecy.
- **A30 independent [negative security review](https://github.com/C8LyNn/aplikacja-turnieje/blob/22d12222104907ab08e8bcc18033dcdf7f5f11f6/docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md), exact #105 HEAD `be2b9557e7c555925b1c1e64755042e35c536932`:** `Authorization: Basic "YTpi"` synthetic dummy credential remains visible in quoted diagnostics; independently ran 10-case confidentiality negatives **5 PASS / 5 FAIL, true exit1**. Standard bare Basic, Bearer, DSN masking and exit/STOP succeed. This is a **logged-format failure**, not a confirmed production credential leak. **A40 disposition: #105 NEEDS_FIX / EXCLUDE FROM ANY NEXT COMPOSITION until A50 repairs quote forms, A30 security acceptance and A60 new SHA retest.** Do not override A30 negative evidence with A60 supported-format green tests.
- **#129** independent A60: **CONDITIONAL TEST_ONLY inclusion** on its own exact test blob; no combined-C03 acceptance yet. **#104** remains unaccepted source correction.

## 5. Replit live preservation: enforced blacklist from current #116

[A140 W5R no-copy](https://github.com/C8LyNn/aplikacja-turnieje/blob/e89798e5a553c738428d61e37a20dc72685f7e8e/docs/web-005/agent-reports/A140/W5R_A140_NO_COPY_HANDOFF.md) and 21-path machine manifest blob `c84b89e0ae1a39ef4024705ba9c305d8341ba5e5`: **8 STOP_NO_AUTO_COPY categories**, **0 approved live transfers**. Replit *editable workspace* agent-reported SHA `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776` tree `90ec61122e4e04b67a68e6a4b8e825f62c393afa`; actual **published** tree/HTTP bytes UNKNOWN and last publish failed. Historical 140-path drift count is not reattested.

STOP copying `artifacts/tournament-manager/src/App.tsx`, `vite.config.ts`, `.replit`, `pnpm-lock.yaml`, frontend/API `artifact.toml`, `artifacts/api-server/src/routes/index.ts`, Steam catalog/admin write guards, migrations `0030/0031`, OBS overlay/stream routes, portfolio and Animated Effects complete JS/CSS bundles, Unity WebGL assets, Core Clash and all game/minigame sources. No wildcard source-tree replacement, git fast-forward of Replit, host wiring or deployment. This protection remains mandatory even for DB-free candidates.

## 6. SINGLE MINIMAL NEXT DB-FREE SOURCE COMPOSITION (PROPOSAL ONLY)

**Decision: propose one-file #129 TEST-ONLY port onto frozen C03, conditional on A10 + A60 specific acceptances.** This is the smallest verified additive unit with no production behavior, no new external ancestry and a native PR-specific receipt. **C04 is NOT CREATED / NOT AUTHORIZED by this document.**

Exact hypothetical diff (nothing else):
```text
BASE COMMIT: 80bb4ca7a9a359fbe76dbab1478a1af16ded0174   (C03)
ADD 100644 artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts
    Git blob: 643fcc876d793b9d86c5d3700f599c4eab88c8db
DO NOT MODIFY backup-preclone-adapter.ts or backup-preclone-adapter.test.ts
DO NOT COPY any ancestor PR100/PR66 or parent release, docs, other source/test paths
```

**Why not add #142 concurrently?** #142 is independently source-accepted and fixes a real pure-module bug, but C03 has neither original helper nor original test. It requires the separate three-blob import above across a divergent newer-release ancestry, and hosting remains unwired. Mixing it into a 1-file Backup test composition would increase failure attribution and risk of accidental game/UI scope. Plan #142 as the **next separate, source-only route candidate** only after its own 3-file allowlist and A60 exact combined-branch QA; do not include PR120 silently. This does **not** withdraw its A60 SOURCE_PASS.

**Why not #105?** A30 confidentiality **FAIL** on same exact SHA; A50 owner must repair and reobtain both A30 and A60 acceptance. **Why not #104?** two existing inherited validator/test collisions and missing exact native 21-case independent suite. Swiss/Undo/CAS and Replit remain distinct STOP lanes.

### Required gates BEFORE beginning C04

1. **A10:** fresh exact HEAD + immutable manifest confirming PR129 remains `35449b148aa782139a5327164cb6ed5d6aa3bfdd`, same blob `643fcc876d793b9d86c5d3700f599c4eab88c8db`, one changed path, parent PR100 present in C03; record C03 HEAD, code-ownership and parent ancestry. No broad parent cherry-pick.
2. **A60:** explicitly accept #129 exact test-only blob for **C03 successor** after independent negative/source review, including non-authorizing preclone semantics and no production positive import; current decision is conditional, not an unconditional full-composition receipt.
3. **A20/runner owner:** certified *complete* isolated checkout with recorded `git rev-parse HEAD`, `git status --porcelain`, Node/pnpm versions and `pnpm-lock.yaml` checksum, sanitized DB/PG/REPLIT/prod vars. The A20 #135 native preflight 13/13 was executed on exact blobs but full-monorepo preflight returned **BLOCKED** on incomplete checkout; not ready merely because the utility unit tests pass.
4. **A00:** explicit bounded approval to create an isolated DB-free **Draft** descendant, no protected ref retarget/merge. Continue to hold PG16, C01 API and Replit/live.
5. **Only after 1–4:** A40 creates **one new isolated branch** based on immutable C03, adds exactly the allowlisted Git blob, opens Draft PR against frozen C03 branch, then verifies new full HEAD SHA / diff (exactly one added file), with STOP-on-drift/STOP-on-conflict.

### Required test matrix AFTER future C04 creation (not executed now)

**All tests run against ONE new composite exact HEAD** in the approved sanitized full checkout, not merely imported reports:
- `pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-preclone-adapter.test.ts` — expected scope original 20; record ACTUAL TAP/pass/fail/skip/exit, never assume.
- `pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-v3-ingress-boundary.wave3.test.ts` — expected scope 18; record actual results, including failing negative cases.
- `pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap test/backup-v3-action-provenance.test.ts` — record true result, do not report authored-only tests as PASS.
- `pnpm run typecheck` — root build command verified at exact C03 `package.json` blob `07929726f77b63bf375af4eb3ad4c70482cc7e14`; API package typecheck script `tsc -p tsconfig.json --noEmit && tsc -p tsconfig.test.json --noEmit` verified at C03 API `package.json` blob `bf931f87a7b0d5532b949f44c7e091878fe6db52`.
- Static check: immutable frozen C03 blobs match exact Git OIDs; no new import wiring, schema, SQL, auth, host, game, stream, lockfile or Replit change. Run independent A60 exact-new-SHA QA and record hashes, commands, env safety and exits.
- **Do NOT invoke `pnpm test`, API `test:integration`, whole `qa/pack17/run-gates.mjs --full` or any destructive PG16 suite under this DB-free authorization.** Existing C03 workflow API integration exit1 stays a real FAIL, not waived/relabelled.

Acceptance of the resulting **source-only** Draft (if ever built) does not mean complete tournament E2E, real importer, Replit parity, PG16 test, merge/release GO or SWARM006 handoff. If any prerequisite or new exact-SHA targeted test fails, stop, file owner-scoped defect and keep C03 unchanged.

## 7. Actual actions in this A40 task and handoff

**Performed by A40 here:** GitHub live `get_pr_info` on all requested PRs and ancestor #100/#64/#66; `list_pr_changed_filenames` for relevant PRs; `compare_commits` for C01→C02, C02→C03, #103→#142, #103→#120 and divergent C03→newer release; Git file blob readback of C03 ancestry/provenance, #142 code/original+new tests and A140 latest manifest; read independent A60 final and A30 final exact-ref reports. **No local native Node/TAP/typecheck execution by A40**: `NOT_RUN` / no exit code. Existing CI/test outcomes credited to named operators, not falsely attributed to this review. Independent source comparisons establish metadata and blob identity only.

**Artifact file on docs-only isolated branch:** `docs/web-005/agent-reports/A40/W5R_A40_INTEGRATION_DECISION.md`. This branch must add **only** the report Markdown; C03 PR #134 base, head, content and draft status untouched. **No C04, merge, production SQL/PG16, Docker, Replit sync, host change, Steam config, game/Unity or deployment.**

**Next owners:** A10 new exact immutable inclusion allowlist; A60 #129 exact negative/source QA and new-composite acceptance; A20 trusted complete DB-free executor; A50+A30 quoted Basic fix for separate diagnostics lane; A120 #142 host-independent future route candidate; A140 live preservation; A00 scope and future GO/STOP.

**Final labels:** `W5R_A40_DECISION_PUBLISHED / C03_FROZEN / PR129_ONLY_CONDITIONAL_TEST_DELTA / PR142_A60_SOURCE_PASS_DEFERRED / PR105_A30_SECURITY_FAIL_HOLD / API_INTEGRATION_EXIT1_UNRESOLVED / NO_C04 / RELEASE_NO_GO`.
