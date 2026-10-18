# Core Clash V149 implementation plan

> For agentic workers: use superpowers:executing-plans, inline execution, authorized by the user on 2026-10-15.

Goal: create a truthful, playable Unity class-demo migration with full roster data, replaceable provisional featured decks, Windows/WebGL builds and an authority boundary for future Unity cross-play.

Architecture: pure C# simulation in source pixel coordinates, explicit physics steps and event handlers; Unity views/input adapt commands to an offline authoritative session. Network clients consume snapshots rather than independently resolving physics.

Tech stack: Unity 6000.4.0f1, C#, JSON data, dependency-free .NET behavioral test runner, Node/Playwright source extraction and browser smoke checks.

Spec: docs/PROPOSED_DESIGN.md, including its approved user amendment.

Delivery update: the latest binding scope is native gameplay intent, not source parity. Completed implementation/evidence and explicit remaining gaps are in `../MIGRATION_STATUS.md`. The checklist below records the original work breakdown rather than a separate unexecuted future plan. All abilities use UNITY_READY / PARTIAL / DATA_ONLY / NOT_PORTED; old NOT_YET_PORTED wording is superseded.

## Global constraints

- Certified V148 source is read-only; verify its supplied SHA-256 throughout.
- Preserve all 227 runtime records, 224 special IDs, 12 archetypes and 36 canonical decks.
- No rebalancing, no implicit replacement of unsupported abilities, no full-parity claim.
- Four featured decks remain PROVISIONAL and independently replaceable JSON data.
- Local simulation remains independent of networking. Native host is authoritative; WebGL/mobile are future clients.
- No HTML/Unity cross-networking or independent deterministic client physics assumption.
- Keep current standard 20-HP, 50-turn rules; document any current-rule omission.

## Review focus

- Invalid commands (NaN, infinity, stale turn/sequence, wrong owner, missing stock) never mutate state.
- Effect/death/spawn chains terminate, and continuous contacts do not repeat primary effects each physics frame.
- Replay plus second-player bonus consumes the right action without skipping end-of-turn pressure.
- Resizing/portrait/touch cancellation cannot accidentally launch or trap the match UI.
- Snapshot application preserves ownership, turn/stock/result and dynamic entity identity without client simulation.

## Tasks

### 1. Source-backed catalog and project bootstrap

Files: Tools/extract-v148.cjs, Tools/verify-data.cjs, Assets/Resources/Data/*.json, Assets/CoreClash/Data/*.cs, Packages/manifest.json, ProjectSettings/ProjectVersion.txt, Tests/CoreClash.Tests.csproj.

Interfaces: Catalog loads BallDefinition, AbilityDefinition, DeckDefinition and ArchetypeDefinition; validates IDs and nine unique slots. Effective stats and ability contracts come from the running source plus raw metadata provenance. Featured decks load from a separate JSON file.

- [ ] Write and run failing data checks: missing import/catalog, 227/224/12/36 expected counts, all deck references valid, certified hash unchanged.
- [ ] Extract runtime values and metadata without modifying the source, implement serializable catalog and provisional deck data.
- [ ] Run catalog checks and compile the minimal actual Unity project; capture logs. Commit.

### 2. Playable authoritative local rules and physics

Files: Core/GameState.cs, BallRuntime.cs, MatchRules.cs, TurnSystem.cs, GameSimulation.cs; Physics/BallPhysics.cs, CollisionResolver.cs, ZoneResolver.cs; Networking/NetworkGameSession.cs, NetworkGameStateAdapter.cs; Tests/Program.cs.

Interfaces: GameSimulation.TryCommand(PlayerCommand, out reason), Step(float), Spawn(...); authoritative GameState with players, balls, geometry/zones, stocks, phase and result. NetworkGameSession validates intent/sequence and exposes snapshots; offline uses the same path.

- [ ] Write failing behavioral checks for commands, stock, replay/bonus, launch, normal collision/HP, STOP hysteresis, base/center pressure, simultaneous zero and turn-limit tie-break.
- [ ] Implement source-backed core and physics; explicitly record approximation boundaries.
- [ ] Run the .NET suite and actual Unity compile. Complete a seeded multi-turn local simulation. Commit.

### 3. Provisional demonstration ability handlers

Files: Core/AbilityResolver.cs and focused handlers for status/support, movement/force, construction/traps, spawn/death/return; Data/AbilitySupport.cs; Tests/AbilityTests.cs.

Interfaces: shared resolver methods OnContact, OnWall, OnStop, OnTurnStart, OnTurnEnd, OnDeath; per-ball runtime state separate from definitions. Unimplemented handlers return explicit NOT_YET_PORTED status. Full roster remains selectable.

- [ ] Add failing outcome tests before each migrated mechanic family, using source evidence for constants and ordering.
- [ ] Implement handlers and archetype passives required by provisional demo candidates as time permits, preserving values and documenting deviations.
- [ ] Run suite, bounded chain and seeded match checks. Update support matrix and commit.

### 4. Unity scene, mouse/touch UI and native/web configurations

Files: Presentation/BoardView.cs, BallView.cs, UI/*.cs; Input/DesktopInput.cs, TouchInput.cs; Editor/BuildTools.cs; Assets/Scenes/CoreClash.unity; WebGLTemplates/CoreClash/*; Tools/build.ps1 and serve-web.cjs.

Interfaces: single input router emits PlayerCommand; board maps pixels into fit-to-screen coordinates. Deck/roster UI shows exact definitions and port warnings; canonical and provisional presets remain accessible. Scene opens into local setup and match.

- [ ] Run failing scene/build validation and input-coordinate/cancel tests.
- [ ] Implement Unity presentation/input, save a runnable scene and build entry points for Windows/WebGL/Android. Avoid Android SDK setup blocking other targets.
- [ ] Compile and run actual Unity scene smoke checks; build and launch Windows, build and serve WebGL; inspect desktop/portrait/landscape and simulated touch. Commit with evidence.

### 5. Networking preparation, review and honest delivery

Files: Networking/*.cs, optional NGO adapter/package configuration, all five requested status reports and README.md.

Interfaces: native authoritative session accepts intent and produces versioned state/events. Snapshot client never calls physics; transport DTOs exclude views. Document Relay/WSS/Sessions integration and unavailable service setup.

- [ ] Add failing stale/duplicate command and snapshot-roundtrip tests, implement boundaries and run suite.
- [ ] Integrate NGO/Unity Transport only after local play/build milestones, if time permits; never claim two-client functionality without testing it.
- [ ] Review the complete implementation, repair important findings with regression tests, verify source hash and final actual build/test outputs.
- [ ] Deliver MIGRATION_STATUS.md, UNITY_PORT_ARCHITECTURE.md, FEATURED_DECK_PORT_STATUS.md, BUILD_STATUS.md, NETWORKING_STATUS.md and launch instructions. Distinguish DONE/PARTIAL/NOT TESTED/NOT YET PORTED, plus BLOCKED/NOT STARTED where applicable.
