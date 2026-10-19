# CC-001 / R17-W5 — A70 Stage 2 Diagnostic Source Integration — HANDOFF

**IDENTITY_CHECK:** CC-001 | A70 | Issue #137 | STAGE 2 ASSEMBLED / G1–G4 HOLD  
**Agent:** A70 — Integration / Release  
**Existing Issue:** [#137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137)  
**Explicit authority:** [HQ #137 comment 6265060722](https://github.com/C8LyNn/aplikacja-turnieje/issues/137#issuecomment-6265060722)  
**Own authorized ref:** `integration/cc001-r17-w5-stage2-diagnostic-20261019`  
**Scope:** exactly eight selected C# source/test paths and this report under `docs/cc001/swarm/w5/A70/`; source authors' original branches not altered.  
**Classification:** **UNVERIFIED / DEVELOPMENT & DIAGNOSTIC ONLY. NOT A RELEASE CANDIDATE.**

## 1. Immutable refs and ancestry

| Ref | Exact commit SHA | Read-back / disposition |
| --- | --- | --- |
| Original frozen R16 source | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` | G0 independent SOURCE-ONLY PASS; original branch unchanged |
| W4 shared dispatch ancestor | `661660d3a3dc8a4fa2c9afea489050247f64c38c` | Common merge-base of Stage1, A40 and A50 divergent histories |
| Stage 1 A70 parent | `ab624c2789b6efda015e742e8bd9bcbb86766735` | Independently A71 source-PASS and A74 hygiene-PASS-with-risks; not G1/G2 |
| HQ Stage 2 branch before integration | `ab624c2789b6efda015e742e8bd9bcbb86766735` | Identity to Stage1: zero extra paths/commits |
| **A40 exact LIVE input** | `bfa9bd4f86c60c7bd528a6d03581179e405be3aa` | Live ref rechecked before write; source HEAD, **NOT** old `3351036...` |
| **A50 exact LIVE input** | `9b84a730b39d4033fcd283e2f555774138312ea2` | Live ref rechecked before write; source HEAD, **NOT** old `947f9...` |
| A72 runner / CI author branch | `ab6074f4903ba4958f5d749d7ae58e3c9512e242` | Unchanged separate runner; workflow/scripts not imported here |
| **Stage 2 source-integrated commit** | **`e58ba23a9f20e7a0865668655bd1e819845474bc`** | True source-containing commit, parent exactly Stage1; Git tree `3d5f979aa16e5b56635c2c3d8f6d58a0cf67b762` |
| Final branch HEAD including this provenance report | **See #137 latest HANDOFF comment and remote branch readback** | Documentation-only commit above the exact source-integrated commit |

`compare_commits` from W4 shared dispatch:
- A40 head: `ahead=17 behind=0`, **8 changed paths**, five Unity C# source/test files and three A40-owned reports.
- A50 head: `ahead=10 behind=0`, **6 changed paths**, three Unity C# source/test files and three A50-owned reports.
- Stage1: `ahead=6 behind=0`, **35 changed paths**, five C# files from W3 + documentation/scripts.
- A40, A50 and Stage1 **DIVERGE** after W4 dispatch (do not fast-forward entire role histories).
- Pairwise intersection of changed **paths**: A40∩A50=0; A40∩Stage1=0; A50∩Stage1=0.
- Structural ancestry/same-path conflict verdict: **PASS / zero observed direct path collisions**. Full Git `merge-tree` three-way and semantic compile-conflict verdict: **NOT_RUN / UNVERIFIED**, not asserted conflict-free.

## 2. EXACT eight-path Stage2 source provenance — Git blob SHA-1

All paths have prefix `unity/cc001-r16/CoreClash-V149-Unity/`. Read each file at its latest author HEAD, insert exact original blob into Stage1 tree, read candidate file back at `e58ba23...`, compare with source. **8/8 exact Git blob matches PASS**.

| Agent | C# file relative to Unity root | Exact selected Git blob SHA-1 |
| --- | --- | --- |
| A40 | `Assets/CoreClash/Core/AbilityResolver.cs` | `1f0affe3d1b3d02f23142d2a894e5a0250dca7d4` |
| A40 | `Assets/CoreClash/Core/GameSimulation.cs` | `25f5a18de4df3942626f0245c9b1be77eee73106` |
| A40 | `Assets/CoreClash/Core/GameState.cs` | `f14e1f8080a4f630ebcb226407585b45a7f152ef` |
| A40 | `Assets/CoreClash/Core/LifecycleEffects.cs` | `65d48932a4b547a5673888d7d0e228fda68f3b58` |
| A40 | `Tests/AbilityTests.cs` | `62fd2ea17d0972bc67d4a356632c442250d69f07` |
| A50 | `Assets/CoreClash/Core/ElementalEffects.cs` | `4e0ce8287e71778dc7bf647e785680ddf03a8e18` |
| A50 | `Assets/CoreClash/Physics/CollisionResolver.cs` | `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e` |
| A50 | `Tests/ElementalTests.cs` | `f846df155ef95128bc04d58a04f6852f58f3b2be` |

**Method and actual Git operations:** connected GitHub immutable blob lookup -> `create_tree` using exact `100644 blob` records and Stage1 base tree `6779f9987d4f1d9b1fb83ebf82711a7500069c80` -> `create_commit` single parent `ab624c...` -> `update_ref(force=false,expected_sha=ab624c...)` SUCCESS. No original agent commit ancestry replay/branch merge/cherry-pick. Source HEAD rechecked immediately before write; no unexpected moving HEADs. Stage2 content commit has exactly eight modified C# files compared to Stage1 (`ahead=1,behind=0`, no other paths). All eight blobs read back individually at exact SHA and match their source Git SHA-1. Report commit only adds this one A70 Markdown file.

## 3. Complete 13-source-path combined candidate ledger

The five W3 Stage1 C# paths were **preserved EXACTLY** by direct Stage1→Stage2 readback (all 5/5 matching Git blob SHA-1):
1. A20 `Assets/CoreClash/Presentation/MatchLayout.cs`: `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916`.
2. A20 `Assets/CoreClash/Presentation/MatchView.cs`: `7f9631a3fb272d312e253b15d2d4627f9d79d05f`.
3. A20 `Tests/PresentationTests.cs`: `7dc53a2c32db97375d6846fac418a4ca89a6feaf`.
4. A41 `Tests/NetworkSeatTests.cs`: `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05`.
5. A51 `Tests/StabilityR16Tests.cs`: `68cbba61fc2d692a2c98241484d1fd30a10092c9`.

Plus eight new A40/A50 paths in table above = **13** intentional modified Unity C# file paths relative to original imported R16. All other Stage1 files preserved because Stage2 commit diff against Stage1 has *only* the eight authorized modifications.

**Protected positive readbacks:** candidate vs Stage1 `Tests/Program.cs` blob `12b8fcca30731f007a01a81ac45572671c99f1dc` unchanged; original `unity/cc001-r16/Reference/V148_reference_original.html` blob `657a423dc4e8fe87598e664d67e124d24b483343` unchanged. Frozen original R16 manifest / `.meta` files / catalog / packages / protocol149/PR/website do not appear in the Stage1→Stage2 eight-file diff. Original V148 reference SHA256 historically `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e` — **not recomputed this iteration**.

**Excluded:** ALL A40/A50 original documentation and inherited commits, W3 A50 separate intentionally RED fixture branch, A72 workflow/runner changes, protected `Tests/Program.cs`, R16 manifest, V148, protocol149, Unity .meta, catalog and cross-project tournament/source files. No registry promotion or user-facing deployment. The new A40/A50 `Tests/AbilityTests.cs` and `Tests/ElementalTests.cs` contain their **authored but not executed** assertions: they are diagnostic test inputs, not passed QA.

## 4. Tests ACTUALLY performed vs not executed

**Successful tool/source checks (no shell exit code for GitHub API or V8 controls):**
- `compare_commits` W4 dispatch→A40/A50/Stage1 and Stage1→Stage2, HEAD/ref/tree reads, eight individual author blob fetches and eight independent target blob readbacks. **8/8 exact Git blob parity PASS**; diff/allowlist exactly 8/8 authorized source paths.
- Stage1 retained source compare: **5/5 exact Git blobs PASS**; protected V148 and `Tests/Program.cs` readback **2/2 PASS**.
- Negative scope controls: `Tests/Program.cs` not selected; no A50 edit to A40-owned `GameSimulation.cs`; no A40 edit to A50-owned `ElementalTests.cs`; pairwise path collisions zero. This is *not* a proof against cross-file semantic conflicts.
- In-memory source text assertions performed on exact combined SHA in V8: **12/12 STATIC SOURCE PRESENCE PREDICATES PASS** (Earth-only replay branch, Frostguard release flag, no normal/cascade grave eligibility, Phoenix/Dirge tokens, grave cap test text, A50 physics explicit 0.30 and written test labels G09B/C/D/E). This **does not run C# or evaluate actual game mechanics**.
- Source candidate Git tree assembly with non-force expected HEAD lease: SUCCESS; actual remote ref and all eight target blobs read back unchanged.

**Environment commands ACTUALLY executed locally in Linux (not repo tests):**
```sh
command -v dotnet        # EXIT 1 (not found)
dotnet --info            # EXIT 127 ("dotnet: command not found")
git --version            # EXIT 0 (git version 2.47.3)
node --version           # EXIT 0 (v22.16.0)
timeout 10 git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD
                         # EXIT 128 (DNS: Could not resolve host github.com)
test -x /usr/share/dotnet/dotnet
                         # EXIT 1 (not present)
```
Ephemeral local logs: `/tmp/cc001_stage2_dotnet.log`, `/tmp/cc001_a70_stage2_git_remote.log`, **not uploaded** or claimed as permanent CI artifacts.

**NOT_RUN**: local clone/full `git merge-tree`, actual .NET 9 baseline 269 and authored W3/W4/W5 managed test suites; codec 13; A50 F02 G09B/C/D/E behavioral RED→GREEN; A40 Phoenix / Dirge / grave-cap / Soul Anchor behavioral execution; Unity 6000.4.0f1 editor compilation and Windows/WebGL/Android builds; physical mobile/network/crossplay, snapshot runtime and independent G4 QA. `G0=PASS` applies to original R16 only; Stage1 A71/A74 PASS apply to **prior** `ab624c...` only, not this Stage2 SHA.

**Tracked H-01 risk from A74 Stage1 hygiene:** historical W2 A51 snapshot corpus pins frozen R16 `Tests/StabilityR16Tests.cs` source SHA-256 while Stage1/Stage2 correctly contain modified A51 test-source blob `68cbba61...`. Legacy W2 source-binding checks run directly against Stage2 may report expected source-hash mismatch; **DO NOT rewrite or disable the old oracle** and do not reclassify a runner FAIL as PASS. A72 should run exact-SHA candidate-specific testing with distinction between immutable R16 provenance and modified candidate test suite.

## 5. Five-axis outcome / next gate owners

PROJECT: CC-001  
WAVE: R17-W5 — STAGE2 INTEGRATION & VERIFICATION  
AGENT / ISSUE: A70 / #137  
OWN BRANCH: `integration/cc001-r17-w5-stage2-diagnostic-20261019`  
START SHA: `ab624c2789b6efda015e742e8bd9bcbb86766735`  
INTEGRATED SOURCE SHA: `e58ba23a9f20e7a0865668655bd1e819845474bc`  
FINAL SHA including handoff document: **recorded in Issue #137 after report-commit readback**  
NEW CHANGED PATHS: eight tabled original-source C# paths + `docs/cc001/swarm/w5/A70/R17_W5_A70_STAGE2_DIAGNOSTIC_INTEGRATION_HANDOFF.md`.  
DESIGNED: **YES** — pinned inputs and exact allowlist/provenance mapping.  
IMPLEMENTED: **YES** — eight exact C# source/test files staged on Stage2 isolation; cross-role defects not claimed repaired beyond authored source.  
TESTED: **STATIC SOURCE / BLOB / READBACK ONLY**; actual managed/Unity/device **NOT_RUN**.  
INTEGRATED: **YES — ISOLATED DIAGNOSTIC SOURCE TREE ONLY**; no main/protected/live merges.  
RELEASED: **NO**.  
CURRENT GATE: **STAGE2 SOURCE ASSEMBLY PASS (structural only); G1/G2=HOLD, G3/G4=WAIT, release=HOLD**.

**Next HANDOFF:** independent new exact-SHA **A71 #140 source provenance** and **A74 #141 hygiene (H-01 retained)**; A73 #136 ancestry/conflict verification; **A72 #113 must obtain real .NET9/codec G1 on actual candidate**, with fresh logs/results and exits, or explicit honest blocker; **A50 #138** G09B/C/D/E on same combined SHA; **A40 #92** Phoenix, Soul Anchor, Dirge, grave eligibility on same combined SHA. A60 #139 independent candidate runtime QA only after G1/G2 proof; A20 #95 / A31 #94 only after real G2 builds. No further A70 source mutation without HQ; Issue #137 stays open; NO public build, deployment, branch rewrite, protected-source modification or release authorization.
