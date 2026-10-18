# R5 final browser visual review

The final frozen R5 WebGL build passed **25 automated checks** with **49 fresh captures visually inspected**, zero browser page errors and zero failed requests. The 390 px library and builder text issues recorded in R4 are resolved in the reviewed layouts. No unresolved visual issue was found in this bounded pass.

The acceptance run began **2026-10-16T08:57:17.406Z** in Microsoft Edge **155.0.4283.45**, after the final friendly LAN disconnect-copy rebuild. WebAssembly SHA256 is `d846d7acf7f79840d3810ca93e14d7a63310698534a5c6c65125c1674bcf1737`. The [automated report](../Evidence/r5-webgl-smoke.json), [visual review record](../Evidence/r5-webgl-visual-review.json), and nine `r5-webgl-review-sheet-*.png` contact sheets record the final run. The [interim report](../Evidence/r5-webgl-smoke-interim.json) and nine `r5-webgl-interim-review-sheet-*.png` sheets retain the earlier layout investigation; they are not the acceptance result.

## Method and preservation

[Tools/r5-webgl-smoke.cjs](../Tools/r5-webgl-smoke.cjs) serves the frozen `Builds/WebGL` files on an ephemeral loopback port in fresh isolated Edge contexts. All selections, builder edits, scrolls, details, right-clicks, mouse drags, F1 toggles, simulated touches, cancellations, navigation and Start actions enter the ordinary player UI. The harness does not call Unity gameplay APIs or mutate game state. Normal action logs verify accepted input; canvas text is checked visually.

The desktop viewport is 1280 x 900 with its measured 960 x 600 stock player canvas. Android-user-agent contexts assert true 390 x 844 portrait and 667 x 375 short-landscape canvases; the portrait context also rotates to 844 x 390. Coordinates scale from the measured canvas rectangle. All 49 final captures were inspected in nine labeled contact sheets, with full-size checks of the changed portrait library and builder, compact controls, runtime inspector and combined-release result.

Build files and the original V148 reference retain their pre-run hashes. The reference SHA256 remains `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`. The harness also verifies all **52** retained R4 browser files against their pre-run hashes, including the original R4 harness and evidence. R4 fixtures and evidence remain intact.

## Phone setup results

| Area | Observed result | Evidence |
|---|---|---|
| 390 px library row | REALITY HACKERS is fully readable on one line, above nine orb previews and separate full-width P1/P2 actions. Neighboring rows remain distinct. | [Scrolled library](../Evidence/r5-webgl-18b1-library-reality-scrolled-portrait.png) |
| Separate portrait controls | A real P1 tap changes only Player 1; Player 2 still shows STATUS REACTOR. A separate P2 tap then changes Player 2. Normal Start logs `featured_reality_hackers vs featured_reality_hackers`. | [P1 only](../Evidence/r5-webgl-18b2-library-reality-p1-portrait.png), [both selected](../Evidence/r5-webgl-18b3-library-reality-both-portrait.png), [started](../Evidence/r5-webgl-18b4-library-reality-started-portrait.png) |
| 390 px builder helper | The complete helper sentence spans two readable lines above search, with clear spacing. Nine selected slots, one-column cards, information buttons, Back and Use remain reachable. | [Builder](../Evidence/r5-webgl-18c-builder-portrait.png), [information modal](../Evidence/r5-webgl-18d-details-portrait.png) |
| 667 x 375 library | Ordinary wheel events expose the long deck name and then both complete separate actions and nine previews within the short list. Start stays in its own footer. | [Name after scrolling](../Evidence/r5-webgl-30-library-scrolled-667x375.png), [controls](../Evidence/r5-webgl-30b-library-reality-controls-667x375.png) |
| Separate compact controls | Actual P1 and P2 taps produce the expected P1-only and both-selected player cards; normal Start confirms the same Reality Hackers matchup. | [P1 only](../Evidence/r5-webgl-30c-library-reality-p1-667x375.png), [both selected](../Evidence/r5-webgl-30d-library-reality-both-667x375.png), [started](../Evidence/r5-webgl-30e-library-reality-started-667x375.png) |

The portrait and compact library Start actions both preserve **0 -> 0 accepted launches**. Explicit checks also cover the desktop custom-deck Start, portrait showcase Start and rotated landscape Start: pressing and releasing the UI control does not leak an arena shot.

## Retained desktop and touch regressions

The R4 sequence remains in the R5 harness: showcase; Create/Join/Advanced containment; builder nine -> zero -> nine; disabled empty Use; custom-deck Start; third-row Gatekeeper; default details; F1 on/off; first-wall and normal mouse aims; resolving input lock; natural P2 turn; runtime inspection; combined mouse release; phone builder/details; touch aim/cancel/new release; lower controls; landscape return/restart; and the true 667 x 375 library.

The normal P1 Gatekeeper settles naturally before P2 Blightpool selection confirms the opponent turn. A real right-click and the ordinary Inspect Board action both open the same existing P1 ball without adding a launch. The modal shows **Gatekeeper**, **P1 / 30 / 30 HP**, **CURRENT STATE**, **Shield: 0**, and **No active status**. See the [right-click inspector](../Evidence/r5-webgl-17b-runtime-instance-right-click.png), [Inspect Board mode](../Evidence/r5-webgl-17c-inspect-board-mode.png), and [button-route inspector](../Evidence/r5-webgl-17d-runtime-instance-inspect-button.png).

The combined gesture begins with a held real P2 left-button aim, followed by right-button down, left-button up and right-button up in immediate order. The measured right-down/left-up browser dispatch gap is **1 ms**. Exactly one P2 launch is accepted (**1 -> 2** total), the next capture shows MOVING with the aim vector cleared, and a subsequent resolving press/release adds none. See [held aim](../Evidence/r5-webgl-17e-p2-aim-before-combined-release.png) and [accepted release](../Evidence/r5-webgl-17f-combined-release-launched.png).

The portrait touch cancellation adds no launch, while a fresh touch after cancellation releases exactly one shot. Portrait and rotated landscape Ball Details / Inspect Board / Match Setup actions remain readable and reachable through ordinary scrolling.

## Scope limits

Touch is Chromium CDP simulation, not a physical device. The short 667 x 375 list intentionally needs scrolling; its gameplay capture proves selection and Start, not full compact-landscape match usability. The short Bouncer details fit without overflow, so their wheel attempt does not establish long-page phone overflow behavior. Browser event ordering cannot guarantee coincidence within one Unity update frame.

This review is not an all-catalog uniqueness or human recognition study, accessibility certification, balance check, or all-ability parity claim. The runtime fixture is naturally launched, settled and undamaged; changing damage, status combinations, transformed identity and network snapshot replacement remain separate test concerns. Multiplayer here covers lobby presentation. Actual failed-connect, cancellation, retry and host-loss recovery are exercised separately by [Tools/lan-recovery-smoke.cjs](../Tools/lan-recovery-smoke.cjs).
