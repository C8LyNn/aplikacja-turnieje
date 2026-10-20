# CC-001 — R17-W6 / A60 PHOENIX INDEPENDENT QA — LOCAL EVIDENCE ACCEPTANCE

**Project:** CC-001 — Core Clash Unity  
**Role:** A60 — Independent QA; **existing [Issue #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139)**  
**Wave:** R17-W6 — Phoenix Evidence Acceptance; **date:** 2026-10-20  
**Authorized scope:** report-only, own branch `feat/cc001-r17-w4-a60-candidate-qa`, path `docs/cc001/swarm/w4/A60/**`.  
**Own previous HEAD:** `83d7585d720f693df2dd1c4cda992086891af7b7`.  
**Old immutable Stage 2 final:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`.  
**NEW Phoenix A20 candidate (NOT integrated):** `10f64e4d213f17a352ed8fa83bc75884a39549f0`; `feat/cc001-r17-w6-a20-phoenix-ui-repair`.  
**A72 runner reference:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`; **frozen R16:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.  
**Authority:** [HQ #97 handoff](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6298600804), [A20 #95 implementation](https://github.com/C8LyNn/aplikacja-turnieje/issues/95#issuecomment-6289675893).  
**This report verifies the actual raw ZIP bytes supplied to THIS A60 conversation.** The external tests were run by the user on Windows; A60 performed an independent offline evidence audit, **not** a new .NET or Unity execution.

## I. Five separate acceptance decisions

| Gate | A60 result | Exact acceptance scope |
| --- | --- | --- |
| `G1_PHOENIX_MANAGED_ACCEPTED` | **ACCEPTED — LOCAL EVIDENCE** | 361 named managed PASS / 0 FAIL, including PHX-UI-01 through PHX-UI-10 (all PASS). Source-only UI contract coverage; not proof of clicking in Unity. |
| `G1_PHOENIX_CODEC_ACCEPTED` | **ACCEPTED — LOCAL EVIDENCE** | 13/13 network codec passes, JSON `exitCode:0`; not real network gameplay. |
| `G2_PHOENIX_WINDOWS_BUILD_ACCEPTED` | **ACCEPTED — LOCAL EVIDENCE** | Unity 6000.4.0f1 StandaloneWindows64 BuildPipeline success, batch exit0 marker, real EXE/DLL/resources/level0 bytes independently rehashed. |
| `G2_PHOENIX_NATIVE_SMOKE_ACCEPTED` | **ACCEPTED — LOCAL EVIDENCE** | Automated Windows Player 50 turns, 51 launches, result P0 11:3; exit0, D3D11, screenshot bytes/PNG decode. **Not a Phoenix specific scenario**. |
| `PHOENIX_REAL_UI_RUNTIME_ACCEPTED` | **NOT_RUN — REMAINS HOLD** | No observed native interaction selecting returned Phoenix as `HAND READY` with depleted stock; no actual mouse/keyboard/touch acceptance of that feature. |
| Fresh Stage 2+Phoenix WebGL/Android; G3 physical/multiplayer; full G4; release | **NOT_RUN / WAIT / HOLD / STOP** | No cross-platform, real phone/tablet or LAN/WAN evidence; no integration or public-release authorization. |

These are **local Windows evidence** decisions for the new A20 branch only. They do **not** retroactively merge the A20 patch into Stage 2 or certify full G2/G3/G4.

## II. Independent raw ZIP SHA/CRC/manifest

**Received attachment in this thread:** `/mnt/data/phoenix-w6-qa-20261020-204232(3).zip`  
**Actual length:** **1,668,642 bytes**  
**Recomputed SHA-256:** **`d6e5224bff848e9bf03881f1f4ea4f4ef69e68ee334aa51dfe8772378a02b658`** — exactly the HQ expected digest.  
**ZIP entries:** **19/19 CRC valid**, `ZipFile.testzip() is None`; 19 distinct safe file names, no traversal.  
**Manifest:** one `manifest.json` plus exactly **18 listed payloads**, one-to-one listing. Independently recomputed SHA-256 **18/18 MATCH** against each `Files[].SHA256`, without relying on HQ's summaries. `CandidateSHA` equals exact A20 `10f64e...`, `Sdk=9.0.313`, `PhoenixPlayerUI=NOT_RUN`. Manifest's `IndependentQA=PENDING` describes its state **before** this independent review.

**Audit executed locally:** `python /mnt/data/a60_phoenix_verify.py > /mnt/data/a60_phoenix_audit.log` → **exit code 0** (`A60_OFFLINE_EVIDENCE_VALIDATION_PASS`). Checks: outer digest, per-entry CRC and SHA, unique manifest paths, parsed JSON, 361 exact-name/log alignment, PHX IDs, 13 codec, Unity build success markers, real binary and PNG bytes, native results and negative controls. **Four independent, in-memory corruption controls** (managed log, test JSON, Assembly-CSharp.dll, final PNG) triggered SHA mismatches **4/4**; negative harness **exit 0**. Unmodified archive preserved. Helper and machine-readable results are local-only; no additional code or binaries committed.

## III. G1 managed 361/361 and Phoenix controls

- `unity-tests.json`: **361 entries** with distinct names, `pass=true` for all, `passed=361`, `failed=0`.
- Independently decoded real `managed-sdk9.log` as **UTF-16**; exactly **361 `PASS <name>`** lines in **the same order and with identical names** as JSON; final `RESULT: 361 passed, 0 failed`.
- `PHX-UI-01..10`: **10/10 unique numbered names and 10/10 PASS**, in both JSON and raw output, including hand-ready depleted stock, absent or unready hand, genuine stock precedence, opponent/turn constraints, consuming the last hand, fallback to Standard, and valid-later-hand case.
- Historical Stage2 Phoenix/Grave mechanics also have named PASS cases; this does **not** establish physical UI button/keyboard/card behavior.
- `manifest.json` reports SDK **9.0.313**; user/HQ provides Windows CLI process exit **0**. **Limit:** the raw managed text log and test JSON do **not** independently include `dotnet --version` or a separately recorded managed process exit-code field. SDK version/process exit0 are therefore host/manifest-reported, while counts/names are independently verified by byte-level log/JSON comparison. No claim that A60 reran managed code.

**PHX-UI-01..10 canonical names, checked directly:**

1. ready Phoenix hand with exhausted stock can be selected;
2. exhausted Phoenix without ready hand falls back to Standard;
3. genuine Phoenix stock takes priority over ready hand;
4. unready Phoenix hand is unavailable;
5. opponent-owned ready Phoenix hand is unavailable;
6. same-turn and stale-processed Phoenix hands are unavailable;
7. consuming last ready hand removes Phoenix availability;
8. exhausted non-Phoenix ball still falls back to Standard;
9. opponent turn never enables own Phoenix hand or stock;
10. one ready hand wins over an invalid earlier hand.

## IV. G1 codec

- `codec-sdk9.log` decoded **UTF-16**, exactly **13 `PASS`** lines plus `RESULT: 13 network wire tests passed`.
- `network-codec-tests.json`: `exitCode=0`, empty `error`, and its `output` exactly equals the decoded raw codec log (including CRLF).
- This is actual logged codec test coverage, **not** real multiplayer transport or G3.

## V. G2 Unity Windows BuildPipeline and REAL binary bytes

- `windows-build.log`: actual Windows 11 Unity **6000.4.0f1** build output. Contains `StandaloneWindows64`, `DisplayProgressNotification: Build Successful`, `Build Finished, Result: Success.`, **`CORE_CLASH_BUILD_PASS StandaloneWindows64`**, and `Exiting batchmode successfully now!`, final **`Application will terminate with return code 0`**. No C# `error CS` lines.
- Complete log raw SHA-256 **`10bf8d21a095af630344da4d97581f6294d9e21bae860fc0e74927116fa7ff56`** matches manifest.
- Unlike previous HQ W6 Stage2 bundle, **this ZIP includes four ACTUAL binaries**, not just metadata. Independently hashed the exact bytes; all four match both `manifest.json` and `native-smoke\\r6-native-runner.json.buildFiles`:
  - `CoreClash.exe`: **667,648 B**, SHA-256 `97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3`.
  - `Assembly-CSharp.dll`: **271,872 B**, SHA-256 **`909d71c3c2641657b887c496cbc7cdbb817070bca22250f758f334c0811b4698`**.
  - `resources.assets`: **696,156 B**, SHA-256 `85fb6df50e0ecf2737357ca1ca211e48e5932d80b7920715066639ac7cb4106d`.
  - `level0`: **3,524 B**, SHA-256 `78e3c6f377ab72737c52c90c4f6bb056fdf274e3ad76f3d4ad440935b190b0f4`.
- These are real imported bytes, but **flattened selections**, not a complete deployable Player directory. Rehash verifies artifact identity and manifest consistency. **It does not prove the full Unity imported source tree at build time matched Git commit** `10f64...`: no `git rev-parse HEAD` from the actual Windows Unity project or full source/build-to-DLL deterministic attestation in the ZIP. **Exact source→build provenance: PARTIAL, UNVERIFIED cryptographically**.

## VI. G2 native smoke and six screenshots

- `native-smoke\\r6-native-runner.json`: `passed=true`, process **`exitCode=0`**, 50 turns, 51 launches, winner0, bases [11,3]. Its four reported binary SHA values exactly match rehashed bundle bytes.
- `native-smoke\\r6-native-runtime.json`: `passed=true`, `renderReady=true`, `phase=Over`, `unityVersion=6000.4.0f1`, `graphicsApi=Direct3D11`, `pointerLaunchAccepted=true`. Actual runtime timestamps `2026-10-20T18:38:53Z` to `18:38:58Z`; accelerated fixed-step simulation rather than 50-turn real-time manual play.
- `r6-native-player.log` has `CC_R2_SMOKE_PASS launches=51 turns=50 winner=0 bases=11,3` and six `CC_R2_CAPTURE_PASS` markers.
- All six PNG *original byte payloads* SHA256 match **three independent listings** (manifest, runner capture list, runtime capture list). Opened/decompressed all six with Pillow `verify()`; **6/6 valid PNG, each 1280×900**; visually reviewed contact sheet: deck selection, aim, portals/gameplay, ball details, optional developer overlay, match results. The PNGs show meaningful content and a completed match.
- **Phoenix was not exercised in this native smoke:** `deckA=featured_gravity_trap`, `deckB=featured_status_reactor`. `deployedA` and `deployedB` contain **no Phoenix**. The UI images do not show a Phoenix hand-ready card, selecting it via mouse/keyboard, or its removal after a successful spawn. **`PHOENIX_REAL_UI_RUNTIME = NOT_RUN`** unequivocally, independent of 10/10 managed.

## VII. GitHub exact-commit and source-protection checks

- Authenticated GitHub remote HEAD for `feat/cc001-r17-w6-a20-phoenix-ui-repair` matched **`10f64e4d213f17a352ed8fa83bc75884a39549f0`**, immutable Stage2 branch remained at **`a67a37a0e4105dd680f52ae6728e93face61f4ce`**. A60 own branch started **`83d7585d720f693df2dd1c4cda992086891af7b7`**.
- GitHub compare pinned Stage2→A20 exact commit: **ahead 6, behind 0**, exactly **five** changed paths, all HQ-authorized:
  1. `Assets/CoreClash/Presentation/BallSelection.cs` (new Git blob `c18d6dc342da868b71a043c3bcc0a524aa9c611a`);
  2. `Assets/CoreClash/Presentation/CoreClashApp.cs` (`33be4b892d85bd3b68d08a1a79d5aab39d256600`);
  3. `Assets/CoreClash/Presentation/MatchView.cs` (`27ea11641dd0caf59fee80599f973e693856c0c5`);
  4. `Tests/PresentationTests.cs` (`08e74174997aaaa01013b4ae0e0cd07b19ba69d2`);
  5. `docs/cc001/swarm/w6/A20/R17_W6_A20_PHOENIX_UI_REPAIR_HANDOFF_001.md`.
- Direct readback of each of the four source files confirms `BallSelection.Source` / `CanSelect` as shared eligibility, `HAND READY` stock label, `CoreClashApp.SelectBall` consuming shared eligibility, `MatchView` querying `BallSelection.Source`, and ten exact `PHX-UI` fixture names. The logged 361/361 tests are consistent with this test source.
- Read-only direct source blob parity with Stage2 confirmed **UNCHANGED** `GameSimulation.cs`, `GameState.cs`, `Tests/Program.cs`, `Packages/manifest.json`, and `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json`. Diff shows **no R16, V148, Protocol149, catalog, physics, metadata, build/Unity generated files or other-agent source changes**.
- Source diff itself was **not** replayed/merged into any other branch. A20 patch remains isolated; no A60 gameplay edits.

## VIII. Open issues / next agent dependencies

**P0 — A20 #95:** run real Phoenix-hand end-to-end Unity Player input test on exact A20 build: stock depleted, valid RETURN ready, `HAND READY` rendered, selection by **mouse and keyboard** (later touch), legitimate SPAWN, hand entry consumed exactly once, no regenerated stock copy, card returns to EMPTY/Standard and no repeated RETURN. Capture a dedicated runtime state/setup, actual input events, log + screenshots, player/executable SHA and exit. A diagnostic fixture only with explicit HQ source-ownership approval.

**P1 — A72/A70:** obtain full build-source digest attestation and standard clean build reproducibility, preserve raw evidence bytes (not only the GitHub comment). Previous runner SHA is a baseline reference; the supplied Phoenix W6 bundle has **no full seven-stage A72 `results.json`** to authenticate as an A72 run, so do not invent `7/7 runner` for these new tests. Report independent Windows managed execution as log/JSON evidence and HQ exit claim.

**P1 — A40:** independently confirm semantic stock-first / readiness / REPLAY_RETURN constraints; A60 sees static consistency and managed pass but no native UI input proof. **Other followups:** fresh WebGL/Android builds, physical UX/phone/tablet and crossplay G3; full G4 WAIT/HOLD; release STOP.

**Five axes:** DESIGNED YES (bounded independent QA); IMPLEMENTED YES (**A60 report only**, no gameplay edits); TESTED independent raw archive SHA/CRC + 18 hashes + 361-name/10-PHX + 13 codec + Unity log + 4 actual binary SHA + six PNG/native + tamper negatives, checker exit0; **no C#/Unity rerun by A60**; INTEGRATED NO by A60 (A20 isolated); RELEASED NO.

**HANDOFF:** A00/HQ, A20, A40, A72, A70. **G1 local evidence ACCEPTED; G2 Windows local evidence ACCEPTED; Phoenix real UI NOT_RUN; full G4 HOLD; release STOP.** No changes to frozen R16/Stage2/V148/protocol149, no merge to main, force-push, deployment or ability registry promotion.
