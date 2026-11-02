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


## R17-W13 — measured pacing edge-case fixes (2026-10-30)

**Agent:** A34, continuing existing isolated W12 PR #233 (no competing separate smoother or packet-trace system). **Frozen W11:** `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`, not modified. **Development base:** post-freeze `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c`, not selected W11 QA.

### Confirmed instrumentation correctness bug, fixed in production code

On action-serial change, frame rewind or >600ms snapshot gap, `RemoteBallSmoother` clears old visual poses and **snaps** immediately. Prior `LastBlendSeconds=duration` nevertheless reported a nonzero blend even though zero interpolation occurred. A34 changed its read-only telemetry value to `LastBlendSeconds=snap?0f:duration`, preserving all visual positions and actual physics/transport. Added three C# regression cases: new action, frame rollback/long gap, stale duplicate revision plus Reset().

### Receiver gap distribution, bounded and reason-specific

The existing aggregate had only `maxRxGapMs`. At 4Hz the selected A41 update interval is 250ms; one long stall cannot be distinguished from normal 4Hz delivery by max alone. W13 adds:
- `rxGapP95ms`: P95 of last **up to 256 accepted P2 snapshot receipt intervals** in the 5s window, or **`NA`** if fewer than two snapshots (never fake zero).
- `rxGapSamples` (bounded 256) and `rxGaps` (total actual intervals observed in the window), to disclose retention limits.
- `rxGapsOver300ms`: count of intervals **strictly above** 300ms (longer than normal 4Hz 250ms), indicating scheduling/jitter only; **not proof of packet loss**.
- `postBlendWaitFrames`: number of sampled P2 Moving frames for which the most recent visual interpolation interval had elapsed, complements the original estimated `postBlendWaitMs`.

The producer uses two additional preallocated 256-float arrays (~2KiB), one O(1) update per accepted snapshot, and one `Array.Sort` of <=256 floats **only once per 5-second report**. Existing frame P95 ring remains 512 floats. No network payload logs, IP, session IDs, host telemetry writes, P2 physics, ability changes or Protocol149 edits.

### Regression suite and actual evidence boundary

**C# source:** existing seven W12 telemetry definitions extended by **six** W13 cases → **13 telemetry test definitions**. Existing 23 smoother cases extended by **three** W13 cases → **26 smoother test definitions**. Total nine new W13 managed test cases **AUTHORED / NOT_EXECUTED**.

**Actually executed:** **51/51** source-backed V8 predicates and numerical policy fixtures on exact readback GitHub blobs for new telemetry, app wiring, smoother, registered tests and .csproj. These are not .NET9 C# compiled tests or Unity PC1↔PC2 results.

**Selected source Git blob identities:**
- `RemoteVisualPacingTelemetry.cs`: `d9d275ae5115837c43c9cb009cfdd6e13573907a`;
- `RemoteVisualPacingTelemetryTests.cs`: `846e554c76b96251e22365cfbb67bd9cdac83b62`;
- `RemoteBallSmoother.cs`: `a2dbaee6c4562b1efd1c8308766c56660dc09949`;
- `RemoteBallSmootherTests.cs`: `856d2f823fcb473fc8f05f1e4c33d81252f31a03`.
Those are exact GitHub-content SHA-1 Git blobs, **not** Windows EXE/DLL SHA256.

**Real compiler and native blocker:** this A34 environment has Node22.16.0 and git, but **no** `dotnet`/.NET9 SDK, Mono/C# compiler, Unity 6000.4.0f1, Windows Player build support or two physical PCs. No native managed test, Windows x64 build, frame metric or PC1–PC2 G3 validation was executed by A34. Native A72/A60 work requires authorized Windows machine with Unity license/Build Support/.NET9 and original pinned Player SHA256 inventory.

**Required routing:** A70 keeps freeze immutable; A72 must build frozen W11 exact SHA before physical QA; A60/A31 test W11 freeze independently (which does NOT include this W12/W13 telemetry). Only after formal W11 close may A70 select W12/W13 PR #233 into an isolated new exact-source candidate for a fresh native build/QA run.

**W13 state:** IMPLEMENTED IN OWN ISOLATED BRANCH / 51/51 SOURCE+NUMERIC / 9 NEW C# TESTS WRITTEN / MANAGED NOT_RUN / WINDOWS NOT_RUN / NATIVE 2PC NOT_RUN / INTEGRATION HOLD / RELEASE STOP.

### W13 action-boundary gap correction

The accepted host may start another Moving action without a visible intervening non-Moving snapshot at P2. Without a read-only action boundary guard, a large pause **between distinct actions** would pollute `maxRxGapMs`, `rxGapP95ms` and `rxGapsOver300ms`. The W13 producer now accepts the already-admitted `state.actionSerial` (optional argument, preserving old test call sites), clears the **interarrival baseline only** when the action changes, and clears it on `EndMoving`/new match. No GameState write or network packet alteration. One additional C# regression covers 250ms within-action plus a long cross-action pause, expecting just one 250ms RX gap rather than a fictitious stall.

**Updated W13 case counts:** 13 telemetry and 26 smoother authored tests; **9 W13 additions**; native .NET9/Unity execution remains NOT_RUN. After the action-boundary source edit, rerun/read back all source checks for the **new exact Git blobs**; the earlier 51/51 refers to the pre-action-boundary iteration and must not be transferred automatically.


### R17-W13 final exact source verification

After the additional rapid-action transition guard, independently re-fetched source/test blobs and **executed 50/50 new source-bound V8 predicates and numeric policy cases PASS** on the *current*, updated code; these supersede the previous 51/51 from an earlier W13 code revision. Tested areas: both 512-frame and 256-snapshot RX bounded rings, 5s report, regular legal 4Hz vs 380ms jitter, `NA` when there are no intervals, forward action-serial reset, expiry after 300ms threshold, actual app admission/wiring, no GameState/physics/protocol mutation, and all 39 C# test definitions (13 telemetry + 26 smoother) registered/integrated.

**Fresh exact Git blob identities**:
- `RemoteVisualPacingTelemetry.cs` = `d9d275ae5115837c43c9cb009cfdd6e13573907a`;
- `RemoteVisualPacingTelemetryTests.cs` = `846e554c76b96251e22365cfbb67bd9cdac83b62`;
- `RemoteBallSmoother.cs` = `a2dbaee6c4562b1efd1c8308766c56660dc09949`;
- `RemoteBallSmootherTests.cs` = `856d2f823fcb473fc8f05f1e4c33d81252f31a03`;
- `CoreClashApp.cs` = `431d36ca44bbecbdfdd9ce4b6b35f7c06e34c8d7`.

**Native status unchanged:** `.NET9` managed tests NOT_RUN, Unity 6000.4.0f1 Windows64 Player NOT_BUILT, 2-PC native frame profile NOT_RUN, independent G3/G4 HOLD. GitHub source V8 checks do **not** certify managed tests or actual network performance.

## R17-W14 — Actual-blend semantics correction (2026-10-30)

**Real production defect:** `RemoteBallSmoother.LastBlendSeconds` previously reported a positive `duration` whenever the current snapshot had the same action/monotonic frame, **even if no ball was actually visually interpolated** (all new/spawned/stationary or short-range instant `PORTAL`/`TELEPORT`/`SWAP` participants, or large warp). This can create false P2 pacing readings after legal instantaneous repositioning. A first correction to set `LastBlendSeconds=0` would itself have falsely counted all later frames as `postBlendWaitMs` in `RemoteVisualPacingTelemetry.SampleFrame`, because the old wait gate was only `lastSnapshot>=0`.

**Implemented atomic owner-scoped fix (both consumer and producer):**
1. `RemoteBallSmoother`: a local boolean `anyVisualBlend` is set only after a tracked ball enters normal interpolation with positive duration **and nonzero displacement**. Event snaps, owner/type conversions, distance snaps, fresh spawns and stationary poses do not set it. The read-only diagnostic property is `LastBlendSeconds=anyVisualBlend?duration:0f`. **Rendering trajectories/physics/network never change.**
2. `RemoteVisualPacingTelemetry`: count `postBlendWaitMs` and `postBlendWaitFrames` only when `lastSnapshot>=0&&blendSeconds>0f`, so hard snaps cannot fabricate a wait window. Existing nonzero-blend/late-frame accounting is retained.

**Seven new W14 C# managed regression DEFINITIONS:** five in existing smoother suite (stationary no blend, short TELEPORT snap, both SWAP participants, mixed warp+ordinary ball correctly nonzero blend, large displacement snap) and two in telemetry suite (all-instant snapshots: zero wait; transition from ordinary moving to instant snap stops wait accrual). Prior W12+W13 tests remain registered. New totals: **31 smoother + 15 telemetry = 46 authored C# regression definitions**, including 7 W14 additions.

**Evidence restrictions:** These are production C# source updates and registered C# regression test code. Source-bound structural / numeric review is **NOT** managed test execution; .NET9, Windows Unity6000.4.0f1 and physical PC1/PC2 performance still **NOT_RUN**. W11 QA freeze remains exact `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` and is **not** modified, so it does not contain W14 additions. No changes to Mitosis V148, Furnace FIRE-only zone/ticks, R16 HP, Protocol149, authoritative GameState, network send cadence, RC1 or main. Draft PR #233 remains **DEV ONLY / QUALITY-GATED** until A70 admits it into a new post-freeze candidate after W11 G3.
