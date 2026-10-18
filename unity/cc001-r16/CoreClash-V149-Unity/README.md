<!-- R16 CURRENT -->
# Aktualny stan: R16 / 18.10.2026

Źródła R15 zostały rzeczywiście sprawdzone i rozwinięte. 269 testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. StandaloneWindows64: Succeeded; WebGL: Succeeded; Android: Succeeded.

Czytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.

**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**
<!-- R16 END -->

# Core Clash V149 — Unity class demo

A native C# vertical slice of Core Clash: turn-based physical launches, collisions, replay, nine-ball decks, bases, status/lifecycle interactions and four provisional mixed-archetype showcase decks. V148 is the design reference; Unity intentionally uses its own coherent physics and event implementation.

## Play

- **Windows:** run `Builds/Windows/CoreClash.exe`. Keep the whole Windows folder together, including `WebRoot` for browser invitations.
- **WebGL:** from this folder run `powershell -ExecutionPolicy Bypass -File Tools/start-webgl.ps1`, then open **http://127.0.0.1:8080/**. Node.js is required for this helper. The WebGL folder can also be served by an ordinary static website with `.wasm` served as `application/wasm`. Opening `index.html` as a local file does not work for Unity WebGL.
- **HTML legacy:** open `Legacy/core_clash_v149_legacy_presentation.html` directly for the separate offline V148-based presentation. It does not participate in Unity multiplayer.
- **Android:** source-built ARM64 APK is `Builds/Android/CoreClash.apk`. Compilation/package verification is separate from physical-device validation, which remains outstanding.
- **Unity Editor:** open this folder with Unity **6000.4.0f1**, then `Assets/Scenes/CoreClash.unity`, and press Play. Windows, WebGL and Android build modules are installed on the development machine.

Choose two decks and start a local match. Select a ball, then drag from the glowing launcher toward the target and release. Longer drag means more power. Standard has unlimited stock. A white dot marks a friendly home-zone ball eligible for Replay before the turn's final spawn. Player 2 gets one extra spawn on their first turn. Enemy-zone occupation, center control and opposing-wall impacts threaten bases. Destroy the other base, or lead the 50-turn tie-break. Escape returns to setup; BALL DETAILS explains a selected identity.

The default screen features four **CLASS DEMO** showcase cards: DEATH ENGINE, STATUS REACTOR, GRAVITY TRAP and REALITY HACKERS. Each has nine orb previews and independent P1/P2 selection. **ALL DECKS / DECK BUILDER** preserves all **224 specials** and **36 canonical presets**. The four selections are provisional presentation choices, not competitive balance certifications. Read [the showcase guide](FEATURED_DECK_PORT_STATUS.md) before presenting the combinations; its three-turn examples use staged setup and are not guaranteed from an empty board.

## Play together: Internet or LAN

1. On Windows, choose both decks, then **MULTIPLAYER → CREATE GAME → INTERNET → CREATE GAME**. Share the game code. Player 2 chooses **JOIN GAME → INTERNET** and enters it. The Windows host must remain running.
2. On the same Wi-Fi, select **SAME WI-FI / LAN** on both devices. Native clients choose **JOIN** beside the discovered room. Browser clients open the host's **COPY LAN JOIN LINK** invitation.
3. Internet browser invitations use `joinCode`. Put the actual HTTPS WebGL address in `Assets/Resources/Data/network-settings.json` to enable the host's Internet link; until a website is configured, share the code with players who have opened a served build.

IP and port fields are only under **ADVANCED → DIRECT LAN CONNECTION**. LAN needs reachable peers on the same network. Internet uses Unity MPS Sessions / Relay with secure WebSockets. Windows↔WebGL has real service/authority verification on one PC; separate physical devices, Android runtime and Safari remain untested. See [network scope](NETWORKING_STATUS.md) and [Cloud setup](docs/R6_UNITY_CLOUD_SETUP_PL.md). QR generation is not included.

## Change featured decks

Edit `Assets/Resources/Data/featured-decks.json`: each entry needs an ID, name, description, `provisional: true`, and **nine distinct existing special IDs**. Gameplay code does not contain these selections. Rebuild to embed changes in Windows/Android/WebGL. A native installation also accepts a `featured-decks.json` override in Unity's `Application.persistentDataPath` (Windows: `%USERPROFILE%/AppData/LocalLow/Core Clash/Core Clash V149 Class Demo/`), loaded at startup. Invalid files produce a visible load error; remove/fix the override to recover. WebGL uses the embedded resource. Canonical decks and the catalog need no edits.

## What is implemented

**R9 explosive triggers:** Mine arms on STOP and detonates on a later enemy touch; Frost can disarm it. Time Bomb shows a two-own-turn fuse that resets at each STOP. Bomb explodes once on STOP or premature death, and its living death payload can be repeated by Agony/Requiem. All three blasts can hit allies. Armed Mine contact resolves before type/ownership mutations, independently of ball order. See [R9 evidence and limits](docs/R9_REPORT_PL.md). All imported statistics and decks are preserved.

**R8 closer to the HTML mechanics:** Pinballer places persistent five-HP bumpers, Slingshot gathers and launches nearby eligible allies, and Ram adds a strong-contact impact/recoil. Bumpers have visible charge labels and event feedback. Three probes exercise the actual unchanged V148 runtime; the native implementation respects safe placement, immobilization and authoritative physics. Ram remains PARTIAL because its advertised structure bonus is disabled in the reference. See [R8 scope and evidence](docs/R8_REPORT_PL.md). No roster statistics, canonical decks or featured presets changed.

**R6 devices and crossplay:** one unchanged C# game/physics core, logical safe-area UI, desktop/phone/tablet profiles, a responsive WebGL shell, stable primary touch and canceled interrupted gestures. Phone portrait has a horizontal special-ball tray; tablets and desktop use larger arenas and scrollable grids. PC supports 1–9 for specials, 0 for Standard and I for board inspection. The browser View control changes presentation only. Full screen has a visible Exit action. Unity Cloud Project ID is configured; actual Windows host / WebGL client sessions passed through Relay. [R6 report](docs/R6_PRESENTATION_AND_CROSSPLAY.md) records limits and evidence.

**R5 continuation:** narrow library rows give the full deck name, all nine previews and P1/P2 actions separate space; the builder measures wrapped guidance before placing search and roster. Joining stays visible and can be canceled. Failed connections and lost hosts return clients to Join Game after transport cleanup, with a plain-language reason and a normal retry path. Closing the lobby allows local play. See [R5 scope and verification](docs/R5_CONTINUATION.md).

**R4 archive review:** the legacy HTML gains Quick Play shortcuts. Unity gains unique short ball marks, non-hue P1/P2 labels, simultaneous state tokens and live instance details. Right-click a ball, or choose **INSPECT BOARD** and tap it, including during the other player's turn. Disconnected P2 now releases its LAN seat; another client can join the same match. This is open LAN seat replacement, without authenticated identity recovery. See [archive decisions and verification](docs/POST_V148_ARCHIVE_REVIEW.md).

The gameplay view uses a portrait arena, team HP bars, a visual 3×3 special-ball tray and separate unlimited Standard. Drag feedback shows direction and power; new shots stay blocked while physics resolves. Ball Details contains player-facing descriptions. **F1** opens the developer overlay with implementation/reference metadata; it is off by default. The Windows and WebGL players are release builds without the Development Build watermark.

**R3 presentation:** the dotted aiming guide now includes the first wall reflection and a bounce marker, using the selected or replayed ball's radius. It is a geometric guide; contacts, fields and abilities can change the actual route. Real damage, healing, shields, returns and other supported events produce brief rings, particles and readable floating labels. Effects fade on presentation time even after a match ends. Phone aim text, landscape HP labels and narrow library/builder/details layouts are improved.

`UNITY_READY` means the native primary handler has targeted verification; `PARTIAL` means a documented limitation remains; `DATA_ONLY` means the identity and metadata exist but its primary ability is not implemented; `NOT_PORTED` is reserved for absent implementations/definitions. Every ball can physically launch. Default player details honestly state when a special power is unavailable, while technical readiness is kept in F1. This is a playable migration foundation, not a completed 224-ability game.

Read [migration status](MIGRATION_STATUS.md), [architecture](UNITY_PORT_ARCHITECTURE.md), [build evidence](BUILD_STATUS.md) and [network scope](NETWORKING_STATUS.md). Machine-readable evidence is in `Evidence/`; original V148 runtime observations are separately documented in `docs/SOURCE_FEATURED_REVIEW.md`.

## Development

```powershell
dotnet run --project Tests/CoreClash.Tests.csproj -- .
node Tools/verify-data.cjs
powershell -ExecutionPolicy Bypass -File Tools/build.ps1 -Target Windows
powershell -ExecutionPolicy Bypass -File Tools/build.ps1 -Target WebGL
```

Only one Unity editor/build may use the project at a time. WebGL builds automatically refresh Windows/WebRoot. Android uses the installed SDK/NDK, ARM64 and IL2CPP; current APK/build and device-test status are in [BUILD_STATUS.md](BUILD_STATUS.md). [Network status](NETWORKING_STATUS.md) covers LAN and Relay. Earlier R2–R8 reports remain historical; current delivery evidence is listed in [the R9 report](docs/R9_REPORT_PL.md) and manifest. The user supplied a Replit website address; its separate read-only audit found an older public build and invitation-routing issues. R9 is a local delivery and has not been synchronized or published there. The [publication guide](docs/R7_WEB_PUBLICATION_PL.md) remains background material.

The certified source in Downloads is unchanged. Branch: `exp/cc-v149-class-demo-unity-port`. Unity Cloud is linked and real Relay service traffic is verified on one PC. Public website deployment and physical-device acceptance remain outstanding.
