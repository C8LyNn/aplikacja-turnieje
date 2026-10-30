# CC-001 — R17-W11 / A34 finalization against exact A70 #207

**Project:** CC-001 | **HQ:** #97 | **A34 role:** Performance / Technical Systems
**Exact independent base:** A70 official [draft #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207) at **`173273122c11cbf738e8b954e32506a6196fe8ec`**.
**Original protected frozen RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
**Authority:** A70 integrates (not A34); A72 builds Windows; A60/A31 independently verify physical PC1–PC2; no main/release merge.

## Implemented minimal production fixes (presentation-only)

1. **P0 density-dependent visual hold:** selected A41 source `NetworkSnapshotRate.Interval()` sends compressed Moving states at 20/12/8/4Hz with **4Hz (250ms)** at >=64KiB. Exact selected A34 #207 `RemoteBallSmoother` previously had `MaxDuration=0.2f`. Thus an ideal 4Hz stream had a 50ms motion plateau before each following packet. Changed single constant to `MaxDuration=0.25f`. 20/12/8Hz still interpolate only over their shorter actual measured receipt intervals. Never extrapolate beyond last accepted pose.
2. **P1 misleading short-distance teleport path:** actual canonical Unity V149 emits `PORTAL` in `SpatialEffects.SpatialStep`, `TELEPORT` via Warp in `AbilityResolver.OnWall`, and `SWAP` via `RealityEffects.RealityStop`, where **two balls** move (`ballId` and `otherId`). Selected A70 #207 `RemoteSnapshotEvents.InstantBallIds` only included `PORTAL` ballId. When displacement is less than the 220-world-unit fallback threshold, PC2 could visually interpolate through impossible positions. New classification includes positive `ballId` for PORTAL/TELEPORT/SWAP and positive `otherId` for SWAP. Filters by new event ID, does not snap old/irrelevant events or suppress genuine motion chains.

**No change:** actual host GameState, balls/HP, simulation constants, collision/STOP/START semantics, physics, decklists, owner-turn, command power, network cadence, NGO RPC, Protocol149, protected RC1, R16, V148. Prior owner decisions retained: Mitosis exact V148, Furnace FIRE zone/ticks only, HP R16.

## Six additional managed tests authored in existing A34 suite

- **4Hz:** x100→200; at elapsed 200ms repaired value x189.6 rather than old x200 (would plateau), endpoint at 250ms x200, no extrapolation afterward.
- **8Hz:** midpoint x150 at 62.5ms, exact endpoint x200 at 125ms.
- **TELEPORT:** new Warp event causes immediate short-range snap, event cursor prevents repeated snapping.
- **SWAP:** both `ballId` and `otherId` snap instantly from one event.
- **Irrelevant/malformed/stale events:** no false snap of a non-moving or unintended ball; no inclusion of invalid partner.
- **Ordinary motion:** DAMAGE events do not force snap; normal 100ms interpolation converges.

The existing 16 A34/A70 test definitions remain present; **22 managed tests are now authored in the group**, NOT YET EXECUTED.

## Executed validation

- GitHub fetched exact new source/test blobs:
  - `Assets/CoreClash/Presentation/RemoteBallSmoother.cs`: `190cc3412a4ffaeccdcea214d7ff4086c2ea7b7b`
  - `Tests/RemoteBallSmootherTests.cs`: `25dab262dec834ee24b8830f78c37c1bf6f7f9dc`
- **28/28 V8 source-bound/static and numerical assertions PASS**, comparing real A41 cadence source, real ability event emitters, selected A34 revision guard, both event roles, no authority mutation, telemetry and test definitions.
- Numeric check: old 4Hz with cap200ms x200 at 200ms; repaired cap250ms x189.6 at 200ms; x200 at 250ms; 8Hz midpoint x150; no future extrapolation.
- These are **not** C# runtime, Unity, true network transport, or performance profiler results.

**NOT EXECUTED:** `.NET9` compile/tests (`dotnet` absent), Unity 6000.4.0f1 Windows build (Unity absent), real physical PC1↔PC2, FPS/queue/jitter/packet sizes, A60 independent G3. Do not claim native PASS, production sync repair or completed W11.

## Exact QA route

1. A70: inspect new draft PR only if #207 exact SHA accepted as baseline. Select this **replacement for old #191** which was stacked on the obsolete #189 branch; avoid double-application. Integrate manually to new *isolated* candidate SHA; never mutate frozen #207 behind QA.
2. A72: compile .NET9 suite with **22 A34 tests** and complete independent V149 Windows x64 player build for **final A70 admitted SHA**; collect binary+source SHA-256, exit code and logs. Previous 173273... build is no longer the final code if patch accepted.
3. A60 / A31: 2 physically separate PCs same signed/hash verified build, low/medium/dense ball counts, actual 20/12/8/4Hz packets, arrival gaps, measured p95 frame times and CPU/GC; verify Host PC1 authoritative positions equal PC2 canonical state at **same revision**, while view interpolates and short PORTAL/Warp/SWAP snaps. Verify player turns, aiming, P2 perspective and power UI unaffected.
4. If evidence demonstrates reliable queue backlog, packet regressions or visual artefacts, do not certify; reject or revise only within A70 authorization.

## Five-axis status

**DESIGNED YES | IMPLEMENTED YES | TESTED STATIC+NUMERIC 28/28 | MANAGED C# NOT_RUN | UNITY BUILD NOT_RUN | PHYSICAL PC1–PC2 NOT_RUN | INTEGRATION NO | RELEASE NO.**

**G3/G4 HOLD. FINAL W11 WAVE NOT CLOSED BY A34.**
