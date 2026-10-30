# CC-001 R17-W12 — A34 bounded client P2 visual-pacing telemetry

**Project:** CC-001, task 008, A34 Performance / Technical Systems. **HQ:** Issue #97.  
**W11 exact native QA freeze:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` under `integration/cc001-r17-w11-qa-freeze-20261030`. **DO NOT MOVE OR MERGE THIS REF.**  
**W12 isolated development parent:** `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c` (A70 post-freeze additional work), with separate fixed review-only base branch `review/cc001-r17-w12-a34-postfreeze-base`. NOT an accepted W11 test source.

## Implemented — real production code

1. `RemoteVisualPacingTelemetry` samples P2-only frame durations on `Update` and measures gaps between already-admitted authoritative revisions. It is bounded: preallocated 512-frame ring and sort scratch, one sorted P95 per 5 seconds (no per-frame array allocations). C# implementation independent of Unity classes, except call sites.
2. New read-only `RemoteBallSmoother.LastBlendSeconds` exposes the last observed visual interpolation period (reset on new match) without changing actual pose/velocity or `Protocol149`.
3. `CoreClashApp` calls `AcceptSnapshot` only AFTER strict monotonic receiver admission; samples frame only when connected client P2, and resets on setup/match. Logs one redacted record per five-second P2 window. No logs from host, local games, or disconnected peers.

Example marker and fields (numbers are **illustrative**, not captured physical results):
```
CC_W12_VISUAL_P2 elapsed=5.01 frames=300 frameSamples=300 fps=59.88 frameP95ms=18 snapshots=60 maxRxGapMs=85 postBlendWaitMs=24
```

Fields: `frameP95ms` is 95th percentile of the most recent up to 512 moving-frame deltas within a window; `fps` uses sum of moving frame deltas, not the full five-second wall window. `maxRxGapMs` is max interval between **observed accepted** packets. `postBlendWaitMs` is estimated frame time after the last accepted interpolation reached its target: **NOT proof of physical balls being stuck**; stationary balls are allowed. Interpolation does **not extrapolate**. The marker does not contain addresses, identifiers, user data, payload contents or auth secrets.

A **5-second aggregate cannot certify packet-by-packet parity** or end-to-end latency between separate PC1/PC2 clocks. Compare it with A41's `CC_W11_STATE_TX/RX` exact-revision sampled SHA256 and A51/A81 independent two-PC log admission. Correlate real frame-time p95 with same-build PC2 video, native console and CPU/GPU profiler before conclusions. No own confidence labels falsely represent G3.

## Seven managed regression definitions

Wired into `Tests/Program.cs`, added to `CoreClash.Tests.csproj`:
- exactly five-second report timing and counts
- accepted-snapshot gap and P95 percentiles
- post-blend wait accounting with no extrapolation claim
- invalid/negative/NaN time suppression
- 650+ frame stress proves fixed 512 ring
- reset/end-of-motion session safety
- output marker privacy and per-window rate limit

**Source/equation checks** are read-only and source-backed. The managed C# suite has **not been run** in this A34 runtime because `dotnet`, Mono, Unity are absent. Unity6000.4.0f1 Windows Player, physical PC1/PC2 and A60/A31 G3 are also **NOT RUN**. The preview log line above is synthetic, not a result.

## Required QA & integration

- **A70**: select optional W12 QA telemetry as a separate addon **after formal W11 closure**, no overlap with A41 authoritative packet digest, A33 existing F1 UI or A51 analyzers. This change does not replace them.
- **A72**: compile .NET9 suite; build exact accepted W12 SHA in Unity6000.4.0f1; produce unflattened Player SHA256 manifest, native logs and output.
- **A60/A31**: independently verify two real PCs, correct P2-only marker frequency (every five seconds while moving), no host marker, frame-time p95, snapshot interarrival and bounded memory at LOW/HIGH density; preserve P1 and P2 physics, turns, short PORTAL/TELEPORT/SWAP jumps, and authority parity at same revision. The old W11 frozen build remains a **separate** QA target and cannot inherit W12 results.

**Owner constraints:** Mitosis V148 identical, Furnace FIRE zone with periodic ticks only, HP R16. No protected gameplay, catalog, Protocol149, RC1, R16, V148 changes; no main merge/release.
**Status:** CODE DELIVERED ISOLATED / C# TESTS AUTHORED / BUILD NOT RUN / PC1-PC2 NOT RUN / W11 NOT CLOSED / W12 INTEGRATION HOLD.
