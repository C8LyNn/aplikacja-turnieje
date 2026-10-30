# CC-001 — R17-W12 / A41 — capped periodic snapshot byte budget

**Agent:** A41 — Backend / Multiplayer. **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).  
**Wave:** R17-W12, **isolated development only** while W11 native QA is HOLD.  
**Base:** exact immutable **W11 QA freeze** `integration/cc001-r17-w11-qa-freeze-20261030` SHA `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`; this source ref is **NOT edited**.  
**Own branch:** `feat/cc001-r17-w12-a41-byte-budget`.  
**Protected:** RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, R16, V148, Protocol149, main, frozen W11 and site unchanged.

## 1. Concrete source issue and patch

**Existing W11 selected source:** host uses `NgoGameSession.LateUpdate` to encode `SessionSnapshot` with `NgoWireProtocol.Encode` and schedule periodic full-state send using `NetworkSnapshotRate.Interval(phase, packed.Length)`. W11 rate has nominal Moving 20/12/8/4 Hz based on compressed payload size; idle 4 Hz. **This limits packet frequency but not bytes/sec** for large compressed payloads: a 63 KiB pack at 8 Hz sends ~504 KiB/s compressed data; a 256 KiB pack at 4 Hz sends ~1024 KiB/s compressed data, near the configured 1 MiB UnityTransport send queue capacity. These are **calculated source upper-rate examples**, not a measured transport backlog.

**W12 implementation (pure managed C#, no NGO RPC/wire changes):** `NetworkSnapshotRate.Interval` now returns the greater of original nominal interval and `compressedBytes / (256*1024f)`. This enforces a nominal compressed **256 KiB/s periodic sender budget** across Moving/Aiming/Over. Preserves all original cadence thresholds and 120 Hz *server-side gameplay simulation*, only changes scheduling periodic full-state sends at large compressed payload sizes. Examples:

| Compressed bytes | Old phase | Old interval | W12 interval | Reason |
|---|---|---|---|---|
| 4 KiB | Moving | 0.05s | 0.05s | 20 Hz preserved |
| 16 KiB | Moving | 0.125s | 0.125s | 8 Hz preserved |
| 48 KiB | Moving | 0.125s | 0.1875s | Throttle ~5.33 Hz |
| 63 KiB | Moving | 0.125s | 0.24609375s | Byte budget |
| 64 KiB | Moving | 0.25s | 0.25s | 4 Hz maintained |
| 128 KiB | Moving | 0.25s | 0.5s | ~2 Hz |
| 256 KiB | Moving | 0.25s | 1.0s | ~1 Hz |
| 256 KiB | Aiming/Over | 0.25s | 1.0s | Idle budget |

**Explicit limitations:** not a transport congestion/backpressure API or measured queue occupancy; command/connection events that set `nextSnapshot=0` may emit extra snapshots outside the nominal periodic budget; compression payload excludes RPC/UDP/WebSocket headers, chunk overhead and acknowledgements; no guaranteed network throughput cap. The longer intervals of large boards **can reduce visual temporal resolution**, even with A34's no-extrapolation 250ms smoother. Therefore the change is **W12 ALT_HOLD for A70/A60 decision**, not auto-admitted into W11 QA freeze and not a claim to fix real user stutter.

## 2. Tests authored and actually executed

**C# source:** `Tests/NetworkSeatTests.cs` updated three older expected nominal interval assertions for large payloads and appended **4 managed test definitions**, 34 total declarations in that suite. Tests validate 24/48/63/128/256KiB thresholds, rate ceiling across Aiming/Moving/Over (step 1024 bytes through codec maximum 256KiB), original small moving 20 Hz, invalid size slow-fail and original idle turn. The existing suite is still registered in `Tests/Program.cs`.

**Executed against exact new GitHub C# source blobs through V8 source checks and an independent JS numeric policy *model* (NOT compiled C#):**
- **17/17** source/contract readback checks PASS on modified C# + unchanged NGO / Protocol149 codec; byte floor, threshold correctness, no NetworkStateDigest import, host-side schedule still reads actual compressed length, owner/seat and 149 intact, 34 C# definitions.
- **3072/3072** numeric policy-model budget assertions PASS (1024 compressed sizes × 3 phases) and **16/16** handpicked boundary assertions PASS. Numeric model tests are reference arithmetic, not actual invocation of C# `NetworkSnapshotRate.Interval`.
- Exact GitHub blobs at source verification time: `NetworkGameSession.cs` `b1ae3c71926a544aa171be8fcfe0a22036e7478d`, `NetworkSeatTests.cs` `1f55f1d020cb91720df6659784f7c0c5f78fc829`; unmodified `NgoGameSession.cs` `2e64b8d0bac82b58fc33e84f701f2331ac2feef0`, `NgoWireProtocol.cs` `4a611ee8bdcd929b577f515768fa10dcef8410fc`.

**NOT RUN:** .NET9 managed tests/Unity compile/Windows build, real NGO bandwidth/CPU/queue telemetry, physical PC1/PC2 latency/render/stutter/physics, A60 independent QA. Local environment has Node v22.16.0/Git but no dotnet/Unity. Therefore no native green gate, no G3/G4 success or claim that worsening visual smoothness is impossible.

## 3. Integrator / native QA handoff

**A70:** Only consider W12 PR after W11 frozen source SHA `3f972cd...` has real Windows build plus A60/A31 physical PC1/PC2 evidence and **formal W11 close**. If accepted, create a *new W12 isolated candidate with new exact SHA*, not revise W11's QA freeze. A41's older parity instrumentation [PR #214](https://github.com/C8LyNn/aplikacja-turnieje/pull/214) is **not in W11 QA freeze** and not imported into this W12 patch; do not confuse competing telemetry/noisy source variants. Live moving #207 contains the sampled digest separately; exact source SHA matters.

**A72:** Build Windows Player only from owner-confirmed exact candidate. A72 currently owns re-pinning old W11 build kit to frozen `3f972cd...`; **this W12 network patch is not a reason to update the W11 build pin**.

**A60/A31:** First run W11 native on fixed SHA and compare host/client source parity. When separately evaluating W12, profile compressedBytes / periodMs / actual NGO reliable send queue on genuine two PCs at small, 48–64KiB and >=128KiB payload; plot frame-to-frame ball motion and P2 legal accepted-once. Compare against exact frozen W11 binary, not a mock. Reject if bandwidth improvement comes with unacceptable temporal hold/freezes/quality loss; if measured congestion is absent, keep W12 alternative unmerged.

**Owner decisions:** preserve exactly Mitosis V148, Furnace only FIRE zone + periodic damage, all R16 HP. This patch touches *only* network rate helper and C# managed tests; no gameplay/catalog/ability/physics/simulation protocol modifications.

**Status:** DESIGNED YES / IMPLEMENTED YES (isolated code+tests) / TESTED STATIC 17 + V8 MODEL 3072 + BOUNDARY16 ONLY / C# & UNITY NOT_RUN / INTEGRATED NO / RELEASED NO. **G3/G4 HOLD; W11 frozen, W12 source ALT_HOLD until HQ/A70/A60 acceptance.**
