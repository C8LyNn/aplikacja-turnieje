# CC-001 R17-W12 / A33 — F1 QA Clipboard Capture (Isolated Development)

**Owner:** A33 — Presentation/UI Implementation
**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**Exact immutable-by-policy W11 QA freeze:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`
**Production/QA freeze ref:** `integration/cc001-r17-w11-qa-freeze-20261030` — **NOT MODIFIED**
**Our isolated W12 branch:** `feat/cc001-r17-w12-a33-f1-copy-qa-evidence`
**Dependencies:** W11 native Unity build by A72, two real PC1/PC2 by A60/A31, A70 final source integration. Optional future compatibility with A33 #212 local-owner cue; NOT bundled here.

## Real code

Adds a small **COPY QA** button to the existing F1 developer overlay (no gameplay UI or primary HUD changes). Click writes a bounded diagnostic text to Unity's clipboard via `GUIUtility.systemCopyBuffer`. The captured text includes:
- One UTC device timestamp in ISO-8601 round-trip format (device clock, **not verified synchronized**).
- Current turn number, authoritative/replica state revision, simulation frame and action serial.
- Existing read-only host/client, local/active seat, connection, NGO snapshot counters and accepted/rejected intent counters (the existing `W9NetworkDiagnostics` output).
- Explicit `SOURCE_SHA=UNVERIFIED`, `CLOCK_SYNC=UNVERIFIED`, `G3_STATUS=NOT_ATTESTED`. This is not equivalent to a SHA-verified Player or matching network digest.

**Privacy precaution:** The copy helper receives only `networkDebug`, **not** `networkNotice` or full `technical` UI text; the latter may include host addresses, invite codes or other unsolicited transport text. Explicit user click required; no passive copying or network transmission.

**UI:** Small top-right F1 button beside Close; title width reduced minimally to avoid overlapping controls; existing F1 scroll panel and network counters unchanged. No change in `Draw`, `MatchView`, `BoardView`, `NgoGameSession`, `GameSimulation`, `Protocol149`, Mitosis/Furnace/HP, RC1/R16/V148, source mapping, build or CI configuration.

## Files and exact Git blobs

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs` — Git blob `c2c4d7d265f3d0ac85e5a76ee20e650cb98e56d8`.
2. `scripts/cc001/w12/a33/check-f1-clipboard.cjs` — Git blob `0617812ea064ef878db8b890fb23eaa6c94051c6`.
3. This handoff.

## Test evidence (limits explicit)

**Actually executed in local Node v22.16.0:** `node --check check-f1-clipboard.cjs` exit 0; `node check-f1-clipboard.cjs --self-test` exit 0 / **13/13** synthetic positive/negative mutation assertions. Local `git hash-object` for that very same Node file was `0617812ea064ef878db8b890fb23eaa6c94051c6`, then GitHub authenticated readback returned the **identical blob SHA**.

**Exact live GitHub W12 C# source gate:** used exact GitHub-readback committed Node script's exported `inspect` under V8 with exact GitHub-readback W12 `DetailsView.cs` content, result `PASS_SCOPED / 0 errors`. This is source-pattern checking, not C# compilation or native Unity rendering.

To repeat on full checkout:
```sh
node scripts/cc001/w12/a33/check-f1-clipboard.cjs --self-test
node scripts/cc001/w12/a33/check-f1-clipboard.cjs unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs
```

**NOT RUN:** .NET9 managed compilation, Unity 6000.4.0f1 editor/PlayMode, native Windows binary build, manual clipboard verification on actual PC1/PC2, independent A60 QA or release G3/G4.

## QA use and integration rules

A60 may use this feature only **after** A70 accepts it into a later controlled candidate and A72 builds an exact SHA Windows Player. For current fixed W11 QA freeze this feature is **not available**; A60 must not use the old W11 Player to claim this button or its data exists.

The clipboard text is an operator convenience: it cannot replace original UTC logs, authenticated host/client snapshot JSON digest, video/frames, independently verified Player binary SHA256, or physical PC1↔PC2 tests.

A33 previous draft [#212](https://github.com/C8LyNn/aplikacja-turnieje/pull/212) covers **different** inspected-ball owner cues and F1 P2 color descriptor; do not bulk-merge historical A33 #176/#187/#195/#212 or duplicate W9 F1 code. A70 can select minimal compatible hunks after W11 closes.

**Status:** IMPLEMENTED=YES / NODE_SELFTEST=13/13 PASS / LIVE_GITHUB_SOURCE_GATE=PASS_SCOPED / CSHARP_WINDOWS_2PC=NOT_RUN / INTEGRATED=NO / RELEASED=NO / W11_G3_G4=HOLD.

**Protected:** Mitosis exactly V148, Furnace only FIRE zone and periodic ticks, HP R16, RC1/R16/V148/Protocol149, main and release all unchanged.
