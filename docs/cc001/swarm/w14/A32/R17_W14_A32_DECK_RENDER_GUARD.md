# CC-001 R17-W14 / A32 — Robust Catalog/Deck Card Rendering

**Isolation:** strictly stacked on A32 W13 [PR #245] exact `6db31267a3c0dd6b06210f40b809a6635ff1dc91`, not W11 QA freeze `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. A70 owns any future integration; no merge or release.

## Verified source defect
`NetworkGameStateAdapter.IsValidState` checks `StockEntry.id != empty` and remaining>=0 but does not cross-check the actual Catalog. `MatchView.CompactBallCard` dereferences `Catalog.Ball(id).name`, `BallCard` dereferences `d.hp`, so a nonempty *unknown* stock id accepted structurally could generate `NullReferenceException` while rendering the host/client deck. The normal game constructor validates the original nine balls; this is a malformed/provisional replica defense, not a claim of a physically reproduced LAN crash.

## Production change
- Add pure `RenderableStockIds(GameSimulation,owner)`: require exactly nine nonnull/unique IDs, nonnegative stock and registered `Catalog.Ball(id)` for every visible card, preserving original order or returning no cards on invalid deck. No state mutation.
- Strengthen shared `HasOwnerStock` used by A32 read-only display and card eligibility to protect null entry and negative amount from direct `GameSimulation.Stock` access, not just null whole list.
- `CanActivate` additionally fail closes unknown catalog IDs (real `SelectBall` already checks this).
- Desktop/compact/phone `MatchView` calls `RenderableStockIds` instead of the raw snapshot list before dereferencing catalog metadata. No changes to launcher/aim/turn/authority.
- Add **six** managed regression C# cases (A32 total **26**): original nine ordered cards, unknown ID exclusion, duplicate ID rejection, null entry on both turns, negative quantity rejection, eight/ten slot invalidity.

## Boundaries/gates
Mitosis V148, Furnace FIRE+periodic only, HP R16, Protocol149, catalog data, Core/Networking/Physics, Unity scene and package versions unchanged. New UI protection does NOT replace A31's required network snapshot structural validation. There is **no evidence a real PC2 received malformed IDs**; source vulnerability confirmed.

GitHub source/diff checks only; **C# .NET9 execution NOT_RUN, Unity Win64 build NOT_RUN, two physical PCs NOT_RUN**. W11 frozen SHA must remain sole A72 native target until A60/A31 independent QA concludes. Proposed W14 enhancement is an optional isolated follow-on, not a reason to change the build lock.

**Status:** CODE_COMMITTED / SOURCE_SCOPE_VALIDATED / CSHARP_NOT_RUN / DEV_HOLD / W11_QA_FREEZE_INTACT / NO_MAIN_OR_RELEASE.
