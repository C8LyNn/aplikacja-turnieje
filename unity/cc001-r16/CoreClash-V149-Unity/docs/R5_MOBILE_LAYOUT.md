# R5 measured setup layout

The source fix addresses the two secondary setup issues visible in the R4 390 × 844 captures: the clipped second line of REALITY HACKERS in the library and the clipped builder helper sentence. It also separates all nine library previews from P1/P2 actions on narrow rows. Final rebuilt-player validation is recorded in R5_VISUAL_REVIEW.md and Evidence/r5-webgl-smoke.json.

## Cause and bounded change

`Draw.Text` already wraps text. `RenderLibrary` nevertheless gave each deck name a fixed 23 px height and only 162 px width at a 390 px viewport. Its previews occupied local x = 16…235 while P1 began at x = 176, so buttons painted over previews. `RenderBuilder` gave a two-line, 13 px helper sentence a fixed 24 px height and positioned the search field independently of the rendered text.

`Draw.TextHeight` measures the same cached label style used for rendering, with a 3 px rounding allowance matching the existing details page approach. The library helper now reserves measured space before the player choices. Each deck name is measured at its actual available width, and the scroll content uses the sum of real row heights. Below a 500 px row width, the name, nine previews and two player actions have separate vertical bands. Wide rows retain their original 74 px height when the name fits its existing 23 px allocation; an unusually long wrapped name grows the row. Builder title and helper measurement determine the search, selection tray and roster positions together.

Search filtering, card selection, information buttons, nine-ball validation, Use, Back and Start behavior are unchanged. Neither catalog nor gameplay files were edited. The current source data still contains **224 visible special balls, 36 canonical decks and 4 featured decks**.

## Browser QA coordinates

All coordinates are Unity canvas pixels, before scrolling. Runtime font metrics determine the helper deltas below; those deltas are intentionally measured, not hard-coded.

At **390 × 844**, the library uses a 318 px row at global x = 24. Let `L = max(27, TextHeight(libraryHelper, 342, 13)) - 27`. Player choices and the list move down by `L` from their R4 positions; the list starts at `308 + L` and still ends at y = 762. A normal one-line row has height **121**, followed by an **8 px gap**, rather than R4's 74 + 8. Its local coordinates are:

| Element | Row-local box |
|---|---|
| Full name | x 14, y 9, width 290, height at least 23 |
| All nine previews | 19 × 19, y 42; first x 16, last x 283 |
| P1 | x 14, y 73, width 140, height 36 |
| P2 | x 164, y 73, width 140, height 36 |

The global action centers are x = **108 / 258**, y = `399 + L + 129 × rowIndex - scrollY`. REALITY HACKERS is featured index **3**, so its unscrolled top is `695 + L`; scroll approximately 130–200 px to capture the complete row and both actions. Font metrics are expected to put `L` near 6 px, but the rebuilt player's screenshot must establish that exact value.

The 390 px builder keeps Back centered at **(318, 93)** and Use at **(195, 801.5)**. Let `T = max(32, TextHeight(builderTitle, 222, 16, bold))`, `HY = max(116, 84 + T)`, `HH = max(24, TextHeight(builderHelper, 342, 13))`, and `SY = max(153, HY + HH + 13)`. Search starts at `SY`; selected text starts at `SY + 43`; roster starts at `SY + 78`. A search click at **(180, 185)** and first information click at **(306, 300)** accommodate the expected measured positions. The prior information click y = 273 is near the new top edge and should move down. Exact search/roster y values require the new player; typical two-line metrics place search near 169–171 and roster near 247–249.

At **667 × 375**, single-line helper text retains player y = **151**, library list top = **244**, and list bottom = **293**. The 595 px wide rows keep height **74** plus an 8 px gap. First-row P1/P2 centers remain **(508, 280)** and **(580, 280)**. Scrolling about 20 px exposes the entire action row within the short viewport. Start remains centered at **(333.5, 331.5)**. Builder search y = **153**, roster y = **231**, and Use y = **311** remain the baseline positions when measured title/helper heights fit their original allocation. The 960 × 600 desktop keeps its existing row/scroll/footer geometry under the same condition.

## Verification and integration

`Tests/SetupLayoutTests.cs` checks usable name height, all nine in-bounds and non-overlapping previews, separation from both actions, in-bounds usable actions, a dedicated narrow preview band, and compact wide rows. Fixtures cover row widths 248, 318, 595 and 888 (320 px phone, 390 px phone, 667 px landscape and 960 px desktop).

An isolated scratch .NET runner first exercised a direct extraction of R4's row coordinates: **1 passed, 5 failed**, including clipped measured names and preview/action overlap. The same six checks then compiled the real new `SetupLayout.cs`: **6 passed, 0 failed**. The runner did not invoke the shared test entrypoint or write shared Evidence files. `git diff --check` reported no whitespace errors. No Unity process, full suite or build was launched by this layout task.

Root integration requires the `SetupLayout.cs` compile include in `Tests/CoreClash.Tests.csproj` and a `SetupLayoutTests()` call in `BoundaryTests.ExtraTests()`. Root owns those files and has applied the hooks. Unity will create the new source asset's `.meta` during its normal import. Root will run the full suite and rebuilt Windows, WebGL and Android checks, including actual phone/short-landscape interactions and fresh screenshots.
