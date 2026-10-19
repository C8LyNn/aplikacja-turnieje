# CC-001 / R17-W5 — A74 Stage 1 candidate hygiene audit

**Agent:** A74 — Repository Hygiene (existing thread assignment)  
**Issue:** [#141](https://github.com/C8LyNn/aplikacja-turnieje/issues/141)  
**HQ activation:** [#141 comment 6264040442](https://github.com/C8LyNn/aplikacja-turnieje/issues/141#issuecomment-6264040442), [#97 comment 6264041137](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6264041137)  
**Audit target (immutable commit, not moving branch):** `ab624c2789b6efda015e742e8bd9bcbb86766735`  
**A70 branch:** `integration/cc001-r17-w4-disposable-candidate-20261018` (read-only)  
**Frozen original R16 source:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**R17-W4 dispatch:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**A74 branch:** `feat/cc001-r17-w4-a74-candidate-hygiene`  
**A74 start HEAD:** `9b174410e14b8766e3a25ca42d9d898ab4ef4501`  
**Write scope:** this new Markdown report ONLY, under `docs/cc001/swarm/w4/A74/**`.

## Decision

**SOURCE/REPOSITORY HYGIENE: PASS WITH TRACKED RISKS for the exact A70 Stage 1 DEVELOPMENT candidate.**

- No unapproved path mutations, generated cache/build folders, new log/build archives or high-confidence secret patterns in the **35 changed paths** were detected using the explicit checks below.
- All **five changed Unity C# blobs** match the stated W3 A20/A41/A51 origin commits by direct GitHub readback. No newly introduced Unity files or altered `.meta`.
- Historical R16 Evidence logs remain intentionally tracked, unchanged and **are not new Stage 1 test results**.
- A **concrete static-preflight compatibility risk** exists: a carried-forward W2 A51 source-hash corpus pins a baseline R16 test file that is modified in Stage 1. See finding H-01.
- The audit does **not** certify absence of all possible secrets, a clean compiled Unity project, test correctness, G1/G2/G3/G4, or release. The candidate remains **UNVERIFIED DEV ONLY / RELEASE HOLD**.

## 1. Full candidate and frozen baseline tree comparison

Both `GET /git/trees/<SHA>?recursive=1` responses returned `truncated=false`; this is a **full GitHub Git-tree metadata inspection**, not a shell clone.

| Read-only test | Observed | Verdict |
| --- | --- | --- |
| Candidate Git tree | `ab624c2789b6efda015e742e8bd9bcbb86766735`, **1,953 tree entries**, **1,748 blob paths** | PASS — complete API listing |
| Frozen R16 repository tree | **1,718 blob paths** | PASS — complete API listing |
| W4 dispatch → Stage 1 candidate commit compare | **ahead 6, behind 0**, **35 changed paths** | PASS — scoped change inventory |
| 35 changed paths grouped | **28 docs**, **2 scripts**, **5 Unity C#**, **0 other** | PASS — matches HQ/A70 file classes |
| Unity source inventory (candidate) | **639 blobs / 88 `.meta`**; **zero newly added source paths** | PASS — no generated-source import |
| Unity modified blob set against frozen R16 | **exactly five**; all mode `100644` | PASS |
| Unexpected changed outside `docs/cc001/swarm/**`, `scripts/cc001/**` or `unity/cc001-r16/**` | **0** | PASS |
| Path scan of all 35 candidate changes | **0** generated/temp/archive/credential-like filenames | PASS (filename patterns, not file-content proof) |
| Candidate Unity tree for generated folders | **0** files in unwanted `Library/Temp/obj/Logs/Builds/UserSettings` outside historical `Evidence/` | PASS — case-insensitive segment scan |
| Duplicate blob SHA among changed paths | **0** duplicate changed-path blob IDs | PASS — does not imply semantic de-duplication of inherited documents |
| Negatively injected simulated paths | `Library/generated.dat`, `Builds/game.apk`, `r17-import-parts/part-045.bin`, `.env`: **4/4 rejected** by in-memory path predicate | PASS — synthetic path classifier; not shell test |
| Safe controls | A20 W3 report and `Tests/PresentationTests.cs`: **2/2 allowed** | PASS — synthetic path classifier |
| `artifacts/` public subtree | Git tree `bb207b60100dc87ec69cbeb879340d393ba35f71` unchanged against frozen R16 | PASS — no current public-website payload delta |

The net blob-path count increases by 30 (35 path deltas include five **modified**, not added, Unity files). Files under `unity/cc001-r16` retained original file inventory: this does **not** mean all Unity file bytes are unchanged, because five source/test blobs were deliberately replaced on the disposable branch.

### Five changed Unity files — checked directly against owner ref

| Exact path relative to Unity project | W3 origin HEAD | Git blob SHA-1 identical candidate/origin? |
| --- | --- | --- |
| `Assets/CoreClash/Presentation/MatchLayout.cs` | A20 `1f87595a9d73de30179e5158a5848eae3b965885` | PASS `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916` |
| `Assets/CoreClash/Presentation/MatchView.cs` | A20 same | PASS `7f9631a3fb272d312e253b15d2d4627f9d79d05f` |
| `Tests/PresentationTests.cs` | A20 same | PASS `7dc53a2c32db97375d6846fac418a4ca89a6feaf` |
| `Tests/NetworkSeatTests.cs` | A41 `8eb0b2517c049c95fc2257d73f0139d7bc17fd2c` | PASS `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05` |
| `Tests/StabilityR16Tests.cs` | A51 `92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5` | PASS `68cbba61fc2d692a2c98241484d1fd30a10092c9` |

These are Git **blob** SHA-1 IDs, not newly computed content SHA-256; independent A71 #140 owns the full provenance/allowed-delta verdict. A74 checked the 5/5 origin/candidate blob equality independently from A70's handoff.

## 2. Protected paths and cross-project isolation

Full-tree entry-to-entry Git blob comparison against frozen R16:

| Immutable/special asset | Frozen R16 == candidate? | SHA-1 (Git blob) |
| --- | --- | --- |
| `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` | YES | `99cf0b5666f9cd6648943e9b54342e6546c5d3b1` |
| `unity/cc001-r16/Reference/V148_reference_original.html` | YES | `657a423dc4e8fe87598e664d67e124d24b483343` |
| `unity/cc001-r16/CoreClash-V149-Unity/Tests/Program.cs` | YES | `12b8fcca30731f007a01a81ac45572671c99f1dc` |
| Unity nested `.gitignore` | YES | `3a55d7c70b84c438a3dd3d62a59d1ba00e4cc462` |
| Unity nested `.gitattributes` | YES | `a66444895919b0d1a68ba102eb43f14b420e86ea` |
| Root `.gitignore` | YES | `b04aec962bf15e2e37dd3626feb90eba9f31452a` |
| A70 import workflow | YES | `6149ab7760bfb8f687012323275787abc91fdf98` |
| Unity `Packages/manifest.json` | YES | `9740a43dab01fbb9252b077da418f73b3b8b4d14` |

The five W4 A40/A50 **non-Stage-1** partial source paths (`GameSimulation.cs`, `LifecycleEffects.cs`, `ElementalEffects.cs`, `Physics/CollisionResolver.cs`, `Tests/ElementalTests.cs`) remain identical to R16. Candidate has **not** integrated those patches. No `.meta` or catalog/protocol modifications surfaced in the complete source diff.

**Website identity:** root `artifacts/` tree is unchanged; `core-clash/`, `core-clash-v149-5/`, and `core-clash-unity/` retain separate previous identities. No tournament/backend source path was changed.

## 3. Logs, evidence, ignore rules and content scan

**Historically tracked evidence:** `CoreClash-V149-Unity/Evidence/**` contains **298 files**, **20,954,214 raw content bytes**, including **24 `.log` files**. The exact Git blob of every one of these **298/298** matches frozen R16. They are canonical imported historical evidence and must **not** be characterized as generated logs from the Stage 1 candidate, deleted, or accepted as a new G1/G2 PASS.

**Ignore rules readback:** Root `.gitignore` is Web/Node/Replit-oriented, while Unity project's own nested `.gitignore` excludes `[Ll]ibrary/`, `[Tt]emp/`, `[Oo]bj/`, `[Ll]ogs/`, `[Uu]ser[Ss]ettings/`, `Builds/`, `Tests/bin/`, `Tests/obj/`, IDE and Unity performance outputs. These rules are unchanged. `Builds/` is case-sensitive on Linux (unlike explicit bracket-case rules for some other dirs); a future generated `builds/` folder in this nested project could escape the ignore. This is a future policy hardening proposal, NOT a permission to edit R16 in place. **NEVER blanket-ignore `*.meta`.**

**Attributes:** R16 nested `.gitattributes` uses `*.cs text eol=lf` and similar rules; preserving exact frozen-source bytes when bulk staging remains important. `-whitespace` is not equivalent to `-text`. Neither config was edited. No `git check-ignore` or actual OS file-generation test was executed; path presence/absence is confirmed from Git trees, not inferred from `.gitignore` effectiveness.

**Added/modified content inspection:** All **28 changed CC-001 documentation/JSON files** and **2 new standalone `.cjs` scripts** were fetched/read. An explicit limited high-confidence pattern scan produced **0 matches** for GitHub classic/fine-grained token forms, OpenAI-looking `sk-` tokens, AWS access IDs, PEM private-key headers and database URIs with inline user/password. Scripts were also read for network/execution behavior; both present themselves as local static preflight checks. This is **not** a comprehensive DLP/secret scanner: unknown token formats, low-entropy passwords and historical unchanged files were outside this scoped content scan. No credentials were copied into this report.

## 4. Risk register / concrete follow-ups

| Finding | Severity | Evidence and specific consequence | Owner / action |
| --- | --- | --- | --- |
| **H-01: W2 pinned static snapshot source SHA is stale on Stage 1** | **MEDIUM — G1/preflight interpretation** | `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json` pins R16 SHA-256 `b7e57a9d...` for `Tests/StabilityR16Tests.cs`. Frozen R16 Git blob `81307b95...`, candidate blob `68cbba61...`; exact file bytes have been changed for W3 A51 tests by design. The included `scripts/cc001/r17-w2-a51-snapshot-preflight.cjs` checks each pinned source file hash under `--source`, so **a source-bound invocation against Stage 1 is expected to report a hash mismatch** on that test file. This is a **static compatibility inference**, NOT an actually observed failed script run or a confirmed gameplay bug. | **A72/A51/HQ**: run baseline R16 provenance check against frozen R16, explicitly distinguish Stage1 source changes in subsequent G1 runner; if future corpus revision is needed, authorize a **new versioned** corpus/runner, do not silently rewrite W2 original or suppress all mismatches |
| **H-02: historical Evidence could be mistaken for fresh G1/G2 proof** | LOW–MEDIUM | 298 unchanged R16 Evidence objects, 24 logs, large historical footprint | **A72/A60**: require per-run immutable candidate SHA, run IDs, fresh log hashes and test exits |
| **H-03: inherited older docs may appear authoritative** | LOW–MEDIUM | 28 documentation changes include old W1/W2/W3 plans and past HOLD/PASS reports; old `R17_SWARM_DISPATCH_20261018.md` gained 15 lines, while W4 dispatch remains separately authoritative | **HQ/A70/A60**: prefer explicit Stage1 35-path ledger and most recent gate decisions, never merge earlier readiness labels |
| **H-04: nested ignore case/normalization** | LOW | `Builds/` case variant and `.gitattributes` text normalization on Linux; current tree clean | **A74/HQ later**: consider future scoped ignore/attributes policy on an approved NEW-development path; no change to frozen R16 |
| **H-05: history footprint predates candidate** | LOW | Existing 45 transfer blobs remain in reachable Git history; no newly introduced chunks/ZIPs in Stage 1 | **HQ**: preserve history; no force push, filter-repo, object deletion, LFS migration in this task |
| **H-06: candidate not executable-certified** | HIGH for release, not repository hygiene | W3 A20/A41/A51 C# deltas are source/test proposals; A72 managed CI workflow and W4 A40/A50 fixes are not integrated; no G1/G2/G3/G4 evidence | **A72, A40, A50, A60, A70**: separate real executable gates; **RELEASE HOLD** |

**Decision:** This candidate has no observed repository-hygiene blocker to remaining an isolated unverified development candidate. H-01 needs explicit handling before anyone interprets W2 preflight failures as fresh candidate regressions or reports G1 PASS. **Do not treat this limited hygiene PASS as A71 integrity PASS or A60 runtime acceptance.**

## 5. Actual controls vs NOT_RUN

**Executed successfully through connected GitHub API and local in-memory validation of returned metadata/text (not shell tests):**
1. Fetched exact A70 Stage1 HEAD/ref, HQ #141/#97 gate comments, A70 35-path provenance ledger and GitHub commit ancestry.
2. `compare_commits(W4 dispatch, Stage1)`: 35 paths, six commits ahead, none behind. Also compared frozen R16 → Stage1.
3. Fetched complete recursive Git trees for both candidate and frozen R16, verified `truncated=false`, classified 639 Unity blobs, 88 `.meta`, all altered paths and generated/log segments, compared original manifest/V148/Program/config/package/source blobs and 298 historical Evidence blobs.
4. Independently fetched candidate and corresponding A20/A41/A51 author-commit content: 5/5 source Git blob IDs matched.
5. Read all 28 changed docs/JSON and both changed standalone scripts; six families of high-confidence secret patterns: zero hits (defined scope).
6. Parsed W2 A51 static corpus and its script to identify source-hash compatibility; candidate-vs-R16 blob comparison verified the changed pinned test file.
7. In-memory synthetic path negative controls **4/4 rejected** and safe controls **2/2 allowed**. These are assertions about the audit predicate, not game tests.
8. No GitHub write/mutation, no traversal into other agents' write scopes, no source edits **until publication of this documentation report in A74-only branch**.

**NOT_RUN:** Local private-repo full clone, `git check-ignore` and `git ls-files --eol`, on-disk pack metrics, actual `node scripts/cc001/r17-w2-a51-snapshot-preflight.cjs` with `--source`, .NET 9 269+ managed cases, codec 13, G09B replay, Unity 6000.4.0f1 Editor compilation, Windows/WebGL/Android builds, hardware/network/UX, end-to-end credentials scanner, public-site QA. **No shell exit codes or runtime logs produced by A74**, and historical R16 run counts are NOT promoted as fresh Stage1 results.

## 6. HANDOFF — A00/HQ, A70, A71, A72, A60

- **PROJECT:** CC-001 / Unity V149
- **WAVE:** R17-W5 continuation of Stage1 W4-08B
- **AGENT:** A74
- **ISSUE:** #141
- **FROZEN R16 BASE SHA:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`
- **W4 DISPATCH SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`
- **AUDITED EXACT A70 CANDIDATE SHA:** `ab624c2789b6efda015e742e8bd9bcbb86766735`
- **OWN BRANCH:** `feat/cc001-r17-w4-a74-candidate-hygiene`
- **OWN START SHA:** `9b174410e14b8766e3a25ca42d9d898ab4ef4501`
- **OWN FINAL COMMIT SHA:** published in #141 HANDOFF and verified ref (not self-referentially guessed here).
- **CHANGED PATHS:** `docs/cc001/swarm/w4/A74/R17_W5_A74_STAGE1_CANDIDATE_HYGIENE_AUDIT.md` ONLY.
- **DATA / V148 / PROTOCOL149 MODIFIED:** NO.
- **DESIGNED:** audit acceptance/risk matrix complete.
- **IMPLEMENTED:** independent audit documentation only.
- **TESTED:** read-only GitHub metadata/content/source-inventory/limited content-pattern scan and synthetic path controls; no CLI game/unit tests.
- **INTEGRATED:** only A70 Stage1 code is integrated on its **disposable dev branch**; A74 did not integrate/mutate anything outside its report.
- **RELEASED:** NO.
- **GATE:** **A74 repository hygiene PASS WITH TRACKED RISKS**, **G1/G2/G3/G4 HOLD / NOT_RUN**, **release HOLD**.
- **BLOCKERS:** H-01 pinned fixture compatibility must be distinguished before G1 interpretation; independent A71 provenance and A72/A60 executable proof pending.
- **HANDOFF:** HQ #97 / A70 #137 / A71 #140 / A72 #113 / A60 #139. **Do not merge to main, deploy, force-push, delete blobs, rewrite history, or edit protected R16/V148.**
