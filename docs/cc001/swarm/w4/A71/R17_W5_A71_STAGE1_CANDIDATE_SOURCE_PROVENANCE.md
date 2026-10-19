# CC-001 — R17-W5 / A71 — Independent Stage 1 Candidate Provenance Audit

**Agent:** A71 — Source Integrity (independently assigned by this conversation)  
**Issue:** [#140](https://github.com/C8LyNn/aplikacja-turnieje/issues/140)  
**Audit authorization:** [HQ comment 6264039774](https://github.com/C8LyNn/aplikacja-turnieje/issues/140#issuecomment-6264039774)  
**Own branch:** `feat/cc001-r17-w4-a71-candidate-integrity`  
**Own start ref:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**Frozen R16 baseline:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**W4 shared dispatch:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**A70 Stage 1 candidate (IMMUTABLY PINNED):** `ab624c2789b6efda015e742e8bd9bcbb86766735`  
**Candidate branch:** `integration/cc001-r17-w4-disposable-candidate-20261018`  
**Candidate Unity subtree:** `79babd44cc8e91a608fa74cc392b3cc11175aa49` (intentionally differs from R16 baseline)  
**Original R16 Unity subtree:** `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`

## Independent verdict

**SOURCE PROVENANCE: PASS on this exact Stage 1 candidate commit** — 35/35 candidate delta paths traced by exact matching Git blob IDs to declared pinned input commits, including **5/5 modified C# blobs**, **2/2 standalone static scripts**, and **28/28 documentation paths**. Original R16 membership (639 files), 88 Unity `.meta` files and their GUIDs, original V148, manifest, package and protocol source protection remain intact. The only 5 changed Unity files are those selectively accepted for **UNVERIFIED DEVELOPMENT / DIAGNOSTIC** use.

**RUNTIME CERTIFICATION: NOT RUN / HOLD.** This is not G1/G2/G3/G4, not a Unity compilation, not successful managed-test execution, not a release approval. The absence of executed candidate tests is an evidence limitation, **not** a source corruption finding.

## 1. Fresh read-only GitHub structure/diff checks

Queried exact refs, both full GitHub recursive trees (`truncated=false`), the W4 dispatch tree, two GitHub compare endpoints, and candidate/author source blobs through the authenticated GitHub connector. Results:

| Property | Independent observation |
| --- | --- |
| `git compare` dispatch → candidate | `ahead=6`, `behind=0`, **35 changed paths** |
| `git compare` frozen R16 → candidate | `ahead=7`, `behind=0`, **36 changed paths** (35 plus W4 dispatch itself) |
| Candidate changed categories | **5** modified Unity C#, **2** new `scripts/cc001/` static scripts, **28** documentation paths, **0 other** |
| Candidate `unity/cc001-r16` subtree SHA-1 | `79babd44cc8e91a608fa74cc392b3cc11175aa49` |
| R16 original `unity/cc001-r16` subtree SHA-1 | `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` |
| Unity files by recursive tree | baseline **639**, candidate **639** |
| Unity source blobs unchanged | **634/639** (byte-identical Git objects) |
| Unity source blobs modified | **5/639**, each on exact approved list |
| Added/missing Unity files | **0 / 0** |
| `.meta` by candidate Git tree | **88**, changed **0** |
| Unexpected changed Unity paths | **0** |
| Changed executable mode/symlink | **0**: all Unity file entries `100644` |
| Case-folded candidate path collisions | **0** |
| Generated Unity cache/build directory components | **0** for `Library`, `Temp`, `obj`, `Logs`, `Builds` |

The top-level candidate diff is not just a new documentation file: it genuinely integrates five C# paths. Conversely, it is **not** an actual Git 3-way merge of the agents' histories; it is a linear selection of source blobs with recorded provenance.

### Five selected Unity source/test blobs — independently verified 5/5

Each SHA below was read **twice independently**, once from the exact contributor HEAD via `fetch_file` and once from the full exact-candidate Git tree. All comparisons matched.

| Relative path under `unity/cc001-r16/CoreClash-V149-Unity/` | Input HEAD | Matching Git blob SHA-1 |
| --- | --- | --- |
| `Assets/CoreClash/Presentation/MatchLayout.cs` | A20 `1f87595a9d73de30179e5158a5848eae3b965885` | `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916` |
| `Assets/CoreClash/Presentation/MatchView.cs` | A20 same | `7f9631a3fb272d312e253b15d2d4627f9d79d05f` |
| `Tests/PresentationTests.cs` | A20 same | `7dc53a2c32db97375d6846fac418a4ca89a6feaf` |
| `Tests/NetworkSeatTests.cs` | A41 `8eb0b2517c049c95fc2257d73f0139d7bc17fd2c` | `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05` |
| `Tests/StabilityR16Tests.cs` | A51 `92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5` | `68cbba61fc2d692a2c98241484d1fd30a10092c9` |

These are **authorial Git blob provenance checks**, not proofs that the newly authored C# test cases execute or pass.

### Two independently checked scripts — matching 2/2

| Path | Pinned author commit | Candidate == original blob |
| --- | --- | --- |
| `scripts/cc001/r17-a51-static-preflight.cjs` | W1 shared A50/A51 `2f4fb224ad19f03ab05a03d642ab4dbfeaaa080c` | `23084fe8e33f96ef247d5be6f88a7b34ee4c0109` |
| `scripts/cc001/r17-w2-a51-snapshot-preflight.cjs` | W2 A51 `1c7d86c266107a84c8e1331acd3ee034e81bb9d0` | `1711bced1cce719924d25f2fe2f9e24611713653` |

Neither script was executed by A71 in this audit.

### All 28 documentation paths — independent author-blob readback PASS 28/28

The following document paths from the exact candidate diff were compared, individually, to the Git blob ID at their source HEAD recorded in [A70's 35-path provenance ledger](https://github.com/C8LyNn/aplikacja-turnieje/blob/ab624c2789b6efda015e742e8bd9bcbb86766735/docs/cc001/swarm/w4/A70/R17_W4_A70_STAGE1_DEV_CANDIDATE_HANDOFF.md); all matched. Grouped here without abbreviating paths:

```text
docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md
docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md
docs/cc001/swarm/R17_A60_INDEPENDENT_QA_GATE_001.md
docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md
docs/cc001/swarm/R17_THREAD_START_PROMPTS.md
docs/cc001/swarm/R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md
docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md
docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json
docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md
docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md
docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md
docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md
docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md
docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md
docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md
docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json
docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS_README.md
docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md
docs/cc001/swarm/w3/A10/R17_W3_A10_MITOSIS_WALL_FIRST_ORACLE.md
docs/cc001/swarm/w3/A20/R17_W3_A20_COMPACT_LAYOUT_IMPLEMENTATION.md
docs/cc001/swarm/w3/A41/R17_W3_A41_LAN_SEAT_REGRESSIONS.md
docs/cc001/swarm/w3/A51/R17_W3_A51_SNAPSHOT_ADMISSION_TESTS.md
docs/cc001/swarm/w3/A60/R17_W3_A60_SOURCE_BASELINE_QA_GATE.md
docs/cc001/swarm/w3/A73/R17_W3_A73_SOURCE_INTEGRATION_GATE.md
docs/cc001/swarm/w4/A70/R17_W4_A70_GATED_CANDIDATE_COORDINATION.md
docs/cc001/swarm/w4/A70/R17_W4_A70_STAGE1_DEV_CANDIDATE_HANDOFF.md
docs/cc001/swarm/w4/A72/R17_W4_A72_MANAGED_CI_HANDOFF.md
docs/cc001/swarm/w4/A73/R17_W4_A73_EXACT_W3_CONFLICT_PREFLIGHT.md
```

**Important:** matching a historical report blob proves which bytes were selected, **not** that its conclusions apply to the modified candidate. W1/W2/W3 reports must retain their original dates and scope.

## 2. Immutable protection checks — PASS for source-level invariants

Compared candidate Git blob SHAs against the frozen baseline's recursive tree. All protected paths below have exact identical blob IDs:

| Protected path / group | Frozen == candidate |
| --- | --- |
| `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` | PASS, Git SHA-1 `99cf0b5666f9cd6648943e9b54342e6546c5d3b1` |
| `Reference/V148_reference_original.html` | PASS, Git SHA-1 `657a423dc4e8fe87598e664d67e124d24b483343` |
| `Tests/Program.cs` | PASS, Git SHA-1 `12b8fcca30731f007a01a81ac45572671c99f1dc` |
| `Packages/manifest.json` and `packages-lock.json` | PASS, unchanged blobs |
| `ProjectSettings/ProjectVersion.txt` | PASS, unchanged blob (Unity `6000.4.0f1`) |
| `Assets/Resources/Data/catalog.json` | PASS, unchanged blob |
| `Assets/CoreClash/Core/GameSimulation.cs` | PASS, unchanged blob |
| `Assets/CoreClash/Core/ElementalEffects.cs` | PASS, unchanged blob |
| `Assets/CoreClash/Physics/CollisionResolver.cs` | PASS, unchanged blob |
| `Tests/ElementalTests.cs` | PASS, unchanged blob |
| Every original `.meta` file | PASS, 88 unchanged byte-identical Git blobs |
| Other 634 original R16 unchanged Unity files | PASS against frozen tree |

**F02 & lifecycle exclusions:** none of the A40 W4 partial gameplay changes, A50 W4 F02 source/test changes or A50 W3 deliberately RED `ElementalTests.cs` fixture was selected. Protocol 149 networking/serialization source and the original V148 reference were not changed by the Stage 1 tree diff. This is **static source preservation**, not a claim that the network protocol was exercised.

The R16 manifest remains a **historical original-source manifest**; it must not be presented as a complete byte manifest for the modified Stage 1 candidate. A70's separate Stage 1 provenance ledger captures exact new Git blobs, but a per-candidate **executed test/result manifest** is not available. G1/G2/G3/G4 remain independent gates.

## 3. Independent raw R16 archive / metadata control — actually executed

The canonical raw `CoreClash-V149-R16-Source-Candidate.zip` available in the present Linux runtime was read **without editing or extracting back into a source worktree**. Ran `python3 /mnt/data/cc001_a71_w5_source_check.py` (Python **3.13.5**) using Python standard-library `zipfile`, `hashlib` and `re`. **Final process exit 0**:

```text
ARCHIVE_SHA256 b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4 PASS
RAW_GIT_TREE_SHA1 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6 PASS
ENTRY_COUNT 639 PASS
META_GUID_UNIQUE 88 / 88 PASS
HISTORICAL_SUMS 637 / 637 PASS
V148_SHA256 bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e PASS
UNITY_EDITOR 6000.4.0f1 PASS
NEGATIVE_CONTROLS 3/3 PASS (mutated in memory)
```

Independent raw Git SHA-1 reconstruction from all 639 original ZIP entry bytes equals frozen GitHub source subtree `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`. Since 634 candidate blobs exactly match the frozen GitHub tree, and every modified blob matches its author source commit, this connects the Stage 1 source tree to the authoritative R16 archive **without incorrectly expecting the modified Stage 1 Unity tree SHA to remain identical**.

Meta GUID extraction: regex `(?m)^guid:\s*([0-9a-fA-F]{32})\s*$` found 88 and **88 unique** in ZIP; candidate preserved every corresponding Git blob. Historical `SHA256SUMS.txt` matched all 637 listed file paths. Three **in-memory negative controls** correctly rejected a modified V148 byte stream, an altered Git blob byte stream and a duplicate GUID. No edits to ZIP, V148 or source were made.

**Audit log SHA-256:** `3257bf1d72b7eb0b21eb8343882ea2c00b80ce7bf7cddb5f5d9098346d04c909` (`cc001_a71_w5_source_check.log`).  
**Local verifier script SHA-256:** `78782a05d3dde85b709fc1fed84c091ebff566219325f36ab27bc28df97e16a9`.  
These local files are reproducibility aids in the A71 runtime; neither is claimed to have been uploaded to GitHub or executed in CI.

**Disclosed first failed ad-hoc run:** earlier positive script invocation exited **1** because the A71 checker transcribed the authoritative V148 SHA-256 assertion incorrectly (the raw calculated hash was correct). Corrected **only the local audit assertion**, then the above final verifier exited **0** with all positive and negative controls. No underlying source defect or repository edit was involved.

## 4. Candidate commit history and absence of runtime evidence

Live GitHub commit-parent checks show a continuous linear chain:

```text
661660d3... [W4 dispatch]
  -> 74a3438b03cdd8891315734c98fc1e8dafc6ba45 [A70 coordination]
  -> e7af2c71bed614d8457b3ad6975cc38ea9840450 [five Unity source/test changes + W3 docs]
  -> d78eb373b3019604e32673bf3b7ba9dacfe8558c [W1/HQ docs+script]
  -> 06caeb173a2573f5daebfc8159b56a7265636395 [W2 docs+script]
  -> 0b3060933abab29701ce947559fdd029a1f25fc5 [QA/CI docs]
  -> ab624c2789b6efda015e742e8bd9bcbb86766735 [A70 Stage 1 ledger]
```

GitHub commit verification reports **unsigned** for each of the six A70 candidate commits; **no cryptographic author-signature attestation exists for those commits**. This does not contradict byte-exact Git-object provenance, but identity/signature verification remains **UNVERIFIED**.

Queried `GET /actions/runs?head_sha=ab624c...&per_page=100`: **total_count=0**. Queried GitHub combined commit statuses: **0 statuses**. There is **no verified candidate-specific executable CI evidence**. A72's W4 managed workflow was **not included** in Stage 1; A72 documentation alone is not execution.

**Not executed by A71:** `dotnet test` managed 269 + W3 test additions; codec 13; Unity Editor import/compile; Windows/WebGL/Android builds; actual UI and network smoke; physical devices; three-way merge-tree conflict resolution; gameplay RED→GREEN, G09B/C/D/E, crossplay; A60 independent G4. Their result is **NOT_RUN**, never `PASS`.

## 5. Gate matrix / risks / HANDOFF

| Gate | Verdict | Exact claim |
| --- | --- | --- |
| **R16 G0** | PASS (existing A60 #126) | Frozen original source only, already independently admitted |
| **A71 Stage 1 SOURCE PROVENANCE** | **PASS** | Exact `ab624c...` candidate; 35/35 changed-path provenance, 5/5 C# source blobs, protected baseline and .meta intact |
| Candidate-specific test result manifest | **UNVERIFIED** | A70 source ledger exists; no executed G1/G2 result bundle anchored to candidate SHA |
| **G1 .NET9 / codec** | **HOLD / NOT_RUN** | No candidate-specific recorded CI runs |
| **G2 Unity native compilation/builds** | **HOLD / NOT_RUN** | Unity toolchain execution not evidenced |
| **G3 devices/network** | **HOLD / NOT_RUN** | No physical devices/network evidence |
| **G4 independent candidate QA** | **HOLD / NOT_RUN** | Reserved for A60 #139 after runtime gates |
| **RELEASE** | **NOT AUTHORIZED** | No main merge, live build or deploy |

**DESIGNED:** YES — complete candidate-specific provenance/missing-evidence control.  
**IMPLEMENTED:** YES — this A71 source-audit report only, on A71-owned documentation path.  
**TESTED:** YES — read-only GitHub tree/blob/source-commit comparison and local ZIP/hash/GUID/negative controls; **not** .NET/Unity/runtime.  
**INTEGRATED:** NO — A71 did not integrate; A70's candidate is on a disposable branch only.  
**RELEASED:** NO.

**HANDOFF → 00/HQ #97, A70 #137, A60 #139, A72 #113:** independent A71 source-provenance gate is **PASS solely for pinned Stage 1 SHA**. The next integration or runtime attempt must be tied to a **new exact candidate SHA** and needs a fresh delta/provenance review if source changes. Run .NET9+codec with fresh logs, manifest, numeric exits; then Unity compile/build and independent A60 QA. A40/A50 partial commits are **not** included here; do not infer their readiness. No branch history rewrite, force push, source edits, V148 modification, main merge, public website work or deployment was performed in this audit.
