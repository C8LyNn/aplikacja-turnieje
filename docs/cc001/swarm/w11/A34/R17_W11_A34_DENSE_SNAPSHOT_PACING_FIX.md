# CC-001 R17-W11 / A34 — dense-board P2 visual-pacing correction

**Project:** CC-001 — R17 W11 / HQ #97
**Agent:** A34 — Performance / Technical Systems
**Type:** narrow production correction + managed regression tests, **not** a competing integrator
**Exact stacked parent:** A30 W10 addon PR #189 at `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`.
**Upstream:** A70 W10 candidate PR #181 at `3d377767e72473cebd90e49293a0cd5dada70464`.
**Owner:** A70/Codex decides inclusion; A72 build; A60 QA. No merge to RC1/main/release.

## Reproduction / rationale

A41 W10 selected adaptive full-state snapshot pacing, in `NetworkSnapshotRate.Interval()`:
- compressed Moving <8 KiB: **20 Hz** (`0.05s`)
- 8–16 KiB: **12 Hz** (~`0.083s`)
- 16–64 KiB: **8 Hz** (`0.125s`)
- 64 KiB or more: **4 Hz** (`0.25s`)

The accepted A34 visual smoother was capped at **200ms**, so under 4Hz it necessarily reached the target pose at t=200ms, held the static pose for the last **50ms**, then moved again on the next snapshot. This causes an avoidable 20%-of-period static dwell under **ideal regular 4Hz snapshot receipt**, before considering actual network jitter. The 4Hz effect is *deduced from source pacing and easing equations*, not observed on two PCs.

## Bounded fix

Change one production constant in selected `RemoteBallSmoother`:
`MaxDuration=0.2f` -> `MaxDuration=0.25f`.

This keeps the interpolation period tied to actual received snapshot intervals, never allows extrapolation, preserves `MaxGap=0.6f`, snap thresholds, action reset, identity checks, fresh `PORTAL` event snap and authoritative GameState/physics. 20Hz/12Hz/8Hz existing intervals use their actual period, not 250ms.

A34 specifically does **not** alter `NetworkSnapshotRate`, NGO reliable RPCs, rate-limit, input/aim, A10 power UI, P2 perspective, collision, action decisions, game balance or Protocol149.

## Regression cases

Added **2 C# managed test cases** in the existing A34 test group, bringing group to **16**:
1. 4Hz scenario with x=100 -> 200, snapshots at 1.00/1.25 seconds: at 1.45 seconds expected **x=189.6**, not x=200 early; at 1.50 seconds and later expected exactly the latest authoritative target x=200 (no extrapolation).
2. 8Hz scenario, snapshots at 1.000/1.125 seconds: at t=1.1875 expected the midpoint x=150; endpoint exact at t=1.25.

**Actually executed in this task:** 22/22 V8 source-bound and numerical-policy assertions PASS on exact GitHub-fetched A41 network and A34 source/test blobs: `RemoteBallSmoother.cs` blob `7c5efd81457c03322de6a0ca179a669dce3a20e2`, test blob `d802bb5fa5b286310fd5ea602241d8f124c704d9`. These are **not** C# compilation or Unity/PC1–PC2 QA.

**NOT EXECUTED:** `dotnet run` because .NET SDK/Mono/Unity is absent here; native Windows Unity Player; physical PC1–PC2; profiler frame times / latency/backlog. No G3 PASS.

## Integration gates

- **A70** decides to adopt the upstream W10 #189 addon and only then this stacked A34 correction. Do not independently merge into frozen RC1 or main.
- **A60** runs managed C# suite including 16 A34 tests + compares 4Hz/8Hz/12Hz/20Hz client P2 draw trajectories and first-frame/PORTAL hard snap on native physical pair, at low/high ball counts. Capture exact code/EXE SHA256, raw traces and frame-time p95.
- **A72** rebuilds Windows Player from the actual A70-admitted SHA, not the old #181 source SHA. Preserve RC1/R16/V148/Protocol149.
- A50's earlier competing smoothing PR #169 was closed unmerged. **No second smoother.**

## Current status

**IMPLEMENTED:** YES (isolated W11 stacked patch)  
**SOURCE / NUMERICAL CHECKS:** 22/22 PASS  
**C# MANAGED EXECUTION:** NOT RUN  
**UNITY BUILD:** NOT RUN  
**REAL PC1/PC2:** NOT RUN  
**INTEGRATION:** NO  
**RELEASE:** NO  
**G3/G4:** HOLD
