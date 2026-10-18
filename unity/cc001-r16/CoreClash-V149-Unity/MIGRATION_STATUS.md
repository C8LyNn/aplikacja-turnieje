<!-- R16 CURRENT -->
# Aktualny stan: R16 / 18.10.2026

Źródła R15 zostały rzeczywiście sprawdzone i rozwinięte. 269 testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. StandaloneWindows64: Succeeded; WebGL: Succeeded; Android: Succeeded.

Czytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.

**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**
<!-- R16 END -->

# Core Clash V149 migration status

Updated 2026-10-17, R9. Canonical target: **native Unity/C# class-demo vertical slice**. V148 is the gameplay reference and mechanic catalog, not an executable parity specification. The goal is a coherent playable demonstration for a development team; complete 224-ability migration is not a release gate.

## DONE — ported and tested within the stated scope

- Actual Unity project/scene opens through the installed editor's automated build/smoke path.
- Local two-player core: physical launch, circle collisions, STOP, stocks, replay before final spawn, first-turn P2 bonus spawn, turns, bases, enemy-zone/center pressure, opposing-wall base damage, simultaneous defeat and 50-turn tie-break.
- Full imported data: **227 records = Standard + 224 specials + two hidden generated tokens**, 12 archetype definitions, all 36 canonical decks and all four exact latest featured presets. Original identifiers and imported source stats remain. Hidden generated tokens remain data rather than normal builder choices.
- Normal nine-special deck builder; all visible specials remain selectable. Four mixed-archetype CLASS DEMO presets are additive, provisional and replaceable via JSON.
- Native primary outcomes for all 36 featured identities exercised; **31 UNITY_READY / 5 PARTIAL**. Eleven causal showcase combo scenarios and four complete local simulated matches pass; all nine selected types deployed in each match, zero native motion guards.
- **180 C# checks** cover gameplay, causal showcases, selection/layout, first-wall guide, feedback, identity/inspection, seat replacement, endpoint validation, real loopback UDP/HTTP, device transforms/primary touch and Internet invitation/cancellation/error logic; 13 wire-codec checks cover bounded framing/compression. R8 adds 18 momentum checks; R9 adds 22 explosive/timer/contact/settling checks, including three full mixed-deck matches. Their 1/0/0 guard counts honestly retain one bounded Echo/Slingshot chain.
- R2 presentation: four featured cards by default, complete secondary library/builder, portrait arena beside desktop controls, 3×3 visual tray, team HP/turn HUD, orb/aim/power feedback, clean player details and F1-only developer metadata. Presentation copy is replaceable JSON, separate from gameplay definitions.
- R3 presentation: first-wall guide with ball-radius/corner bounds; real-event rings/particles/floating labels with overlap suppression; effect expiration independent of match/simulation time; no replay of historical joining snapshots; corrected phone aim text, narrow HP labels, library, builder and details.
- Actual Windows and WebGL release builds, without the Development Build watermark. Native rendered screenshots and one complete local match are captured by the real Windows player. Real WebGL canvas QA covers builder, mouse, touch cancellation/launch and orientation/scroll controls. See BUILD_STATUS.md for current artifact evidence.
- Actual native Windows NGO/Unity Transport WebSocket host and WebGL client connect, replicate host state/events, accept a remote intent, and reject remote owner spoofing and duplicate sequence. Clients do not run gameplay physics.
- Simple LAN invitations: Create Game / Join Game, bounded versioned UDP discovery for Windows, expiring room rows, automatic sender-IP connection, Windows-hosted read-only WebRoot and copyable browser invitation. WebGL reads joinHost/joinPort and joins as Player 2. Manual connection fields stay under Advanced. Discovery grants no gameplay authority.
- R4 archive review: unique identity marks, non-hue ownership, simultaneous static states, live instance inspection and safe Quick Play HTML additions. P2 disconnect releases the LAN seat; a new SDK connection receives the same ongoing match and its own sequence. See docs/POST_V148_ARCHIVE_REVIEW.md.
- R5: measured setup text and separate narrow-row bands for names/previews/actions; visible cancelable join; failed join and client host-loss recovery; safe same-manager retry and return to local play. No new primary ability coverage is claimed by this presentation/network pass.
- R6: desktop/phone/tablet safe-area UI and normalized input; responsive WebGL shell; native Windows/WebGL/Android builds from one project; actual Unity Cloud anonymous authentication, private two-player Sessions and WSS Relay exchange between Windows and WebGL on one PC. Host still validates intent and alone advances physics. R6 does not change Core, Physics, catalog or featured selections.
- R7: real Cloud full/missing/invalid-code responses, client leave/retry, cancellation with delayed genuine response, host loss and local fallback; actionable full/invalid-code messages. All three builds refreshed. Separate WebGL upload archive and HTTP/MIME/SHA256 verifier prepared; actual public deployment and physical devices still NOT TESTED. See docs/R7_REPORT_PL.md.
- R8: source-backed Pinballer bumpers, Slingshot allied launches and Ram strong-contact effects. Safe native placement and friendly structure immunity; renewed late Slingshot motion has a bounded settling window. No imported statistic or deck edits. Three actual V148 runtime probes, native rendering and complete matches verify the stated scope. Ram's disabled reference structure bonus remains absent/PARTIAL. See docs/R8_REPORT_PL.md.
- R9: source-backed Mine enemy-touch arming/Frost disarm, Time Bomb own-turn fuse and Bomb STOP explosion. Native pair-level Mine triggers precede identity/ownership changes and allow both armed Mines to react. Timer/copy state is synchronized, a living Bomb's DEATH payload remains repeatable, and the hard motion guard resolves once. Six source probes and 22 new C# checks; no imported statistic or deck changes. See docs/R9_REPORT_PL.md.
- Separate derived HTML LEGACY / PRESENTATION stays offline playable and adds featured presets without removing builder/canonical content. Certified source remains unchanged; source hash checked by `Tools/verify-data.cjs`.

## PARTIAL

- **Mimic, Doppelganger, Wildcard, Collector and Echo:** transformations/repetition work for implemented handlers; access to the full unchanged roster can reach data-only abilities. No fake substitute handler or secretly restricted Wildcard pool is used.
- Native ability support across all 227 records: **37 UNITY_READY, 32 PARTIAL, 158 DATA_ONLY, 0 NOT_PORTED**. This includes Standard and hidden records. The readiness registry and per-ball evidence are `Data/AbilitySupport.cs` and `Evidence/ability-support.json`.
- Archetype concepts/data are preserved, with native passives for selected families and generic status behavior. Every historical passive/exception is not implemented or exhaustively certified.
- Additional helper abilities outside the featured 36 have partial handlers. Genesis currently creates a white-hole zone but does not yet implement its complete spawned-ball lifecycle; no full Genesis readiness claim is made.
- Multiplayer remains a prototype: Windows host chooses both decks; one remote seat; direct LAN or Internet Sessions/Relay. Authenticated reserved-player recovery, interpolation and broader load/latency validation remain work. The supplied Replit address serves an older build; R9 is not deployed and its public invitation routing remains unresolved. The embedded public invitation URL is not configured. QR generation is not implemented.
- Presentation uses procedural Unity UI/VFX with V148-inspired navy arena, glossy orbs and touch controls; production art, accessibility and physical mobile ergonomics need further work.

## NOT TESTED

- Physical Android/iOS devices, native Android runtime, Safari/iOS WebGL, cross-NAT peers on separate physical networks, high latency/loss/load and a publicly deployed HTTPS website. Real Relay service traffic on one PC is tested separately from these limits.
- WebGL hosting parity, different native host platforms and physical two-device LAN networking. P2 seat replacement has real single-PC process coverage; authenticated reconnect/resume is not implemented.
- Every copied identity/status/geometry combination, long-duration soak, competitive balance and the remaining roster's intended abilities.
- Native Windows was rendered in a visible D3D11 window and its captured frames inspected. The automated native run uses the app's normal selection/pointer path and accelerates simulation for its full match; human manual OS input is not claimed. Browser tests use actual mouse and emulated touch input on the compiled canvas.

## BLOCKED / NOT STARTED / NOT YET PORTED

| Classification | Work / reason |
| --- | --- |
| NOT TESTED on a physical Android device | AndroidPlayer/SDK/NDK are installed; current APK compilation status is in BUILD_STATUS.md. Touch/network/performance require actual device validation. |
| DONE / PARTIAL | Cloud Project ID configured; real Authentication + Sessions + Relay tested with Windows/WebGL on one PC. Physical Internet cross-device QA remains outstanding. |
| NOT STARTED in R9 | Publishing the current delivery to the supplied website, native iOS build and store publication. An older public WebGL build exists and was audited separately. |
| NOT YET PORTED | DATA_ONLY primary handlers and incomplete helper lifecycles; catalog data remains intact and selectable. |
| NOT A GOAL | HTML↔Unity network compatibility and frame/physics/event-order parity with V148. |

## Deliberate native decisions

Planning freezes physical state; only accepted actions resolve physics. Ordinary collisions/walls no longer use the legacy global energy multipliers. Ward clears all modeled negative statuses; Plagueleech can bind/infect a clean enemy; Penitent avoids source immediate ally reinfection. These implement intended interactions cleanly under the approved scope correction. Ability/deck selection was not tuned to win-rate outcomes, and the Reality smoke loss is retained.

The original source SHA256 remains `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`. Source audit evidence (36 ball scenarios, 13 combo/replacement scenarios, 198 assertions, four source matches) is separate from Unity evidence and does not establish native parity. Native implementation decisions and process rulings are in `docs/PROGRESS.md`.

Next useful work: install the Android APK and test physical phone/tablet/PC crossplay on LAN and separate networks; prepare invitation routing and publish current WebGL only after separate approval; test service expiration and expand data-only handlers by mechanic family.
