# V149 HTML LEGACY / PRESENTATION

Unity remains the primary V149 product. `Legacy/core_clash_v149_legacy_presentation.html` is an independently hostable, single-file HTML presentation derived from the certified V148 candidate. It supports local/offline play and has no network compatibility with V149 UNITY.

The HTML retains the full V148 source, roster, rules, physics, abilities, canonical 36 decks, custom builder, and existing modes. The only changes are the document title and additive presentation blocks: a menu notice, scoped styling, and a separate **CLASS DEMO / FEATURED** section. The inherited HTML online features remain legacy code and require their own legacy infrastructure; no HTML/Unity cross-play is provided.

The four provisional demonstration decks are loaded at generation time from `Assets/Resources/Data/featured-decks.json`: DEATH ENGINE, STATUS REACTOR, GRAVITY TRAP, and REALITY HACKERS. Each selects its exact nine existing IDs through the original draft selection and Start flow. They are presentation metadata, **not balance-certified decks**. They are separate from the canonical deck array and are not substituted for canonical presets, random deck selection, or the normal builder.

## Reproduce

R4 selectively imports the supplied V149.5 Quick Play menu: AI/local shortcuts,
four hero presets and collapsed Advanced settings. It delegates to the original
mode/start controls and uses the existing featured JSON IDs. Automatic restore,
polling and persistent preferences from the supplied HTML were deliberately
omitted after review. See [ARCHIVE_HTML_REVIEW.md](ARCHIVE_HTML_REVIEW.md).

Run from the repository root:

```powershell
node Tools/prepare-legacy.cjs
node Tools/prepare-legacy.cjs --verify
```

The default read-only source is `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`. For a different location of the identical certified input, set `CORE_CLASH_V148_SOURCE`. Generation refuses any source whose SHA256 differs from `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.

Generation uses only Node built-ins, has no timestamps in the generated HTML, and is deterministic for the same source and featured JSON bytes. The optional browser verification uses the available Playwright installation and isolated headless Microsoft Edge. In this desktop sandbox, browser launch requires the approved elevated execution path; generation itself does not.

Open the HTML directly for local use, or serve that file from independent static hosting. No Unity build, server, package install, or remote asset is needed for local play. Existing builder storage stays in the inherited legacy browser storage namespace.

## Verification

Evidence is recorded in `Evidence/legacy-manifest.json` and `Evidence/legacy-verification.json`. Checks performed:

- Removing exactly the generated title replacement and three additive blocks reconstructs the certified input hash byte for byte. No original gameplay function or canonical data is rewritten.
- Existing V148 runtime regression APIs pass **30/30 + 36/36 + 26/26**.
- **227 total roster entries, 224 selectable specials, 36 canonical decks**, and match rules exactly match the original runtime.
- Each of the four featured buttons selects the supplied nine IDs on desktop and phone; canonical deck count stays 36.
- A canonical preset remains selectable. The custom builder still opens, saves, and closes through its original flow.
- The existing Start button transfers the chosen deck into the player loadout, including the always-present Standard ball.
- The actual uninstrumented generated file opens and starts local play with HTTP(S) blocked.
- No page errors; no horizontal overflow in the added phone section.

`Evidence/legacy-presentation.png` and `Evidence/legacy-presentation-phone.png` were rendered and visually inspected. QA instrumentation is injected only into isolated verification browser responses; it is absent from the delivered HTML.

These checks demonstrate preservation and selection plumbing. They do not constitute new balance certification, exhaustive playtesting of all inherited V148 systems, or validation of legacy multiplayer infrastructure.
