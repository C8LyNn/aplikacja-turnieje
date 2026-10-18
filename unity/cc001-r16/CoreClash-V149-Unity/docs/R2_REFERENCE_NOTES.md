# R2 certified V148 presentation reference

Captured 2026-10-15 with `Tools/r2-reference.cjs` in a fresh, isolated headless Microsoft Edge context at **1280 × 900, DPR 1**. The original HTML is served from memory, with read-only inspection hooks inserted into that response. No personal browser profile, Unity files, gameplay resolvers, canonical data or certified HTML bytes are changed.

Source: `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`.

Verified SHA256 before and after: `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.

Result: **8 screenshots saved and visually inspected; zero browser page errors; source unchanged.** Measured DOM rectangles, computed styles, deck IDs, map, aim state and rendered detail text are in `Evidence/r2-reference.json`. Seed: `r2-presentation-reference`.

## Accepted evidence

| File | Actual source state | Observed presentation |
|---|---|---|
| [01 menu](../Evidence/r2-reference-01-menu.png) | Initial main menu | Large white heading, cyan eyebrow, navy rounded panel, three prominent PC/tablet/phone choices; lower modes continue in the menu scroller. |
| [02 deck choice](../Evidence/r2-reference-02-deck-choice.png) | Original PC loadout, 0/9 | Left canonical deck list and builder access; right orb-first catalogue; fixed nine-slot selection/action dock. |
| [03 selected deck](../Evidence/r2-reference-03-deck-selected.png) | `cosmos_3`, Kosmos · Osobliwość, 9/9 | Selected preset and selected catalogue cards use warm gold outline/check state; cyan primary Start action is enabled. |
| [04 gameplay](../Evidence/r2-reference-04-gameplay.png) | First player aim phase, Standard selected | Portrait arena left; complete fixed-width control column right; cyan/rose team HUD above left board. |
| [05 selected orb](../Evidence/r2-reference-05-selected-orb.png) | Singularity selected | Card frame/background changes; source spawn preview changes to the matching purple marked orb. |
| [06 aim](../Evidence/r2-reference-06-aim.png) | Real mouse drag, `dragging=true` | Dashed cyan projected vector with arrowhead, separate circular drag handle, visible 98% power label, selected spawn orb. |
| [07 resolving](../Evidence/r2-reference-07-resolving.png) | Real pointer release, `phase=moving` | Ball launches with team rim and HP number; tray is visibly dimmed and ready count drops to zero; used unique stock becomes x0/EMPTY. |
| [08 ball details](../Evidence/r2-reference-08-ball-details.png) | Original PC long press on Singularity | Large orb/name header, dark rounded modal, badges, ability text, two-column stats; source includes dense rule/trace text and scrolls. |

Details were captured before launching, so the actual capture order is 01, 02, 03, 04, 05, 08, 06, 07. `captureSequence` records this explicitly. All accepted images are viewport screenshots of the original rendered game, not mockups or generated assets.

## Measured desktop composition

The source canvas coordinate system is **540 × 900**. Playable field bounds are x=24.3…515.7, y=16…884. Player launch pad is (270, 853), radius 31, stem width 24. The selected match generated the original `cornerRings` / `Pierścienie narożne` map; the four corner ring obstacles are map geometry, not part of the common arena backdrop.

| Element in gameplay screenshot | Position / dimensions at 1280 × 900 |
|---|---|
| App grid | x=0, y=0; 1280 × 900; columns **760 + 520 px** |
| Right controls | x=760, y=0; **520 × 900**; internal vertical scrolling |
| Left HUD | x=0, y=0; **760 × 161** |
| Each base HUD block | approximately **218 × 136**, 17 px radius |
| Center HUD column | approximately 272 × 136 |
| Rendered portrait canvas | x=180, y=162; **432 × 721**, 22 px outer radius |
| Source tray | x=779, y=54; **473 px wide**, 12 px gaps, two columns |
| Source tray card | approximately **230.5 × 183.1**, 18 px radius |
| Source orb icon | **64 × 64**, white translucent 2 px rim |
| Main menu panel | x=100, y=18; **1080 × 872**, 26 px radius |
| PC draft panel | x≈12.8, y=0; **1254.4 × 900**; columns **390 + 803.4 px**, 14 px column gap |
| Ball details modal | x=300, y=156; **680 × 720**, 22 px radius, vertical scrolling |

The source PC tray includes Standard plus nine special balls in **two columns**. It exceeds the viewport height; the final row and quick controls are reached by scrolling. R2 explicitly requests a **3 × 3 special-ball tray**, so that requirement takes priority over reproducing the source's two-column overflow. The recognizable reference is the orb/card/state treatment and portrait-board/right-panel relationship.

## Palette and surface treatment

| Role | Source value / visible treatment |
|---|---|
| App navy | `#09111c` |
| Arena canvas outside field | `#09131f` |
| Arena floor gradient | `#101a28` → `#0b1723` → `#0a141f` → `#0b1723` → `#101a28` |
| Right control gradient | `#07131e` → `#050d15` |
| Main menu gradient | `#0b1b28` → `#06111a` |
| Main readable text | `#eef7ff`; quieter surface system also declares `#f2f7fb` |
| Muted readable text | `#9cafbd` / `#8da1b8` |
| Player 1 | cyan `#4fd6ff` |
| Player 2 | rose `#ff5d78` |
| Selected match card | cyan frame `#7de8ff`; fill gradient `#174159` → `#0d293a` |
| Selected draft/preset | warm gold `#f0d27b` |
| Ready/available state | small mint-green circular check and restrained green border |
| Details surface | `#07151f`; ability text block `#0a1b27` |
| Canvas outer border | `#38566f` |

Source type icons use a radial sphere gradient centered at 35%/35%: white highlight, canonical type color at 45%, and the type color darkened by 50 at 90%. The large dark type symbol is central. Stock and HP badges sit low on opposite sides of the sphere. For the selected Singularity, the type color is `#5c4a8f`, the mark is `⊕︎`, HP is 25 and stock starts at x1.

## Common arena cues

The common backdrop uses a faint 36-logical-pixel grid (`rgba(150,190,220,.032)`), a very soft central glow, rose upper territory and cyan lower territory. Territory fill fades from approximately 14.5% opacity at the base edge to 2.5% towards the center. Its horizontal border is a thin team-color line with small inward chevrons. Top and bottom base edges use a stronger 4-logical-pixel team-color line. The playable perimeter is a cool light beveled outline. The center zone is readable through a pale 2.4-logical-pixel circular outline, three faint inner rings and a dashed crosshair. No large watermark obscures the play surface.

Each team launch area has concentric circles, an outer dashed ring and a short stem joining the pad to its base edge. The selected launch orb is bright enough to identify without text. On the field, player ownership is communicated by a cyan/rose ring outside the type-color orb; HP is a small white number above the orb.

## Interaction and hierarchy cues

The HUD makes ownership and base HP primary: bold names, large HP numbers and segmented team-color bars. Turn ownership occupies the large center pill; the round/50 counter remains visible below. The second-player extra-ball bonus has a restrained amber badge.

Aim follows a real press/drag/release on the launch pad. The reference has an 8-logical-pixel low-opacity underlay, a 2-logical-pixel dashed cyan path, arrowhead/dot endpoint, a separate ring at the pointer's actual clamped drag position, and a dark rounded percent-power pill. Maximum aim distance is 175 logical pixels; this capture's drag is approximately 170.66 px (98%). Releasing the pointer changes the source phase to moving and dims the tray.

Original PC details open by holding a tray card for 560 ms. The visible `i` affordance exists in touch layouts but is hidden on PC. The details modal leads with orb/name, badges, description, and grouped stat cards. Its source text also contains technical trace/semantic metadata. **R2 explicitly asks for a cleaner player view and developer-only implementation metadata; those instructions take priority over copying the dense source detail text.**

## Limits

This captures the certified V148 player-vs-AI PC flow and a real first shot. It does not certify Unity parity, all maps, local-PvP handoff, balance, or all ability behavior. V149 featured decks were not injected into these source references. The original menu and details contain more information than fits in one viewport; screenshots faithfully retain the normal scrollable state. No art direction is proposed here: these are source-backed visual measurements for the native R2 comparison.
