# CC-001 / R17-W6 — A60 Independent Evidence Acceptance: Stage 2 G1 and Windows G2

**Identity:** A60 — Independent QA / Verification; **existing [Issue #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139)**.  
**Date:** 2026-10-20; **authority:** [HQ W6 decision](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6288003274), [direct HQ assignment](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6288004428).  
**Own branch:** `feat/cc001-r17-w4-a60-candidate-qa`; own starting HEAD `661660d3a3dc8a4fa2c9afea489050247f64c38c`.  
**Frozen R16:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b` (previous G0 PASS on #126; NOT rerun).  
**Stage 1:** `ab624c2789b6efda015e742e8bd9bcbb86766735`.  
**Stage 2 source commit:** `e58ba23a9f20e7a0865668655bd1e819845474bc`.  
**Exact Stage 2 final candidate:** **`a67a37a0e4105dd680f52ae6728e93face61f4ce`**.  
**A72 runner exact commit:** **`1d9be1b1cd39b5b768036ef4d711bf15e4088318`**.  
**Evidence class:** user-executed **LOCAL Windows 11** managed and Unity Windows Player build/smoke, **independently byte-reviewed by A60 from actually uploaded ZIP**. No independent rerun on A60's machine, no GitHub Actions runtime claim.

## 1. THREE SEPARATE A60 EVIDENCE VERDICTS

| Gate | Independent A60 verdict | Accepted scope |
| --- | --- | --- |
| `G1_MANAGED_CODEC_ACCEPTED` | **ACCEPTED — LOCAL STAGE2 evidence** | .NET SDK 9.0.313 managed **351/351**, codec **13/13**, original A72 runner **7/7 stages exit 0**, exact candidate worktree recorded |
| `G2_WINDOWS_BUILD_ACCEPTED` | **ACCEPTED — LOCAL Windows BuildPipeline evidence** | Unity Editor **6000.4.0f1**, fresh **StandaloneWindows64** build log success, BuildReport JSON `Succeeded`, 0 errors / 1 warning |
| `G2_WINDOWS_NATIVE_SMOKE_ACCEPTED` | **ACCEPTED — LOCAL Windows Player smoke evidence** | Rendered D3D11 Player and automated 50-turn local match; 51 launches, winner P0, bases 11:3; 6 real PNG exact digest matches |
| Stage2 WebGL / Android G2 | **NOT_RUN / NOT_ACCEPTED** | Bundled WebGL/Android reports are historic R16, **not** fresh Stage2 builds |
| G3 physical and multiplayer/network | **WAIT / NOT_ACCEPTED** | No real separate-device pairing/LAN/WAN/multiplatform/physical mobile test |
| Full G4 / public release | **HOLD** | Local G1 and Windows-subscope G2 are **not** full gameplay acceptance, comprehensive Unity testing or release authority |

**Important limitation:** The ZIP contains Windows build and run logs, SHA-256 assertions for `CoreClash.exe` and several Player data files, but **NOT the executable or its DLL/resources bytes themselves**. Thus their logged hashes and exact source-tree-to-standalone-binary binding cannot be rehashed by A60; the Stage2 link is supported by pinned manifest and chronological local logs, not by an independent binary provenance attestation. This does **not** invalidate the logged local BuildPipeline/Player runs, but prevents claiming independently hashed EXE authenticity or full reproducibility.

## 2. RAW PACKAGE CRYPTOGRAPHIC INTAKE — A60 ACTUALLY EXECUTED

Input attached in **THIS A60 thread** as `/mnt/data/handoff-20261020-030137(2).zip`, user upload corresponding to HQ `handoff-20261020-030137.zip`.

- Archive size **1,293,934 bytes**; independently recomputed complete SHA-256 **`20a16c90f4997c40959081d45f6a451834e8983e590a3ec38247da8747815c31`**, equals HQ's expected hash: **PASS**.
- External ZIP **17 entries**, `ZipFile.testzip() is None` (all CRC checks PASS), unique names and no path traversal: **PASS**.
- Inner `CC001_STAGE2_G1_EVIDENCE.zip` **22,770 bytes**, recomputed SHA-256 **`0ebe9de9e1a08b96f25b39a8bc9b6989658136312512ac5b5b653d6be2288bad`**, equals HQ's assertion and outer manifest. **10 entries**, all inner CRC valid: **PASS**.
- Outer `manifest.json` candidate SHA and inner `results.json.observed.selectedSha` exactly equal **`a67a37a0e4105dd680f52ae6728e93face61f4ce`**. Runner SHA in `results.json` exactly equals **`1d9be1b1cd39b5b768036ef4d711bf15e4088318`**. The `git worktree add --detach ... a67a37a...` step and output `HEAD is now at a67a37a0` are consistent with a real isolated candidate checkout.
- Direct GitHub API remote readback confirmed Stage2 branch HEAD **`a67a37a...`**, with the report commit parent exactly the Stage2 source commit; Stage1-to-Stage2 GitHub comparison: exactly **8 authorized A40/A50 C# paths + 1 A70 report**, no unexpected delta. Own A60 branch confirmed at W4 start SHA prior to write.
- Inspected all raw JSON and text logs from two-level ZIP, not only HQ claims or filenames.

## 3. G1 — runner identity, logs, exact counts and negative evidence

**Recorded environment:** Windows 11, Node **v22.16.0**, .NET SDK **9.0.313** selected (SDK list also has 10.0.203). Source:`results.json`, `dotnet-selected.log`, `node-version.log`.

**A72 source-code authentication:** Retrieved `scripts/cc001/w4/a72/managed-ci.cjs` (Git blob SHA1 `dd04a6a0b4f27bed8d0ae7a9e14af615f8dc32e1`) and `policy.cjs` (Git blob SHA1 `59d14bb7f761fdbdc71b9d814aa846c75fecaf2d`) **from pinned runner commit**. Independently computed SHA-256 of GitHub original LF content AND Windows CRLF-transformed content. **Windows CRLF source digests exactly equal execution's `results.json.observed.scriptSha256=663fe4eaa9f0ce90d7edfe9c8977dfab66814a4762710d377cc31ee180ec311c` and `policySha256=cbbdc0f14190842d3db427bd390515bc16f1f1b8a4f03b34bc718ddd517d9a8a`.** The LF vs CRLF difference explains why hashing GitHub text as-is would appear mismatched; no runner-code tamper inferred.

`results.json`: `target=candidate`, `verdict=PASS_MANAGED_CODEC_ONLY`, `expectedRed=false`, path-policy 45 total changes / 13 C# changes, `policyControls.passed=16/failed=0`, `merged=false`, `unityTested=false`, `devicesTested=false`, `released=false`.

**All seven stage logs raw SHA-256 recomputed and MATCH:**

| Stage | Exit | Independently verified SHA-256 |
| --- | ---: | --- |
| node-version | 0 | `6e1a0a6e1fb7f21a01419a1296792ae1aac17f7d8fc9bf20407e1d9564f453ff` |
| dotnet-sdks | 0 | `1d1d2c740f00452a1cbc38a6e552d6aadd24c57b6deb282734ceea3041b0f02d` |
| disposable-checkout | 0 | `f4222e3ffed788bd5966969dd9785732ba84f79cccdbdcdbb773adda924660eb` |
| dotnet-selected | 0 | `567432dd429ba38e8fc450dbdb68c5904df0fb06383c23b46d295026fb4d2c74` |
| data | 0 | `57056a6ff7b50bc0cdc05cdca5ac8a61692d8ef85916b0d19f5fb21480e603ba` |
| managed | 0 | `d8c0ca9e0c6b62efc4631b410c6ea32fa3d30dc419090b81bf59bba35f15cf79` |
| codec | 0 | `8a98774b426fad24d670e34cf4a3e95c771faeb5bb0621e54a106ac7c30683b5` |

Further **independent cross-checks**:

- `managed-tests.json` hash and size equal `results.json.observed.managed.freshEvidence`: SHA-256 `6ce0a8649a47f8f08edd67a89d993c7ffd61ec9391e1ad72251c7fd29ade9177`, **41,622 bytes**.
- Enumerated exactly **351 distinct named test results**, **351 true PASS** / **0 FAIL**; `managed.log` contains **351 matching, same-order named `PASS` lines**, ends `RESULT: 351 passed, 0 failed`. This is not an inference from summary count alone. Covered names include Phoenix (6), Soul Anchor (4), Dirge (2), Frostguard (15), Den Mother (4), grave-cap, Replay, and exact Frostguard F02-G09B, G09C, G09D, G09E (one named each).
- `codec-tests.json` hash and size equal runner fresh evidence: SHA-256 `fe5b3014794a9f40135bdcc356d956b84133c3e7a707af753621abc374d52bf8`, **683 bytes**. Exactly **13 named `PASS` lines**, `RESULT: 13 network wire tests passed`, codec exit 0. This is **codec only**, no real multiplayer.
- Original `data.log` prints 227 records, 224 specials, 12 archetypes, 36 canonical + 4 provisional decks and exits 0.

## 4. G2 Windows BuildPipeline — original LOG and JSON

- Original external `windows-build.log` **946,833 bytes**, independently SHA-256 **`a875b88a5578d13724eea95bd75590ea4ae9f53464848f48d4b6c43aeb1c5148`**.
- Starts with Unity `6000.4.0f1` / revision `8cf496087c8f` on Windows 11, **2026-10-20T00:44:38Z**; batch build command has `-buildTarget StandaloneWindows64 -executeMethod CoreClash.Editor.BuildTools.BuildWindows`, with explicit local Stage2 project folder.
- Log includes `DisplayProgressNotification: Build Successful`, `Build Finished, Result: Success.`, **`CORE_CLASH_BUILD_PASS StandaloneWindows64`**, final `Application will terminate with return code 0`. No `error CS`, exception or build compilation failure; intermediate Unity/Bee `ExitCode:4` notices were observed but the complete BuildPipeline returned success. Do **not** misreport every internal subprocess exit as zero; only runner's 7/7 individual exits were all zero.
- `unity-build-evidence\\build-StandaloneWindows64.json`: **`Succeeded`**, errors **0**, warnings **1**, size reported **97,720,050**, duration **00:00:43.4122698**. Warning is Unity Services project-not-linked warning; log contains non-blocking licensing token warning/recovery messages, but build completed.
- `CoreClash.exe` reported (NOT included) **667,648 bytes**, SHA-256 `97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3`; separate `Assembly-CSharp.dll`/resources asset hashes are present **as assertions only**. Independent A60 file-byte rehash **NOT_RUN: FILE ABSENT**.

## 5. G2 Windows native visible automated Player smoke

Independently parsed three original outer entries `native-smoke\\r6-native-runner.json`, `r6-native-runtime.json`, `r6-native-player.log`.

- Windows Player `6000.4.0f1`, `developmentBuild=false`, `batchMode=false`, Direct3D11, local display **1280×900**, `renderReady=true`, `pointerGestureStarted=true`, `pointerLaunchAccepted=true`, finished splash, and completed a match on the live simulation with automated/fixed-step acceleration.
- `r6-native-runner.json: passed=true, exitCode=0`; native runtime also `passed=true`. The player log contains **one** `CC_R2_SMOKE_PASS` marker with **50 turns**, **51 launches**, **winner=0**, **bases 11,3**; it contains **six** `CC_R2_CAPTURE_PASS` markers.
- Native `startedUtc=2026-10-20T00:57:35Z`, finished `00:57:40Z` (after G1 00:37 and Windows build 00:44); `phase=Over`, `resultReason=50 turns: base HP`. Reports `simulationFrames=23474` and `acceleratedSteps=23305`; this is NOT a 50-turn human-paced performance measurement.
- All **six PNG files** actually present and decoded (RGB, 1280×900, distinct pixel content); independently recomputed hashes exactly match **both** runner and runtime manifests, with matching byte sizes and PNG dimensions:

| Image | A60 verified SHA-256 |
| --- | --- |
| `r6-native-01-deck-selection.png` | `92aba0db1c08060a1da86bdb46f511474aa389b9e423d1d212bece6e6b470418` |
| `r6-native-02-aim.png` | `6ccbfc2772cd9928629c7f349100815a5f4d43b9ee02512af4e4d8971cd92cd7` |
| `r6-native-03-gameplay.png` | `7601f21a78a0a5cb8268fc82f13c5e069ddd337e3f88eed6a6b3504aac1c587b` |
| `r6-native-04-ball-details.png` | `0f429c6c502936cc8f25aa80572cfc4f738409c93433ded4019da64dec5a7f74` |
| `r6-native-05-developer-details.png` | `2ad6e0bae949876093f4ae57c8594593583a22336e2405bea9ff1737e06ec884` |
| `r6-native-06-match-result.png` | `f0133863d0047bdb3d46ae157b474c88442097196ace8be883b8fb0537c9fd7` |

A60 **visually inspected** the actual six screenshots: selection, aim indicator, active arena with portal pair, ball details, developer overlay as an **optional** panel, winner/result screen with P0 11HP vs P1 3HP. This is useful visual evidence, **not** physical touch, high-resolution responsive QA, or proof every gameplay ability activates. In the player log there are **50** automatic `CC_R2_MATCH_LAUNCH` markers plus one initial pointer launch, reconciling 51 launches total; no `Unhandled` or `Exception` lines detected.

## 6. Reproducible A60 audit commands/exits (not a C#/Unity rerun)

Executed in A60's Linux Python environment against **the uploaded bytes** (read-only ZIP):

```sh
python /mnt/data/a60_w6_verify_evidence.py
# exit 0 — verifies external+inner SHA/CRC, manifests, 7 log hashes/exits,
# 351 unique managed names/log-line equality, 13 codec, native log/PNG/JSON
# and Windows build markers.

python - <<'PY'
# In-memory corruption of copies of three stage logs and one screenshot;
# all four must be caught by stored SHA-256 comparisons.
PY
# exit 0, 4/4 negative checks PASS; untouched archive bytes.

git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD
# exit 128 (this Linux environment cannot resolve github.com; no fake local clone).

# GitHub connected API readbacks: actual remote HEAD, parent/diff,
# A72 runner/policy sources + UTF-8 LF/CRLF SHA-256 source verification.
# API operations successful; not shell commands or managed test execution.
```

Audit script itself remains a **local QA helper**, not repository source; no speculative gameplay test was inserted, no destructive extraction and no frozen source changed. The in-memory corruption negatives prove the audit detects altered hashes but do not attest the Windows host independently.

## 7. Freshness, limitations, and future coverage

**Freshness:** G1 logs report 2026-10-20T00:37Z and detached checkout at exact Stage2 SHA. Unity build log reports 00:44Z; native smoke runtime reports 00:57Z. These are new vs 2026-10-18 historical R16. **Do not interpret** packaged `unity-build-evidence\\build-WebGL.json` / `build-Android.json` as fresh Stage2; their mere `Succeeded` text does not satisfy target-specific identity or freshness. Historical `initial-build-StandaloneWindows64.json` is not substituted for the actual `windows-build.log`.

**Residual risk / next tests:** Native automated match does **not** separately exercise Phoenix DEATH→hand/RETURN shield, Soul Anchor grave positioning/cap, Dirge nearest supported death-body or Frostguard physics G09B/C/D/E and real collision/replay in **Unity Player**. These **were** covered in managed C# by named tests; do not claim them untested in managed. Need bounded native Unity Player per-mechanic runtime probes authored by A40/A50, new G2 Stage2 WebGL and Android builds, manual Windows UX/safe area input, and actual separate-device network/crossplay/reconnect, loss/jitter and mobile touch G3. No new source implementation based on pass counts alone.

**Critical provenance limitation:** archived `manifest.json` pins Stage2 candidate, inner disposable C# worktree pins Stage2, and Windows build log uses a separate `unity-stage2` local project directory rather than A72 disposable G1 checkout. ZIP contains **no recorded `git rev-parse HEAD`/source-file hashes for that exact Unity build directory**. Hence local build smoke is accepted **as observed local Windows execution evidence** but independently cryptographic source-to-EXE provenance is **UNVERIFIED**. Before public release reproducibility/higher gates, collect binary bytes or signed SHA source/build manifest and exact local Unity checkout ref without changing frozen source.

**Evidence portability:** raw ZIP is attached to the A60 conversation only; it is **not** asserted to exist on a shared Google Drive/GitHub link. Any additional independent verifier needs the exact archive bytes and outer SHA-256, rather than relying solely on this Markdown.

## 8. Five-axis status and next handoff

**DESIGNED:** YES — scope-controlled independent evidence acceptance and next per-mechanic tests identified.  
**IMPLEMENTED:** YES — **A60 QA report only**, not gameplay/test-source changes or independent SDK rerun.  
**TESTED:** **Independent raw ZIP/CRC/SHA/log/JSON/name/PNG/source-runner hash and visual review PASS**; Windows .NET/Unity commands were run by the user, independently verified **from raw evidence**, NOT rerun by A60.  
**INTEGRATED:** NO A60 integration. A70 already has Stage2 **on isolated diagnostic branch only**.  
**RELEASED:** NO, **STOP**.

**Final gates:** original R16 G0 PASS; Stage2 A71/A73/A74 source/hygiene PASS-with-risks; **G1 LOCAL EVIDENCE ACCEPTED; G2 WINDOWS BUILD LOCAL EVIDENCE ACCEPTED; G2 WINDOWS NATIVE SMOKE LOCAL EVIDENCE ACCEPTED**; G2 Stage2 WebGL/Android NOT_RUN; G3 WAIT; complete G4 / release **HOLD**.

**A60→A00/HQ, A72, A70, A40, A50, A20, A31 HANDOFF:** treat the three accepted layers as **real local Windows evidence** on exact declared Stage2 candidate, do not demand re-running the same managed 351 tests without a reason; do **not** infer cross-platform/physical or gameplay coverage beyond what was executed. A40/A50: bounded Unity Player-specific lifecycle/F02 probes. A72/A70: preserve raw ZIP custody + candidate/run provenance. HQ: decide next authorized target build and acceptance gate; still **no main merge, public publication, force push, frozen R16/V148/Protocol149 mutation or registry promotion**.
