# CC-001 — R17-W4 / A70 STAGE 1 UNVERIFIED DEVELOPMENT CANDIDATE

**AGENT:** A70 — Integration / Release  
**ISSUE:** [#137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137)  
**WAVE:** R17-W4 RECOVERY  
**SCOPE/AUTHORITY:** [HQ Stage 1 authorization #137 comment 6254787287](https://github.com/C8LyNn/aplikacja-turnieje/issues/137#issuecomment-6254787287) after independent G0 and A73 W4 preflight.  
**DISPOSITION:** **ACTUAL SOURCE ASSEMBLED — UNVERIFIED DEVELOPMENT / DIAGNOSTIC CANDIDATE ONLY. G1/G2/G3/G4 HOLD; RELEASE HOLD.**  
**BRANCH:** `integration/cc001-r17-w4-disposable-candidate-20261018`

## 1. Exact source/gates/commits

| Item | SHA / decision |
| --- | --- |
| Frozen original R16 A70 SOURCE baseline (not edited) | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` |
| Shared R17-W4 MASTER DISPATCH | `661660d3a3dc8a4fa2c9afea489050247f64c38c` |
| A70 pre-existing coordination HEAD / STAGE 1 start | `74a3438b03cdd8891315734c98fc1e8dafc6ba45` |
| STAGE 1 W3 source/test proposals | `e7af2c71bed614d8457b3ad6975cc38ea9840450` |
| STAGE 1 HQ/W1 unique docs+static script | `d78eb373b3019604e32673bf3b7ba9dacfe8558c` |
| STAGE 1 W1 QA plus W2 documentation+static corpus | `06caeb173a2573f5daebfc8159b56a7265636395` |
| STAGE 1 A60 G0/A73/A72 evidence docs | `0b3060933abab29701ce947559fdd029a1f25fc5` |
| **Final report commit / exact final branch HEAD** | **See #137 handoff and readback**; creating this report advances HEAD by documentation only |
| **A60 independent G0 source gate** | **PASS SOURCE-ONLY**, report `2ceeb9b1a8bf2edd4c55731533cbad2c49d6a4de`, [#126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126#issuecomment-6254152535) |
| **A73 W4 ancestry/path preflight** | **ACCEPTED WITH LIMITS** by HQ, `65883db7589964367f33c0e5ee2672f9d3a85822`, [#136](https://github.com/C8LyNn/aplikacja-turnieje/issues/136#issuecomment-6254215721) |
| A72 W4 manual-only CI handoff | `ab6074f4903ba4958f5d749d7ae58e3c9512e242`; managed CI G1 **NOT_RUN** |

**Method:** a deliberately linear, **path-specific Git blob inclusion** into a disposable A70 branch. The GitHub connector fetched exact source-file SHA blobs from pinned source commits; `create_tree(base_tree_sha, tree_elements[path,mode=100644,type=blob,sha])`, `create_commit(parent_sha=current)`, and **non-force** `update_ref(expected_sha=previous)` each succeeded. This is deterministic content selection, **not a 3-way merge, Git cherry-pick, or preservation of original merge-parent graph topology**. HQ authorized path-specific inclusion if local merge-tree unavailable. Every original source ref remains recorded below; shared parent file changes were included ONCE rather than repeating a branch's inherited files.

## 2. INCLUDED provenance matrix — Stage 1

**Common documents — source-by-source, exactly one selected leaf set per shared history:**

| Input (exact source HEAD) | Selected paths | Candidate classification |
| --- | --- | --- |
| HQ `f35145085127bdbb878e8ffdcf38705be8348e45` | `docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md` (modified), `R17_THREAD_START_PROMPTS.md`, `R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md` | W1/W2 coordination and context ONLY; HQ leaf paths used once |
| W1 A10 `bc6820b1f32b4b48d26c9359567433ff26ca7ef1` | `docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md` | Contract, not lifecycle implementation |
| W1 A20 `aaf89e6c095fe3be408f0d31ace8ecd2a25ad0ea` | `docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md` | UX prior assessment |
| W1 A41 `a914d4c5102c726f4dc7686c9316126dd9e4258e` | `docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md` | Design/reference, NOT physical network |
| **Shared W1 A50/A51 `2f4fb224ad19f03ab05a03d642ab4dbfeaaa080c`** | `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json`, `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md`, `docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md`, `scripts/cc001/r17-a51-static-preflight.cjs` | Four unique paths from ONE shared four-commit history; no double import |
| W1 A60 `28d4e60c37e2a6bbf0a85ec854440fdb29053f38` | `docs/cc001/swarm/R17_A60_INDEPENDENT_QA_GATE_001.md` | Historical HOLD/assessment, not latest candidate acceptance |
| W2 A10 `9ae525297fc9b257d61da772efb196157b145c0b` | `docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md` | Contract only |
| W2 A20 `3b41765c28585944b1271944bbb63cbcae94006a` | `docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md` | UX contract |
| W2 A41 `e98bc9e7708fdf2cfb814fe0efdcf27dbbbc7f5f` | `docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md` | PROPOSAL only, not network policy |
| W2 A50 `baf79110fbc9a9da934356271785ab860b37741b` | `docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md` | Binding F01 correction: protected V148 construction initial HP=5, NOT 2 |
| W2 A51 `1c7d86c266107a84c8e1331acd3ee034e81bb9d0` | `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json`, `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS_README.md`, `scripts/cc001/r17-w2-a51-snapshot-preflight.cjs` | Static corpus/scripts, not compiled codec |
| W2 A60 `ae3199b4fe840833ed1221e41b46bf01d0da180f` | `docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md` | Historic QA report |
| W3 common `e9e235a69a04eb57727defd308918321836d7f02` | `docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md` | Single copy of W3 common dispatch |
| W3 A10 `05eb15293dad4d61271e7c200ce661f1080f5288` | `docs/cc001/swarm/w3/A10/R17_W3_A10_MITOSIS_WALL_FIRST_ORACLE.md` | A10 browser oracle, NOT Unity |
| W3 A73 `7d57f92aea3660aa1b2183e937e357b409e8c19d` | `docs/cc001/swarm/w3/A73/R17_W3_A73_SOURCE_INTEGRATION_GATE.md` | Prior integration plan |
| A60 G0 `2ceeb9b1a8bf2edd4c55731533cbad2c49d6a4de` | `docs/cc001/swarm/w3/A60/R17_W3_A60_SOURCE_BASELINE_QA_GATE.md` | SOURCE-only PASS for immutable R16 |
| A73 W4 `65883db7589964367f33c0e5ee2672f9d3a85822` | `docs/cc001/swarm/w4/A73/R17_W4_A73_EXACT_W3_CONFLICT_PREFLIGHT.md` | Path/ancestry PASS, 3-way unverified |
| A72 W4 `ab6074f4903ba4958f5d749d7ae58e3c9512e242` | `docs/cc001/swarm/w4/A72/R17_W4_A72_MANAGED_CI_HANDOFF.md` | CI documentation only, **workflow/runner NOT INCLUDED** in candidate, G1 NOT_RUN |

**Source+test proposals INCLUDED but explicitly UNCOMPILED:**

| W3 author HEAD | Exact source/test paths under `unity/cc001-r16/CoreClash-V149-Unity/` | Readback Git blob SHA-1 | Gate |
| --- | --- | --- | --- |
| A20 `1f87595a9d73de30179e5158a5848eae3b965885` | `Assets/CoreClash/Presentation/MatchLayout.cs` | `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916` | G1/G2/G3 HOLD |
| A20 same | `Assets/CoreClash/Presentation/MatchView.cs` | `7f9631a3fb272d312e253b15d2d4627f9d79d05f` | G1/G2/physical UI HOLD |
| A20 same | `Tests/PresentationTests.cs` | `7dc53a2c32db97375d6846fac418a4ca89a6feaf` | Authored tests, NOT_RUN |
| A41 `8eb0b2517c049c95fc2257d73f0139d7bc17fd2c` | `Tests/NetworkSeatTests.cs` | `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05` | 17 authored W3 cases, NOT_RUN; not authenticated reconnect |
| A51 `92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5` | `Tests/StabilityR16Tests.cs` | `68cbba61fc2d692a2c98241484d1fd30a10092c9` | 23 authored W3 cases, NOT_RUN; not NGO transport |

Their owned source reports are also included:
- `docs/cc001/swarm/w3/A20/R17_W3_A20_COMPACT_LAYOUT_IMPLEMENTATION.md`
- `docs/cc001/swarm/w3/A41/R17_W3_A41_LAN_SEAT_REGRESSIONS.md`
- `docs/cc001/swarm/w3/A51/R17_W3_A51_SNAPSHOT_ADMISSION_TESTS.md`

**34 changed paths** compared to W4 dispatch *before this final report*: **five** modified Unity C# files; **two** new standalone static scripts; the remaining **27** documentation files (including the pre-existing A70 coordination memo). GitHub compare shows `ahead=5`, `behind=0`. No Unity source deletions in the five selected source files. Original R16 imported source remains present as ancestor; after W3 source modification, candidate Unity subtree itself is **NOT** identical to frozen R16 by design.

## 3. EXPLICIT EXCLUSIONS and semantic holds

- **W3 A50 `4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5`**: intentionally RED `Tests/ElementalTests.cs` fixture and W3 F02 report **NOT INCLUDED** in this development candidate. No F02 readiness promotion or false RED→GREEN.
- **W4 A50 `a9548d044047b8bfbbfd28285222512573e6b51c`**: partial `ElementalEffects.cs`, `CollisionResolver.cs`, `Tests/ElementalTests.cs` and F02 report **NOT INCLUDED**. A40 owns necessary shared `GameSimulation.cs` replay handling; G09B still needs controlled combined resolution and executable positive/negative controls.
- **W4 A40 `22b1d1b005ce494f7dd980a4602a9172c754cac0`**: partial lifecycle `LifecycleEffects.cs`, `GameState.cs`, `AbilityResolver.cs`, `AbilityTests.cs` and report **NOT INCLUDED**; Phoenix normal command hand and Kill grave timing require new A40-only `GameSimulation.cs` scope per latest HQ #92 comment. Do NOT stage or self-edit partial shared-core fixes now.
- **A72 W4** manual CI workflow `.github/workflows/cc001-r17-managed.yml` and two `scripts/cc001/w4/a72/*.cjs` not included at this step; only its status document selected. No CI registration or execution is claimed.
- No `Tests/Program.cs`, original `R17_A70_SOURCE_MANIFEST.json`, `Reference/V148_reference_original.html`, `.meta`, `catalog.json`, Protocol149, ability registry, game networking implementation, main branch, protected website, deployment or public release was changed.
- W1 historical F01 'HP2' inference is explicitly superseded by W2 V148 HP5 source truth. No structure HP/source fixes authored here.

## 4. ACTUAL QA/evidence — strict scope and exits

**GitHub connector read-only and atomic-write checks (successful):**
- Selected source paths fetched from exact original commit SHAs; Git blob IDs used to build new tree objects; each A70 remote ref update was `force=false` and lease-checked by `expected_sha`; each update reported `success=true`.
- Full GitHub compare `661660d3a3dc8a4fa2c9afea489050247f64c38c...0b3060933abab29701ce947559fdd029a1f25fc5`: 34 changed paths, 5 modified Unity files and no unapproved filenames; source files are disjoint from A40/A50 authorized W4 paths. This is source metadata inspection, **not** 3-way conflict calculation.
- **Positive provenance/readback control: PASS 5/5**: each candidate modified Unity C# Git blob SHA is **exactly identical** to A20/A41/A51 named source commit blob. Original R16 manifest unchanged `99cf0b5666f9cd6648943e9b54342e6546c5d3b1`; `Tests/Program.cs` unchanged `12b8fcca30731f007a01a81ac45572671c99f1dc`; protected original V148 at `unity/cc001-r16/Reference/V148_reference_original.html` unchanged Git blob SHA `657a423dc4e8fe87598e664d67e124d24b483343`. Their source vs candidate blob IDs were read back individually. The authoritative V148 SHA-256 is independently recorded by A60 as `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`, **not newly recomputed by A70**.
- **Negative path-control: PASS**: injected forbidden paths `Tests/Program.cs` and `Tests/ElementalTests.cs` were both rejected by the A70 5-source-file allowlist. No such file was included by candidate compare.
- Recorded branch HEAD and new tree SHAs for each deterministic integration commit; no force push or protected branch mutation.

**Local Linux shell commands actually attempted (Git 2.47.3, Node v22.16.0):**

```sh
git --version
# exit 0: git version 2.47.3
git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD
# exit 128: Could not resolve host: github.com
dotnet --info
# exit 127: dotnet: command not found
node --version
# exit 0: v22.16.0 (availability check only)
```

Local log files: `/tmp/cc001_a70_git_ls_remote.log` and `/tmp/cc001_a70_dotnet_info.log` (ephemeral in A70 runtime; excerpts above; not uploaded to GitHub). Local full private-repo clone, `git merge-tree`, `git diff` in actual worktree, .NET9 managed test invocation, codec 13, Unity Editor 6000.4.0f1 compilation, Windows/WebGL/Android target builds, real phone/tablet/touch, LAN/WAN and G09B gameplay negative controls: **NOT_RUN**. No fabricated test counts or exits.

**NO NEW EXECUTABLE G1/G2/G3/G4 PASS.** A60 #126 source-only G0=PASS refers solely to immutable R16 and does NOT certify the added W3 code. A73 metadata/path preflight cannot guarantee semantic compatibility or compiled success.

## 5. Five independent status axes + next handoff

PROJECT: CC-001  
WAVE: R17-W4 RECOVERY  
AGENT: A70 — Integration / Release  
ISSUE: #137  
OWN BRANCH: `integration/cc001-r17-w4-disposable-candidate-20261018`  
FROZEN R16 BASE: `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
W4 DISPATCH SHA: `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
OWN STAGE1 START SHA: `74a3438b03cdd8891315734c98fc1e8dafc6ba45`  
SOURCE CANDIDATE SHA BEFORE THIS REPORT: `0b3060933abab29701ce947559fdd029a1f25fc5`  
FINAL HEAD: **See #137 final comment / exact remote GitHub readback**.  
CHANGED PATHS: precise 34-path compare above + **this one new A70 report file**; no game content authored outside selective original W3 blob inclusion.  
DATA / V148 / PROTOCOL 149 MODIFIED: NO.  
DESIGNED: **YES — selective safe-source plan/provenance matrix**.  
IMPLEMENTED: **YES — 5 W3 Unity source/test deltas and controlled documentation integrated into a disposable dev branch**; W4 A40/A50 partial fixes NOT included.  
TESTED: **STATIC GIT provenance/readback/allowlist only; C#/.NET/Unity/device NOT_RUN**.  
INTEGRATED: **YES — disposable development candidate only, unverified; NO merge into main or protected/release/web branches**.  
RELEASED: **NO**.  
GATE: **STAGE 1 SOURCE ASSEMBLY COMPLETED; G1/G2/G3/G4 HOLD / NOT_RUN; release HOLD**.  
BLOCKERS: no local repo DNS/.NET9/Unity; true three-way merge conflict detection NOT_RUN; independently uncompiled A20/A41/A51 changes; A40/A50 shared-core resolution and G09B pending; A72 G1 CI runner not on default branch; physical mobile/network evidence missing.  
HANDOFF: **00/HQ #97** (candidate SHA and selection); **A71 #140** source-provenance inspection; **A74 #141** hygiene ledger; **A72 #113** executable managed test runner on exact candidate when possible; **A60 #139** independent candidate QA only after G1/G2; **A20 #95** and **A31 #94** after real G2 target builds.

**Issue #137 remains open. No production merge, deploy, release certification, force push, R16 overwrite or V148 mutation.**
