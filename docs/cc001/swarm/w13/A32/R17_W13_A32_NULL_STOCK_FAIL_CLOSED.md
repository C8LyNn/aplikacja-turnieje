# CC-001 R17-W13 / A32 — Null stock fail-closed deck UI

**Strict isolation:** stacked from own W12 PR #226 at SHA `4ca793f47eb982a16c8670d975220ee535430352`; NO change to frozen W11 QA SHA `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`, moving PR #207, protected RC1, R16, V148 or Protocol149. A70 selects after W11 QA closure.

## Source-proven issue
`LocalDeckContent.StockIds` already returns empty when `PlayerState.stock==null`, but `Remaining`, `DisplaySource`, `ActiveSource` and `CanActivate` could call `GameSimulation.Stock` / `BallSelection.Source` on the null stock. Canonical `GameSimulation.Stock` dereferences `State.players[owner].stock.FirstOrDefault`, so this presentation path would throw for incomplete local state. The normal network adapter rejects null stock, so this is a defensive malformed/provisional-state guard, not a claim of an observed real PC crash or remote packet exploit.

## Implementation
One shared private `HasOwnerStock` predicate requires state, P1/P2 seat, owner player and non-null list. All four display/permission helpers now fail closed before dereferencing invalid local roster. No new selection rights; authoritative owner/turn check and canonical `BallSelection.CanSelect` remain unchanged. `StockIds`, Phoenix Hand rules, board, physics, network and game data untouched.

Five C# regressions authored for waiting P2 null stock, P2 own-turn null stock, null player, null players array, and preserved 9-slot Phoenix Hand fixture. Fixture W12 corrected: Phoenix replaces one existing slot instead of adding an invalid tenth stock entry. A32 managed test definitions: 20 total. **NOT executed (.NET9/Unity absent).**

W13 source/diff checks are not native C# execution; any custom Node tests are explicitly source-scoped. A72/A60 must continue frozen W11 binary + 2PC QA without this branch. No protected merge/release.
