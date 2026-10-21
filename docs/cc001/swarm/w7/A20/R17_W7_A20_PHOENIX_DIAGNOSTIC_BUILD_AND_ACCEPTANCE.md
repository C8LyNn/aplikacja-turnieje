# CC-001 — R17-W7 / A20 — Phoenix read-only diagnostic build and final evidence

**Status:** IMPLEMENTED_IN_ISOLATED_SOURCE / UNITY_BUILD_NOT_RUN / PLAYER_NOT_RUN / RELEASE_STOP

**Owner:** A20 — UX/UI & Game Feel, Issue #95.
**HQ GO:** Issue #97 comment 6312599546 and Issue #95 comment 6312600794.
**NEW disposable branch:** diag/cc001-r17-w7-a20-phoenix-hand-trace.
**Immutable START SHA:** 10f64e4d213f17a352ed8fa83bc75884a39549f0.
**A20 implementation-source SHA:** 21fb3f69081bf188e07c511cbedfb1c0bee71b3e.
**Final branch SHA:** recorded and verified in the final Issue #95 HANDOFF, after this documentation commit.

## 1. Exactly authorized paths, mechanism and safety

ONE source-code file modified under unity/cc001-r16/CoreClash-V149-Unity/:
- Assets/CoreClash/Presentation/CoreClashApp.cs.

The only second file is this document under docs/cc001/swarm/w7/A20/.

No edits to GameSimulation, GameState, BallSelection, MatchView, tests, A40/A50 gameplay, physics, Protocol149, catalog, .meta, protected R16/V148, immutable Stage2, main, release, CI or workflows.

ALL new read-only diagnostic fields, helpers, event logging and input attribution are guarded by #if CC001_PHOENIX_DIAGNOSTIC. Without this symbol, all newly added diagnostic marker and helper code is omitted at C# preprocessing. The existing CORE_CLASH_SELECT and CORE_CLASH_LAUNCH logs still run as previously. No new code writes to stock, phoenixHand, turn, abilities or GameState; no input injection, no synthetic events.

Each diagnostic log has marker CC001_PHOENIX_DIAGNOSTIC and run GUID, match index, trace sequence, ISO UTC time, frame and stage. Stages:
- MATCH_START: local match/deck id.
- SELECT: when Phoenix is chosen or deselected, real attempted input path (KEYBOARD_0_OR_NUMPAD0, KEYBOARD_1_OR_NUMPAD1, GUI_MOUSE_UP_NO_TOUCH_REPORTED, GUI_MOUSE_UP_TOUCH_PRESENT or clearly unattributed origin), requested/selected name, whether admitted, turn, Phoenix stock and entire hand roster.
- BEFORE_SUBMIT: only on CommandKind.Spawn of Phoenix; command owner/turn/sequence, local vs potentially async network path, Phoenix stock and full hand entries (index, sourceBallId, lineageId, owner, ready, createdOwnerTurns, lastProcessedOwnerTurns, HP, max HP, shield), event serial.
- AFTER_SUBMIT: same trace number as BEFORE; Submit accepted/reason; stock and hand entries again; actual newer GameState.events of type SPAWN with event id/new ball id, owner, HP and shield when available.

Unity IMGUI can consume the MouseUp event; diagnostic examines Event.current.rawType and .type, so a GUI_MOUSE_UP value means an IMGUI mouse event with no touch currently reported, NOT independently certified physical hardware. An operator video can corroborate the input path. Local offline testing is mandatory for synchronous before/after admission; NetworkLink may be asynchronous.

## 2. Tests actually performed here — not a C# compile

- GitHub fetched exact source and checked branch ancestry/source-path scope.
- Conditional compilation simulated by removing all #if CC001_PHOENIX_DIAGNOSTIC regions from an in-memory source read: diagnostic marker and all diagnostic references absent.
- With symbol conceptually enabled: required log fields and before/after trace are present; no mutating Phoenix hand/stock methods introduced.
- Both preprocessed source views passed static delimiter/lexical checks for braces, brackets and parentheses (strings/comments excluded).
- Original selection and Submit/launch call sites retained; 14/14 static structural checks PASS.
- The tests above are NOT a C# compilation or Unity Player test.

**A20 host toolchain probe:** dotnet, csc, mcs, mono, msbuild, Unity and pwsh/powershell unavailable (each command -v exit 1). Managed compilation NOT_RUN; Unity 6000.4.0f1 Windows build NOT_RUN; physical/native Player NOT_RUN here. Previously accepted 361/361 managed, 13/13 codec and Windows G2 evidence applies to the OLD candidate, not automatically to the new diagnostic branch. Never rerun the old 361 without concrete need.

## 3. Safely build on Windows 11 — isolated project only

1. Install/use Unity Hub with Unity **6000.4.0f1** and Windows build support. Do NOT open/overwrite the current production/old Stage2 project.
2. In PowerShell with Git installed, clone into an entirely NEW downloads folder:

       git clone --single-branch --branch diag/cc001-r17-w7-a20-phoenix-hand-trace https://github.com/C8LyNn/aplikacja-turnieje.git "$env:USERPROFILE\Downloads\CC001_W7_DIAG"
       git -C "$env:USERPROFILE\Downloads\CC001_W7_DIAG" rev-parse HEAD

   Compare HEAD to the exact final Git SHA recorded in the #95 W7 HANDOFF. If wrong, STOP. Do not overwrite an existing directory. Do not run reset/clean/force-push.
3. In Unity Hub use Add Project and select:
   Downloads\CC001_W7_DIAG\unity\cc001-r16\CoreClash-V149-Unity.
   Open with Unity **6000.4.0f1**, let package imports/scripts compile.
4. In **this disposable clone only**, navigate Edit > Project Settings > Player > Other Settings > Scripting Define Symbols, Standalone (Windows) target. **ADD CC001_PHOENIX_DIAGNOSTIC** without deleting existing symbols. Apply and WAIT until scripts recompile. This locally changes ProjectSettings but do not commit/push these editor-generated files.
5. Unity menu **Core Clash > Build Windows**. This project already implements CoreClash.Editor.BuildTools.BuildWindows (runs SetupAndSmoke and StandaloneWindows64 build); no other source edits needed. Verify success, 0 errors, Editor build log and Evidence/R16/Unity/build-StandaloneWindows64.json. Local BuildTools can update scene/settings/evidence inside disposable folder; do not commit those.
6. Full fresh output:
   Builds\Windows\CoreClash.exe
   Builds\Windows\CoreClash_Data\Managed\Assembly-CSharp.dll
   plus all adjacent Windows Player files. **Do not reuse/replace W6 accepted binaries.** The old DLL reference SHA-256 909D71C3C2641657B887C496CBC7CDBB817070BCA22250F758F334C0811B4698 belongs to W6; new diagnostic DLL MUST be hashed separately and should not be treated as the old binary.
7. Launch this exact new EXE. Default Unity Player log after this project's company/product settings:
   %USERPROFILE%\AppData\LocalLow\Core Clash\Core Clash V149 Class Demo\Player.log.
   Old Player.log may contain several matches; keep an unchanged backup. After a NEW local match starts, the log MUST contain CC001_PHOENIX_DIAGNOSTIC stage=MATCH_START. If absent, STOP: symbol not effective, wrong Player build, wrong log or no new match. The log may be held open while the Player runs; close the game normally before copying it.

**Handoff to A72 (#113):** Independently compile this isolated source in Unity 6000.4.0f1, record source SHA, Editor logs/error count, actual build exit if batch mode, new EXE/DLL SHA256, no modified gameplay paths, and prove new diagnostic symbol active only in one-off Player. No workflow/main/policy changes required or authorized here.

## 4. Simple manual player test — one organic Phoenix return

1. Start **offline/local** game with Player 1 deck Ogień · Popiół (fire_3): Phoenix special is slot 1, keyboard 1; Standard is 0.
2. Shoot the sole genuine stocked Phoenix (x1), let it organically die and return; wait for your Player 1 turn with stock **0** and UI label **HAND READY**. Save 01_BEFORE.png.
3. **Mouse-click Phoenix card**. Selected top bar must show Phoenix; save 02_MOUSE.png.
4. Press **0**, then **1**; selected card must change Standard -> Phoenix. Save 03_KEYBOARD.png. Log should contain stage=SELECT inputOrigin=KEYBOARD_1_OR_NUMPAD1 admitted=True with same run/match as this test.
5. Aim from the launcher and **RELEASE** to actually submit Phoenix; do not stop at an aim-preview state. Save 04_AFTER_LAUNCH.png once Phoenix is on board or on following turn. New log must include stage=BEFORE_SUBMIT, accepted=True stage=AFTER_SUBMIT with the **same trace number**, and actual newSpawnEvents=event...:ball...:typephoenix:owner0.
6. **Oracle:** before stock=0, one eligible Phoenix hand entry; after stock=0, exactly that hand entry removed; handCount decremented by exactly one (1 -> 0 if there was only one); new P1 Phoenix ball with id, HP and shield from new SPAWN. When Player 1 has a new turn, if no other hand entry is ready, card must show OUT OF STOCK and Standard fallback; save 05_CARD_AFTER.png.
7. Close game normally, then collect a copy of Player.log, original 4-5 PNGs, exact new EXE/DLL hashes, and Unity Editor build log. Package evidence ZIP and send to A20 and A60. Do not submit PowerShell screenshot as game evidence.

### Correctly capture the *game window*, not the desktop

Bring the running CoreClash window to the foreground and **visually verify it is active**. Press **Alt + Print Screen** (may require Fn on some keyboards), open Paint, press **Ctrl+V**, and save the PNG with the checkpoint name. Or press Windows + Shift + S, select **Window**, click **CoreClash**, then save PNG. Re-open EACH PNG immediately: it must show the game, not a PowerShell/browser window. A short Windows Game Bar video recording the mouse and key actions is a useful optional supplement.

### Required independent acceptance evidence

A60 should confirm run/match/trace correlation, local Submit accepted=True, BEFORE phoenixStock=0 with ready entry owner correct, AFTER phoenixStock=0 and exactly one matching entry removed, new SPAWN event/ball ID, proper screen capture of before/after, and evidence SHA for the fresh diagnostic EXE/DLL + logs/images. If any element is absent, classify it HOLD, not PASS. A keyboard SELECT log proves the game's actual Input.GetKeyDown call path; GUI mouse-up logs establish Unity IMGUI mouse-event path, supplemented by operator/video for hardware provenance. If multiple hand entries exist, compare entry identities, not just aggregate count.

## 5. End state / boundaries

DESIGNED YES / IMPLEMENTED YES (A20 branch only) / TESTED STATIC ONLY (14/14), C# and Unity actual NOT_RUN / INTEGRATED NO into Stage2/main / RELEASED NO.
A60 #139 WAIT_NEW_DIAGNOSTIC_BYTES until user sends a fresh full diagnostic Player ZIP; A70 #137 WAIT/NO INTEGRATION until separate formal HQ GO. Full G4, Android/WebGL/G3 and public release all remain HOLD/STOP.

**No changes to original Stage2, R16, V148, Protocol149, network serialization or gameplay.**
