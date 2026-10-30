# CC-001 — R17-W11 / A32 Phone Tray Fail-Closed Fix

**Role:** A32 — Content / Decks. **Scope:** local player deck presentation only.

**Pinned ancestor:** RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
**Parent:** A30 [PR #189](https://github.com/C8LyNn/aplikacja-turnieje/pull/189) exact HEAD `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`, stacked on A70 #181 candidate. **A70 remains integration owner.**

## Executable source defect
The selected W10 A32 roster correctly fails closed on a disconnected/invalid local network seat (`DisplayOwner=-1` / 0 cards), but `MatchView.RenderPhoneTray` computed `fullW=ids.Length*(cardW+8)-8`. At zero cards this becomes **-8**, passed into `Draw.ScrollView` as a negative width. The horizontal `trayScroll.x` also retained the previous 9-card viewport offset when the local seat disappeared, so the phone tray could show stale scroll position.

## Concrete fix
- `LocalDeckContent.TrayContentWidth` returns a finite, nonnegative, at-least-visible content width, including empty/invalid roster.
- `LocalDeckContent.ClampTrayScroll` ensures stale offsets are clamped to the new allowed range and nonfinite inputs are fail closed.
- `RenderPhoneTray` uses both helpers and displays **DECK UNAVAILABLE** on invalid local owner.
- Four new C# tests cover zero-card viewport, nine-card width/offset, invalid numeric dimensions and P2→disconnected transition; total A32 suite 10 cases.
- No deck/stat/simulation/network/payload/physics or Protocol149 edits. P2 view and A10 power removal already chosen in A30 #189 unchanged.

## Evidence/gates
Source patch is independently SHA-pinned at PR head; GitHub base comparison proves narrow changed paths. C# regression cases are **authored, NOT_RUN** (no dotnet/Unity compiler available here). Any Node/source checks only validate structural inclusion, not Unity runtime. **Unity build / physical PC1-PC2 QA NOT_RUN.**
A70 selects integration; A72 builds exact admitted SHA; A60 validates actual Windows + disconnected phone/control cases.

**Status:** IMPLEMENTED (isolated) / STATIC_CHECKED / RUNTIME_QA_PENDING / NOT_INTEGRATED / NO_MAIN_OR_RELEASE.
