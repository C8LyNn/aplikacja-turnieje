# CC-001 — R17-W9 — A20 Multiplayer UX Repair

**Agent:** A20 — UX/UI & Game Feel. **Issue:** #95. **HQ:** #97.
**Authorization:** owner R17-W9 role-scoped implementation dispatch, without main merge or RC1/release modification.
**Source baseline (frozen RC1):** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
**Isolated A20 branch:** `feat/cc001-r17-w9-a20-network-ux`.
**Scope:** LOCAL-SEAT TURN COPY + AIM GUIDE PRESENTATION ONLY. No networking ownership, snapshot interpolation, authority logic, gameplay, math physics or source RC1 changes.

## Operator-observed defects and scoped fixes

| Priority | Actual player feedback | A20 scope and implementation |
|---|---|---|
| P0 | PC2 remote ball teleport/stutter | **NOT MODIFIED BY A20**. A31/A41 network stream/snapshot interpolation owner. A20 source cannot prove host/client state divergence; no fake fix. |
| P0 | PC2 during P1 turn displays `YOUR SHOT` | **FIX IMPLEMENTED**: owner-relative copy through pure `LocalTurnPresentation`, fed `NetworkLink.LocalOwner`, `IsConnected`, turn/phase; remote turn = `WAITING FOR PLAYER N`, own aiming turn = `YOUR SHOT`, disconnected = `WAITING FOR CONNECTION`, moving = `RESOLVING`, game-over winner remains absolute. |
| P1 | P2 local identity ambiguous | **FIX IMPLEMENTED**: desktop/portrait HUD uses `PLAYER 2 (YOU)`, player-specific deck label; short landscape compact HUD uses `YOUR SHOT` vs `WAIT P1`; no blind `AIM` implies local turn. |
| P1 | P2 aim direction guide fragmented / disconnected | **CODE REPAIR IMPLEMENTED**: BoardView.RenderAim uses its own group-local, transform-free `AimStroke` for dashed predicted paths, arrow wings and contact line, preserving the original core AimGuide physics/wall reflections. No nested `GUI.matrix` rotations for **aim** graphics. Samples capped to 256 per segment with >=2 px step to limit fill overhead. |
| P1 | P2 sees red side at top; wants own launcher at bottom | **NOT IMPLEMENTED**: full 180° perspective remapping also changes world-to-screen pointer, ball inspection, drag launch direction, launcher and text glyph orientation. Must be coordinated with A10 and A31 before authorizing a consistent view/input transform. Labels identify P2 correctly in interim. |
| P2 | Redundant power percent/bottom bar | **NOT MODIFIED**, awaiting explicit A10 acceptance as requested. Original power semantics unchanged. |

### Exact files relative to Unity project

1. `Assets/CoreClash/Presentation/BallSelection.cs`: add Unity-free `LocalTurnPresentation.Status` + `CompactStatus`.
2. `Assets/CoreClash/Presentation/MatchView.cs`: use local seat status for turn headline, compact third HUD cell, `(YOU)` in owning HP label, and replace misleading `YOUR DECK` with `PLAYER N DECK`.
3. `Assets/CoreClash/Presentation/BoardView.cs`: limit matrix-free aim guide drawing to the active path; no changes to GUI render order, world simulation or aim power.
4. `Tests/PresentationTests.cs`: NET-UX-01..08 regression cases authored before code changes.

Only own documentation in `docs/cc001/swarm/w9/A20/**`. Frozen RC1 has zero changed refs and preserved Protocol149; changes are in isolated own branch.

## Test case manifest

| Case | Managed oracle | Execution |
|---|---|---|
| NET-UX-01 | P2 client during P1 aiming reads WAITING FOR PLAYER 1, never YOUR SHOT | NOT_RUN |
| NET-UX-02 | P2 client during P2 aiming reads YOUR SHOT | NOT_RUN |
| NET-UX-03 | P1 host and P2 client show different locally relative status for identical game state | NOT_RUN |
| NET-UX-04 | MOVING state is never YOUR SHOT | NOT_RUN |
| NET-UX-05 | disconnected P2 shows WAITING FOR CONNECTION/OFFLINE | NOT_RUN |
| NET-UX-06 | local offline/hotseat text uses absolute player, not remote-seat YOUR | NOT_RUN |
| NET-UX-07 | result winner stays absolute owner | NOT_RUN |
| NET-UX-08 | P2 aim guide trace moves from world top launcher into playfield, within arena bounds | NOT_RUN |

**Test-first GitHub commit:** `fcef70a8f3ab6e23b18285d2c246a7c8c8cc9465`.
**Compilation / execution constraint:** No .NET SDK (`dotnet`), C# compiler (`csc/mcs`), `msbuild`, Unity Editor or Windows Player available in A20 environment: **managed suite + Unity compile + real two-Windows input NOT_RUN**. Existing RC1 G1/G2 A60 361/361 managed/codec13/13/Windows smoke are historical baseline only, not QA of new SHA.
**Actual read-only checks executed:** authenticated GitHub pinned branch/file diff and 13/13 structural source assertions PASS before final doc creation. GitHub APIs do not provide process exit codes. Local command -v toolchain probes have NOT_AVAILABLE (process exit1). No game executable launched.

### Verification required from A60 and A72

- Run NET-UX-01…08 using .NET9 managed harness on **this exact A20 SHA**; report actual exit code. Existing 361 tests are not automatically this change's tests.
- In Unity 6000.4.0f1 Editor/Windows Player, check P1/P2 status with exact local role and active turn across Aiming→Moving→Aiming, disconnect and result; verify COMPACT HUD and desktop.
- Physically inspect P2 aim line including side-wall bounced trajectory, and verify no offscreen dashed fragments; compare player P1; profile draw calls/performance with developer recorder, no arbitrary PASS.
- For movement jitter, A31/A41 must distinguish 0.2s authoritative snapshots + zero client simulation/interpolation from divergent state; implement on their own authorized paths.
- P2 bottom-side camera transform and P2 aim input remap require a separate A10 UX design decision before code.
- A10 approval required before modifying redundant power UI.

### Five-axis and gate

DESIGNED=YES, IMPLEMENTED=YES_ISOLATED_UI_CODE, TESTED=STATIC_ONLY (13/13 source checks, managed/Unity/native NOT_RUN), INTEGRATED=NO (no RC1 ref or main merge), RELEASED=NO.
GATE=READY_FOR_A60_COMPILATION_AND_VISUAL_QA; R17-W9 G3/G4=HOLD; main/release/CI not authorized.
A70 must assemble only after HQ/A60 authorization. PR is DRAFT DIFF REVIEW only.

**Handoff:** A00/HQ #97, A60 independent QA, A70 isolated integration, A31/A41 networking owners, A10 perspective/power decisions. No protected changes.
