# CC-001 / R17-W13 — A41 Backend-Multiplayer: measured host RPC-submission ledger

**HQ:** [issue #97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97). **Agent:** A41. **P0 frozen W11 QA:** `integration/cc001-r17-w11-qa-freeze-20261030` exact `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` **UNCHANGED**. **Own W13 source:** `feat/cc001-r17-w13-a41-host-byte-ledger`, stacked on own W12 [Draft #228](https://github.com/C8LyNn/aplikacja-turnieje/pull/228) exact HEAD `72e57524ec4fe32e7a5e50141cc8204afb89c49f`. W13 source NOT accepted into W11 or any live binary. No protected RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, V148 Mitosis, Furnace FIRE+DoT, R16 HP, game simulation, Protocol149, main/release modifications.

## 1. Source implementation — **host-side evidence the W12 256KiB/s policy currently lacks**

The current frozen W11 host logs `CC_W10_NET_HOST revision/action/turn/phase/balls/packedBytes/chunks/periodMs` (~1Hz). The A41 W12 optional policy additionally throttles nominal compressed periodic payload production to 256 KiB/s, but **neither reports actual cumulative RPC-submitted bytes over time**. Therefore packet-size logs alone cannot establish that observed PC1 byte production respects the nominal cap. A31/A81 independently analyze snapshot revisions/turn; A34 independently owns client frame/RX jitter. A41's W13 extension complements those rather than replacing them.

**New isolated source:**
1. `Assets/CoreClash/Networking/NetworkGameSession.cs`: new pure managed `NetworkSnapshotTraffic` host counter with `SubmittedBytes`, `SubmittedChunks`, `SubmittedSnapshots`, `Reset()` and `Record(packedBytes,chunkCount)`. Rejects zero/negative/over-limit payloads, impossible 900-byte chunk geometry and integer counter overflow before mutating the ledger.
2. `Assets/CoreClash/Networking/NgoGameSession.cs`: after **all** `SnapshotChunkRpc` calls in the complete outgoing chunk batch, record the exact `packed.Length` and `chunks.Length`. Reset ledger in `ResetSession()` (LAN and relay). Append cumulative `submitBytesTotal`, `submitChunksTotal`, `submitSnapshotsTotal`, and host-local Unity monotonic `hostMs` to the existing `CC_W10_NET_HOST` ~1Hz marker. **Preserve existing fields, adaptive W12 size interval, pending ACK, P2 owner and Protocol149.** Partial failures during a batch are NOT counted as a completed submission: documented bounded undercount if an exception occurs mid-send.
3. `Tests/NetworkSeatTests.cs`: **5 authored C# regressions** for valid batches, malformed sizes/geometry, exact 256KiB maximum, session reset and nine legal chunk boundary sizes. Combined with W12 34, the suite now has **39 registered test definitions** (not C# runtime evidence).
4. `scripts/cc001/w13/a41/analyze-host-traffic.cjs` + `analyze-host-traffic.test.cjs`: actual native Node22 single-PC host-log analyzer and **19 positive/negative executable tests**. It compares cumulative submitted compressed bytes/chunks/snapshots between consecutive host timestamps, rejects counter/clock/revision regressions, impossible geometry, unsafe integers, duplicate fields; refuses multiple sessions or W11 log schemas without the W13 ledger. Reports observed mean/peak compressed submitted-byte rates and **windows exceeding 256KiB/s**, but emits `status=OBSERVED_ONLY`, `runtimeGate=NOT_ASSESSED` even for plausible low rates. No raw JSON, IP, join code, token, machine or player identity in reported output.

**Explicit boundaries:** A completed `SnapshotChunkRpc` call is **NOT confirmed network delivery**. Counters omit RPC/UTP/WebSocket overhead, transport queue occupancy and any batch that failed partway through submission. W12 rate cap is a nominal *periodic* budget; intentionally forced immediate snapshots can exceed it, therefore a high observed byte rate is **a diagnostic** not proof of congestion, packet loss, logic failure or visually unstable balls. Host time uses one machine's `Time.unscaledTime`; no unsynchronized PC-to-PC clock subtraction.

## 2. Real execution / evidence

### Actually executed in the local native Node22 environment
- `node --check analyze-host-traffic.cjs`: **exit 0**
- `node --check analyze-host-traffic.test.cjs`: **exit 0**
- `node --test analyze-host-traffic.test.cjs`: **19/19 PASS**, 0 failed, exit 0 (real child-process CLI exit 0/1/2 exercised). Inputs are **synthetic fixture logs**, not actual Windows Player.log.
- Local Node `v22.16.0`, Git installed. Local tested file bytes **match GitHub blobs exactly**:
  - CLI Git blob `5b27ef40e12e6fa8d9b983790d67fa5fe08c1260`; original raw SHA256 `658e29f27c63387edf410d85970e80f0af4d36bbba2c3ea0ecb14a8b727af40d`, 3945 bytes.
  - Test Git blob `d5f69b0f5f82e16f09c132ad568439cddb9ec604`; original raw SHA256 `546beeaa36499cf169da93a2af8ad30e21539f83f4c404b05f1861e2e6a700cf`, 5443 bytes.
- Exact live GitHub C# files/source readback **18/18 invariant checks PASS**, including submission-after-RPC, ResetSession, codec chunk geometry, existing legacy marker compatibility, no raw JSON, NGO owner/Protocol149 preserved.
- New C# Git blobs: `NetworkGameSession.cs` = `f790989601812d56a8e9b22f96ca21e825700e9f`, `NgoGameSession.cs` = `9b48d48e65d37ff149ba7f4a0207742314a88bd7`, `NetworkSeatTests.cs` = `b7811349506ad59f7273cd796bb1b36cb57ac7ab`.

**NOT RUN:** .NET9 compilation/39 C# seat tests, Unity 6000.4.0f1 Windows Player, host actual `Player.log`, real NGO UTP byte output, original two physical PC1/PC2 payload/render evidence. Local executor has **no `dotnet`, `csc`, `mcs`, Unity or Windows**. No Windows binary exists from this patch. G3/G4 remain HOLD.

### How to use after a NEW authorized W13 native build (NOT the frozen W11 binary)

```sh
node scripts/cc001/w13/a41/analyze-host-traffic.cjs --host PC1_Player.log
node --test scripts/cc001/w13/a41/analyze-host-traffic.test.cjs
```

Return **0** for enough well-formed W13 submitted-byte samples, status `OBSERVED_ONLY`; **2** for no/W11-only/insufficient/multiple-session markers, status `HOLD_...`; **1** for corruption, counter rewind or invalid geometry. **No exit code means physical G3 PASS**. A60/A31 must compare true two-PC game state/action and visual frames separately.

## 3. Required intake / release gate

**A70:** keep this W13 additive patch **ALT_HOLD** as a dependent PR stacked on A41 W12 #228, **not** a competing network cadence implementation. Choose W12 nominal budget **only if** independent frozen-W11 PC1/PC2 evidence establishes congestion and later controlled performance QA shows acceptable motion. Reconcile A34 client pacing telemetry separately (different paths/owners) without replicating it. Any selected change requires a new exact integrated SHA and new Windows Player; no merge or release by A41.

**A72:** continue building ONLY exact immutable W11 freeze `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. A72 operator kit PR #188 was revised for exact freeze/Unity Win build prerequisites, but there is currently **no attested new Windows Player**. Missing Unity6000.4.0f1 Windows Standalone Build Support/license and .NET9 executor on this host: **operator action required** (run owner-pinned CMD on authorized Windows11 host, produce original EXE/DLL/full Player SHA256, Unity build logs, fresh managed JSON and exit codes; share privately with A60/A31). GitHub CI attempts at independent QA workflows failed pre-step, not compiler failures.

**A60/A31:** first verify W11 binary built from fixed SHA and real two-PC state/action/turn/aim/portal and client smoothness. Frozen W11 `CC_W10_NET_HOST/CLIENT` lack W13 cumulative fields; **do not run this W13 analyzer and interpret HOLD as a W11 regression**. After owner selects W12/W13 candidate, independently profile actual host RPC throughput + A34 client pacing and compare frame smoothness at 4KiB,48KiB,128KiB,256KiB compressed payloads; recognize forced sends are outside nominal periodic rate.

**Status:** IMPLEMENTED=YES (source+5 C# tests+native analyzer/19 tests); TESTED=NATIVE_NODE19/19 + GITHUB_STATIC18/18; C#_UNITY_PC1_PC2=NOT_RUN; INTEGRATED=NO; RELEASED=NO; W13=ALT_HOLD; W11_G3/G4=HOLD; RC1/main/protected untouched.

*New PR and final exact SHA to be recorded in HQ immediately after this report commit.*

## 4. W13 marker hardening and real native regression run (2026-10-30)

Follow-up **A41-owned** hardening of the *same* Draft PR #241, not a duplicate feature/branch: the original analyzer looked for `CC_W10_NET_HOST` anywhere in a log line and sliced the marker substring. Thus `prefixCC_W10_NET_HOST` and `CC_W10_NET_HOST_SUFFIX` could be mistaken for the genuine host marker. This was a **synthetic source-level evidence parsing defect**, not a demonstrated Windows multiplayer failure. A strict whitespace/token-boundary match now gates both discovery and direct parsing; 3 new native Node regressions cover suffix, prefix and direct parser rejection while preserving a genuine Unity host row.

**Actual execution on exact committed file bytes (local Linux, Node v22.16.0):**
- `node --check` source and test: **both exit 0**.
- `node --test scripts/cc001/w13/a41/analyze-host-traffic.test.cjs`: **22/22 PASS, 0 FAIL, exit 0**, including spawned real CLI child-process outcomes.
- Executed source Git blob **`f6cb371bf80dae3ff02e3f99599c5585d8c450a5`**, raw SHA256 **`23517ad6f30ae07d64bd72794e25bf07f7d780911014a4c2f8f803c240c0a836`**.
- Executed test Git blob **`dbd6591da39831a63cdb2f150a9cf52de5e0e2c5`**, raw SHA256 **`4fc796f9f6a3cfe4616bbb2aacb1605fa7a18ea023a42b8c9a7527b5e6d4b7bc`**.
- Local stdout TAP transcript SHA256 **`275a57fe514fc03951ac329b4a84f922b01ed9d4eae286b1c4cd9e8f04dd59a9`** (non-deterministic duration metadata means this is a provenance fingerprint of this execution, not a reproducible expected artifact).
- 8/8 *additional* source-behavior V8 assertions passed before the commit; **native 22/22 supersedes earlier 19/19** for unchanged+new analyzer logic.

**No change** to C# network transport, actual Unity or .NET9 test status, owner-approved Mitosis V148/Furnace FIRE-only DoT/R16 HP, W11 freeze, A70 source, main/release. **W11 G3/G4 HOLD**, **W13 ALT_HOLD**; independent A72 Windows build and A60/A31 real dual-PC QA remain required. Marker hardening improves diagnostic correctness, not packet delivery or game smoothness.
