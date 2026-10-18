# R2 visual comparison and browser interaction QA

The final frozen WebGL build passed **12 automated checks**, with **28 fresh screenshots visually inspected**, zero browser page errors, zero failed requests and unchanged build-file hashes. The 1280 × 900 native screenshots were also inspected: all four featured cards are visible, the complete 3 × 3 tray fits beside the portrait arena, and player details are clean by default. Two small-phone presentation limitations are recorded below; no new desktop/native P0 was found.

Final browser run: 2026-10-15 12:02:32 UTC, Microsoft Edge 155.0.4283.45. WebAssembly SHA256: `a35e0363f639633a8bdaa745a6248ea8cf2b7e419088785a04f9f8835b474d12`. See [automated report](../Evidence/r2-webgl-smoke.json) and [visual review](../Evidence/r2-webgl-visual-review.json).

## Reference and capture method

The certified V148 reference was captured at 1280 × 900 from `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`, SHA256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`. Source bytes were verified before and after. Original gameplay and UI were rendered in a fresh isolated Edge context; the source file was never edited. See [reference notes](R2_REFERENCE_NOTES.md) and [reference metadata](../Evidence/r2-reference.json).

The R2 WebGL checks use `Tools/r2-webgl-smoke.cjs`, an ephemeral loopback HTTP server and isolated Edge contexts. All builder changes, selections, F1 toggles, mouse drags and simulated touch events enter the ordinary player UI. The test does not call Unity state APIs or manufacture gameplay state. Build-file hashes are recorded before and after each run.

The desktop browser viewport is 1280 × 900; the stock Unity web template embeds a 960 × 600 canvas. Portrait mobile uses a 390 × 844 canvas and landscape uses 844 × 390. Canvas-relative coordinates are scaled to the measured browser rectangle. The native Windows screenshots use a full 1280 × 900 player and are documented by `Evidence/r2-native-runtime.json`.

Key visual pairs: [V148 deck selection](../Evidence/r2-reference-03-deck-selected.png) / [R2 showcase](../Evidence/r2-native-01-deck-selection.png), [V148 gameplay](../Evidence/r2-reference-04-gameplay.png) / [R2 gameplay](../Evidence/r2-native-03-gameplay.png), [V148 aim](../Evidence/r2-reference-06-aim.png) / [R2 aim](../Evidence/r2-native-02-aim.png), and [V148 details](../Evidence/r2-reference-08-ball-details.png) / [R2 player details](../Evidence/r2-native-04-ball-details.png).

## Visual convergence

| Area | Certified V148 reference | R2 Unity presentation |
|---|---|---|
| Match setup | Canonical presets at left, full orb catalogue at right, nine-slot selection dock | Four featured showcase identities lead the setup flow; canonical decks and the builder remain secondary. This follows the explicit R2 requirement. |
| Desktop composition | Portrait 540:900 logical arena left; fixed 520 px control column right; HUD above the left board | Portrait arena left and fixed control panel right; HUD, turn, selected ball, deck and details controls share the right panel. The source palette and team-color hierarchy remain recognizable. |
| Deck tray | Standard plus nine specials in two tall scrolling columns | Nine special orb cards in a 3 × 3 tray, with Standard separate. R2 explicitly supersedes the source's two-column arrangement. |
| Identification | Colored shaded spheres, central type marks, nearby HP/stock badges | Colored shaded spheres with concise identity marks, visible names, HP/stock and selection outline. Team rings remain distinct from type color. |
| HUD | Cyan/rose names, large HP numbers, bars, active-turn pill and round/50 counter | Player 1/2 labels, readable numeric base HP and bars, team-color active-turn treatment and round/50 counter. |
| Aim and release | Glowing selected spawn orb, dashed vector, drag ring, arrow tip, percent-power label; source can preview a wall bounce | Glowing selected orb, dashed direction/vector, drag marker and launch-power cue; resolving state blocks a second shot. Unity's guide communicates direction and power, without predicting collisions. |
| Arena | Navy floor, faint grid, team zones, center concentric rings, perimeter and launch markers; multiple source maps | Matching common navy/grid/zone/ring/launcher vocabulary and restrained watermark. Current Unity arena does not reproduce all V148 map variants. |
| Ball details | Orb/name header, stat blocks, description, detailed rules and trace/semantic text in one modal | Name and HP/size lead; quick explanation, ability and setup/payoff follow. Technical migration/reference metadata is gated behind F1, as R2 requests. |
| Multiplayer entry | Source main menu includes online discovery/match options | Local match remains primary; Multiplayer opens Create/Join with manual IP/port under Advanced. Existing LAN/WebSocket scope is preserved. |

## Interaction evidence

The final accepted evidence is the full `Evidence/r2-webgl-smoke.json` run and the screenshot set below. Interim reports retain investigation history and are not the final acceptance result. The native full-match report also passes: 33 launches, 32 turns, zero motion guards, non-development Windows player, live simulation reaching a base-destruction result.

| Flow | Evidence files |
|---|---|
| Featured setup | `r2-webgl-01-showcase-desktop.png`, `r2-webgl-18-showcase-portrait.png` |
| Create / Join / Advanced containment | `r2-webgl-02-multiplayer-create.png`, `r2-webgl-03-multiplayer-join.png`, `r2-webgl-04-multiplayer-advanced.png` |
| Actual builder nine → zero → nine → custom setup | `r2-webgl-05-builder-initial.png` through `r2-webgl-09-custom-deck-setup.png` |
| Gameplay, selected special and player details | `r2-webgl-10-gameplay-desktop.png`, `r2-webgl-11-selected-special.png`, `r2-webgl-12-player-details.png` |
| F1 developer metadata and clean view restored | `r2-webgl-13-developer-details.png`, `r2-webgl-14-player-details-restored.png` |
| Held mouse aim, launch lock and next player | `r2-webgl-15-aim-desktop.png`, `r2-webgl-16-resolving-lock.png`, `r2-webgl-17-next-turn.png` |
| Actual simulated touch aim, cancel and subsequent launch | `r2-webgl-19-gameplay-portrait.png` through `r2-webgl-22-touch-launched.png` |
| Portrait lower controls and landscape navigation | `r2-webgl-23-portrait-lower-controls.png` through `r2-webgl-27-landscape-restarted.png` |

The builder fixture removes the actual nine default DEATH ENGINE members by display-name search and actual card clicks, then adds the nine GRAVITY TRAP members. Clicking Use with zero selected leaves the builder open. The accepted custom match is identified by the ordinary `CORE_CLASH_MATCH_START custom_0` log. Gatekeeper is selected from the third tray row and launched by a real mouse drag/release. P2 turn is confirmed by selecting Blightpool from the actual P2 STATUS REACTOR tray after settling. Touch cancellation is checked by unchanged launch count; the next touch release must add exactly one launch. Landscape lower controls are reached through actual scrollbar track clicks, followed by Match Setup and Start.

Visual review confirms the repaired Multiplayer button/modal, manual host/port fields contained by Advanced, readable desktop 20/20 HUD, thin accent/health bars, complete vertical arena boundaries/grid, and the unclipped 390 px showcase heading. Default Gatekeeper details show no `UNITY_READY`, internal rule identifiers or migration notes; F1 exposes those only in the separate overlay and F1 again removes it.

## Remaining experiential differences

The presentation now follows the requested Unity layout, so HUD placement, the separate Standard action and the 3 × 3 special tray intentionally differ from literal V148 pixels. At the stock 960 × 600 web canvas, showcase cards and control panels require more scrolling than the 1280 × 900 native player. V148's original glyphs, full map selection, richer effect rendering and collision-preview behavior are not reproduced pixel-for-pixel. The complete imported roster does not imply that every source ability is implemented; player descriptions state unavailable special powers honestly, while F1 retains migration metadata.

Two small-mobile polish issues remain in the inspected final build. At 390 × 844, the on-arena `RELEASE TO LAUNCH` text wraps/clips in its small fixed-height label even though the vector, power bar and touch interaction work ([touch aim](../Evidence/r2-webgl-20-touch-aim.png)). At 844 × 390, the Player 1/2 label and numeric HP are tightly packed and partly overlap in the narrow HUD cells; lower controls remain reachable and restarting works ([landscape restart](../Evidence/r2-webgl-27-landscape-restarted.png)). The native 1280 × 900 class-demo HUD and aim label are readable.

The browser run validates UI interactions and selected live gameplay transitions, not all-ability parity, game balance or cross-device network connectivity. Touch uses Chromium CDP simulation; a physical-phone check remains distinct. The native full-match run uses the live simulation with automated pointer samples and bounded acceleration, so it is not a claim of a human-played complete match.
