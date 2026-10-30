# CC-001 R17-W11 / A83 — local-seat visual truth

**Ownership:** A83 UX / Human Factors. **Base candidate (not accepted):** A30 #189 exact commit `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`, stacked on A70 #181 `3d377767e72473cebd90e49293a0cd5dada70464`, RC1 ancestor `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

## Implemented behavior

1. On a network client, only a **connected** valid P1/P2 local seat receives a `YOU` badge (desktop/portrait HUD and compact landscape). A disconnected or invalid seat never appears locally confirmed.
2. The selected local ball is displayed in a **launcher preview only when the local player can actually aim**. In particular, PC2 cannot preview its P2-deck-selected ball inside P1's active launcher while P1 owns the authoritative turn. The fix does not mask existing runtime or remote balls, and it does not alter host authority, match state, hit testing, or command admission.
3. Offline hotseat still shows the selected ball at the active launcher when it can aim.

## Source footprint

- `Presentation/LocalSeatVisuals.cs` + new Unity `.meta`: pure policy helper
- `Presentation/MatchView.cs`: render callsite + two seat badges
- `Tests/R17W11A83SeatVisualTests.cs`: 5 managed regression cases
- `Tests/Program.cs` + `Tests/CoreClash.Tests.csproj`: tests + helper registration
- `scripts/cc001/w11/a83/check-seat-visual.cjs` + `.test.cjs`: runnable source gate and negative fixture suite
- this README

No edits to `CoreClashApp.cs`, `BoardView.cs`, NGO networking, physics, `LaunchGesture`, Protocol149, R16/V148, main or A70's existing branches. Integration/merge remains **A70-only**.

## Run validation

```sh
node --check scripts/cc001/w11/a83/check-seat-visual.cjs
node --check scripts/cc001/w11/a83/check-seat-visual.test.cjs
node --test scripts/cc001/w11/a83/check-seat-visual.test.cjs
node scripts/cc001/w11/a83/check-seat-visual.cjs unity/cc001-r16/CoreClash-V149-Unity
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/CoreClash.Tests.csproj -- unity/cc001-r16/CoreClash-V149-Unity
```

**A83 execution:** Node 22.16.0: **8/8 negative/positive source fixture tests PASS** (real Node run, not a game test); all **9 source assertions PASS** against the exact fetched GitHub candidate file contents in this branch. No `dotnet`, `mono`, `csc`, `Unity` executable in this agent environment; therefore the 5 authored C# tests, native Windows build, and real paired PC1/P2 verification are **NOT_RUN**. A60 and A72 must certify the integrated exact SHA. No inferential claim that gameplay/performance improved.

## Specific manual A60 scenarios

- PC2 connected and P1 aiming: PC2 badge YOU (P2 only); no P2 chosen-ball preview in P1 launcher.
- PC1 connected and P2 aiming: corresponding symmetric condition.
- P1/P2 disconnected/rejoining: remove YOU until connection and authoritative snapshot confirmed; do not offer click-to-launch in unknown seat.
- Offline hotseat: active selected-ball preview unchanged.
- P2 view flip and 16:9/portrait/compact: verify selected launcher preview remains consistent with actual local seat. Inspect world balls still available, power bar stays absent.
- Verify no performance impact; this helper is constant-time and read-only, but measurement still required.

**Decision gate:** conditional addon only; #189 is draft/not selected by A70 yet. If A70 chooses another base, port only these helper/callsite semantics after comparing exact current `MatchView` content. Never merge the entire competing PR list.
