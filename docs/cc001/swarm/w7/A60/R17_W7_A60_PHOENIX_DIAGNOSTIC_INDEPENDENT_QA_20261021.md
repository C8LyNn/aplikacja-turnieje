# CC-001 — R17-W7 / A60 Independent Phoenix Diagnostic QA — FINAL

**Identity:** A60 — Independent QA / Verification. **Existing issue:** [#139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139).  
**Review date:** 2026-10-21. **Priority:** P0. **Mode:** read-only evidence audit, one A60-only report.  
**Source evidence:** [original `CC001_W7_A72_DIAGNOSTIC_EVIDENCE.zip` on connected Google Drive](https://drive.google.com/file/d/1AFdhsIrowFbPCipG0LVlRokaXhsljrjl/view), Drive ID `1AFdhsIrowFbPCipG0LVlRokaXhsljrjl`, folder Core Clash.  
**W7 exact diagnostic source:** `e30e471f25005954f3e234d82afdbe15193a7a4a` on `diag/cc001-r17-w7-a20-phoenix-hand-trace`.  
**W6 Phoenix UI candidate parent:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (W7 ahead 3/behind 0; only `CoreClashApp.cs` + one A20 report differ).  
**Frozen Stage2:** `a67a37a0e4105dd680f52ae6728e93face61f4ce` (not modified). Frozen R16 `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.  
**Own QA branch:** `feat/cc001-r17-w4-a60-candidate-qa`; **START HEAD** `cf1950996719f6b57d4d17fba520fdabbaab3c13`.  
**Authority:** [HQ W7 independent-reception dispatch](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6325602161). **No gameplay, CI, integration, main or protected source changes.**

## 1. Decision — scope strictly separated

| Gate | Independent A60 decision | Scope/limitation |
|---|---|---|
| `W7_RAW_ZIP_SHA_CRC_MANIFEST` | **PASS** | Actually downloaded original bytes; outer SHA; 11/11 CRC; 9/9 included file SHA and sizes |
| `W7_GIT_SOURCE_PROVENANCE` | **PASS — bounded** | Exact W7 branch, Git tree and CoreClashApp blob verified independently on GitHub; 50/50 local checkout provenance assertions internally consistent, though raw bytes for all 50 checkout files are not in ZIP |
| `W7_UNITY_WINDOWS_BUILD_EVIDENCE` | **PASS — local Windows evidence** | BuildPipeline success, 0 reported build errors / 1 warning, actual EXE/DLL hashes and compiled diagnostic marker |
| `W7_NATIVE_PHOENIX_FIRST_STOCK_USE` | **PASS** | `trace=3`, stock 1→0, ball1 HP20 created |
| **`W7_NATIVE_PHOENIX_HAND_EXACT_ONCE`** | **PASS** | `trace=8`, eligible hand 1→0, stock remains0, `accepted=True`, new event60 / ball7 Phoenix HP10 |
| `W7_KEYBOARD_0_TO_1_SOFTWARE_INPUT` | **PASS** | Same-run `SELECT` event origin from Unity `Input.GetKeyDown` branches, `admitted=True` for normal and Phoenix; cannot distinguish number row from numpad |
| `W7_GUI_SELECTION_SOFTWARE` | **PASS** | Admitted Phoenix `GUI_EVENT_Used_RAW_Used_HARDWARE_UNATTRIBUTED`; not proof of a physical mouse |
| `W7_PHYSICAL_MOUSE_ATTRIBUTION` | **HOLD** | GUI event consumed as `Used`; physical mouse source versus another input device not proven |
| `W7_NEW_SCREENSHOT_VALIDATION` | **NOT_RUN** | Screenshot list empty and **ZERO** PNG in actual W7 ZIP; older *separate* 11 game screenshots independently accepted in W6 |
| `PHOENIX_WINDOWS_DIAGNOSTIC_RUNTIME` | **PASS** | Real Windows Player local Phoenix gameplay state acceptance, not full physical UX or cross-platform acceptance |
| `FULL_WINDOWS_INPUT_MODALITY / G3 / G4 / RELEASE` | **HOLD / NOT_RUN / HOLD / STOP** | No fully authenticated physical mouse event and no new mobile/real network/WebGL/Android or broader release testing |

**Overall R17-W7 diagnostic verdict: `PASS` for the exact local Windows Phoenix hand-consumption and spawn test.** This **closes the specific internal GameState hand-consumption blocker**. Full UI/hardware-input gate remains scoped `HOLD`; no full G4 or release promotion.

## 2. Verified original Drive ZIP bytes and manifest ledger

**Actual connector operation:** Google Drive `get_file_metadata(fileId=1AFdhsIrowFbPCipG0LVlRokaXhsljrjl)` verified `application/zip`, 519,734 bytes; then `fetch(download_raw_file=true, include_base64=false)` delivered **actual raw ZIP** as `/mnt/data/CC001_W7_A72_DIAGNOSTIC_EVIDENCE.zip` for independent hashing. Metadata alone was not treated as proof.

- Byte length: **519,734**.
- **Recomputed outer SHA-256**: `5D80B9C4D338122B71F0BB4EFF722441458B6AF468E73DD838FD13B4802B6DA2`, exact user/HQ expected digest.
- **11/11 ZIP CRC PASS**, `ZipFile.testzip() == None`, 10 real files + one folder marker. Unique paths, no path traversal.
- `manifest.json` includes exactly **9** other payload references. Independently matched each referenced path (normalizing ZIP backslashes for lookup), bytes and SHA256: **9/9 PASS**. Manifest itself is authenticated by the outer ZIP SHA.
- **Full actual nine-file hash ledger:**

| Included payload | Independently computed SHA-256 |
|---|---|
| `build-StandaloneWindows64.json` | `4A655F077A6132A558636C94E691A0D42B6482DB5392C046F3B478CFD677A2AC` |
| `checkout-eol-after.json` | `0B67DB775E48EF9D59D39204FAE5ABB59A6F5CD9C2C54ACFA60F807C0D8C3CF4` |
| `checkout-eol-before.json` | `4DC148D07AF8B885C407698664E482252F28B088C433FD082D27480D3E5E8415` |
| `Player.log` | `A21DDB5C04172745A1F1FC2852792FD4E677C52CDBF0F96A5F04D70BD14939C1` |
| `player-binaries/CoreClash.exe` | `97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3` |
| `player-binaries/CoreClash_Data/Managed/Assembly-CSharp.dll` | `7C05C8527952393E5B58C6088B3E8711602A9C59AF90A678A48BA2658D407724` |
| `player-exit.json` | `26890C4DB4F739764D8806FD421D4A8105600A27404FE8585845C4C2DAD9B439` |
| `source-provenance.json` | `8BD5A26BB334DE774E1DA4AE93B4233DF14374794D4C46C2AA2550233BC69AD6` |
| `unity-editor.log` | `D86426CCB70D477E5B4B8C63DBF8194CF790358A6012C18BD55C78DF45FA422E` |

**New independent local audit executed:** `python /mnt/data/cc001_w7_a60_independent_audit.py` **exit 0** after correcting the audit script's own initial conflation of Unity Editor SHA (`provenance.unityExeSHA256`) with player EXE SHA; **the final script explicitly distinguishes them**. Final checker SHA256 `D9EBCA926DB3EEE69FE2C065F9A66417B688BA81D168E9100A666BDE14A95BEB`. Machine-readable local ledger `/mnt/data/cc001_w7_a60_audit.json`, SHA256 `35A3DAD9F7F2C3CC890E9E14C4CC23F7DACB6C48C19A9EA07611273ABFF0F44C`. Two in-memory tamper negatives caught **2/2**. No tests executed inside Unity/.NET by A60; these were checks of actual previously executed output bytes.

## 3. Diagnostic source SHA and Windows source checkout proof

- Actual GitHub `diag/cc001-r17-w7-a20-phoenix-hand-trace` HEAD confirmed `e30e471f25005954f3e234d82afdbe15193a7a4a`, not previous W6 source SHA `10f64...`.
- Actual project Git tree at `unity/cc001-r16/CoreClash-V149-Unity/`: **`4ab2eb0eb2cfd6f2393233ef7e18d831f06ce652`**, independently traversed GitHub tree objects from exact commit. `Assets/CoreClash/Presentation/CoreClashApp.cs` Git blob **`a4a729e7a20bd0c6f5a89a466c1139b68cb1778c`**, read independently and matches source manifest.
- `source-provenance.json` source SHA, tree SHA and blob match GitHub; declares host Windows NT 10.0.26200.0, Unity Editor 6000.4.0f1 and temporary `CC001_PHOENIX_DIAGNOSTIC` scripting define via `Assets/csc.rsp` and disposable ProjectSettings.
- `checkout-eol-before.json` and `checkout-eol-after.json`: each **50** unique tracked paths classified `HEAD_BYTES_IDENTICAL_EOL_INDEX`; for each, `headRawSHA256 == workSHA256`, bytes equal, Git blob identity unchanged. Identical 50-path set and matching per-path raw/normalized hashes before and after. Initial `Git clean=false` **was not hidden**: the 50 modified paths were an EOL conversion phenomenon. Two expected disposable config paths are declared in AFTER (`ProjectSettings.asset` and `Assets/csc.rsp`), exact hashes cross-match provenance.
- Important limit: the ZIP **does not contain all 50 source-file raw bytes or the complete 182-file Windows Player**. A60 verified Git source/tree/blobs and **internal consistency of original checkout audit JSON**, not independently reran the Git-worktree byte proof on the Windows machine. This is high-quality but bounded source-build attribution.

## 4. Actual Windows Unity BuildPipeline and binary evidence

- `build-StandaloneWindows64.json`: `result=Succeeded`, `errors=0`, `warnings=1`, `target=StandaloneWindows64`, duration `00:00:47.1958772`, build report `size=97725682`.
- Original **1,246,585-byte** `unity-editor.log` SHA verified. It contains `DisplayProgressNotification: Build Successful`, `Build Finished, Result: Success.`, `CORE_CLASH_BUILD_PASS StandaloneWindows64` and final `Application will terminate with return code 0`; no `error CS`.
- **CAVEAT:** raw Editor import log also includes **32 `DirectoryNotFoundException` mentions** involving `Library/PackageCache` importer paths. They were non-blocking for the recorded final successful build but are not simply erased by `errors=0`. If reproducibility on a fresh path later fails, A72 should investigate Windows path/package-cache behavior, not reinterpret this W7 build as FAIL without an actual failed result.
- Actual packaged EXE **667,648 bytes**, SHA256 `97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3`; DLL **276,992 bytes**, SHA256 **`7C05C8527952393E5B58C6088B3E8711602A9C59AF90A678A48BA2658D407724`**. Both match manifest and player file inventory. Verified real DLL contains `CC001_PHOENIX_DIAGNOSTIC` marker as UTF-16LE bytes (not merely manifest flag). This is a **diagnostic build**, **not a release candidate**.
- Player launch `-force-d3d11 -screen-fullscreen 0 -screen-width 1280 -screen-height 900`, `player-exit.json exitCode=0`, original `Player.log` Direct3D11 and Unity 6000.4.0f1, match started `fire_3 vs featured_status_reactor`. No Unity Player screenshots supplied in THIS ZIP.

## 5. Decisive full Player.log Phoenix oracle — real accepted state change

**Exact source `CoreClashApp.cs` independently read:** Under `CC001_PHOENIX_DIAGNOSTIC`, `PhoenixDiagnosticState` serializes live `Simulation.Stock`, actual `state.phoenixHand.Count`, per-entry source/lineage/ready/turn/HP/shield, and `state.eventSerial`; `PhoenixDiagnosticSpawnEvents` scans newly appended events after the prior serial. `BEFORE_SUBMIT` is emitted directly before `session.Submit` and `AFTER_SUBMIT` directly after, within the same pointer-release codepath. It records actual `accepted` from Submit; no independent source edit or assumption required.

**Log provenance:** same process log `Player.log`, run ID `c390b89a37714879a176efea641b3ccf`, `match=1`, Unity 6000.4.0f1 Windows, `LOCAL` owner0. Distinguish ordinary `CORE_CLASH_LAUNCH` events from pairs of instrumented `Spawn` before/after.

### First stocked Phoenix — `trace=3`

At UTC 19:57:37Z, frame4298, `commandSequence=1`, `owner0 turn1`:

- BEFORE: `phoenixStock=1 handCount=0 eventSerial=0`.
- AFTER: `accepted=True`, `phoenixStock=0 handCount=0 eventSerial=2`, `newSpawnEvents=event1:turn1:ball1:typephoenix:owner0:hp20:shield0`.

**PASS:** ordinary stock Phoenix was used before hand return, consumes 1→0 stock and yields ball1 HP20.

### Returned Phoenix from ready hand — `trace=8`

At UTC **2026-10-21T19:58:53Z**, same `frame=8804`, owner0 **turn5**, `commandSequence=9`, `kind=Spawn`, `type=phoenix`, `network=LOCAL`:

**BEFORE_SUBMIT:**
```text
run=c390b89a37714879a176efea641b3ccf match=1 trace=8
phoenixStock=0 handCount=1
handEntries=0:owner0:source1:lineage1:readyTrue:created2:processed3:hp10:maxHp20:shield0
eventSerial=59
```

**AFTER_SUBMIT:**
```text
run=c390b89a37714879a176efea641b3ccf match=1 trace=8
accepted=True reason=none commandSequence=9
phoenixStock=0 handCount=0 handEntries=empty
eventSerial=61
newSpawnEvents=event60:turn5:ball7:typephoenix:owner0:hp10:shield0
```

**Independent A60 result: PASS** for this bounded same-run single-operation scenario: ready hand entry `source1/lineage1` disappeared **1→0**, stock stayed **0→0**, command `Spawn` accepted, one new `SPAWN` event includes `ball7` owned by P1/owner0 at **10 HP, shield0**. The later trace also demonstrates no immediately duplicated stock from RETURN. This does not prove all future iterations/no duplication across sessions.

**Relevant nuance:** raw Player.log contains three generic `CORE_CLASH_LAUNCH owner=0 type=phoenix` markers but only two explicitly instrumented Phoenix `Spawn` pairs (trace3 and trace8). The extra generic launch around trace6–7 has **no corresponding diagnostic before/after pair**; it may be a distinct command kind (for example REPLAY), but exact semantics **cannot be inferred from that generic log line**. It does not contradict exact frame-level `trace=8` and should not be mislabeled as either a new stock copy or a failed hand consumption.

## 6. GUI/software keyboard vs actual hardware

In the same run/match during turn5 with stock0/handCount1:

| Trace | Original `inputOrigin` | `requested` / `admitted` | QA scope |
|---|---|---|---|
| `trace=4` | `GUI_EVENT_Used_RAW_Used_HARDWARE_UNATTRIBUTED` | phoenix / **True** | **GUI software selection PASS**, physical mouse **HOLD** |
| `trace=5` | `KEYBOARD_0_OR_NUMPAD0` | normal / **True** | keyboard 0/keypad0 codepath admitted **PASS** |
| `trace=6` | `KEYBOARD_1_OR_NUMPAD1` | phoenix / **True** | keyboard 1/keypad1 codepath admitted **PASS** |
| `trace=7` | `GUI_EVENT_Used_RAW_Used_HARDWARE_UNATTRIBUTED` | phoenix / **True** | subsequent GUI software selection PASS; physical mouse still unattributed |

The diag source sets the keyboard origin **only inside the native Unity `Input.GetKeyDown` branch**. Thus software keyboard shortcut handling really executed. But it cannot distinguish number row from numpad. `Event.current.type/rawType == Used` records an IMGUI event consumed by GUI code, **not a physical mouse device**, so no defensible mouse hardware PASS.

No original PNG/screenshots in this ZIP (manifest `screenshotNames=[]`). Earlier **11 genuine game screenshots** separately A60 visual-accepted remain useful but are a different W6 capture and cannot be relabeled as W7.

## 7. Exact remaining gates / concrete next owner action

**NOW CLOSED by W7 independent QA:** `PHOENIX_DIAGNOSTIC_NATIVE_STOCK_FIRST=PASS`, `PHOENIX_DIAGNOSTIC_HAND_COUNT_1_TO_0=PASS`, `PHOENIX_DIAGNOSTIC_STOCK_REMAINS_ZERO=PASS`, `PHOENIX_DIAGNOSTIC_ACCEPTED_SPAWN_BALL7_HP10=PASS`, `KEYBOARD_SHORTCUT_SOFTWARE=PASS`, `GUI_SELECTION_SOFTWARE=PASS`, `W7_WINDOWS_DIAGNOSTIC_BUILD=PASS` (local evidence).

**STILL OPEN:** physical mouse origin (`HOLD`) and independently attributed hardware input; fresh W7 game-window screenshot evidence (`NOT_RUN`), new WebGL/Android (`NOT_RUN`), real mobile touch/separate-device/network multiplayer G3 (`WAIT`), complete G4 (`HOLD`), release/integration (`STOP/WAIT`). Diagnostic build uses a temporary scripting define; don't ship it.

**Smallest optional physical mouse proof if HQ needs it for Windows UI certification:** one native W7 gameplay run with actual mouse-specific `MouseUp`-based attribution or trustworthy video plus native event logs and actor/source; if IMGUI still normalizes to `Used`, use a **separately HQ-authorized** narrow diagnostic input hook only. Do NOT rerun 361 managed/13 codec without new fault. No gameplay changes or merge permissions granted.

**Five axes:** DESIGNED YES (bounded independent oracle) / IMPLEMENTED QA REPORT ONLY / TESTED actual raw SHA/CRC/hash/manifest, full Player.log, Unity Editor/build and EXE/DLL, Git readbacks PASS / INTEGRATED NO by A60 (diagnostic remains isolated) / RELEASED NO.

**Next HANDOFF:** A00 HQ Issue #97, A20 Issue #95, A72 Issue #113 and A70 Issue #137 — treat the exact-once Phoenix blocker as independently CLOSED; A70 integration remains WAIT pending separate HQ approval; no main merge, force push, release or deployment.
