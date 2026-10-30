# CC-001 R17-W15 / A32 — Returned Phoenix Hand visible outside nine-slot stock

**Base:** A32 W14 PR #254 `6d6530092c0ac8b89f7ed22bd6b21d1ba4328eab`, stacked on W13 #245 and W12 #226. **Immutable W11 QA:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` (not modified). DEV #207 and Phoenix validator #266 are independent candidates, not admitted.

## Confirmed source UI/command mismatch
Production `GameSimulation.TryCommand` accepts `CommandKind.Spawn ballType=phoenix` when an owner-matched ready `phoenixHand` exists even if `PlayerState.stock` has **no Phoenix ID**; `BallSelection.CanSelect` agrees. However the W14 deck renderers only enumerate `RenderableStockIds` (nine original specials), so no card/button exists for the ready hand when Phoenix is not in those nine slots.

This is verified against production command/source contracts, NOT a claim this exact state appeared on actual PC1/PC2. Featured decks 0/1 carry nine normal specials without Phoenix; the isolated test creates an otherwise structurally valid ready Hand and verifies actual `TryCommand` acceptance in a future native C# run.

## Code
- New pure `RenderableCardIds` reuses strict nine-card validated stock roster and appends **one visual-only tenth `phoenix`** iff ready owned Hand exists and Phoenix ID isn't already among the nine. Does not mutate deck, stock or hand. Fails closed if nine-slot source invalid.
- All three `MatchView` deck card sections (desktop, compact landscape, phone) render the combined visual roster. Existing `CanActivate`, `BallSelection.Source`, turn/seat gating and `TryCommand` stay authoritative.
- Desktop/tablet grid reserves a fourth row and increases ScrollView content size by 106px (98 card +8 gap) or 88px (80+8) only for this special hand card; ordinary nine-card layout and actions unchanged.
- Seven new C# regression cases (33 total A32) cover missing-stock Phoenix visibility, actual command acceptance, no duplicate when Phoenix already in deck, stale/unready/opponent hand, malformed/invalid owner, fourth-row layout, and state read-only invariants.

## Evidence scope and dependencies
GitHub exact SHA/diff + code source assertions are static/structural only. **C# .NET9 tests NOT_RUN, Unity Windows Player NOT_BUILT, PC1/PC2 physical QA NOT_RUN** in A32 environment (no dotnet, Unity, Windows). A72 must build only the W11 frozen SHA, not this DEV branch. A60/A31 physical QA requires original identical Player manifest/hashes and logs.

A70 reviews after formal W11 closure; A31/A41/#266 Phoenix snapshot admission is independent. Mitosis exact V148, Furnace FIRE zone/periodic only, R16 HP and Protocol149 unchanged. No main/RC1/release merge.

**Status:** IMPLEMENTED / STATIC_QA_PENDING / MANAGED_NOT_RUN / NATIVE_NOT_RUN / DEV_HOLD.
