# CC-001 / R17-W5 — A74 independent Stage 2 repository hygiene audit

**PROJECT:** CC-001 — Core Clash Unity  
**WAVE:** R17-W5 Stage 2 Verification / G1 Unblock  
**AGENT:** A74 — Repository Hygiene (original thread identity; not A10 or A71)  
**ISSUE:** [#141](https://github.com/C8LyNn/aplikacja-turnieje/issues/141)  
**EXPLICIT HQ AUTHORITY:** [#141 comment 6275615884](https://github.com/C8LyNn/aplikacja-turnieje/issues/141#issuecomment-6275615884)  
**OWN BRANCH:** `feat/cc001-r17-w4-a74-candidate-hygiene`  
**OWN START HEAD:** `da267affa7a221c70589a4984a1226ae548a1eb4`  
**FROZEN R16:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**PREVIOUS STAGE 1:** `ab624c2789b6efda015e742e8bd9bcbb86766735`  
**EXACT STAGE 2 SOURCE COMMIT:** `e58ba23a9f20e7a0865668655bd1e819845474bc`  
**EXACT AUDITED STAGE 2 FINAL HEAD:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**STAGE 2 BRANCH:** `integration/cc001-r17-w5-stage2-diagnostic-20261019`  
**A40 AUTHOR HEAD:** `bfa9bd4f86c60c7bd528a6d03581179e405be3aa`  
**A50 AUTHOR HEAD:** `9b84a730b39d4033fcd283e2f555774138312ea2`  
**OWN FINAL HEAD:** See GitHub Issue #141 handoff and direct branch-ref readback after this file is committed (a report cannot contain its own future commit SHA).

## 1. Decision

**A74 STAGE 2 REPOSITORY HYGIENE = PASS WITH TRACKED RISKS (source/tree hygiene only).**

The exact Stage 2 diagnostic candidate contains the eight authorized A40/A50 modifications, retains the original five Stage 1 modified C# files, and contains no newly introduced generated caches, build/log output, archive chunks, unauthorized cross-project source paths or high-confidence credential signatures **within the new Stage 2 diff/content scan described here**.

**This is NOT a release/build/gameplay test.** G0 remains a separate frozen-R16-only PASS; G1 .NET9/codec and G2 Unity remain HOLD/NOT_RUN, G3 physical and G4 independent runtime acceptance WAIT, RELEASE STOP. The previous A74 Stage 1 PASS at commit `da267affa7a221c70589a4984a1226ae548a1eb4` is historical evidence, not reused as a Stage 2 decision.

**Risk H-01 persists**: legacy W2 A51 source SHA-256 pin is for frozen R16 `Tests/StabilityR16Tests.cs`, while Stage 2 intentionally retains the modified Stage 1 version. See below. An unrelated new G1 admission blocker was separately confirmed by A72 (#113): its previous candidate allowlist omitted A40-owned `GameSimulation.cs`; HQ authorized A72-only one-entry correction, **not** A74 code changes.

## 2. Independently inspected complete Git trees and authorized deltas

Read full recursive Git tree API responses at all five immutable commits (frozen R16, Stage 1, Stage 2, A40 author, A50 author). All five returned `truncated=false`.

| Control | Observed | A74 decision |
| --- | --- | --- |
| Frozen-R16 recursive Git tree | **1,900 entries**, **1,718 blobs** | Exact original comparison baseline |
| Stage 1 recursive Git tree | **1,953 entries**, **1,748 blobs** | Previous source-integrated candidate |
| Stage 2 recursive Git tree | **1,956 entries**, **1,749 blobs** | Full Git metadata listing; one new report blob plus tree entries |
| Stage 1 → Stage 2 commit compare | **ahead=2 / behind=0**, **nine changed paths** | **8 modified C# + 1 new A70 report**, nothing else |
| Stage 2 source commit | `e58ba23a9f20e7a0865668655bd1e819845474bc` | Exactly eight modified Unity C# paths; its parent is Stage 1 |
| Frozen R16 → Stage 2 | **ahead=9 / behind=0**, **45 paths** including shared W4 dispatch | **13 modified Unity C# paths** overall |
| Stage 2 Unity source inventory | **639/639 existing paths**, **88/88 `.meta`**; **0 new / 0 removed** | PASS structural |
| Changed Unity source relative to frozen R16 | **13/13 distinct C# blobs**, all mode `100644` | PASS scoped; not compilation |
| Candidate vs Stage1 unauthorized deltas | **0** | PASS |
| Unexpected generated Unity paths outside original `Evidence/` | **0** | PASS, tracked-tree only |
| Changed-path secret/artifact filenames | **0** | PASS for checked path patterns only |

Full tree entry equality (frozen R16 → Stage2) independently confirmed **88/88 .meta Git blobs unchanged**. The `artifacts/` Git tree matches frozen R16 exactly; no tournament/web change was introduced. All Stage 1 tracked paths remain present: no missing paths or unexpected deletions.

### Stage 2 — all eight modified files and independent original-origin equality

Each row names a path under `unity/cc001-r16/CoreClash-V149-Unity/`. These Git blob identities were independently compared using full untruncated candidate and A40/A50 author Git trees, not copied as asserted results from A70.

| Agent | C# path | Exact Git blob SHA-1 candidate = author |
| --- | --- | --- |
| A40 | `Assets/CoreClash/Core/AbilityResolver.cs` | `1f0affe3d1b3d02f23142d2a894e5a0250dca7d4` |
| A40 | `Assets/CoreClash/Core/GameSimulation.cs` | `25f5a18de4df3942626f0245c9b1be77eee73106` |
| A40 | `Assets/CoreClash/Core/GameState.cs` | `f14e1f8080a4f630ebcb226407585b45a7f152ef` |
| A40 | `Assets/CoreClash/Core/LifecycleEffects.cs` | `65d48932a4b547a5673888d7d0e228fda68f3b58` |
| A40 | `Tests/AbilityTests.cs` | `62fd2ea17d0972bc67d4a356632c442250d69f07` |
| A50 | `Assets/CoreClash/Core/ElementalEffects.cs` | `4e0ce8287e71778dc7bf647e785680ddf03a8e18` |
| A50 | `Assets/CoreClash/Physics/CollisionResolver.cs` | `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e` |
| A50 | `Tests/ElementalTests.cs` | `f846df155ef95128bc04d58a04f6852f58f3b2be` |

**8/8 author blob parity PASS.** All eight differ from Stage1 (intentional); the report-only child of source commit leaves source unchanged.

### Five pre-existing Stage 1 C# changes retained exactly

1. `Assets/CoreClash/Presentation/MatchLayout.cs` — `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916`
2. `Assets/CoreClash/Presentation/MatchView.cs` — `7f9631a3fb272d312e253b15d2d4627f9d79d05f`
3. `Tests/PresentationTests.cs` — `7dc53a2c32db97375d6846fac418a4ca89a6feaf`
4. `Tests/NetworkSeatTests.cs` — `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05`
5. `Tests/StabilityR16Tests.cs` — `68cbba61fc2d692a2c98241484d1fd30a10092c9`

**5/5 Stage1 retained. Combined 13/13 intentional changes.** This is source hygiene/identity evidence, not the separate full cryptographic source provenance gate owned by A71.

## 3. Protected content, generated output, logs and configurations

**Exact Git blob comparisons frozen R16 → Stage2 PASS:**

| Protected/read-only path | Git blob SHA-1 retained |
| --- | --- |
| `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` | `99cf0b5666f9cd6648943e9b54342e6546c5d3b1` |
| `unity/cc001-r16/Reference/V148_reference_original.html` | `657a423dc4e8fe87598e664d67e124d24b483343` |
| `unity/cc001-r16/CoreClash-V149-Unity/Tests/Program.cs` | `12b8fcca30731f007a01a81ac45572671c99f1dc` |
| `CoreClash-V149-Unity/Packages/manifest.json` | `9740a43dab01fbb9252b077da418f73b3b8b4d14` |
| Nested Unity `.gitignore` | `3a55d7c70b84c438a3dd3d62a59d1ba00e4cc462` |
| Nested Unity `.gitattributes` | `a66444895919b0d1a68ba102eb43f14b420e86ea` |
| Repo root `.gitignore` | `b04aec962bf15e2e37dd3626feb90eba9f31452a` |

**Historical tracked evidence:** `Evidence/` under the Unity project has **298 files / 20,954,214 raw logical bytes / 24 historical `.log` files**, with **298/298 original R16 Git blobs unchanged**. These are legitimate old evidence, not freshly executed Stage2 CI logs. No new `Library`, `Temp`, `obj`, `Logs`, `Builds`, `UserSettings`, `node_modules`, IDE cache or `TestResults` tracked paths appeared in the Stage2 Unity tree outside historical evidence.

**Ignore policy inspection:** Root `.gitignore` is mainly Node/web specific. Unity nested ignore has bracket-case `[Ll]ibrary/`, `[Tt]emp/`, `[Oo]bj/`, `[Ll]ogs/`, `[Uu]ser[Ss]ettings/`, `Builds/`, `Tests/bin/`, `Tests/obj/`. `Builds/` is case-sensitive on Linux; a lower-case `builds/` variant could escape the ignore. This is a future hardening suggestion, not an observed Stage2 artifact. **Do not blanket-ignore `.meta`.**

**Attributes:** Nested `.gitattributes` declares `*.cs text eol=lf`, `*.json text eol=lf`, etc., and `*.meta -whitespace`. The latter does **not** mean `-text`; further bulk imports must protect known original blob bytes. No changes to these rules were made.

**Source-content scan:** Independently fetched/read the **eight newly modified C# texts and the one new A70 report**. Seven scoped pattern families detected **zero** high-confidence GitHub classic/fine-grained, OpenAI-looking, AWS-style token identifiers, PEM private-key headers, password-bearing database URI or obvious credential assignment strings. Also checked new paths for secret-looking file names and archives. **Limit:** not full DLP; opaque or nonstandard credentials, old unchanged files and unrelated repo content not exhaustively screened. No credential contents copied to this report. No new `Console.Write`, `File.Write`, `Debug.Log` or `Application.persistentDataPath` substring was observed in the eight inspected Stage2 texts (this is text presence only, not runtime log proof).

## 4. H-01 and new evidence risks

| ID / severity | Directly observed evidence | Consequence / correct owner |
| --- | --- | --- |
| **H-01 / MEDIUM — carried from Stage1** | W2 A51 `R17_W2_A51_SNAPSHOT_CORPUS.json` still pins `Tests/StabilityR16Tests.cs` SHA-256 `b7e57a9dd50b17152fd801c5187e675edadad8051a8d334f43dc5db397ebbf12`. Frozen original Git blob `81307b95d857c2891318098c72d4e948471a6809`; Stage2 retains Stage1 intentional modified blob `68cbba61fc2d692a2c98241484d1fd30a10092c9`. Source-bound `r17-w2-a51-snapshot-preflight.cjs` actually has `if(source)` and `hashBuf(content)===want` guards. W2 corpus declares `runtime_executions_performed=0`. | Running legacy W2 source-binding against modified Stage2 is **expected to fail on source mismatch**, an inference from actual file identity/code, NOT an executed script failure. **A72/A51/HQ:** separate frozen-R16 provenance check from candidate-specific runtime checks; never rewrite original W2 fixture, disable SHA checks, or count predicted failure as runtime regression |
| **H-07 / MEDIUM — actual current G1 evidence gap** | GitHub `actions/runs?head_sha=<exact Stage2 HEAD>` returns **total_count 0**, `fetch_commit_workflow_runs` returns 0 PR-triggered runs, combined commit statuses `[]`. A72 #113 independently reproduced outdated CI candidate allowlist rejecting HQ-owned `Core/GameSimulation.cs`; HQ authorized narrow A72-only correction. | **A72:** make approved one-entry policy update on its own branch, keep negative controls and attempt real .NET9/codec only on an available runner. No G1 PASS until actual commands/logs/exits tied to exact candidate SHA |
| **H-02 / LOW–MEDIUM — historic log conflation** | Original Evidence unchanged 298/298, 24 logs; Stage2 has no new candidate run evidence in GitHub Actions | **A72/A60:** require SHA-scoped new run ID, test counts, exits and immutable log hash, not R16 evidence |
| **H-03 / LOW — ignore/line-ending assumptions** | `Builds/` case and Git attribute `-whitespace` handling remain unchanged; Stage2 generated-file scan clean | **HQ/A74 later, separately authorized:** consider scoped future policy improvement, no frozen R16 edits |
| **H-04 / LOW — inherited documentation and history** | Stage2 path-specific blob inclusion added 8 C# but no A40/A50 branch-merge topology. Earlier W1/W2/W3 dispatches and old reports persist as historical documents. | **A70/HQ:** preserve explicit included SHA ledger; do not treat old reports or repository history as proof of fresh runtime or signed authorship |

**No hygiene blocker found that requires changing the Stage2 source candidate itself.** A71 independently owns full source integrity; A74 reports only candidate scope, generated-output and evidence hygiene.

## 5. Actual checks, positive/negative controls and limitations

**Executed:** Connected GitHub API `fetch` exact immutable refs, complete recursive tree reads (all `truncated=false`), `compare_commits` Stage1→Stage2 and R16→Stage2, A70 report, A40/A50 author refs, Issue #141/HQ authorization, Issue #113 G1 blocker, GitHub Actions run/status query, root/Unity ignore and attribute file reads; in-memory JS analysis of returned file paths/blobs; nine exact new/modified source+document text reads. All returned usable responses.

**In-memory scoped audit controls:**
- Actual Stage1→Stage2 changed-path array: **9/9 authorized**, **0 unexpected**, positive admission PASS.
- Explicit simulated forbidden paths: `Tests/Program.cs`, protected V148, `Packages/manifest.json`, `Library/BuildCache/temp.bin`, deployed tournament/site file, `docs/cc001/swarm/.env`: **6/6 rejected**, negative admission PASS.
- Candidate complete Git trees: **8/8** Stage2 author origin blob equality; **5/5** Stage1 preserved; **88/88** original Unity `.meta` unchanged; **298/298** historical Evidence unchanged.

**NOT RUN:** No local shell `git clone`, `git check-ignore`, `git ls-files --eol`, `git merge-tree`, actual `node` execution of W2 A51 snapshot preflight, `.NET SDK 9` managed 269+/codec13, C# compile, G09B/C/D/E execution, Phoenix/Soul Anchor/Dirge gameplay execution, Unity 6000.4.0f1 Windows/WebGL/Android builds, actual mobile/network/long-haul tests, complete secret scanner, G4 acceptance. **A74 performed no shell/runner command**; therefore there are **no OS command exit codes, local test log files or new run hashes to claim**. GitHub API success is not a `dotnet` or Unity test PASS. Synthetic path checks are in-memory, not application tests.

## 6. Final HANDOFF, five status axes

- **PROJECT / WAVE / AGENT:** CC-001 / R17-W5 Stage2 / A74.
- **ISSUE:** #141; **OWN BRANCH:** `feat/cc001-r17-w4-a74-candidate-hygiene`.
- **START SHA:** `da267affa7a221c70589a4984a1226ae548a1eb4`.
- **FINAL OWN COMMIT SHA:** see verified GitHub #141 handoff after publication.
- **CANDIDATE EXACT SHA:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`.
- **CHANGED PATHS BY A74:** **ONLY** `docs/cc001/swarm/w5/A74/R17_W5_A74_STAGE2_INDEPENDENT_HYGIENE.md`.
- **DATA / V148 / PROTOCOL 149 MODIFIED:** NO.
- **DESIGNED:** YES, independent Stage2 hygiene matrix and risk handoff.
- **IMPLEMENTED:** YES, report only; no gameplay/source/config changes.
- **TESTED:** static Git tree/content/limited secret-pattern/negative-path evidence only. Managed/codec/Unity/physical **NOT_RUN**.
- **INTEGRATED:** NO by A74 (A70 Stage2 integration remains its own isolated branch); no main merge.
- **RELEASED:** NO.
- **GATE:** **A74 HYGIENE PASS WITH TRACKED RISKS FOR EXACT STAGE2 SOURCE**; G1/G2=HOLD, G3/G4=WAIT, RELEASE=STOP.
- **BLOCKERS:** H-01 historical hash pin, A72 G1 allowlist correction and absent verified runner results, future runtime/Unity evidence.
- **NEXT HANDOFF:** A00/HQ #97, A70 #137, A72 #113, A71 #140, A60 #139. Preserve A40/A50 original ownership and stage-specific SHA. Do not merge/publish, rewrite history, delete files or auto-promote readiness.
