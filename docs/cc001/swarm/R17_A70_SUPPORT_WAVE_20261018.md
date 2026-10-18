# CC-001 / Core Clash Unity — A70 SUPPORT WAVE
## One-source parallel dispatch — 18 October 2026

**MISSION:** Split A70's post-import responsibilities into four independent specialist threads without repeating its completed 639-file source import.

**STATUS:** START A71/A72/A73/A74 CONCURRENTLY.  
**HQ OWNER:** 00 / Core Clash.  
**A70 ORIGINAL ISSUE:** [#90](https://github.com/C8LyNn/aplikacja-turnieje/issues/90) — **SOURCE IMPORT COMPLETE / BRANCH ONLY**.  
**A70 COMPLETED HANDOFF:** [report](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a70-source-import/docs/cc001/swarm/R17_A70_SOURCE_IMPORT_HANDOFF_20261018.md).

### COMMON ONE-SENTENCE START INSTRUCTION

> CC-001 / R17 A70 SUPPORT. Open this canonical document and locate **your agent number A71/A72/A73/A74**. Execute ONLY your own section in parallel from the exact A70 source-import baseline, on your own branch, without waiting for any other support agent. Publish an actual GitHub commit, evidence, SHA and HANDOFF on your assigned Issue. Never rewrite imported source/history, merge or deploy.

**This file is the sole task authority for this support wave.** GitHub Issues are tracking surfaces, not duplicated instructions. Do not invent new dependencies between support agents.

## 0. Verified facts before this dispatch

- **Canonical upstream R16 source:** [CoreClash-V149-R16-Source-Candidate.zip](https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view).
- ZIP SHA256: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`.
- Source-import commit: `9a3b12a17d15aa10a260f494c7c407597fe9cce5`.
- Final A70 handoff/head commit: `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.
- Base branch: `feat/cc001-r17-a70-source-import`.
- Exact imported Git subtree: `unity/cc001-r16`.
- Unity project root: `unity/cc001-r16/CoreClash-V149-Unity`.
- Source manifest: `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json`.
- Imported 639 source archive files, 88 Unity `.meta` files, no generated cache/build directories.
- Canonical imported tree SHA: `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` (A70 independently reported match; HQ confirmed GitHub tree object exists).
- [GitHub Actions run 39125498352](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125498352) completed with `success`.
- A70 R17 did **not** independently rerun the Unity Editor compilation or physical-device crossplay.
- Historic R16 reports: 269/269 managed C# tests, codec 13/13, browser HTML 5/5 and three successful builds; these are NOT new A70 post-import runtime results.
- Issue #90 remains open for independent review and final HQ acceptance; a branch-local completion is not a merge.
- Existing Core Clash Unity WebGL published artifact is **not** the canonical editable R16 project.

**If any source HEAD moves after this dispatch:** record new HEAD; do not automatically reset, force push or rewrite. All four support branches originate from the frozen `de1fe4b...` import handoff commit.

## 1. Shared execution and file ownership

- This wave is **four parallel, independent outcomes**. Every agent reads only the shared A70 frozen baseline and existing R16/W1 evidence, never another support agent's new output.
- Each agent writes only inside its dedicated `docs/cc001/swarm/a70-support/A7x/` folder, except **A72** may add an isolated proof script under `scripts/cc001/a72/` when useful; it must not modify source/CI workflow files without a separate gate.
- Source tree `unity/cc001-r16/**` is **READ ONLY** for all four support agents. Do not normalize whitespace, edit `.meta`, stage generated `Library`, `Builds`, `Temp`, `obj`, `Logs`, or modify historical R16 Evidence.
- Don't alter `.github/workflows/cc001-r17-a70-r16-source-import.yml`, transfer blobs, refs, Git history, `.gitattributes`, protected V148, tournament features, current public WebGL/HTML builds.
- No automatic merge, force push, deletion of blobs, Git LFS migration, public deployment, credentials/secrets dumps, or network backend creation.
- Work on one specific task. Use GitHub commit/readback. If the local environment lacks a toolchain, record that explicitly rather than recycling earlier PASS results.
- **No task below is blocked on the completion of A71/A72/A73/A74.** A70 need not be interrupted.

## 2. A71 — Independent source integrity verifier

**TRACKER:** [Issue #112](https://github.com/C8LyNn/aplikacja-turnieje/issues/112)  
**BRANCH:** `feat/cc001-r17-a71-source-integrity`  
**MODE:** READ-ONLY INTEGRITY AUDIT / RISK MEDIUM  
**OWNED OUTPUT:** `docs/cc001/swarm/a70-support/A71/R17_A71_INDEPENDENT_SOURCE_AUDIT.md`

### Mission

Independently verify the **already imported** A70 Git source tree against the authoritative R16 Drive ZIP and `R17_A70_SOURCE_MANIFEST.json`, rather than trusting the A70 HANDOFF.

### Exact work

1. Verify the chosen A70 commit/head and collect its Git tree SHA for `unity/cc001-r16`.
2. Obtain independent file/path/size/hash evidence for **639/639** declared entries where the tools permit, including all **88 `.meta`**. Distinguish Git blob SHA1/tree SHA1 from source SHA256.
3. Independently check `ProjectSettings/ProjectVersion.txt` (Unity 6000.4.0f1), `Packages`, `Assets/CoreClash`, `Assets/Resources/Data`, `Tests`, R16 `Evidence`, and V148 reference inclusion.
4. Check missing/extra paths and unexpected generated outputs, silent line-ending transformation or renamed case-sensitive files. A `git diff` can report historical trailing spaces; never “fix” certified bytes during this audit.
5. Corroborate GitHub Actions source-import success and explain what it proves versus what requires separate Unity compilation.
6. Provide a simple PASS / FAIL / UNVERIFIED table with evidence hashes. No second import.

**Exit:** independently reproducible exact-source verdict and R17 A60/HQ handoff. If bytes cannot be accessed, report `UNVERIFIED`, not `PASS`.

## 3. A72 — Build and managed QA reproducibility

**TRACKER:** [Issue #113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113)  
**BRANCH:** `feat/cc001-r17-a72-build-readiness`  
**MODE:** QA TOOLCHAIN PREFLIGHT / RISK MEDIUM  
**OWNED OUTPUT:** `docs/cc001/swarm/a70-support/A72/R17_A72_BUILD_TEST_READINESS.md`  
**OPTIONAL UNIQUE SCRIPTS:** `scripts/cc001/a72/`

### Mission

Turn the Git-imported Unity project into a **clearly reproducible test entry point**, distinguishing no-SDK checks, .NET managed tests and actual Unity native platform builds.

### Exact work

1. Read exact imported `Tools/r16-qa.cjs`, `Tools/verify-data.cjs`, `Tools/r16-build-smoke.ps1`, build tools, `Tests/CoreClash.Tests.csproj`, package manifest and R16 QA.
2. Define a staged order: project structure + Node data check → managed 269-test suite → codec/HTML → Unity Editor import/compile → Windows/WebGL/Android builds → native gameplay smoke → physical device crossplay.
3. Record exact commands and **their environment requirements**, including .NET 9, Node 22, Unity 6000.4.0f1 and required modules. Account for Windows-only paths, Unity license, browser runner and existing evidence output behavior.
4. Actually run any safe checks supported by the agent environment **against a disposable checkout**; record exit codes/log hashes. If Unity/.NET missing, mark tests NOT RUN rather than asserting PASS.
5. Guard against the historical runner overwriting evidence and detect “green by previous output” false positives.
6. Design a gated GitHub CI proposal for non-Unity checks; **no modifications to actual production workflows or new paid Unity CI execution** in this wave.
7. Produce machine- and human-readable readiness state, blockers, and the minimal next safe command for A60.

**Exit:** test pipeline matrix, real test results if run, unperformed evidence list, no gameplay edits.

## 4. A73 — Git integration and dependent branch map

**TRACKER:** [Issue #114](https://github.com/C8LyNn/aplikacja-turnieje/issues/114)  
**BRANCH:** `feat/cc001-r17-a73-merge-map`  
**MODE:** READ-ONLY MERGE/DEPENDENCY PLANNING / RISK LOW  
**OWNED OUTPUT:** `docs/cc001/swarm/a70-support/A73/R17_A73_INTEGRATION_MERGE_MAP.md`

### Mission

Create the precise plan for incorporating A70 imported Unity sources into ongoing R17 branches **without resetting their existing results**, losing R17-W1/W2 documents or touching deployed website builds.

### Exact work

1. List exact HEAD commits and ancestry for source-import branch, HQ `feat/cc001-unity-swarm-20261018`, A10 PR #98, and A20/A41/A50/A51/A60 R17 first-wave branches; note ongoing R17-W2 branches as independent documentation work.
2. Classify each branch: source-import-required for code, document-only, independently testable, or hold.
3. Build a path-level change/conflict matrix (Unity source under `unity/cc001-r16` versus `docs/cc001/swarm/**` / `scripts/cc001/**`), including shared A50/A51 branch history.
4. Propose **one safe integration ordering** and exact `git merge-base`/compare commands for future HQ, with acceptance gates from A71/A72/A60.
5. Show how to preserve initial R16 exact commit/manifest while allowing separate R17 development commits later; avoid changing `main` or the website release branch until separate authorization.
6. Note which A40 implementation gates can be enabled after A10 contract acceptance and A60 independent source QA, without declaring source readiness equivalent to gameplay release.

**Exit:** decision-ready branch/PR dependency map. **No merge, rebase, PR retargeting or destructive checkout executed.**

## 5. A74 — Transfer-blob/history and storage hygiene

**TRACKER:** [Issue #115](https://github.com/C8LyNn/aplikacja-turnieje/issues/115)  
**BRANCH:** `feat/cc001-r17-a74-repo-hygiene`  
**MODE:** READ-ONLY SOURCE STORAGE/HISTORY AUDIT / RISK LOW-MEDIUM  
**OWNED OUTPUT:** `docs/cc001/swarm/a70-support/A74/R17_A74_SOURCE_HISTORY_HYGIENE.md`

### Mission

Review the artifact footprint left by A70's 45 temporary transfer chunks and the exact R16 import, **without disrupting valid Git history**.

### Exact work

1. Inspect current A70 branch tree versus Git history and determine what transfer chunks are current tracked paths, historical-only reachable blobs, or unverified; do not conflate a clean tree with zero historical storage cost.
2. Estimate repository/clone growth using verifiable Git object and source manifest information. If GitHub connector lacks clone-size evidence, label estimates as conditional rather than inventing disk metrics.
3. Review safe `.gitignore`, `.gitattributes`, Unity `.meta`, executable-bit/text-normalization implications and size policies for future R17 asset commits.
4. Evaluate **without executing** possible approaches: keep history as-is, future Git LFS for new large artifacts, GitHub Actions artifacts/Release packages, external Drive build archives. Discuss trade-offs and retention.
5. Produce explicit `DO NOT FORCE PUSH / NO HISTORY REWRITE / NO DELETION` decision until HQ approves, with any recommended cleanup delayed to separate controlled work.
6. Ensure new Unity source stays separate from existing WebGL/HTML public assets and preserves three-version website identity.

**Exit:** source-history/storage risk register and low-risk future recommendation, no repository mutation outside this report.

## 6. Cross-role isolation

| Agent | Issue | Branch | Exclusive write path | May start now? |
| --- | --- | --- | --- | --- |
| **A71** | [#112](https://github.com/C8LyNn/aplikacja-turnieje/issues/112) | `feat/cc001-r17-a71-source-integrity` | `docs/cc001/swarm/a70-support/A71/` | YES |
| **A72** | [#113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113) | `feat/cc001-r17-a72-build-readiness` | `docs/cc001/swarm/a70-support/A72/` + `scripts/cc001/a72/` | YES |
| **A73** | [#114](https://github.com/C8LyNn/aplikacja-turnieje/issues/114) | `feat/cc001-r17-a73-merge-map` | `docs/cc001/swarm/a70-support/A73/` | YES |
| **A74** | [#115](https://github.com/C8LyNn/aplikacja-turnieje/issues/115) | `feat/cc001-r17-a74-repo-hygiene` | `docs/cc001/swarm/a70-support/A74/` | YES |

All four start from the same **frozen `de1fe4b...` base** through the coordination branch; they don't need one another's output.

## 7. Required HANDOFF in issue comment

```text
PROJECT: CC-001 / Unity V149 R17
WAVE: A70-SUPPORT
AGENT: A7x
ISSUE: #11x
SOURCE BASE HEAD: de1fe4b88fce3bd08ef383165dc2cd622af2536b
OWN BRANCH: feat/cc001-r17-a7x-...
OWN FINAL COMMIT SHA: <verified>
CHANGED FILES: <paths>
ACTUAL CHECKS: <commands, exit codes, or NONE>
UNEXECUTED TESTS: <explicit>
SOURCE INTEGRITY CLAIM: <only if independently supported>
DESIGNED:
IMPLEMENTED:
TESTED:
INTEGRATED:
RELEASED:
BLOCKERS:
HANDOFF: A70 + 00/HQ + A60 as applicable
```

Add a comment with exact file URL and SHA on your Issue. Read back your GitHub artifact. Neither issue closure nor a screenshot by itself is proof of build/merge/live status.

## 8. Acceptance and continuation

00/HQ receives independent work from A71–A74 and reconciles with A70 Issue #90 and A60 Issue #96. A70 import is complete in its own branch; A60 independent review, managed/native test re-execution and branch integration are distinct gates.

**A70 can stop doing chunk handling.** Do not redo the Git archive packaging already completed. This support wave does not merge or deploy the game. R17 source edits by A40/A20/A31/A50 are a **separate** development wave based on a verified imported source tree, with their own review and QA.
