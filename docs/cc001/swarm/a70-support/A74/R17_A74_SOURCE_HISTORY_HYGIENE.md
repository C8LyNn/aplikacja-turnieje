# CC-001 / R17 — A74 Source History & Repository Hygiene Audit

**Date:** 2026-10-18  
**Agent:** A74 — Repository Hygiene  
**Tracker:** [#115](https://github.com/C8LyNn/aplikacja-turnieje/issues/115)  
**Authority:** [R17 A70 support wave](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a70-parallel-support-20261018/docs/cc001/swarm/R17_A70_SUPPORT_WAVE_20261018.md), section 5  
**Audit mode:** remote GitHub API / Git object-tree and commit metadata, read-only; this report is the only new file  
**Frozen source base:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**A70 source import:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`  
**A74 branch:** `feat/cc001-r17-a74-repo-hygiene` (pre-existing branch, initially one dispatch-only commit `7bb38587edb75169b4f69575da2f499c6e51fda1` after frozen base)  
**Verdict:** **CURRENT-TREE HYGIENE PASS / HISTORICAL TRANSFER STORAGE PRESENT / CLONE COST NOT MEASURED**. Nothing should be deleted or rewritten in this wave.

## 1. Actual evidence and observed state

| Observation / check actually made | Result | Evidence |
| --- | --- | --- |
| A70 branch head resolved | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` | GitHub `git/ref/heads/feat/cc001-r17-a70-source-import` |
| A74 pre-audit branch versus frozen base | Ahead 1, behind 0; only `docs/cc001/swarm/R17_A70_SUPPORT_WAVE_20261018.md` added before this report | GitHub compare `de1fe4b...feat/cc001-r17-a74-repo-hygiene` |
| Staging commit inspected | `0122b021f8dc5cb0166e74f6c75e7e250ef61f71` added 45 parts and import script/workflow | GitHub commit file list; Git history |
| Staging transfer directory tree | `4bd72b9758df78475d27fd8cc08fa14c8c3a3d30`; exactly `part-000.bin` through `part-044.bin`, 45 unique blob SHA-1 IDs, `100644` modes | `GET /git/trees/4bd72b...` |
| Sum of 45 transfer-blob declared sizes | **17,690,458 bytes**; 44 × 393,216 + 388,954; min 388,954 / max 393,216 | Sum of individual `size` fields of all 45 Git tree entries |
| Transfer paths in current A70 `docs/cc001/swarm` tree | **ABSENT** (tree `34c765648997fcc9d7a7fac36312af4759849974`); Contents endpoint for transfer path returns 404 | Git tree + current contents GET |
| Transfer parts from stage to import | **45 removals** found in compare `0122b021...9a3b12a` (three intervening commits) | GitHub compare; note REST compare file list is truncated to 300, but all 45 removals are visible |
| Historical reachability | **PRESENT** because the staging commit is an ancestor of the current A70 head and has the transfer directory; this is not the same as current-tree tracking | `GET /commits?sha=feat/cc001-r17-a70-source-import`, staging tree |
| Source Git tree | `unity/cc001-r16` at tree SHA `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` | A70 root `unity` tree and recursive source tree |
| Source tree inventory | **639 Git blobs**, **26,223,651 total uncompressed blob-content bytes**, **88 `.meta`**, all blob modes `100644`, **0** generated-directory hits (`library/temp/obj/logs/builds` path segments, case-insensitive) | Recursive tree API `truncated=false`; count and size aggregation |
| Source manifest metadata | ZIP SHA256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`, ZIP 17,690,458 bytes, 639 entries and 88 `.meta` claimed | `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` Git blob `99cf0b5666f9cd6648943e9b54342e6546c5d3b1` |
| Largest imported file | `CoreClash-V149-Unity/Legacy/core_clash_v149_legacy_presentation.html`, **1,477,293 bytes**; V148 reference **1,465,149 bytes** | Recursive imported Git tree metadata |
| Separate current web versions | `core-clash/`, `core-clash-v149-5/`, `core-clash-unity/` all exist under `artifacts/tournament-manager/public/prototypes/minigames/` | GitHub current-tree contents GET |
| Existing public payload versus source | Public WebGL lives under `artifacts/.../minigames/core-clash-unity/`; editable R16 under `unity/cc001-r16/` | R16 source pointer and repository trees |
| Repository size metadata | `size=74312` reported by GitHub repository API (API's coarse size field, nominally KB); **not** measured checkout or pack growth, not attributable solely to R16 | `GET /repos/C8LyNn/aplikacja-turnieje` |

**Important evidence distinction:** The 45 transfer objects are confirmed in a reachable historical tree. This does **not** establish the number of Git pack bytes on GitHub, a shallow clone, a full clone, a working tree or all refs; compression/delta deduplication and ref availability matter. A deleted path in the current commit does not make its historical blob unreachable.

**Hash distinction:** The transfer items have Git object IDs (Git SHA-1 here); those are **not** the ZIP SHA-256. The declared ZIP SHA-256 was validated by the previous A70 workflow, not recomputed independently by A74. The source tree SHA is a Git tree object ID, **not** a SHA-256 of an archive.

## 2. Storage footprint: defensible bounds, not fake clone metrics

- **Transport payload in Git history:** 17,690,458 raw file bytes / about 16.87 MiB, across 45 historical blobs. This is a sum of *logical blob contents*, not measured compressed storage or marginal fetch cost.
- **Current imported editable source:** 26,223,651 raw file bytes / about 25.01 MiB, across 639 blobs (including 88 `.meta`). It includes source, reference, evidence and supporting R16 files.
- **Simple transfer + imported-source payload tally:** 43,914,109 raw bytes / about 41.88 MiB, before source manifest and Git metadata. **Do not treat this as additional physical storage, clone growth, pack size or deduplicated cost.** Git objects may compress and delta; old repository objects and public builds also exist.
- **Canonical ZIP:** 17,690,458 bytes; source transfer was staged as this archive split into 45 blobs. The size equality was independently observed from Git object metadata. Reassembly/content SHA-256 was **not** independently tested by A74.
- **No clone or storage-delta measurement:** no authenticated full local clone, `git count-objects -vH`, `git verify-pack`, ref-specific `git rev-list --objects` size accounting, or before/after `git clone` / `du` executed. These are next-stage optional measurements, **not** blockers for keeping current clean tree.

### Why clean latest tree is not a history cleanup

At `0122b021...`, `docs/cc001/swarm/r17-import-parts/` contains 45 distinct file objects. A70's `9a3b12a...` import commit deletes all 45 paths from the new tree, but A70 HEAD `de1fe4b...` descends from the staging commit. Ordinary history-preserving full clones that acquire this ancestry may need these older objects; pack/delta behavior and shallow filters change the actual amount. No garbage-collection or GitHub server-space claim is supported.

## 3. Ignore, attributes, mode and byte-preservation risks

**Current root `.gitignore`** (blob `b04aec962bf15e2e37dd3626feb90eba9f31452a`) focuses on web/Node/Replit outputs (`dist`, `node_modules`, caches, backups). It does not independently contain Unity's generated-directory rules. **The imported Unity project's own `.gitignore`** (blob `3a55d7c70b84c438a3dd3d62a59d1ba00e4cc462`) ignores `[Ll]ibrary/`, `[Tt]emp/`, `[Oo]bj/`, `[Ll]ogs/`, `Builds/`, `Tests/bin/`, `Tests/obj/`, IDE paths, performance test outputs. This is adequate for the current nested project path, but future alternate Unity locations or differently cased `Builds` paths need scoped review. **Do not add a blanket `*.meta` ignore; Unity GUID links depend on these files.**

**Imported nested `.gitattributes`**, blob `a66444895919b0d1a68ba102eb43f14b420e86ea`, declares `*.cs`, `*.json`, `*.md`, `*.ps1`, `*.cjs` as `text eol=lf`; `*.unity`, `*.meta`, `*.asset` as `-whitespace`; `Evidence/*.log` as `-whitespace`; and `Legacy/*.html` as `-text`. The `-whitespace` attribute concerns whitespace error checking and **does not disable text conversion**. A relative `Evidence/*.log` pattern may not cover nested `Evidence/R16/BuildLogs/*.log`. These facts justify a future precise attributes review, **not** changing any R16-certified bytes now.

**Source integrity risk:** The original archive was staged with `git hash-object -w --no-filters` / `git update-index --cacheinfo` specifically to preserve bytes despite text attributes. A future `git add -A`, checkout/re-add, bulk line-ending fix, or an editor save could normalize bytes; do not run these casually against certified R16. Use before/after exact blob and manifest comparison, `git ls-files --eol`, and explicit review of expected deltas in an isolated checkout. No `core.autocrlf` policy was altered by A74. All 639 imported blobs currently have `100644` mode, **none** `100755`; scripts requiring executable bits must be invoked via an interpreter or explicitly reviewed in a later authorized change.

**Future asset hygiene proposal (not enforced):** require file-size and provenance review for **new** binary artifacts >5 MiB; seek HQ-approved storage choice for >25 MiB or generated builds; forbid committing `Library/Temp/obj/Logs/Builds`, platform build archives and disposable transfer chunks into normal source history; preserve `.meta` beside Unity assets. These are project policy thresholds, **not claimed GitHub service limits**.

## 4. Risk register

| ID / severity | Risk | Evidence / consequence | Proposed action / owner |
| --- | --- | --- | --- |
| A74-R1 / Medium | Historical transfer payload persists on reachable staging commit | 45 chunks = 17,690,458 raw bytes; clean HEAD does not eliminate history cost | **Accept and document** for R17. HQ only may separately approve future storage optimization; no history rewrite |
| A74-R2 / Medium | Subsequent source changes normalize certified R16 text/meta data | Nested `.gitattributes` and raw import strategy are not interchangeable | Future A71/A60 byte-diff/manifest guard before source edits; never bulk re-add current source |
| A74-R3 / Medium | Generated Unity caches/build outputs committed in new work | Nested ignore limited to project subtree; future sources may move | Proposal for later scoped ignore and pre-commit validation, not this wave |
| A74-R4 / Low | Excessive asset versions and binary churn in future commits | Already three distinct public minigame directories; source and deployment are separate | Preserve three-version catalog identity; review new artifacts and owners before any new public path |
| A74-R5 / Low–Medium | Physical clone size misunderstood or asserted as measured | GitHub `size` API and Git tree blob sizes are not packed object size | Measure clone/pack in approved environment; record shallow/full conditions and refs |
| A74-R6 / Low | Import workflow runs unexpectedly if parts are reintroduced | Workflow listens to changes under `r17-import-parts/**`; source script refuses replacing an existing destination | Do not re-add transfer chunks; future workflow retirement only through separate HQ gate |
| A74-R7 / Low | Ignore/attributes rules incompletely apply to nested logs and case variants | `Evidence/*.log`, `Builds/` patterns | Review as new-source rules in separate controlled PR; **do not edit** imported R16 configs |

No evidence was found in reviewed paths that A74 must repair source or public assets. This is not a claim that every private Git reference, local machine checkout, branch or CI artifact has been exhaustively scanned.

## 5. Options evaluated — **not executed**

| Option | Benefits | Downsides / retention | Decision |
| --- | --- | --- | --- |
| Keep history as-is | Preserves exact SHA chain, A70 reproducibility, clear provenance; no force push / re-clone impact | Transfer blobs remain reachable for full-history retention | **Recommended now** |
| Git LFS for future large binary source assets | Smaller regular Git blobs for newly added large assets, auditable pointers | Hosting/quota/bandwidth, client tooling, retention and archival requirements; not retroactive without migration | **Consider only for new assets** with HQ approval; no LFS migration in R17 |
| GitHub Actions artifacts / Release attachments for build ZIPs | Keep disposable builds and logs separate from source commits; workflow/run traceability | Artifacts need explicit retention and provenance; releases/access control and downloads managed separately | **Preferred for temporary CI outputs**, with manifest + hash |
| Google Drive for canonical release/build archives | External storage for large operator-distributed packages, easier source/build separation | Permissions, link durability, checksum and independent access policy | **Acceptable as archive channel**, with SHA-256 and Git reference; not a substitute for editable source |
| Filter-repo/BFG/force push history rewrite | Could remove historical chunks from some refs and shrink reconstructed history | Invalidates commit SHA, branch ancestry, open PRs and proof, can desynchronize clones; retained refs or hosted objects remain | **REJECTED in this wave** |

**DECISION: DO NOT FORCE PUSH / NO HISTORY REWRITE / NO DELETION.** No blob deletion, Git LFS migration, ref reset, GC, merge, deployment, source modification, workflow modification, or public website change is authorized. Any future cleanup requires separate HQ-approved procedure with exhaustive ref/clone inventory, immutable backups, impact analysis, an explicit rollback and audit gate.

## 6. Public website separation / three-version identity

Current `artifacts/tournament-manager/public/prototypes/minigames/` contains:
- `core-clash/` — existing original Core Clash experience.
- `core-clash-v149-5/` — distinct V149.5 showcase.
- `core-clash-unity/` — distinct published Unity WebGL payload, **not** the canonical editable R16 project.

Imported source is solely `unity/cc001-r16/`. A74 did not edit those three website directories, routing, build artifacts, gallery identifiers, protected V148 source or the separate Unity source. No website deployment has been requested or performed. Keeping these distinct identities is a release/integration acceptance constraint for HQ and A70.

## 7. Reproducibility of read-only checks and deliberately unrun checks

**Actually executed using connected GitHub API:** resolved A70 and A74 refs; read stage/import/final commit history; fetched root/docs/swarm/transfer trees; counted the 45 historical chunk entries and summed Git-declared object sizes; scanned full non-truncated recursive `unity/cc001-r16` tree for paths, file counts, sizes and modes; inspected root/nested ignore and attributes; inspected source manifest, import script, workflow, R16 audit, A70 handoff, R17 dispatch and public minigame directory listing; compared A74 branch against frozen source baseline; fetched absent current transfer path (404, expected). Successful fetches returned structured content; **these are API inspections, not shell command exit=0 or runtime tests**.

**Suggested optional commands in a future authorized disposable clone — NOT RUN here:**
```sh
git fetch origin feat/cc001-r17-a70-source-import
git rev-parse origin/feat/cc001-r17-a70-source-import
git ls-tree -r -l 0122b021f8dc5cb0166e74f6c75e7e250ef61f71 -- docs/cc001/swarm/r17-import-parts/
git ls-tree -r -l de1fe4b88fce3bd08ef383165dc2cd622af2536b -- docs/cc001/swarm/r17-import-parts/
git rev-list --objects origin/feat/cc001-r17-a70-source-import -- docs/cc001/swarm/r17-import-parts/
git count-objects -vH
git ls-files --eol unity/cc001-r16/
```
Compare object storage after a fresh full clone versus an explicitly documented shallow/filtered clone; avoid claiming GitHub's coarse repo-size API field is marginal clone cost. Do not execute destructive commands such as `git filter-repo` or `git gc --prune` as part of R17 support.

**NOT EXECUTED:** independent download/rebuild/hash of the ZIP; local Git clone/repack/pack metrics; local Git LFS tests; Node/.NET/Unity Editor; C# 269-test suite; WebGL/Windows/Android builds; browsers/devices/network crossplay; release or live verification. Historical R16 and A70 success is cited as previous work, **not new A74 test results**. A74 does not independently certify 639 source SHA256s or gameplay readiness; that is A71/A60's gate.

## 8. Handoff — A70 / 00-HQ / A60

- **DESIGNED:** audit and policy/retention risk register completed.
- **IMPLEMENTED:** one documentation-only A74 report; no code/source changes.
- **TESTED:** read-only GitHub history/tree/metadata checks listed above (not runtime tests).
- **INTEGRATED:** A74 report only on agent branch; **no HQ/main merge**.
- **RELEASED:** **NO**.
- **Result:** clean current tree for transfer paths, historical 45-chunk footprint confirmed. Keep history unchanged. A71 owns byte-level source reconciliation, A72 build-toolchain readiness, A60 independent QA and 00/HQ integration decisions.
- **Blockers:** exact physical Git pack/clone growth and independent archive content hash are **UNVERIFIED**, not blockers for recommending no rewrite. Any repo cleanup must be separately authorized.
- **Protected:** `unity/cc001-r16/**`, R16/R15 evidence, V148, public website, WebGL/HTML payload, `.gitattributes`, Git refs and workflows were all untouched by A74.

**End state: DOCUMENTATION COMPLETE / R17 SOURCE HISTORY PRESERVED / NO MERGE OR DEPLOY.**
