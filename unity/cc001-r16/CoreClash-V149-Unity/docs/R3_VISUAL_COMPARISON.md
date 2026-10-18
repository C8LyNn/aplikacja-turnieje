# R3 visual comparison and browser interaction QA

The final frozen WebGL build passed **14 automated checks** with **36 fresh screenshots visually reviewed**, zero browser page errors, zero failed requests, and unchanged build and V148 reference hashes. The two small-mobile issues recorded in R2 are fixed: the 390 × 844 release instruction fits on one line, and the 844 × 390 player labels and numeric HP are separated. The native 1280 × 900 captures also show all four featured cards, the complete 3 × 3 special tray, clean player details, and the first-wall aim reflection.

Two minor portrait text issues remain in secondary setup views: a long canonical deck name can wrap into a clipped second line, and the builder helper sentence clips the bottom of its second line. Their selection, search, information, Use, Back, and Start controls remain usable. These are distinct from the two R2 gameplay issues above.

Final browser run: **2026-10-15 19:05:42 UTC**, Microsoft Edge **155.0.4283.45**. WebAssembly SHA256: `352ae082da77b1c654b7323b4491ca021225a4272fdba191ad71276e548bbc45`. See the [automated report](../Evidence/r3-webgl-smoke.json), [visual review](../Evidence/r3-webgl-visual-review.json), and six `r3-webgl-review-sheet-*.png` contact sheets in Evidence.

## Reference and capture method

The certified V148 reference remains `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`, SHA256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`. Its original 1,465,149 bytes were hashed before and after this run and were not edited. The existing isolated V148 captures and their source metadata remain the comparison baseline: [reference notes](R2_REFERENCE_NOTES.md) and [reference metadata](../Evidence/r2-reference.json).

`Tools/r3-webgl-smoke.cjs` serves the unmodified build on an ephemeral loopback HTTP port and opens fresh isolated Edge contexts. Builder edits, orb selections, details, F1, mouse drags, simulated touch, cancellation, scrolling, and setup navigation all enter the ordinary player UI. The browser test does not call Unity state APIs, inject gameplay state, or change the build. Build hashes are checked again after browser shutdown.

The desktop browser viewport is 1280 × 900 with the stock 960 × 600 Unity canvas. The Android-user-agent phone context uses a true 390 × 844 canvas, then rotates to 844 × 390. A separate fresh Android-user-agent context explicitly asserts a true 667 × 375 canvas for the short-landscape cases. Coordinates are scaled from the measured canvas rectangle. The final accepted report is the complete 14-check run; an earlier compact-context setup mistake was corrected before this accepted evidence was captured.

Key visual pairs are [V148 setup](../Evidence/r2-reference-03-deck-selected.png) / [R3 native setup](../Evidence/r3-native-01-deck-selection.png), [V148 gameplay](../Evidence/r2-reference-04-gameplay.png) / [R3 native gameplay](../Evidence/r3-native-03-gameplay.png), [V148 aim](../Evidence/r2-reference-06-aim.png) / [R3 native reflected aim](../Evidence/r3-native-02-aim.png), and [V148 details](../Evidence/r2-reference-08-ball-details.png) / [R3 native player details](../Evidence/r3-native-04-ball-details.png).

## Visual convergence

| Area | Certified V148 reference | R3 Unity presentation |
|---|---|---|
| Setup | Canonical preset list, full orb catalogue, and selection dock | Four featured deck identities lead the flow; All Decks and the complete builder remain secondary. All four cards fit in the 1280 × 900 native capture. |
| Composition | Portrait 540:900 logical arena at left, tall control column at right, HUD above the board | Portrait arena and control column retain the source's navy, cyan, rose, grid, team-zone, perimeter, launcher, and center-ring vocabulary. HUD and turn information lead the control panel. |
| Deck tray | Standard plus nine specials in two tall scrolling columns | Nine special cards in a 3 × 3 tray, with Standard separate. This remains the requested Unity arrangement; the full native tray fits alongside the arena. |
| Orb identity | Colored shaded spheres with type glyphs, stock, and HP | Shaded type-colored spheres, concise identity marks, names, HP/stock, a selected-card outline, and team rings. Exact V148 glyph artwork is not reproduced. |
| Aim | Glowing selected launcher, dashed vector, drag ring, arrow, power cue, and possible wall bounce | Selected orb, dashed path, drag marker, power cue, first-wall contact ring, and reflected continuation are visible. The shallow held mouse capture proves the reflection before release. The guide covers the first arena-wall bounce; it is not a prediction of ball, structure, portal, or later collisions. |
| Feedback | Rich source-specific effect rendering | R3 renders pulse/spark/float feedback from actual match events. The native result capture shows live shield/root feedback; the ordinary browser Gatekeeper shot creates portals and reduces P2 base HP to 19/20, then reaches a clean next-turn view without stuck floating text. This does not establish every effect's visual parity. |
| Player details | Name, stats, rules, and technical/semantic text together | Name, HP/size, quick explanation, ability, and setup/payoff lead. F1 alone exposes technical migration/reference metadata; switching F1 off restores clean details. The narrow Bouncer modal remains readable and honestly states that its special power is unavailable. |
| Multiplayer entry | Source online/discovery options | Create/Join is presented in an opaque modal; raw host and gameplay-port inputs stay behind Advanced. Browser hosting limitations are explained in player terms. Connectivity is tested separately. |
| Small screens | Source layout is the comparison vocabulary rather than an exact responsive target | Portrait release text and narrow landscape HUD are repaired. Library, builder, details, lower controls, Match Setup, and Start are reachable through normal input. At 667 × 375 the deliberately short library viewport requires scrolling within a row, while its Start footer stays separate. |

## Interaction evidence

| Flow | Final R3 evidence |
|---|---|
| Featured setup | `r3-webgl-01-showcase-desktop.png`, `r3-webgl-18-showcase-portrait.png`, `r3-webgl-28-showcase-667x375.png` |
| Create / Join / Advanced containment | `r3-webgl-02-multiplayer-create.png` through `r3-webgl-04-multiplayer-advanced.png` |
| Builder nine → zero → nine → custom setup | `r3-webgl-05-builder-initial.png` through `r3-webgl-09-custom-deck-setup.png` |
| Actual orb selection and clean details | `r3-webgl-10-gameplay-desktop.png` through `r3-webgl-12-player-details.png` |
| F1 metadata and clean view restored | `r3-webgl-13-developer-details.png`, `r3-webgl-14-player-details-restored.png` |
| Held wall guide and same gesture moved to upward aim | `r3-webgl-15b-wall-guide.png`, `r3-webgl-15-aim-desktop.png` |
| Launch lock, real portals, base damage, and P2 turn | `r3-webgl-16-resolving-lock.png`, `r3-webgl-17-next-turn.png` |
| Phone library / builder / player information | `r3-webgl-18b-library-portrait.png` through `r3-webgl-18e-details-scrolled-portrait.png` |
| Touch aim / cancel / subsequent release | `r3-webgl-19-gameplay-portrait.png` through `r3-webgl-22-touch-launched.png` |
| Portrait lower controls and landscape return/restart | `r3-webgl-23-portrait-lower-controls.png` through `r3-webgl-27-landscape-restarted.png` |
| True 667 × 375 library footer and scroll reachability | `r3-webgl-29-library-667x375.png`, `r3-webgl-30-library-scrolled-667x375.png` |

The builder fixture removes the nine actual DEATH ENGINE members by name search and card clicks. Use with zero selected leaves the builder open. Adding the nine actual GRAVITY TRAP members produces `custom_0`, which starts through the normal Start control. Gatekeeper is selected from the third tray row, held at a shallow side-wall angle, moved upward while the same mouse button remains held, and released once. A second drag while resolving is blocked. After settling, selecting Blightpool confirms the P2 turn. No gameplay state was manufactured for these captures.

The phone path opens All Decks, P1 Edit Deck, and Bouncer information before returning through Close and Back to start the match. A wheel-scroll attempt in Bouncer details leaves its short copy readable; this case does not prove a long phone details page's scrolling. A canceled touch produces no launch, while the next touch release produces exactly one launch. Actual scrollbar clicks reach lower controls, followed by Match Setup and a successful landscape Start.

The separate [native runtime report](../Evidence/r3-native-runtime.json) passes with 51 launches, 50 turns, 26 base-damage events, zero motion guards, and a completed `50 turns: base HP` result. Its match uses the live simulation with an initial presentation-pointer gesture, later legal commands, and bounded fixed-step acceleration. It is not a claim of a manually played full match. The native [result capture](../Evidence/r3-native-06-match-result.png) provides additional event-feedback evidence.

## Fixed R2 issues and remaining limits

The R2 portrait `RELEASE TO LAUNCH` wrap/clipping is superseded by the readable [R3 touch-aim capture](../Evidence/r3-webgl-20-touch-aim.png). The R2 narrow landscape Player/HP overlap is superseded by the separated [R3 restarted HUD](../Evidence/r3-webgl-27-landscape-restarted.png). Both repairs were visually checked in the final frozen build.

Two minor 390 px secondary-view issues remain: [the library](../Evidence/r3-webgl-18b-library-portrait.png) can clip a wrapped long name such as REALITY HACKERS, and [the builder](../Evidence/r3-webgl-18c-builder-portrait.png) clips the bottom of the helper sentence's second line. The phone details header, search field, selected-orb row, card names, information buttons, Use, Back, and Start remain clear and usable. At 667 × 375 the short library list initially cuts off part of the first row; ordinary scrolling exposes P1/P2 above the separate footer, as shown in the paired captures.

The intended Unity 3 × 3 tray, HUD placement, separate Standard action, and featured-first setup differ from literal V148 pixels. The stock 960 × 600 web player scrolls more than the native 1280 × 900 player. Full source map variants, exact glyph artwork, all richer effects, and all source abilities are not reproduced. A full imported catalogue does not imply every special power is implemented; the default player copy states unavailable powers honestly.

Browser checks establish UI interaction, selected real gameplay transitions, and the inspected layout states. They do not establish all-ability parity, balance, physical-phone behavior, or cross-device connectivity. Touch is Chromium CDP simulation. The browser uses software WebGL rendering, while the native capture uses its recorded Windows graphics device. Separate native/network/core reports cover their own scopes.
