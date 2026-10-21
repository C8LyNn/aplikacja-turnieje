# CC-001 — R17-W7 / A72 diagnostic Phoenix Windows Player

**IDENTITY:** A72 Build & CI / Issue #113.  
**AUTHORITY:** https://github.com/C8LyNn/aplikacja-turnieje/issues/113#issuecomment-6313005982  
**STATUS:** OPERATOR_PACKAGE_PREPARED / WINDOWS_UNITY_RUNTIME_NOT_RUN_BY_A72 / RELEASE_STOP

## Immutable source pins

- A20 diagnostic branch: `diag/cc001-r17-w7-a20-phoenix-hand-trace`
- A20 exact commit: `e30e471f25005954f3e234d82afdbe15193a7a4a`
- A20 diagnostic C# blob: `a4a729e7a20bd0c6f5a89a466c1139b68cb1778c`
- Actual tracked Git tree of Unity project at exact A20 commit: `4ab2eb0eb2cfd6f2393233ef7e18d831f06ce652`
- Previous A20 W6: `10f64e4d213f17a352ed8fa83bc75884a39549f0` (unchanged).
- Frozen Stage2: `a67a37a0e4105dd680f52ae6728e93face61f4ce` (unchanged).
- Frozen R16: `de1fe4b88fce3bd08ef383165dc2cd622af2536b` (unchanged).

**W7 A20 source scope verified:** W6→W7 exactly two paths: `Assets/CoreClash/Presentation/CoreClashApp.cs` and A20 W7 documentation; no gameplay/GameState/physics/network/meta/main changes.

## Published A72 execution assets

On A72 branch, under `scripts/cc001/w7/a72/`:

1. `CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1`: PowerShell 5.1 pinned source clone, temporary defines, Unity Windows BuildTools build, fresh DLL/EXE validation, Player launch and evidence ZIP.
2. `START_CC001_W7.ps1`: secure bootstrap for **PRIVATE** GitHub repo; uses user's authenticated Git and fetches the main script from immutable commit `0dde984c41ff825aa7dd30c317f2637f3ca63db7` rather than unauthenticated public GitHub RAW. Verifies exact SHA-256 and invokes Windows PowerShell parser BEFORE any execution. Needs no API keys inside the package.
3. `URUCHOM_CC001_W7.cmd`: double-click Windows entrypoint, running the bootstrap under process-local Windows PowerShell execution policy.

**Main builder SHA-256 (UTF-8/LF GitHub committed bytes):** `F83DD3BA968C454A81FF0FD74B5C3964059AFABB198D37A3E8DCF90DFFA69BDE`  
**Main builder Git blob SHA-1:** `056e2e8ef8269ffca9dc1e901a849e49db18a561`.

### Windows 11 — minimal operator instructions

**Prerequisites:** Unity Hub with **Unity 6000.4.0f1**, Windows Standalone build support, and Git for Windows installed. The private `C8LyNn/aplikacja-turnieje` repository must be accessible with the user's GitHub account using Git Credential Manager. Internet access is needed for authenticated Git clones. Do not use a different Unity version. Do not run as administrator.

1. Extract the small A72 Windows operator ZIP to a folder in Downloads. The ZIP contains `URUCHOM_CC001_W7.cmd`, `START_CC001_W7.ps1`, operator README and SHA text; the full large builder script is fetched automatically from authenticated private GitHub by the bootstrap and SHA-checked before execution.
2. **Double-click `URUCHOM_CC001_W7.cmd`.** No commands to type. Git may request one-time GitHub sign-in; authenticate in the normal browser/credential-manager dialog.
3. The harness creates a brand-new `Downloads\CC001_W7_DIAG_*\` folder, checks SHA, history, exact project tree and clean checkout. Do NOT add/modify files there during compilation.
4. In the **disposable clone ONLY** it sets `CC001_PHOENIX_DIAGNOSTIC` via `Assets/csc.rsp` (Unity's compilation-at-startup mechanism) and `ProjectSettings/ProjectSettings.asset` `Standalone` scripting symbol. This preserves original source/Stage2/main; **never commit these temporary local settings**. Uses the existing `CoreClash.Editor.BuildTools.BuildWindows`, equivalent to **Core Clash > Build Windows**.
5. If Unity compiles successfully, the launcher checks `CORE_CLASH_BUILD_PASS StandaloneWindows64`, `build-StandaloneWindows64.json` `Succeeded`/errors0, real fresh `Builds/Windows/CoreClash.exe`, and `CoreClash_Data/Managed/Assembly-CSharp.dll` whose SHA must differ from old W6 `909D71C3...`. It checks the **compiled DLL byte content** for the diagnostic marker. A source file containing the string does NOT count as compiled proof.
6. The script displays the screenshot directory and instructions, then waits for ENTER to start a **visible** Windows Player. Make a LOCAL/OFFLINE match with Player 1 deck **Ogień · Popiół (`fire_3`)**. Spend the single genuine Phoenix stock, wait for organic return to hand at `HAND READY`/stock0. Click the Phoenix card **with the mouse**, then press keyboard **0**, **1**, aim and RELEASE for actual SPAWN. 
7. While the game is foremost, take real **game-window** PNGs at BEFORE, MOUSE, KEYBOARD, AFTER, and CARD_AFTER using **Alt+PrintScreen → Paint** or **Win+Shift+S → Window**. Save each image in the script-created `Screenshots` folder. Reopen images immediately; discard screenshots showing PowerShell/browser/desktop instead of the game. The tool NEVER programmatically captures the desktop or injects UI events.
8. **Close the game normally.** The script then uses its fresh custom `logs/Player.log`, hashes build logs, EXE, DLL, **ALL** Windows Player files with unflattened relative paths, creates `evidence/manifest.json` with copy/hashes of EXE/DLL and original screenshots/logs, compresses `CC001_W7_A72_DIAGNOSTIC_EVIDENCE.zip`, and writes `EVIDENCE_SHA256.txt`.
9. Upload the **original ZIP and SHA256 receipt** to A60 #139 (or a verified private Google Drive sharing channel). The operator's successful build is not independent QA acceptance.

If the game closed before screenshots were collected, the script saves a build-only archive and marks `WAIT_SCREENSHOT`/runtime incomplete; do not falsely claim UI PASS. For recovery, use the same source script with `-Mode Collect -RunFolder <EXACT_GENERATED_RUN_FOLDER>` **only when no evidence archive exists**. It never overwrites previous evidence. Keep the full, original unflattened `Builds/Windows` folder in the isolated run directory for troubleshooting; the small evidence ZIP includes binaries/logs/PNGs and a full inventory, not a full runnable game installation.

### A60 evidence oracles

- Log must be from THIS exact new Player (`-logFile` path within run directory), contain `CC001_PHOENIX_DIAGNOSTIC stage=MATCH_START`, run ID, match number, UTC, frame and unambiguous SELECT path.
- For the actual Phoenix spawn: `BEFORE_SUBMIT` and `AFTER_SUBMIT` share exact run/match/trace. Require `network=LOCAL`, pre-stock0, valid ready owner0 hand record; after acceptedTrue, stock stays0, precisely one matching Phoenix sourceBallId/lineageId hand entry removed, actual new SPAWN event and new ball ID/typephoenix/owner0. A20/A60 must inspect true PNGs; PNG header check alone does not prove window targeting.
- Document exact Unity compiled DLL SHA; it MUST NOT be inferred from preexisting W6 EXE/hash. The original source C# under preprocessor is not proof of compiled branch, but the builder verifies marker in actual DLL and the post-start log.
- Distinguish `BUILD_PROVENANCE_VERIFIED`, `DIAGNOSTIC_MATCH_START_OBSERVED`, `PHOENIX_HAND_UI_RUNTIME_ACCEPTED`, and full G4: neither the first two nor the script can grant A60 UI PASS automatically.
- Do not rerun historic 361 managed/13 codec just to create another report.

### Safety and limitations

- **Git repo is PRIVATE**, so direct unauthenticated `raw.githubusercontent.com` is not supported; bootstrap uses the same authenticated Git access needed for the A20 checkout. No secrets stored in the ZIP.
- Source fetched with `git clone --no-checkout`, pinned detached SHA, clean working-tree requirement, exact project tree and diagnostic C# blob. No `git reset`, `git clean`, force-push, production checkout mutation or merge. Default-main CI workflow and candidate allowlists untouched.
- Unity compiler or PowerShell 5.1 **NOT_AVAILABLE in A72 current Linux environment**. Thus no native PowerShell parser, Unity compile/build, player screenshots or EXE/DLL checks have executed HERE. Operator startup invokes a real PowerShell parser before the build. Static strings, source API field names and GitHub references checked only.
- The source field review found real `GameState.players`, `phoenixHand`, `events`, `eventSerial`, `GameSimulation.Stock`, `PhoenixHandEntry.{owner,sourceBallId,lineageId,ready,createdOwnerTurns,lastProcessedOwnerTurns,hp,maxHp,shield}`; Unity `Debug.Log`, `Time.frameCount`, `Event.current.rawType` and `UnityEngine.Input.touchCount` are API-appropriate. This is a source-level assessment, not Unity compilation.
- `csc.rsp` is documented by Unity as a pre-compilation scripting-symbol mechanism in batch mode; temporary `Standalone` ProjectSettings entry is supplemental. Its actual correct application is accepted only after binary marker and fresh runtime `MATCH_START`.
- The build may legitimately write scene/project settings/evidence and Unity cache files **inside disposable clone only**. Never commit or merge the generated changes.
- No A20 source edit, no Stage2/main/R16/V148/Protocol149 mutation; no public release, gameplay redesign, workflow registration or deployment.

**A72 gate:** `GO_OPERATOR_LOCAL_EXECUTION` **conditional** on Git authorization, Unity 6000.4.0f1 and Windows PowerShell grammar preflight; `UNITY_W7_BUILD=NOT_RUN_BY_A72`, `PHOENIX_REAL_UI=A60_WAIT`, `RELEASE=STOP`.
