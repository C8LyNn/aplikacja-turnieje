# CC-001 R17-W10 — A83 UX merge admission (source-only)

**Owner:** A83 Human Factors / UX. **Baseline:** frozen `integration/cc001-r17-w8-phoenix-rc1` at `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

## Why
W9 produced overlapping `MatchView.cs` changes in A20, A21, A30, A32 and A83. Blindly merging them can restore the PC2 false YOUR TURN prompt or show the active opponent deck as a local deck. This gate is **an executable check on the assembled source tree**; it does not edit or merge any Unity source and cannot replace actual A60 Unity/native QA.

## Chosen owner interfaces (not merge authority)
- **Local turn and actionable prompts:** prefer A21 PR #170 `TurnPerspective`, including unknown/disconnected seat fail-closed behavior. **Do not** also carry A83 PR #160 `MatchTurnCopy`, A20 `LocalTurnPresentation` or A30 `MatchPerspective.TurnText` in `MatchView.cs`.
- **Local deck contents:** A32 PR #173 `LocalDeckContent` for desktop, compact landscape and phone. Stock may be visible on the opponent's turn, but its buttons must be disabled.
- **Arrow geometry:** A20 PR #168 field-local aim rendering, review its `BoardView.cs` hunk separately from its competing turn text.
- **P2 local-bottom perspective:** A30 PR #175 proposal needs A10 UX decision and independent pointer/view transforms; this gate does NOT certify a P2 flip.
- **Network snapshot rate/smoothing:** A30/A41 and A34/A50 are competing engineering implementations, owned by A70+A31+A50, not A83. No network PASS inferred from UX source.
- **Power meter:** optional `--require-no-power` after confirmed A10 decision. Do not declare the meter removed from the existing W9 candidate merely because the flag exists.

## Run
```bash
node --test scripts/cc001/w10/a83/ux-merge-gate.test.cjs
node scripts/cc001/w10/a83/ux-merge-gate.cjs unity/cc001-r16/CoreClash-V149-Unity
node scripts/cc001/w10/a83/ux-merge-gate.cjs unity/cc001-r16/CoreClash-V149-Unity --require-no-power
```
Exit **0** => `PASS_SOURCE_ONLY`; exit **1** => `HOLD`. The optional flag checks absence of dedicated power meter. Apply it only to an A10-authorized no-meter candidate.

## Checks
UX01 required source files; UX02 exactly one selected local-turn renderer in MatchView; UX03 fail closed if no connected valid seat; UX04 opponent turn; UX05 actionable hint and compact phase wiring; UX06 local stock in all three UI layouts; UX07 cannot activate non-active seat cards; UX08 no rotating GUI matrix in arrow rendering; UX09 registered A21 managed tests; UX10 optional A10 meter removal.

**Actual execution of this branch:** Node 22.16.0; 9/9 deterministic positive/negative tests passed locally (all test fixtures are simulated source strings, NOT human participants or Unity runtime). No C# compiler/Unity available here, so compiled tests and real PC1/PC2 visual-snapshot QA are **NOT RUN**. A60 must test actual accepted assembly and two physical PCs. A72 owns a rebuilt Windows artifact; A70 controls integration. No RC1/R16/V148/Protocol149/main or release changes.

## Verified source discrepancy
RC1 `NgoGameSession.LateUpdate` uses `(phase==Moving ? .2f : 1f)` for snapshot schedule; A30 W9 handoff described 2.0 seconds while Moving. The source is **0.2 seconds (5 Hz)**. This is a report discrepancy, NOT proof that changing to 0.05s (20 Hz) solves observed stutter.
