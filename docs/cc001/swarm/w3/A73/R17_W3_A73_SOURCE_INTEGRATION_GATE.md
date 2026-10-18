# CC-001 / R17-W3 — A73 Safe Source Integration Gate

**Date:** 2026-10-18  
**Agent:** A73 — Git Integration  
**Issue:** #127  
**Branch:** `feat/cc001-r17-w3-a73-integration-gates`  
**Authorized scope:** READ-ONLY integration preparation. **Only this Markdown file may be changed by A73.**  
**Disposition:** **CONFLICT MAP / HQ CANDIDATE PLAN READY; SOURCE QA PARTIALLY PASSED; BUILD/GAMEPLAY/RELEASE HOLD.**  
**Canonical authority:** `docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md`.

This report **updates**, rather than reruns, the [previous A73 R17 support-wave map](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a73-merge-map/docs/cc001/swarm/a70-support/A73/R17_A73_INTEGRATION_MERGE_MAP.md) from commit `518ee677727592639a4635f025d67bc13decbe2f`. W2 A20/A50/A51 and A72 have now delivered previously missing reports. W3 agents are explicitly concurrent; their **future** outputs are planned, **not consumed as if completed**.

## 1. Frozen source admission / provenance

| Identifier | Exact observed value | Evidence type |
| --- | --- | --- |
| Repository | `C8LyNn/aplikacja-turnieje` | Authenticated GitHub |
| A70 source branch HEAD | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` | GitHub live ref read |
| First source-import commit | `9a3b12a17d15aa10a260f494c7c407597fe9cce5` | A70/A71 evidence |
| Imported prefix | `unity/cc001-r16/` | GitHub exact file reads |
| Actual Unity root | `unity/cc001-r16/CoreClash-V149-Unity/` | GitHub exact file reads |
| Canonical archive SHA-256 | `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` | Independently verified by A71; A73 did NOT re-download ZIP |
| Imported exact source subtree Git tree SHA-1 | `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` | Independently reconstructed/verified by A71 |
| Manifest blob Git SHA-1 | `99cf0b5666f9cd6648943e9b54342e6546c5d3b1` | A73 direct frozen-ref read |
| Manifest contents | 639 files; 88 `.meta` | A73 direct JSON read / A71 byte verification |
| A71 source-audit HEAD | `3e683ee463bac44bd3f35e17d84a43193f084d5e` | GitHub live ref read |
| A71 exact audit result | PASS 639/639 files, 88/88 `.meta`; protected V148 SHA-256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e` | A71 independently executed ZIP/tree/manifest checks |
| Unity ProjectVersion.txt Git blob | `8a87982496ed3239376379e331cd8bda920ee735` | A73 frozen-ref read: 6000.4.0f1 (8cf496087c8f) |
| Package manifest Git blob | `9740a43dab01fbb9252b077da418f73b3b8b4d14` | A73 frozen-ref read: NGO 2.13.3, Multiplayer 2.2.4, Transport 2.6.0 |
| `Tests/Program.cs` Git blob | `12b8fcca30731f007a01a81ac45572671c99f1dc` | A73 frozen-ref read; protected from W3 agent edits |
| `ElementalEffects.cs` Git blob | `31e4785f94d69abac5cbf21a59a844ad46393636` | A73 frozen-ref read; W3 A50 permitted feature-branch edit ONLY |
| GitHub Actions import workflow | run `39125498352`, completed success | A71/A70 checked; tests ZIP reconstruction/data/source push, NOT Unity Editor compile |
| W3 common dispatch/parent HEAD | `e9e235a69a04eb57727defd308918321836d7f02` | GitHub read + compare: one documentation commit descendant of frozen A70 `de1fe4b...` |

**A71 PASS applies to the frozen A70 tree only**. Future W3 source changes are deltas from this certified baseline, not new byte-for-byte R16 files. Keep original commit `9a3b12a...` and the immutable original manifest reachable and unchanged. A later R17 feature-source manifest/version may be written only with separate HQ ownership, never by editing the R16 import manifest.

## 2. Updated exact branch graph — verified heads at the A73 snapshot

All SHA values here are *commit* IDs, not Git blob hashes. Branch heads can move. The first group shares a legacy common ancestor `d1caeb49faaf9a4f2a892e205190705859b367b4` with A70, but does not descend from A70. The W3 group **does** descend from A70 via W3 dispatch.

| Group / branch | Exact current HEAD | Source relationship / changed files | Classification |
| --- | --- | --- | --- |
| A70 `feat/cc001-r17-a70-source-import` | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` | Immutable source import | **CODE SOURCE BASE — FROZEN** |
| HQ `feat/cc001-unity-swarm-20261018` | `f35145085127bdbb878e8ffdcf38705be8348e45` | GitHub A70→HQ compare diverged: HQ ahead 3, behind 5; three master/W2 dispatch docs | **DOCS — BRANCH HISTORY DIVERGED** |
| A10 W1 `feat/cc001-r17-a10-lifecycle-return-contract` | `bc6820b1f32b4b48d26c9359567433ff26ca7ef1` | A70→A10 diverged 1/5, one unique semantic contract | **DOCS / OPEN PR #98** |
| A20 W1 `feat/cc001-r17-a20-mobile-ux` | `aaf89e6c095fe3be408f0d31ace8ecd2a25ad0ea` | Diverged 1/5, one mobile source audit | DOCS, physical UX HOLD |
| A41 W1 `feat/cc001-r17-a31-network-crossplay` | `a914d4c5102c726f4dc7686c9316126dd9e4258e` | Diverged 1/5, one A41 network authority document | DOCS, A31 retains runtime ownership |
| A50+A51 W1 `feat/cc001-r17-a50-partial-acceptance` | `2f4fb224ad19f03ab05a03d642ab4dbfeaaa080c` | Diverged 4/5; four report/fixture/script files on SAME ancestral branch | **DOCS+STATIC SCRIPT — INTEGRATE ONCE** |
| A60 W1 `feat/cc001-r17-a60-independent-qa` | `28d4e60c37e2a6bbf0a85ec854440fdb29053f38` | Diverged 1/5, one HOLD QA report | QA docs, NOT runtime certification |
| A10 W2 `feat/cc001-r17-w2-a10-semantics` | `9ae525297fc9b257d61da772efb196157b145c0b` | HQ→head ahead 1, one `w2/A10` design file | DOCS; Mitosis/Furnace |
| A20 W2 `feat/cc001-r17-w2-a20-landscape-contract` | `3b41765c28585944b1271944bbb63cbcae94006a` | HQ→head ahead 2, one `w2/A20` contract file | **DOCS DELIVERED** (was empty at A73 W1 snapshot) |
| A41 W2 `feat/cc001-r17-w2-a41-reconnect-design` | `e98bc9e7708fdf2cfb814fe0efdcf27dbbbc7f5f` | HQ→head ahead 1, one `w2/A41` contract file | DOCS / POLICY PROPOSAL ONLY |
| A50 W2 `feat/cc001-r17-w2-a50-parity-oracles` | `baf79110fbc9a9da934356271785ab860b37741b` | HQ→head ahead 2, one `w2/A50` golden-oracle file | **DOCS DELIVERED / F01 CORRECTION** |
| A51 W2 `feat/cc001-r17-w2-a51-snapshot-fixtures` | `1c7d86c266107a84c8e1331acd3ee034e81bb9d0` | HQ→head ahead 1, three corpus/README/static-script files | **DOCS+STATIC SCRIPT DELIVERED** |
| A60 W2 `feat/cc001-r17-w2-a60-wave1-qa` | `ae3199b4fe840833ed1221e41b46bf01d0da180f` | HQ→head ahead 1, one `w2/A60` independent review file | QA docs / HOLD |
| A71 `feat/cc001-r17-a71-source-integrity` | `3e683ee463bac44bd3f35e17d84a43193f084d5e` | A70→A71 ahead 2/behind 0; A70 support dispatch + A71 report | INDEPENDENT SOURCE PASS |
| A72 `feat/cc001-r17-a72-build-readiness` | `c49ef5855eed7eb5aef5534f5cc8334fe1585463` | A70→A72 ahead 4/behind 0; coordination dispatch + 3 A72-only files | **PREFLIGHT DELIVERED / MANAGED+UNITY HOLD** |
| A73 W1 support `feat/cc001-r17-a73-merge-map` | `518ee677727592639a4635f025d67bc13decbe2f` | Previous ancestry report, read/consumed; NOT merged here | DOCUMENTATION REFERENCE |
| W3 coordination `feat/cc001-r17-w3-parallel-source-development-20261018` | `e9e235a69a04eb57727defd308918321836d7f02` | A70→W3 ahead 1/behind 0; ONLY `docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md` | SOURCE DESCENDANT + DOC |
| Seven W3 agents at start: A10/A20/A41/A50/A51/A60/A73 | `e9e235a69a04eb57727defd308918321836d7f02` **each observed** | No separate W3 implementation commit at ref-freeze; intentionally NOT wait for subsequent work | **FUTURE INPUTS, NOT COMPLETE** |

**Checked HEAD PR #98:** `state=open`, `merged=false`, `draft=false`, head `bc6820b...`, base branch `feat/cc001-unity-swarm-20261018`. The PR's stored base SHA (`9aa10a9eb0fe2ca04172eedafc57e87f5615492d2`) is not the newest observed HQ HEAD `f351450...`. Recheck before any authorized integration, do NOT retarget PR in this task.

**Exact topological facts actually measured:** 
- A70 → HQ/W1 compare `merge_base=d1caeb49faaf9a4f2a892e205190705859b367b4`; diverged, behind 5 on each W1 branch; W1 A50/A51 has four commits ahead.
- HQ → every W2 branch compare: all `status=ahead`, `behind=0`, ahead count as above; one or three uniquely added files by path, no Unity source changes.
- A70 → A71/A72/W3 compare: all `status=ahead`, `behind=0`, A71 ahead 2, A72 ahead 4, W3 ahead 1. A70 source commit is therefore an ancestor of W3 baseline.
- No local shell `git merge-base` command, checkout, Git `merge-tree`, actual merge or rebase was executed. Results are authenticated GitHub compare API evidence.

## 3. Path-level source and document conflict graph

**Observed path intersection is assessed from GitHub compare file lists, not inferred from task titles.** For the A70 import, a GitHub compare may cap file listings at 300; its exact 639-file scope comes from A71's full non-truncated recursive-tree audit. Existing W1/W2 branches change unique leaf paths. `docs/cc001/swarm/**` as a broad folder *overlaps textually* but **file-paths are disjoint** in observed reports.

| Input | Exact/owned path set | Direct path conflict today? | Semantic / ancestry hazard |
| --- | --- | --- | --- |
| A70 certified source | `unity/cc001-r16/**` (639 files), `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json`, A70 HANDOFF | NO vs delivered W1/W2 docs | Initial imported bytes must never be modified retroactively; future R17 code edits measured against frozen SHA |
| HQ W1/W2 master | `docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md`, `R17_THREAD_START_PROMPTS.md`, `R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md` | NO vs A70; W2 already inherits HQ | Integrate HQ history ONCE before individual W2 heads |
| A10 W1 / PR #98 | `docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md` | NO | A40 later code requires HQ acceptance; NOT implemented by PR |
| A20 W1 | `docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md` | NO | UI/device observations historically from emulation |
| A41 W1 | `docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md` | NO | A31 remains owner of real network/runtime validation |
| A50 + A51 W1 | `docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md`; `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json`; `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md`; `scripts/cc001/r17-a51-static-preflight.cjs` | NO | Shared **four-commit ancestry**; include A50 head ONCE, never re-pick A51 W1 commits separately |
| A60 W1 | `docs/cc001/swarm/R17_A60_INDEPENDENT_QA_GATE_001.md` | NO | Early HOLD is historical; remains HOLD for runtimes |
| W2 A10 | `docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md` | NO | W3 A10 may refine control-flow oracle, not old file |
| W2 A20 | `docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md` | NO | W3 A20 uses distinct Unity Presentation files |
| W2 A41 | `docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md` | NO | Explicit host refill is PROPOSAL, not implemented policy |
| W2 A50 | `docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md` | NO | W1 F01 initial two-hit assertion **superseded**; source V148 initial HP actually 5 |
| W2 A51 | `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json`; `R17_W2_A51_SNAPSHOT_CORPUS_README.md`; `scripts/cc001/r17-w2-a51-snapshot-preflight.cjs` | NO | 41 static fixtures are NOT actual executed C# / NGO tests |
| W2 A60 | `docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md` | NO | W1 reconciliation predates W3 code |
| A71/A72 support | `docs/cc001/swarm/a70-support/A71/**`; `a70-support/A72/**`; `scripts/cc001/a72/**` | NO vs W1/W2/W3 source | A72 preflight is read-only; original source runners may mutate historical Evidence |
| W3 A10 | `docs/cc001/swarm/w3/A10/R17_W3_A10_MITOSIS_WALL_FIRST_ORACLE.md` | **PROPOSED, NOT OBSERVED** | NO V148 edit; can be accepted independently as doc |
| W3 A20 | `Assets/CoreClash/Presentation/MatchLayout.cs`; `MatchView.cs`; `Tests/PresentationTests.cs`; `docs/cc001/swarm/w3/A20/**` under Unity prefix | **PROPOSED, NOT OBSERVED** | Disjoint from A41/A50/A51 permitted files; touch/control integration risk at runtime |
| W3 A41 | `Assets/CoreClash/Networking/LanSeat.cs`; `Tests/NetworkSeatTests.cs`; `docs/cc001/swarm/w3/A41/**` | **PROPOSED, NOT OBSERVED** | Identity policy must stay R16 current behavior; no unsolicited reconnect redesign |
| W3 A50 | `Assets/CoreClash/Core/ElementalEffects.cs`; `Tests/ElementalTests.cs`; `docs/cc001/swarm/w3/A50/**` | **PROPOSED, NOT OBSERVED** | F02 Frostguard only; cannot touch physics or construction |
| W3 A51 | `Assets/CoreClash/Networking/NetworkGameSession.cs`; `Tests/StabilityR16Tests.cs`; `docs/cc001/swarm/w3/A51/**` | **PROPOSED, NOT OBSERVED** | Distinct file paths from A41, but shared network semantics / command admission require integration regression |
| W3 A60 | `docs/cc001/swarm/w3/A60/R17_W3_A60_SOURCE_BASELINE_QA_GATE.md` | **PROPOSED, NOT OBSERVED** | Source-admission QA only, not post-W3 regression |
| W3 A73 | `docs/cc001/swarm/w3/A73/R17_W3_A73_SOURCE_INTEGRATION_GATE.md` | **THIS REPORT ONLY** | Documentation has no runtime impact |

**Current path-conflict assessment: NO observed same-path collisions across delivered W1/W2 documents and planned *distinct* W3 owned source files.** This does not certify any later changed paths or resolve semantic conflicts. **File path disjointness ≠ merge-test PASS; neither test execution nor candidate assembly occurred.** Never modify `Tests/Program.cs` to register suites: existing suites already run from Program.Main. New Unity `Assets` files require valid unique `.meta`, but current W3 permits only existing owned source files.

**Critical corrected F01 status:** V148 `createStructure()` initializes **HP 5** even where callers pass `hits:2`; R16 likewise initially has HP 5. W1 inference “R16 must be repaired to two hits” is WRONG; W2 A50 supersedes that inference. The unresolved parity candidate concerns V148 hostile impact `>32` and `>0.28s` cooldown vs R16 fresh contact and inward speed `>=90`. This remains a **specified/native-unverified** F01 hypothesis, not W3 permission to change structures. W3 A50 owns **F02 Frostguard only**: no synthetic Earth stacks, regression first. Do not promote any of 19 PARTIAL or 134 DATA_ONLY absent actual evidence.

## 4. A72 delivery and QA gate: precise separation

A72 Issue #113 is **still OPEN**, but its final HANDOFF comment and artifacts **exist**. A73 directly read the published report and Issue comments; do not copy the dispatch-time statement “no A72 handoff yet” as current fact:

- A72 exact head `c49ef5855eed7eb5aef5534f5cc8334fe1585463`.
- Files: `docs/cc001/swarm/a70-support/A72/R17_A72_BUILD_TEST_READINESS.md`, `R17_A72_READINESS.json`, `scripts/cc001/a72/read-only-preflight.cjs` (plus inherited support dispatch, no Unity source edits).
- **Actually reported:** read-only static GitHub checks 32 PASS/0 FAIL, local Node 22.16.0 available and Node script syntax pass; deliberately missing fixture exits 1 (negative-control expected).
- **Not executed:** the original `node Tools/verify-data.cjs` in a full disposable checkout, `.NET 9` managed suite 269 cases / codec 13, Unity Editor 6000.4.0f1 compilation, Windows/WebGL/Android builds, browser/live hosting checks, physical device/network smoke.
- **Blockers:** A72 environment lacked `dotnet`, `pwsh`, Unity Editor and working DNS checkout. Old `Tools/r16-qa.cjs` and Editor smoke tools write Evidence/build outputs and MUST run only from a disposable full checkout.

**Interpretation:** A71 raw-source fidelity PASS = source provenance gate; A72 scoped static preflight PASS = pipeline inspection gate; A60 Issue #126 source admission is a separate independent sign-off; new managed/Unity/physical runtime still HOLD. The R16 historic 269/269 and 13/13 reports are not post-W3 tests. An open A72 Issue must not be used as evidence of no A72 delivery; conversely a final Issue comment is not proof of runtime compilation.

## 5. Proposed single HQ-owned disposable integration sequence (NOT EXECUTED)

This is a **future** plan that HQ must authorize separately, after obtaining current refs. Do not reset existing HQ/W1/W2/W3 branches, amend A70 source, rebase PR #98, update protected/main/site refs, publish, or force-push.

1. **Freeze current SHA ledger and audit readbacks.** HQ checks exact A70 `de1fe4b...`, source/tree/manifest A71 PASS, accepted A60 source admission (Issue #126) and A72 scoped preflight status, then re-checks all delivered W1/W2 HEADs and open PR #98. Any branch movement invalidates this frozen path matrix until re-compared. No editing outside disposable candidate. **Gate:** A60 admits A70 for *development only*; runtime/release remain HOLD.
2. **Create an explicitly authorized disposable candidate branch from frozen A70 HEAD `de1fe4b...`**; do not point/rewrite existing `feat/cc001-unity-swarm-20261018` or `feat/cc001-r17-a70-source-import`. First incorporate the W3 dispatch coordination document exactly once (already ancestor of any W3 branch) and the HQ master W1/W2 documentation history (common ancestor `d1caeb49...`). Inspect `git merge-tree` **BEFORE** a later actual merge and compare resulting source subtree to certified A70 while still at docs-only stage.
3. **Incorporate completed W1 work ONCE:** A10 W1 PR #98 only following HQ semantic acceptance; A20 W1; A41 W1; A50/A51 W1 as **single inclusion** of `2f4fb...` preserving all four ancestor commits (do not independently cherry-pick A51 fixture commits and then replay A50); A60 W1 HOLD report. Accept W1 design/evidence without promoting gameplay statuses. Leave PR #98 open until HQ decides its workflow; no automatic PR retarget/merge.
4. **Incorporate completed W2 documentation:** A10 `9ae525...`, A20 `3b4176...`, A41 `e98bc9...`, A50 `baf791...`, A51 `1c7d86...`, A60 `ae3199...`. All descend from HQ `f351450...`, therefore include shared HQ ancestry once. Preserve W2-A50's F01 correction *as governing source-truth* without editing W1 audit history. The A51 corpus/readme/script remain distinct from W1 A51 fixtures/static preflight.
5. **Bring in A71/A72/A73 independent support reports** as docs/script inputs as HQ approves; parent coordination dispatch is shared. Their completed reports do NOT automatically close source, runtime or release gates. A74 storage is independently owned, optional for runtime candidate and must not cause history rewrite.
6. **Only then evaluate fresh W3 branches** (A10 design, A20 compact layout, A41 seat tests, A50 F02 Frostguard, A51 snapshot tests and A60 source admission) using per-head compare and **actual** file list at final SHAs. Require original assigned files only; tests must be *executed* where environment supports and all NOT_RUN declared. For each code branch, run its suite in isolation, review source diff, then simulate candidate conflict and subsequently run combined tests on the disposable candidate. W3 A60 source admission is **not** a combined-regression sign-off for these newly authored source changes. Don't wait for their results in this A73 task.
7. **Final HQ/A60 gates:** a candidate (if ever assembled) must pass fresh combined managed/codec, Unity Editor import, Windows/WebGL/Android build, native gameplay, and physical device/network gates as separately scoped. Distinguish unavailable/NOT_RUN from failure and from historical R16 PASS. Revalidate V148 SHA, protocol 149, data/catalog unchanged, Unity GUIDs, actual diff against raw R16, and public website three-build isolation. HQ may authorize later release only in a new scope.

**Stop / escalation conditions:** source A71 integrity changes or manifest differs; A60 source admission fails; PR #98 semantics not approved for A40; new W3 edits exceed assigned paths, write `Program.cs`, touch V148 / website / protocol / catalog or R16 Evidence; merge-tree returns conflict; a regression run fails; or build/runtimes are falsely asserted PASS. Freeze refs and report to HQ rather than hide conflicts.

## 6. Non-mutating validation commands / GitHub API for future HQ

**These commands are provided, NOT EXECUTED by A73.** Use a disposable local clone with read permission and known Git version. `git merge-tree --write-tree` does not advance refs, but may create unreachable Git tree objects locally. Exit codes must be preserved, not overridden.

```bash
# Resolve fresh current refs; never treat frozen W3 HEAD as permanently current
git fetch --no-tags origin   feat/cc001-r17-a70-source-import   feat/cc001-unity-swarm-20261018   feat/cc001-r17-w3-parallel-source-development-20261018   feat/cc001-r17-a50-partial-acceptance   feat/cc001-r17-w2-a50-parity-oracles

git rev-parse origin/feat/cc001-r17-a70-source-import
git rev-parse origin/feat/cc001-unity-swarm-20261018
git cat-file -t 9a3b12a17d15aa10a260f494c7c407597fe9cce5
git merge-base de1fe4b88fce3bd08ef383165dc2cd622af2536b f35145085127bdbb878e8ffdcf38705be8348e45
git merge-base --is-ancestor 9a3b12a17d15aa10a260f494c7c407597fe9cce5 e9e235a69a04eb57727defd308918321836d7f02
git diff --name-status d1caeb49faaf9a4f2a892e205190705859b367b4 f35145085127bdbb878e8ffdcf38705be8348e45
git diff --name-status f35145085127bdbb878e8ffdcf38705be8348e45 1c7d86c266107a84c8e1331acd3ee034e81bb9d0

# Preview A70↔HQ history reconciliation; no branch movement
git merge-tree --write-tree de1fe4b88fce3bd08ef383165dc2cd622af2536b f35145085127bdbb878e8ffdcf38705be8348e45

# Later, use exact updated HEAD SHA for each accepted branch on the candidate
git diff --name-status de1fe4b88fce3bd08ef383165dc2cd622af2536b CANDIDATE_SHA -- unity/cc001-r16
git diff --exit-code de1fe4b88fce3bd08ef383165dc2cd622af2536b CANDIDATE_DOCS_ONLY_SHA -- unity/cc001-r16
git diff --exit-code de1fe4b88fce3bd08ef383165dc2cd622af2536b CANDIDATE_SHA -- docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json
git merge-base --is-ancestor 9a3b12a17d15aa10a260f494c7c407597fe9cce5 CANDIDATE_SHA
```

**Interpretation:** In a documentation-only candidate, the imported Unity subtree and original R16 manifest must remain byte-identical. After separately accepted W3 code changes, the Unity diff will **intentionally** be nonempty, but may contain **only accepted feature paths**, with no original source commit/manifest rewrite. An actual `git merge --no-ff`, candidate `switch -c`, remote push, PR retarget or release requires new HQ authorization and is explicitly **not part of A73-W3**.

GitHub equivalent read-only GET comparisons (authenticated, inspect ahead/behind/merge_base/files; compare file lists can truncate on large source imports):

```text
GET /repos/C8LyNn/aplikacja-turnieje/git/ref/heads/feat/cc001-r17-a70-source-import
GET /repos/C8LyNn/aplikacja-turnieje/compare/de1fe4b88fce3bd08ef383165dc2cd622af2536b...f35145085127bdbb878e8ffdcf38705be8348e45
GET /repos/C8LyNn/aplikacja-turnieje/compare/f35145085127bdbb878e8ffdcf38705be8348e45...1c7d86c266107a84c8e1331acd3ee034e81bb9d0
GET /repos/C8LyNn/aplikacja-turnieje/git/trees/de1fe4b88fce3bd08ef383165dc2cd622af2536b?recursive=1
```

**A73 actual checks** are connector-based GitHub `fetch` of 24 exact branch refs, authenticated `compare_commits` for A70→HQ/W1/A71/A72/W3 and HQ→all W2, `get_pr_info` of #98, Issues #127/#113/#126, issue #113 final HANDOFF readback, readback of A71, A72, prior A73 and six W2 reports, plus direct exact source reads of ProjectVersion/Packages/Program/ElementalEffects/manifest at frozen A70 commit. The actual checks are *read-only API operations* with observed outputs, not shell command executions. No cross-platform compilation or acceptance tests were run by A73.

## 7. Block / unblock decision table and truthful A73 HANDOFF

| Gate | Evidence today | Decision / next owner |
| --- | --- | --- |
| G0 exact original R16 provenance | A71 independent ZIP SHA, 639/639, meta 88/88, Git tree matches | **PASS for frozen A70 source** |
| G1 initial source may serve as W3 DEVELOPMENT base | A70 complete + A71 PASS; separate A60 #126 admission pending at A73 freeze | **CONDITIONAL / A60 source-admission owner** |
| G2 reproducible static preflight | A72 final HEAD c49ef..., scoped 32/32 static checks PASS | **STATIC PREFLIGHT PASS ONLY** |
| G3 new .NET managed + codec / native Unity compilation | A72 NOT RUN; missing SDK/Unity/checkout | **HOLD / A72 + A60** |
| G4 A10 W1 semantic contract | PR #98 open/unmerged | **HOLD A40 implementation until explicit HQ acceptance** |
| G5 W1/W2 evidence preservation | All six W2 heads now delivered, separate file paths; A50/A51 W1 shared branch | **PLANNABLE / HQ**; no executed merge |
| G6 future W3 changed-path compliance | All seven W3 branch heads equal e9e235... at freeze | **UNVERIFIED FUTURE CHANGESET**; must re-read after delivery |
| G7 F01 structures parity | W2 A50 corrects V148 actual HP to 5; hit-gate differences native NOT RUN | **DO NOT FIX TO 2 / RUNTIME QA HOLD** |
| G8 F02 Frostguard parity | W2 F02 remains source discrepancy; W3 A50 assigned two paths | **REQUIRES TEST-FIRST / A50 + A60** |
| G9 physical Android/tablet, WAN/cross-device, public three builds | No R17 physical/network acceptance delivered | **HOLD; NO RELEASE** |
| G10 public website/main merge or deploy | Not authorized in W3 | **PROHIBITED** |

**DESIGNED:** YES — updated complete W1/W2/W3 Git ancestry ledger, paths, source/build/status gates and specific HQ ordering.  
**IMPLEMENTED:** YES — *documentation-only* A73 report on its isolated branch; NO gameplay or Git integration.  
**TESTED:** authenticated GitHub branch-ref/compare and exact source/report readback only; NO local Git merge-tree, .NET, Unity or device tests.  
**INTEGRATED:** NO — no merge, rebase, PR retarget, cherry-pick, force push or candidate branch assembly.  
**RELEASED:** NO — public website and all three Core Clash builds untouched.  
**LIMITATIONS:** W3 branch heads can move; path comparisons are not an actual 3-way merge; GitHub per-file compare can truncate for 639 source files; A73 did not independently re-hash the canonical ZIP.  
**HANDOFF:** 00/HQ / Issue #97, A60 / Issue #126 and Issue #96, A70 / Issue #90. Preserve original R16 source commit and manifest. HQ should authorize and independently verify its own disposable integration candidate only after source-admission and runtime gates, without treating planning as deployment.
