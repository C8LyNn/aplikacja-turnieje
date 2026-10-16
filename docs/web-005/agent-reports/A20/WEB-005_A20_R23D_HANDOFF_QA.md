# WEB-005 — A20 / R23D · Final Handoff & QA Evidence

**Agent:** A20 PostgreSQL Migration Reconciliation · **Scope:** [Issue #72](https://github.com/C8LyNn/aplikacja-turnieje/issues/72) (Steam/DB source preservation) + [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) (D01–D04 migration decisions, DB dependencies of Backup trust & Basket CAS).  
**Dispatcher:** [WEB-005_R23D_EXECUTION_DISPATCH_20261016.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), source Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Date:** 2026-10-16 Europe/Warsaw. **Mode:** READ-ONLY SOURCE RECONCILIATION; docs-only publication.  
**QA ownership:** This is **A20's evidence/self-check**, **NOT independent A60 QA**. Independent A60 exact-source/candidate QA is a separate Issue #77 gate.

## Published R23D evidence and immutable identifiers

| Artifact | Immutable published commit SHA | Git blob SHA-1 verified by readback | Purpose |
|---|---|---|---|
| [A20 Issue #72 Steam/DB preservation](https://github.com/C8LyNn/aplikacja-turnieje/blob/27b902a847f371ae9649b1870362a86a83b8d4da/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE72_STEAM_DB_PRESERVATION.md) | `27b902a847f371ae9649b1870362a86a83b8d4da` | `b63190678de0792705c2286790bc8efd4c2adcf0` | Original and proposed migration nine-row file/hash matrix, repo-vs-Replit evidence boundary, partial-deploy hazards, no-op source preflight/rollback |
| [A20 Issue #76 D01–D04 migration gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/e935d2421e978272d5e29da1a784d24265831edc/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE76_D01_D04_OWNER_DECISION_GATE.md) | `e935d2421e978272d5e29da1a784d24265831edc` | `a400b96fb67590a1fde9e29358f53e3e0b7a19bd` | Explicit pending signatures, ledger/allocator safe graph and separate Backup/CAS authorization |
| This final handoff `WEB-005_A20_R23D_HANDOFF_QA.md` | Git commit returned by create_file and verified by readback | Git blob SHA to be observed on readback | Evidence and one-step A00/A60 handoff |

**Files modified by A20 this turn:** ONLY these three newly created files under `docs/web-005/agent-reports/A20/` on `chore/web-005/t000-wave1-control`. **No game/code/migration/scripts/lockfile/test source modifications**. No new PR or merge.

## R23D current source pins

| Source | SHA | Actual state observed |
|---|---|---|
| GitHub release `release/tournament-ops-20261013-01` | `1db3734b8988940acc6be8b992420a58fc39624a` | `identical` with ref; +1 commit / 23 changed game/showcase paths vs old `1fdc401d...`; 0 DB migration changed |
| R23C old release | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | One commit behind actual current release; old migration SQL blobs identical |
| Original Steam editor `codex/game-catalog-editor-reliability` | `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c` | `identical` with ref |
| P05 PR38 offline migration validator | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | OPEN/DRAFT/UNMERGED; proposed mapping `PROPOSAL_ONLY_NOT_APPROVED` |
| P22 PR55 Basket CAS fail-first tests | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | OPEN/DRAFT/UNMERGED; tests-only, no server CAS |
| P23 PR56 Backup V3 strict policy | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | OPEN/DRAFT/UNMERGED; NOT_WIRED |
| R23C C01 PR60 composite | `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN/DRAFT; dispatcher cites prior API integration exit 1, **NOT diagnosed by A20** |
| Replit published local checkpoint (owner-reported) | `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` | **NOT IN GITHUB / NOT VERIFIED**; exact tree/byte hash inaccessible |

## QA method and direct results — no runtime execution

| Check | Actual source action | Pass/Fail/Not executed |
|---|---|---|
| Dispatcher and issues | GitHub file read, GitHub Issue #72/#76 with body; both issues OPEN, comments initially 0 | **PASS**, correct A20 ownership |
| Current release identity | GitHub compare release pin `1db373...` vs named release branch | **PASS**, identical/0 ahead, 0 behind |
| Release delta from R23C | GitHub compare `1fdc401...`→`1db373...` | **PASS**, one commit, **23 paths**, no DB migration touched; all game-facing paths **frozen and not edited** |
| Original editor branch | GitHub compare pinned `28da3ef...` vs branch | **PASS**, identical |
| 14 source migration Git blobs | GitHub recursive trees of release/editor, join by original path+source lineage to PR38 `manifest.proposal.json` | **PASS 14/14 exact SHA-1**; 5 release, 9 editor |
| Canonical editor 0032–0040 in GitHub release | GitHub recursive release tree, match nine canonical filenames | **0/9 present**, exact conclusion applies **ONLY TO GITHUB RELEASE** |
| Original SQL SHA-256 | Raw content checksums verified in earlier A20 R23A | **PRIOR 14/14 PASS**, **NOT FRESHLY RECOMPUTED R23D** |
| Replit 140-path diff | Dispatcher aggregates 140=90 local-only+50 different blobs; Replit local snapshot not accessible | **NOT INDEPENDENTLY VERIFIED**; do not infer 140 defects or source commit |
| Replit read-only inspect | `Replit.search_apps` returned app with Aug-11 update metadata; `ask_question` returned `phase=busy`, request explicitly **NOT QUEUED** | **NOT_EXECUTED**, no state/hash evidence obtained |
| Production/live Steam access, auth, worker behavior | Assigned to A30; no Replit source or secrets read | **NOT_EXECUTED**, no A20 positive security verdict |
| PostgreSQL actual history 0027–0040 / catalog | No signed physical DB read authorization, no trusted source/credential | **NOT_EXECUTED**; `ACTUAL_EXECUTION_UNKNOWN` |
| Native API/backend, unit, browser, PG16 tests | No full exact checkout and no owner-approved isolated environment; A20 performed GitHub source checks only | **NOT_EXECUTED**, no command/exit/TAP |
| GitHub documentation publication | `create_file` for two issue reports + this QA artifact; issue-report `fetch_file` readback verified blob SHA-1 | **PASS** (docs only). No game file touched |
| A60 independent QA | Separate role/Issue #77 | **NOT_EXECUTED BY A20** |

**Execution commands / exit:** GitHub and Replit connector read-only methods, no shell invocation for application/PG16; actual exit code/TAP **NULL / NOT_EXECUTED**. SHA checks from GitHub source tree + P05 manifest are **source QA**, not a standalone pipeline or runtime success. No SQL SELECT, DDL, reset, secrets, paid CI or destructive action performed.

## Exact blockers and decision request for A00

1. **P0 preserve live:** assign owner/operator to provide immutable Oct-15 Replit checkpoint file hash manifest for the reported 140-path drift, including original migration 0030–0038 and actual deployment provenance; DO NOT synchronize GitHub release into Replit until the exact 90+50 path diff is reviewed, even if a file looks stale. Keep game paths fully frozen.
2. **D01–D04:** obtain signed separate A00/HQ decision record for graph, release/editor total order, acceptable real PostgreSQL/runner receipts and exclusive number allocator. Current P05 manifest not owner approved; numeric T055 key NULL, logical `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1=REQUESTED_NOT_ALLOCATED`.
3. **Actual DB execution:** only after separately authorized physical target+observer, compare `app_schema_migrations` and any alternate ledger to object schema and independent runner transformed-input logs/checksums. `SOURCE_FOUND` / `LEDGER_CLAIM` != `ATTESTED_APPLIED`. No live SQL has been authorized.
4. **A30 Steam security:** verify guard/worker/insertOnly/revision conflict semantics, absence-secret behavior, compare API against actual DB schema. A20 did not assume PASS or inspect credentials.
5. **A90/A110 strict Backup/CAS:** owner trust issuer and anti-downgrade; complete database monotonic BIGINT CAS + 428/412/ABA/clone-local match vs history revision, with separate code GO; A50 native tests and A60 independent exact SHA QA later.
6. **C01:** Issue #73 A50+A60 diagnoses PR60 API integration exit 1; A20 cannot mark composite PASS or trigger #75 based on source-only migration review.
7. **SWARM-006 / release:** HOLD; no merge/deployment/go until explicitly signed by A00/HQ, native PG16/browser/security acceptance complete.

**Recommended next action:** A00 signs D01–D04 *documentary* choices or explicitly defers them, and assigns authenticated Replit checkpoint inventory/DB evidence collection **without any deploy**. A30's parallel security evidence then feeds #72; A60 separately reviews issues/new source in #77. The source-side preservation report and ledger owner packet are ready for their decisions.

**Final A20 status:** `WEB-005_R23D_A20_DOCS_PUBLISHED / SOURCE_MIGRATIONS_14_OF_14_SHA1_CONFIRMED / REPLIT_EXACT_DIFF_UNVERIFIED / D01_D04_PENDING_OWNER_APPROVAL / PG16_NOT_EXECUTED / QA_SOURCE_ONLY / RELEASE_NO_GO / SWARM006_HOLD`.
