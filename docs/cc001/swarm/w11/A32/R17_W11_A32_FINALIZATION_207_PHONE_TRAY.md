# CC-001 — R17-W11 / A32 Finalization: Local P2 Deck Phone Tray

**A70 selected candidate:** Draft #207 now at exact SHA `8fce19b9fefb05fb8e781417af7455749979d93e` (previous `173273122c11cbf738e8b954e32506a6196fe8ec`), immutable protected RC1 ancestor `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

## Confirmed selected-candidate defect
W11 #207 includes A32 #178 six-test local stock implementation, **not** the later #196 phone empty-roster fix. On invalid or disconnected local seat, `LocalDeckContent.StockIds` returns empty. Existing `RenderPhoneTray` computes `fullW=ids.Length*(cardW+8)-8`, therefore **-8 px** for zero IDs, and retains old `trayScroll.x` from the previous nonempty P2 list. Disconnected seat also displayed a stale selected-ball name. This is a view-only defect, not physics/snapshot/turn authority.

## Minimal deterministic implementation
Exactly **three preexisting files** are changed by copying the **exact Git blobs already proven on isolated A32 #196**, not manually re-implementing:
- `LocalDeckContent.cs`: `TrayContentWidth` validates width for zero deck / bad numeric dimensions; `ClampTrayScroll` bounds or resets stale offsets.
- `MatchView.cs`: phone tray uses finite viewport/content width and clamps its scroll before drawing; disconnected invalid seat header says `DECK UNAVAILABLE`.
- `Tests/LocalDeckContentTests.cs`: four extra authored managed C# regressions on top of six prior tests (ten total) for empty roster, 9-slot width, invalid dimensions, seat-loss scroll reset.

Original #207 version of these three files exactly matched #189 at blob level; all three new blobs are byte-for-byte identical to #196, so no unique candidate rebase changes or conflicts.

## Protected boundaries
No changes to Core / Networking / Physics / Data / V148 / R16 / Protocol149 / RC1 / ball stats / deck slots. Inherited A41 20/12/8/4Hz snapshot policy, A34 single wired smoother, A20 aim and owner labels, A10 no-strength rule, A33 F1 diagnostics and A70 revision monotonicity stay untouched.

## QA
A32 source/Git and basic arithmetic checks only. The 10 C# managed tests are **authored, not executed** in A32 environment; Unity Windows build **NOT_RUN**; real two-PC independent A60 test **NOT_RUN**. Any new A70 acceptance **changes its candidate SHA**, thus A72 must repin exact Windows build; never certify the old #207 SHA with new source.

**Integration:** A70 only; draft into the selected A70 #207 branch after owner admission, no RC1/main merge/release.
