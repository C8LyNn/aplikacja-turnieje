# CC-001 — R17-W5 Stage 2 / A71 — Independent Source Provenance & Protected Baseline Audit

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W5 — STAGE 2 VERIFICATION  
**AGENT:** A71 — Source Integrity; existing [Issue #140](https://github.com/C8LyNn/aplikacja-turnieje/issues/140)  
**AUTHORIZATION:** [HQ Stage 2 A71 scope](https://github.com/C8LyNn/aplikacja-turnieje/issues/140#issuecomment-6275615260)  
**OWN ISOLATED BRANCH:** `feat/cc001-r17-w4-a71-candidate-integrity`  
**OWN START HEAD:** `ab25f316ea2effcc6dc4c6ca01f04b6470112360` (the previously completed Stage 1 A71 audit)  
**FROZEN R16:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**STAGE 1:** `ab624c2789b6efda015e742e8bd9bcbb86766735`  
**STAGE 2 SOURCE COMMIT:** `e58ba23a9f20e7a0865668655bd1e819845474bc`  
**STAGE 2 FINAL CANDIDATE, PINNED:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**STAGE 2 CANDIDATE BRANCH:** `integration/cc001-r17-w5-stage2-diagnostic-20261019`  
**A40 EXACT AUTHOR INPUT:** `bfa9bd4f86c60c7bd528a6d03581179e405be3aa`  
**A50 EXACT AUTHOR INPUT:** `9b84a730b39d4033fcd283e2f555774138312ea2`

## Independent verdict

**PASS — Stage 2 SOURCE INTEGRITY AND PROVENANCE for EXACT commit `a67a37a0e4105dd680f52ae6728e93face61f4ce` ONLY.** Stage 1→Stage 2 source diff contains **8/8 HQ-authorized C# modifications**: 5/5 original author A40 Git blob SHA-1 matches, 3/3 original author A50 SHA-1 matches; Stage 1's original five C# changes are byte-identically retained (**5/5**). Combined frozen R16→Stage 2 exactly **13/13 selected Unity C# file deltas**, no additional Unity file edits, additions, deletions or path ownership collisions. Candidate's 88 original `.meta` files and protected V148/reference/manifest/catalog/package/Tests Program blob IDs remain identical to immutable R16.

**This is NOT a gameplay, compiled, managed test, build, network or release PASS.** G1, G2, G3 and G4 remain **HOLD/WAIT / NOT_RUN**; this report does not promote abilities or attest runtime behavior.

## 1. Independently read GitHub state and complete delta/ancestry

Authenticated GitHub connector calls on **exact pinned SHA refs**, without relying on the author's report for comparison:

| Check | Observed result |
| --- | --- |
| Stage 2 integration branch live head at audit | `a67a37a0e4105dd680f52ae6728e93face61f4ce` |
| Source commit parent | `e58ba23...` is DIRECT child of exact Stage 1 `ab624c...` |
| Final head parent | `a67a37...` is DIRECT child of source commit `e58ba23...` |
| Stage 1→Stage 2 source `compare_commits` | `ahead=1, behind=0`; **eight C# modifications only** |
| Source→final `compare_commits` | `ahead=1, behind=0`; **one A70-owned report only** |
| Stage 1→final `compare_commits` | `ahead=2, behind=0`; **eight C# + one report** |
| Original frozen R16→final | `ahead=9, behind=0`; **13 modified Unity C# paths** + historical Stage 1 docs/scripts + current A70 report |
| Recursive Git trees | All three frozen R16 / Stage1 / Stage2 returned `truncated=false` |
| R16 Unity subtree SHA-1 | `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` |
| Stage 1 Unity subtree SHA-1 | `79babd44cc8e91a608fa74cc392b3cc11175aa49` |
| **Stage 2 Unity subtree SHA-1** | **`8ce679f9ad7e88e94320e0d0dc02d684fd62234d`** |
| Unity file count R16 / Stage1 / Stage2 | **639 / 639 / 639** |
| Stage 2 files still exact R16 | **626/639** (13 approved changed; never claim modified subtree identical) |
| Added / deleted Unity files | **0 / 0** |
| All original `.meta` | **88/88**, identical paths/modes/Git SHA-1 |
| New/disallowed Unity source paths | **0** |
| Unity mode violations / casefold collisions / generated directories | **0 / 0 / 0** |
| Non-Unity Stage 2 incremental diff | Only `docs/cc001/swarm/w5/A70/R17_W5_A70_STAGE2_DIAGNOSTIC_INTEGRATION_HANDOFF.md` |
| Source path intersections A40∩A50∩Stage 1 | **0** direct same-file overlaps |

Source addition was done by A70 as pinned-path blob inclusion on a disposable branch. The actual author commit DAGs were **not** merged with a real Git three-way merge. This source-identity PASS does **not** establish compile-level or semantic conflict freedom.

## 2. Eight NEW Stage 2 deltas — original authors independently fetched, 8/8 MATCH

Each exact file was read with `fetch_file` at the pinned author SHA and compared with the corresponding Git `blob.sha` independently enumerated from the final Stage 2 recursive tree. Paths are relative to `unity/cc001-r16/CoreClash-V149-Unity/`.

| Owner / exact HEAD | Exact C# source or test path | Candidate AND author Git blob SHA-1 |
| --- | --- | --- |
| A40 `bfa9bd4f86c60c7bd528a6d03581179e405be3aa` | `Assets/CoreClash/Core/AbilityResolver.cs` | `1f0affe3d1b3d02f23142d2a894e5a0250dca7d4` |
| A40 same | `Assets/CoreClash/Core/GameSimulation.cs` | `25f5a18de4df3942626f0245c9b1be77eee73106` |
| A40 same | `Assets/CoreClash/Core/GameState.cs` | `f14e1f8080a4f630ebcb226407585b45a7f152ef` |
| A40 same | `Assets/CoreClash/Core/LifecycleEffects.cs` | `65d48932a4b547a5673888d7d0e228fda68f3b58` |
| A40 same | `Tests/AbilityTests.cs` | `62fd2ea17d0972bc67d4a356632c442250d69f07` |
| A50 `9b84a730b39d4033fcd283e2f555774138312ea2` | `Assets/CoreClash/Core/ElementalEffects.cs` | `4e0ce8287e71778dc7bf647e785680ddf03a8e18` |
| A50 same | `Assets/CoreClash/Physics/CollisionResolver.cs` | `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e` |
| A50 same | `Tests/ElementalTests.cs` | `f846df155ef95128bc04d58a04f6852f58f3b2be` |

All eight were modified relative to their Stage 1 blobs. No author SHA was guessed or taken only on trust from A70. Changes appear on disjoint paths (five A40 / three A50); importantly, `GameSimulation.cs` matches **A40 exclusively**, not A50.

## 3. Previously approved five Stage 1 source changes — preservation 5/5

Independently fetched Stage 1 originals by file path at pinned Stage 1 `ab624c...`, compared to Stage 2 Git tree, and checked they were not modified in Stage 1→Stage 2 diff.

| Owner | Relative file | Stage 1 AND Stage 2 blob SHA-1 |
| --- | --- | --- |
| A20 | `Assets/CoreClash/Presentation/MatchLayout.cs` | `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916` |
| A20 | `Assets/CoreClash/Presentation/MatchView.cs` | `7f9631a3fb272d312e253b15d2d4627f9d79d05f` |
| A20 | `Tests/PresentationTests.cs` | `7dc53a2c32db97375d6846fac418a4ca89a6feaf` |
| A41 | `Tests/NetworkSeatTests.cs` | `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05` |
| A51 | `Tests/StabilityR16Tests.cs` | `68cbba61fc2d692a2c98241484d1fd30a10092c9` |

These 13 unique source paths are the **complete** modified Unity source/test set versus the original R16 tree. Stage 2 did not delete other original source files, or import W3 A50 deliberately-red fixture as an additional outside-allowlist change. Authored C# test definitions are **NOT executed test results**.

## 4. Protected evidence, original R16 ZIP, GUIDs and Protocol 149

**Git tree protected source comparison to immutable original R16:**

- `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` unchanged blob `99cf0b5666f9cd6648943e9b54342e6546c5d3b1`; it describes ORIGINAL R16, NOT a new 13-delta candidate manifest.
- `unity/cc001-r16/Reference/V148_reference_original.html` unchanged blob `657a423dc4e8fe87598e664d67e124d24b483343`.
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/Program.cs` unchanged blob `12b8fcca30731f007a01a81ac45572671c99f1dc`.
- `Packages/manifest.json` blob `9740a43dab01fbb9252b077da418f73b3b8b4d14`, `Packages/packages-lock.json` blob `6007e27c351c9286cd10ccb4f5cd167a77c37296`, Unity `ProjectVersion.txt` blob `8a87982496ed3239376379e331cd8bda920ee735`, and `Assets/Resources/Data/catalog.json` blob `65874e0078949a21219af056b5e26d296ba65d76`: all unchanged from frozen R16.
- Candidate's **all 88 `.meta` paths and Git blob SHA-1** match original R16; no modified GUID file, duplicate path, new/removed `.meta` or source mode/line-ending Git blob transformation observed outside allowlisted files.
- Stage 2 changed Unity paths are exactly the 13 names in sections 2–3; **no direct changes to network transport/protocol/serialization files, Protocol 149 version configuration, reference, packages or catalog**. This is source-file immutability evidence, NOT a runtime wire-compatibility guarantee.
- No unexpected tournament application/backend/website paths in Stage 2 vs Stage 1; full recursive tree/compare excludes them.

**Independently executed original R16 archive check:** Using the original `/mnt/data/CoreClash-V149-R16-Source-Candidate.zip` available to the A71 Linux runtime, ran:

```sh
python3 /tmp/cc001_a71_stage2_r16_provenance_check.py > /tmp/cc001_a71_stage2_r16_provenance_check.log 2>&1
# shell exit 0; Python 3.13.5
```

Actual final output:

```text
zip_sha: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
tree_sha: 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6
v148_sha: bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e
zip_integrity: True
entries: 639
meta: 88
guid_found: 88
guid_unique: 88
sums_valid: 637
sums_listed: 637
FINAL: PASS; NEGATIVE_CONTROLS 3/3; EXIT 0
```

Archive SHA-256, reconstructed raw Git original subtree SHA-1, **88/88 distinct GUIDs**, original V148 SHA-256 and embedded **637/637** checksums are verified from file bytes, not from a copied agent claim. A memory-only mutated-V148 check, altered-blob check and duplicated GUID check each correctly rejected the negative input. No ZIP, live Git worktree or source bytes were modified.

**Local A71 ephemeral audit evidence digests** (not pushed to GitHub or presented as CI artifacts):
- Checker script SHA-256: `500ae0765d260acd8f98a5d283d917bf3bbfb30badc780ac03a336a69d4aadec`
- Checker log SHA-256: `81017d2a46159d5d0cdb3249228d22617729a56a021f51825ecf46fa6a8770b3`

**Transparent first-attempt control correction:** a preliminary interactive Python assert failed because the manually entered expected V148 SHA-256 contained only **62 hex characters** (transcription error, actual ZIP hash was correct). Corrected checker used the verified 64-character canonical SHA and returned shell **exit 0** with all checks passing. The original reference was NEVER changed. First interactive failure was not a Stage 2 test failure.

## 5. Scope-negative controls, commit signature and execution evidence

**Read-only GitHub-source allowlist validator (V8 connector orchestration):** compared exact Stage 1→source `compare_commits` changed paths against the 8-entry Stage 2 HQ allowlist. **8/8 positive PASS**. Injected each of six forbidden path examples into the candidate list (separately): `Tests/Program.cs`, `Tests/StabilityR16Tests.cs`, catalog, original V148, a protocol-path example, and an escaped cross-project server path. Validator **rejected 6/6**; not a destructive source edit. No outside-allowlist change in actual candidate diff.

**GitHub commit verification:** Stage 2 source commit `e58ba23...` and report HEAD `a67a37...` each returned `verified=false, reason=unsigned`. Exact Git blob/content ancestry is established but cryptographic Git author-signature authenticity is **UNVERIFIED**.

**Current exact candidate-specific automation evidence:** GitHub Actions `GET /actions/runs?head_sha=a67a37...&per_page=100` returned **0 workflow runs**. Combined statuses: `[]`. Source branch readback remained pinned `a67a37...` during audit; A71 own initial HEAD remained `ab25f316...` before new report.

**NOT_RUN:** `.NET 9` managed tests, codec13, standalone runner/CI tests, C# Unity compile, Unity Editor 6000.4.0f1 imports, Windows/WebGL/Android builds, actual gameplay Phoenix/Soul Anchor/Dirge and F02 Frostguard/G09B/C/D/E positive or negative runtime tests, multiplayer/physical devices, full local 3-way merge-tree, independent candidate G4. Runtime exits and logs cannot be invented. Existing A72 policy `CANDIDATE_SOURCE` blocker is **not fixed by this A71 audit**.

**Tracked H-01:** W2 A51 static corpus binds original R16 `StabilityR16Tests.cs` hash, while Stage 1/2 intentionally retain the modified A51 test file. This is a provenance/test-policy distinction; **do not replace or weaken the legacy frozen-source assertion or mistake a Stage 2 hash-policy FAIL for runtime PASS**. A72 owns new candidate-specific CI policy repair and actual G1 tests.

## 6. Five-axis HANDOFF and next decision

| Axis | Stage 2 A71 result |
| --- | --- |
| **DESIGNED** | **YES** — independent pinned-SHA provenance/allowlist and original R16 bridge |
| **IMPLEMENTED** | **YES** — this A71 audit document only, on A71-owned branch |
| **TESTED** | **SOURCE STATIC + original ZIP/Git/GUID/negative controls PASS**; G1/G2/G3/G4 runtime **NOT_RUN** |
| **INTEGRATED** | **NO BY A71**; existing A70 Stage 2 remains disposable diagnostic source only |
| **RELEASED** | **NO**, not authorized |

**Gate decision:** **A71 STAGE 2 SOURCE INTEGRITY PASS for exact `a67a37...`**. G0 original R16 and Stage1 provenance retain their separately scoped PASS; **G1 managed/codec HOLD, G2 Unity HOLD, G3 devices WAIT, G4 QA WAIT, RELEASE STOP**.

**HANDOFF → HQ/A00 #97, A70 #137, A72 #113, A74 #141, A60 #139.** Next: A72 fix the one approved CI policy path under own isolation, provide actual .NET 9/codec logs and candidate test manifest; A40/A50 verify Stage 2 combined game mechanics after execution; independent A60 acceptance after actual G1/G2. Any future candidate HEAD/source-tree SHA change requires fresh, exact SHA-scoped A71 provenance review. No V148/original R16/Protocol149, other agents' files, `main`, live, PR history, force push, deployment or release touched.

**REPORT AUTHOR COMMIT SHA:** to be supplied in the Issue #140 HANDOFF after the atomic report commit; the report cannot prestate its own SHA.
