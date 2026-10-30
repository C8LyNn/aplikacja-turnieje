# CC-001 R17-W12 / A32 — Phoenix Hand local deck display (ISOLATED)
**Author base:** A70 W11 frozen QA source `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. **Read-only source baseline; freeze ref is not modified.**
**Scope:** deck visual information while waiting for opponent, not Phoenix ability execution or turn authority.

## Confirmed presentational inconsistency
Frozen local-deck code correctly displays normal P2 stock while P1 is active, but calls `LocalDeckContent.ActiveSource` for the Phoenix Hand display. `ActiveSource` is intentionally turn-gated. If P2 has zero Phoenix stock and a ready local Phoenix Hand during P1's turn, the local P2 deck wrongly shows `EMPTY` / `OUT OF STOCK` rather than the ready hand.

## Patch
- New `LocalDeckContent.DisplaySource` is **read-only** and checks local-stock-first then the same ready Phoenix owner/turn-stamp predicates used by `BallSelection.Source`. When the owner is active, it delegates to the canonical `BallSelection.Source`.
- `VisibleAsAvailable` and `StockLabel` now represent local owned Phoenix Hand even during opponent turns; `MatchView` visual cards (compact and desktop/phone) consume DisplaySource.
- **Crucial security/gameplay gate unchanged:** `LocalDeckContent.CanActivate` and `BallSelection.Source` still enforce `state.turn==owner` and `CanChoose`. `GameSimulation`, Phoenix hand generation/expiry, snapshot/network, and actions are untouched.
- Five C# regression tests (A32 local deck total: 15) for waiting P2 hand, local activation, stale/unready/wrong-owner rejection, stock precedence, and observation without mutation.
- No V148 Mitosis, Furnace FIRE zone, R16 HP, deck composition, balance, Physics, Networking or Protocol149 edits.

## QA boundary and integration policy
Independent source/diff checks are source-level only. C# tests have been **authored, not executed** here (no .NET compiler). Windows Unity Player and real PC1/PC2 tests not performed.
A70 owns selection and selective integration only **after formal W11 closure**. A72 and A60 test the immutable `3f972...` freeze as-is, not this W12 branch. No main/release merge.
