# R4 archive presentation: final browser visual review

The refreshed frozen R4 WebGL build passed **18 automated checks** with **41 fresh screenshots visually reviewed**, zero browser page errors, zero failed requests, and unchanged build/reference hashes. Real right-click and the ordinary **INSPECT BOARD** action both open the existing P1 Gatekeeper during P2's turn without submitting a launch. The modal clearly shows **Gatekeeper**, **P1 / 30 / 30 HP**, **CURRENT STATE**, **Shield: 0**, and **No active status**.

The final acceptance run began **2026-10-15 19:44:57 UTC** in Microsoft Edge **155.0.4283.45**. Its WebAssembly SHA256 is `f6163cab745523f088152e260177eb78871fd490c12410c25d6772221ed24dae`. See the [automated report](../Evidence/r4-webgl-smoke.json), [visual review record](../Evidence/r4-webgl-visual-review.json), and seven `r4-webgl-review-sheet-*.png` contact sheets. `r4-webgl-smoke-interim.json` records the earlier investigation run and is not the acceptance result. R3 evidence remains preserved.

## Scope and method

This review follows the bounded changes described in [ARCHIVE_PRESENTATION_REVIEW.md](ARCHIVE_PRESENTATION_REVIEW.md): distinguish orb identity, non-hue ownership, current state, and readable instance inspection. Archive research is supporting material rather than a replacement for the working game or a claim of full implementation of every archive proposal.

`Tools/r4-webgl-smoke.cjs` serves the untouched WebGL build on an ephemeral loopback port and uses fresh isolated Edge contexts. Every builder edit, selection, mouse drag, right-click, inspection-button click, F1 toggle, scroll, simulated touch, cancel, and navigation action enters the ordinary player UI. The script never calls Unity gameplay APIs or manufactures game state. Console logs identify ordinary accepted actions; canvas text is checked visually.

The desktop viewport is 1280 × 900 with the stock 960 × 600 canvas. Android-user-agent contexts use a true 390 × 844 portrait canvas, rotate to 844 × 390, and separately assert a true 667 × 375 short-landscape canvas. All coordinates are scaled from the measured canvas rectangle.

The original `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html` was read only and retains SHA256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e` before and after the run. The prior [R3 comparison](R3_VISUAL_COMPARISON.md) retains the V148 comparison baseline.

## New presentation evidence

| Area | Observed result | Evidence |
|---|---|---|
| Disambiguated identity marks | Neighboring builder entries Bouncer and Bomb now visibly use `BO3` and `BO0`; their canonical names remain readable. The tray and selected/detail orb use the same mark vocabulary. This is a concrete sample, not a visual recognition study of all 227 entries. | [Builder](../Evidence/r4-webgl-05-builder-initial.png), [P2 tray](../Evidence/r4-webgl-17-next-turn.png) |
| Non-hue ownership | The naturally launched Gatekeeper has a static P1 label. After the real P2 release, the new Blightpool shows P2 while the existing Gatekeeper still shows P1. | [P1 board](../Evidence/r4-webgl-17-next-turn.png), [P1 and P2 board](../Evidence/r4-webgl-17f-combined-release-launched.png) |
| Runtime instance through desktop right-click | With P2 confirmed active by selecting Blightpool, right-clicking the settled P1 Gatekeeper opens its canonical name, owner, current/max HP and current-state section. Accepted launch count stays **1 → 1**. | [Runtime right-click modal](../Evidence/r4-webgl-17b-runtime-instance-right-click.png) |
| Explicit board inspection | The actual middle action changes to CANCEL INSPECT and displays TAP A BALL TO INSPECT. Clicking the same existing P1 ball opens the same readable runtime modal; accepted launch count remains unchanged. | [Inspection mode](../Evidence/r4-webgl-17c-inspect-board-mode.png), [Runtime button-route modal](../Evidence/r4-webgl-17d-runtime-instance-inspect-button.png) |
| Measured details layout | Gatekeeper's current-state, archetype, explanation, ability and setup/payoff content fits the desktop modal. The narrower Bouncer header, archetype and honest unavailable-power copy remain readable. | [Runtime details](../Evidence/r4-webgl-17b-runtime-instance-right-click.png), [Phone details](../Evidence/r4-webgl-18d-details-portrait.png) |
| Three player actions | BALL DETAILS, INSPECT BOARD and MATCH SETUP remain reachable and readable in the scrolled portrait/landscape panels. The third action returns to setup and normal Start succeeds. | [Portrait actions](../Evidence/r4-webgl-23-portrait-lower-controls.png), [Landscape actions](../Evidence/r4-webgl-25-landscape-lower-controls.png), [Restart](../Evidence/r4-webgl-27-landscape-restarted.png) |

The Gatekeeper used for inspection is created by the normal P1 mouse release after a real custom-deck builder flow. It settles naturally, creates its portal pair and reduces P2 base HP to 19/20. P2's ordinary card selection confirms the opponent turn before inspection. No instance was injected for this check. The inspected ball is undamaged and has no active status in this fixture; the browser evidence does not demonstrate damage updates, transformation, replacement network snapshots or simultaneous status combinations.

## Combined input regression

After closing the runtime modal, the script begins a fresh real P2 aim from the upper launcher and captures the held vector. At an empty board point it sends right-button down, left-button up and right-button up in immediate order. The recorded browser dispatch gap between right-down and left-up is **1 ms**. Exactly one new `owner=1 type=blightpool` launch is accepted, giving **1 → 2** total launches. The next capture shows MOVING and a cleared aim vector. A fresh press/release while that shot resolves adds no launch.

See [held P2 aim](../Evidence/r4-webgl-17e-p2-aim-before-combined-release.png) and [one accepted release with cleared aim](../Evidence/r4-webgl-17f-combined-release-launched.png). These are real browser inputs; their coincidence within one Unity update frame is not observable from this player, so this pass does not claim that timing guarantee.

## Retained interaction and layout checks

The complete R3 sequence was rerun against the refreshed R4 build: featured setup; Create/Join/Advanced containment; builder nine → zero → nine; disabled empty Use; custom match Start; third-row Gatekeeper selection; default details; F1 on/off; shallow first-wall guide; normal mouse release and resolving lock; natural P2 turn; phone library/builder/details; touch aim/cancel/new release; lower controls; landscape return/restart; and genuine 667 × 375 showcase/library scrolling.

The 390 px release instruction remains on one line, the 844 × 390 Player/HP cells remain separated, and the 667 × 375 library keeps Start below a separate short list viewport. Ordinary scrolling reveals the canonical P1/P2 buttons. All 41 captures were inspected in seven labeled contact sheets, with full-size originals additionally checked for the runtime inspector and combined-release pair.

## Remaining limits and minor polish

Two existing minor 390 px secondary-setup issues remain: [the library](../Evidence/r4-webgl-18b-library-portrait.png) clips the wrapped second line of a long canonical name such as REALITY HACKERS, and [the builder](../Evidence/r4-webgl-18c-builder-portrait.png) clips the bottom of its helper sentence's second line. Their selection, search, information, Use, Back and Start controls remain usable. The short 667 × 375 library intentionally requires scrolling within a row to expose all controls.

This browser review does not establish human recognition efficacy, color-vision accessibility certification, 16-pixel mark legibility, or all-catalog visual uniqueness. Dense overlaps can still obscure board labels; the explicit inspector supplies exact confirmation. The all-roster identity mapping, independent status combinations, snapshot rebinding and transformed-type behavior are separate code/test concerns described by the archive review, not browser demonstrations made here.

Touch is simulated through Chromium CDP, not a physical phone. The phone Bouncer copy is short, so the wheel-scroll attempt does not prove a long phone details page's overflow behavior. Multiplayer checks here cover lobby presentation only; this is not a network authority/connectivity test. Browser software WebGL rendering, native Windows runtime validation, Android validation, balance and all-ability parity retain their separate scopes.
