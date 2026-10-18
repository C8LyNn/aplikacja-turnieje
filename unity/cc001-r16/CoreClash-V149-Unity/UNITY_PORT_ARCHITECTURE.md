# V149 Unity architecture

V149 is the gameplay/spec version with two independent implementations: HTML LEGACY / PRESENTATION and canonical UNITY. The HTML is a playable reference and mechanic catalog. Unity preserves the concept and ability meaning; it does not promise JavaScript physics, timings, event quirks or frame parity.

## Boundaries

| Layer | Responsibility |
| --- | --- |
| `Data/` | Serializable ball/ability/archetype/deck definitions, catalog validation and effective ability support |
| `Core/` | Match state, command validation, stocks, turns, replay/bonus, base rules, lifecycle/status/spatial/reality ability handlers and semantic events |
| `Physics/` | Explicit circle integration and contacts, walls, temporary structures, friction, launch protection and STOP hysteresis |
| `Input/` | Mouse/touch adapters and pointer-owned launch gesture; cancel never submits an intent |
| `Presentation/` | Featured showcase, secondary library/builder, responsive arena/HUD/3×3 tray, orb/aim feedback, player details and F1-only metadata |
| `Networking/` | Owner-bound sequence validation, snapshots, NGO/UTP WebSockets, plus separate LAN invitation/discovery and read-only WebRoot helpers |
| `Editor/` | Repeatable scene generation, editor smoke and platform builds |

The authoritative `GameSimulation` is pure C# and independent of Unity APIs. Local two-player play calls the same command validation as a network host. This makes rule tests fast and leaves the simulation reusable on native hosts/dedicated servers. It uses an explicit fixed step at 120 Hz. This is a deliberate native implementation choice; it is not a cross-platform deterministic synchronization guarantee. Physics/continuous fields freeze during aiming. Only an accepted action starts resolution. STOP uses separate movement thresholds and a hold; bounded effect depth, generated-entity limits and a final 14-second motion guard prevent unbounded resolution.

## Authority and transport

Client input → connection-bound `NetworkGameSession.Submit` → host simulation/physics → state/events → bounded compressed snapshots → client adapter → Unity presentation. A network client never calls `Simulation.Step`. The host assigns P1, first remote connection P2, and chooses both decks. NGO's in-scene `NetworkObject` carries intent/result/snapshot RPCs; snapshots use ordered revisions, GZip size limits and small reliable chunks. Definitions remain shared data; dynamic state carries identities, owners, HP, statuses, zones, stock, turns and events.

The transport uses NGO 2.13.3 + Unity Transport 2.6.0 with direct LAN WebSockets or MPS 2.2.4 Sessions/Relay WSS. `NgoInternetSession` initializes anonymous Authentication, owns Cloud membership and installs a custom SDK network handler so authority is prepared before exactly one NGO start. Cancellation invalidates stale callbacks and holds the transport gate until cleanup. Actual Windows↔WebGL Relay state/intent traffic is tested on one PC. Reserved-player recovery, interpolation, public HTTPS deployment and physical mobile sessions remain separate work. HTML/JavaScript is outside this network protocol.

R2 adds invitation UX above that unchanged boundary: Windows UDP advertisements carry only bounded display/protocol/port/count metadata; discovery uses the actual sender address and expires rooms. WebGL joins from URL parameters. A native read-only HTTP helper serves only the packaged WebRoot. Neither discovery nor HTTP accepts gameplay commands or grants authority. Manual endpoint entry is confined to Advanced.

## Data and extension

R6 presentation uses one logical safe-area viewport for every view and the lobby. Raw screen pointers are inversely transformed before world-space launch intent is built; `ArenaRect` remains raw screen pixels for external fixtures. Device profiles change layout and input only. WebGL uses CSS-sized buffers and a responsive shell; explicit toolbar/focus/fullscreen events cancel pending input. Phone portrait uses a horizontal tray, while short surfaces can scroll and landscape phones use a side panel. Stable primary-finger tracking prevents reordered/extra touches from releasing another finger's shot.

R5 exposes session recovery separately from gameplay state: failed startup or a
client losing its host schedules SDK shutdown, then the lobby restores setup
after `!IsListening && !ShutdownInProgress`. A new join resets command sequencing,
snapshot assembly and client history. Intentional disconnect suppresses failure
recovery. No automatic rejoin loop or client-side simulation is introduced.

`catalog.json` preserves 227 runtime records (Standard, 224 specials, two hidden generated tokens), 12 archetypes and 36 canonical decks, source ability declarations/raw metadata and imported stats. `featured-decks.json` is an additive replaceable resource; native builds can load a user-file override at startup. No primary handler decides whether a ball is featured. The normal builder allows all visible specials, including data-only abilities.

`presentation-copy.json` supplies optional deck identity/accent and player-facing ball descriptions by existing ID. It does not modify deck membership, stats or handlers. `CoreClashApp` coordinates separate setup, match and details views; `MatchLayout` and `BallSelection` remain independently testable. The app renders the LAN panel last in the same OnGUI pass so separate-component GUI sorting cannot cover its entry or modal.

R3 adds two pure presentation helpers. `AimGuide` computes a bounded geometric first-wall reflection, without simulating gameplay or modifying physics. `FeedbackTimeline` observes accepted semantic events once, suppresses initial network history, retains at most 24 recent effects and expires them by presentation time. The renderer limits visible bursts and avoids overlapping labels. Neither helper emits gameplay events, changes numerical rules, or grants network authority.

Runtime instances contain their own state; definitions are not mutated by gameplay. Effective ability readiness comes from `AbilitySupport` and is applied to `AbilityDefinition.portStatus` when the catalog loads. Imported raw contracts remain reference metadata. Add missing handlers incrementally through the existing event methods and behavioral tests; expand status readiness only after verifying the claimed behavior. Broad copy/echo/random identities stay PARTIAL while they can reach unimplemented catalog entries.

## Intentional native differences

- Stable normal restitution removes legacy global energy multipliers; source-specific integration/contact order is not reproduced.
- Planning freezes physical state; only the host resolves an action, at a bounded fixed step.
- Ward cleans all modeled negative statuses. Plagueleech can bind/infect a clean enemy. Penitent's transfer does not immediately reinfect the relieved ally through the legacy contagion bug.
- Placement rejects no-build launcher regions, boundaries, existing bodies and structures; generated chains are bounded.
- Numerics are starting values imported from V148, not a balance certification. Technical corrections are documented; no deck was curated around win rate.

The procedural UI/VFX are prototype presentation. The codebase, data and repeatable evidence are the handoff foundation; production art, accessibility, platform certification and complete ability coverage are future work.

## Delivery classification

- DONE: separated C# authority, data/physics/presentation/input, tested local core and Windows/WebGL network boundary.
- PARTIAL: roster-wide primary handlers, some archetype passives, production networking and presentation.
- NOT TESTED: physical Android execution and networking; the SDK/NDK toolchain is now installed and current build status is recorded in BUILD_STATUS.md.
- DONE within single-PC test scope: anonymous Authentication, Sessions/Relay WSS, Windows/WebGL state and intent exchange. NOT STARTED: public deployment, native iOS and release certification. Physical cross-device Internet play remains NOT TESTED.
