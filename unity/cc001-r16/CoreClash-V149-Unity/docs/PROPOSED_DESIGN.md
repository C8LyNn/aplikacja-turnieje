# Core Clash V149 — proposed class-demo migration

Date: 2026-10-15. Architecture approved; implementation authorized. All featured selections remain PROVISIONAL pending separate user curation/approval.

Historical design record: later user scope corrections below override the original parity language. The current implemented architecture and readiness are in `../UNITY_PORT_ARCHITECTURE.md` and `../MIGRATION_STATUS.md`; the latest exact provisional presets are approved for this class demo.

## Latest binding scope correction

V148 is a gameplay reference, mechanic catalog, deck/ball design source and proof of the core loop. It is NOT an executable parity specification. V149 Unity is a better native implementation of the concept. Preserve turn-based PvP, physical launches, bases/HP/win conditions, deck construction with nine-ball decks, identities, archetype concepts and selected ability intent/setup-payoff interactions. Physics, collision/STOP detection, timing, event and ability internals, UI/VFX/input/mobile/networking and technically necessary numerical tuning may be redesigned. Do not recreate HTML quirks.

Current priority: playable core; launches/collisions/turns/bases; data; four latest additional CLASS DEMO decks; their abilities; Windows; WebGL; touch; multiplayer prototype; remaining roster afterward. Full roster may initially be data-only. Runtime ability categories: UNITY_READY, PARTIAL, DATA_ONLY, NOT_PORTED.

The latest four user presets are DEATH ENGINE, STATUS REACTOR, GRAVITY TRAP and REALITY HACKERS, stored in Assets/Resources/Data/featured-decks.json. They supersede every earlier proposed list below. Preserve all 36 canonical decks and the normal builder. Source combo observations and staged three-turn rehearsals are in docs/SOURCE_FEATURED_REVIEW.md.

## Approved user amendment

V149 is the gameplay/spec version. V149 HTML LEGACY / PRESENTATION and V149 UNITY are separate implementations. The legacy HTML may remain locally playable or be hosted independently; HTML-to-Unity network compatibility is outside this migration. Unity is the canonical migration target: one C# codebase for Windows, native mobile/Android and website-hosted WebGL. Future shared sessions apply only to Unity clients.

The multiplayer prototype is host-authoritative. Clients send intent; the host alone resolves gameplay and physics; clients receive resulting state/events. Do not run independent deterministic physics on clients as a cross-play assumption. First network milestone may use a native Windows host and WebGL/mobile clients. Preferred path: NGO + Unity Transport + Multiplayer Services / Relay / Sessions. Android configuration is prepared even when the SDK/module is unavailable; it must not block Windows/WebGL. No non-featured roster record is deleted or disabled. All definitions remain selectable with explicit NOT_YET_PORTED ability warnings where needed.

Featured decks are fully data-driven and replaceable without gameplay-code edits. Provisional selections never block the migration. The user will provide or approve the final four decks separately. Implementation proceeds now without an additional planning approval checkpoint, as explicitly directed.

## Outcome and constraints

Create a small, playable Unity/C# local two-player vertical slice, then attempt Windows and WebGL builds within the approximately four-hour implementation timebox. Preserve the certified V148 HTML unchanged. Do not rebalance or claim full roster parity. Keep all roster records and all 36 canonical deck presets importable and visible. Add four featured nine-ball presets; these are demonstration selections, not replacements for canonical decks.

Source: `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`.
Verified size: 1,465,149 bytes.
Verified SHA-256: `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.

## Approach and alternatives

Recommended: a pure C# simulation with explicit fixed steps, using source pixel coordinates and source equations, hosted by Unity views and input. This makes offline play and headless rule tests possible and leaves a clean future authority boundary for networking.

Alternative: use Rigidbody2D for all motion. Faster initial setup, but different integration/contact behavior makes fidelity harder and introduces engine-specific state into networking.

Alternative: embed the HTML in a Unity WebView. Fastest visual result but does not fulfill a C# gameplay migration; rejected.

Use installed Unity 6000.4.0f1, which has Windows Standalone and WebGL modules. Android is optional and no Android module has been identified. Create a new project directory here; this Desktop folder is not a functioning Git repository. Initialize the project repository on `exp/cc-v149-class-demo-unity-port` when implementation starts.

## Data and source authority

Extract the complete runtime roster, normalized statistics, canonical ability declarations, archetype mappings and canonical decks. The initial TYPES literal has 227 records: Standard, 224 specials, and two hidden generated tokens. V148's 20 new content definitions are only a subset, so importing that table alone would drop most of the roster.

Do not use raw literal HP or radius as final values: the source applies a global +5 HP pass, normalizes size/mass, applies archetype effects and updates ability contracts. Runtime extraction and focused source inspection must establish the effective values. Preserve both original metadata and effective imported values with provenance.

BallDefinition, AbilityDefinition, DeckDefinition and ArchetypeDefinition are serializable data. Runtime balls contain IDs, owner, position, velocity, HP, shield, status durations, per-event counters and consumed limits. Abilities are resolved through event handlers; no MonoBehaviour class per ball.

Unimplemented abilities are labeled `NOT_YET_PORTED` in data and UI. Non-featured roster entries remain browsable; unsupported abilities must never silently become implemented equivalents. Featured presets may be labeled partial if a required handler remains incomplete.

## Simulation and presentation boundaries

`Core/`: GameState, MatchRules, TurnSystem, BallRuntime, AbilityResolver and events.
`Data/`: definitions, roster/deck catalog and validation.
`Physics/`: BallPhysics, CollisionResolver, ZoneResolver and temporary geometry.
`Presentation/`: BoardView, BallView and UI; visual interpolation never changes rules.
`Input/`: desktop and touch adapters produce the same validated launch/replay command.
`Networking/`: NetworkGameSession and NetworkGameStateAdapter exchange commands and authoritative snapshots; offline sessions use the same simulation.

Simulation responsibilities: owners, turns, one-use special stock plus unlimited Standard, launch/aim, replay eligibility, motion, contact episodes, strong-hit threshold, STOP hysteresis, damage, death/removal, zones, base pressure, center pressure, base-zero outcome and turn-limit tie-break. Implement the current standard rules, not every legacy rules toggle or historical map variant. Any omitted current rule must appear in MIGRATION_STATUS.

Confirmed source anchors: map 540 x 900; classic field left=24.3, right=515.7, top=16, bottom=884; zones at 22%/78% height; range SHORT=100, MEDIUM=165, LONG=230; HIT uses closing relative normal speed >=90; STOP speed 14 with 0.12-second hold, START speed 18; launch power min(590, drag distance*3.38). The current standard rule table and a live browser check both confirm 20 base HP and 50 turns despite a historical audit object mentioning 30 HP. Preserve the second player's first-turn extra spawn, sequential replay opportunities, and the source turn-end pressure order.

Presentation: readable vertical arena, separate player HP/turn/stock indicators, deck selector, ball details with actual port status, aim line and match result/restart. Scale UI independently of resolution. Portrait and landscape fit the same board; touch and mouse share press/drag/release with no hover requirement. Input must reject launches during resolution, after match end, with invalid owner, unavailable stock or invalid numbers.

## Proposed featured presets

These are provisional until focused current-runtime checks confirm their handlers. Exclude the source's explicit redesign-pending list: scorch, cryolance, snowball, breaker, mitosis. Also prefer Rimeburst over Shatterer: the current Shatterer description flags unresolved legacy contact behavior. Selection prioritizes distinct mechanics, inspectable implementations and contrast, not strength or win rate. Effective spawn stats and ability contracts have been inspected for the initial 36 candidates, but their individual outcomes have not yet been tested.

### Elemental Crossfire

Identity: combine harmful status, status payoff, a persistent zone and support counterplay.

| Ball | Selection reason | Main risk |
|---|---|---|
| Fire (`fire`) | Burn and stack lifecycle | Current initial event is TOUCH; dynamic upgrades can change it |
| Frost (`ice`) | Ice stacks and full freeze | Freeze duration and thaw sequencing |
| Plague (`plague`) | Owner-turn toxin ticks | Correct target-owner timing |
| Rimeburst (`rimeburst`) | Frozen-target payoff and nearby ice propagation | Consume-freeze ordering and per-target/turn limit |
| Pyre Core (`pyrecore`) | Persistent fire zone | Contact episodes and zone lifetime |
| Medic (`medic`) | Area healing on STOP | No overheal or HP rounding changes |
| Shield (`shield`) | Ally-contact shield | Source/target role and per-action limits |
| Cleanser (`cleanser`) | Visible status counterplay | Exact transferable/cleansable status set |
| Ward (`ward`) | STOP cleanse plus shield | Multi-target event ordering |

### Momentum & Misdirection

Identity: bank shots, momentum transfer, phasing and a small pair of contrasting force tools.

| Ball | Selection reason | Main risk |
|---|---|---|
| Bouncer (`bounce`) | Distinct wall restitution | Clamp and rebound amplification fidelity |
| Dart (`dart`) | Fast movement and strong-hit payoff | Speed condition and first-hit gate |
| Slingshot (`slingshot`) | Gathers and launches allies on STOP | Exact impulse, range and target ordering |
| Duelist (`duelist`) | Exchanges velocity vectors | Collision versus effect ordering |
| Warp (`warp`) | Opposite-wall teleport | Teleport contact guard |
| Phase (`phase`) | Bypasses collisions during its move | Phase expiry and STOP |
| Magnet (`magnet`) | One clear PULL representative | Earth resistance and source range |
| Pulse (`pulse`) | One clear PUSH representative | Symmetric impulse and anchored targets |
| Anchor (`anchor`) | Counters displacement | Progressive archetype anchor stacks |

### Siege Workshop

Identity: construct an arena, repair it, exploit banks and punish approaches with traps/explosions.

| Ball | Selection reason | Main risk |
|---|---|---|
| Wallmaker (`wallmaker`) | Basic physical construction | Exact placement and protected launch area |
| Engineer (`engineer`) | Structure interaction distinct from walls | Current implementation geometry |
| Repair Pulse (`repairpulse`) | Owner-turn structure repair, shield fallback | Structure HP units |
| Pinballer (`pinballer`) | Bumper geometry and ricochets | Repeated contact suppression |
| Mine (`mine`) | Armed persistent trap | No detonation on deployment contact |
| Bomb (`bomb`) | STOP/DEATH area explosion | Exactly one explosion and removal |
| Spikes (`spike`) | Wall-triggered hazard | Natural wall versus generated geometry |
| Barricade (`barricade`) | Directional defensive arc | Placement and overlap validation |
| Bastion (`bastion`) | Ongoing defensive support | Own-turn target selection |

### Living Reinforcements

Identity: generate units, strengthen Standards and demonstrate death/return with explicit limits.

| Ball | Selection reason | Main risk |
|---|---|---|
| Brood Core (`brood`) | HP-for-token economy | Spawn count and self-death ordering |
| Egg Sac (`eggsac`) | Death spawns a surrounding brood | Spawn placement and lineage |
| Splitter (`splitter`) | Splits into two halves on STOP | Generated token statistics and one-use limit |
| Commander (`commander`) | Persistent Standard support | Shield cap and own-turn scope |
| Armorer (`armorer`) | Local STOP support | Standard eligibility and cap |
| Quartermaster (`quartermaster`) | Periodic Standard production | Every-second-own-turn timing |
| Veteran (`veteran`) | Contact upgrade to a Standard | Once-per-action and stat inheritance |
| Resurrector (`resurrector`) | Graveyard and one-use return | Eligible deaths, lineage and one-life limit |
| Cascade (`cascade`) | Bounded repeat death/return | Life identity and no infinite return loop |

Archetype-wide passives used by these balls count as required mechanics. If they cannot be completed, document the resulting deck as partial instead of declaring its balls complete based only on their primary ability.

## Builds and networking

Create reproducible editor entry points for setup, source/data validation, simulation smoke tests, Windows build and WebGL build. Keep logs and evidence. Windows and WebGL are verified separately: successful compilation is not evidence a player launched, and a successful build is not evidence a browser rendered it.

Prepare a server-authoritative command/snapshot boundary for Netcode for GameObjects + Unity Transport, with Multiplayer Services/Relay as the intended external session path. WebGL must use supported secure WebSocket/Relay transport, not raw TCP/UDP. Networking packages or a working Relay session are optional after local play; no connected multiplayer claim without a two-client test. Do not provision paid external services or publish externally during this local migration.

## Verification and reporting

Source: hash before and after; roster/deck counts and references; effective stats versus runtime; run available source self-tests and record their limits.

Core tests: stock/owner validation, launch, replay, contact episode versus HIT, STOP once per episode, zone boundaries, status owner-turn timing, shield/HP/death ordering, simultaneous base zero, 50-turn tie-break, token generation and invalid/network command rejection. Add focused featured-handler checks and a multi-turn seeded local smoke match. These are behavioral tests, not assertions that mirror implementation.

Unity checks: compile in the actual editor, enter/execute a local scene smoke check, build Windows and WebGL, launch the Windows player and serve the WebGL player for a browser smoke check where the environment permits. Verify mouse and simulated touch input/layout; distinguish that from physical-device testing.

Maintain MIGRATION_STATUS.md, UNITY_PORT_ARCHITECTURE.md, FEATURED_DECK_PORT_STATUS.md, BUILD_STATUS.md and NETWORKING_STATUS.md. Reports use DONE/PARTIAL/BLOCKED/NOT STARTED; system fidelity uses PORTED_AND_TESTED/PORTED_NOT_TESTED/PARTIAL/NOT_YET_PORTED/UNKNOWN_SOURCE_BEHAVIOR. State what each test actually covers. Deliver the project, available builds, exact launch instructions and a short honest summary of remaining gaps.

## Timebox priority

First establish editor compilation and imported roster; then a complete basic local turn loop; then featured handlers ordered by reliability; then Windows/WebGL and touch checks; then networking if time remains. Reserve time for verification and truthful reports. If environment setup blocks a target, continue the independent gameplay and other target work.
