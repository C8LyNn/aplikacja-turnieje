# CC-001 — R17-W10 / A41 — Authoritative network pacing and two-PC trace handoff

**Role:** A41 Backend / Multiplayer (existing W1–W3 + W9 owner), **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97)  
**W9 antecedent:** [A41 PR #163](https://github.com/C8LyNn/aplikacja-turnieje/pull/163), SHA `caa7d9c3b8e619533096b4d5d0feb0d71dd2b3f4`.  
**W10 own branch:** `feat/cc001-r17-w10-a41-network-pacing-trace`, created from **EXACT W9 A41 SHA** above.  
**Protected source baseline:** `integration/cc001-r17-w8-phoenix-rc1` at `10f64e4d213f17a352ed8fa83bc75884a39549f0` (unchanged). **R16** archive SHA256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`. V148 and three live website versions untouched. **Protocol 149 preserved.**  
**Stage:** IMPLEMENTED AS ISOLATED SOURCE+TEST CANDIDATE, NO UNITY BUILD / NO TWO-PC QA / NO INTEGRATION OR RELEASE.

## 1. Executed W10 A41 code delta vs W9

1. **Adaptive full-state broadcast:** `NetworkGameSession.NetworkSnapshotRate.Interval` now chooses Moving 20Hz when compressed size is <8KiB, 12Hz at 8–16KiB, 8Hz at 16–64KiB, 4Hz >=64KiB; idle/aiming 4Hz. A negative payload size is invalid and fails to a slow 4Hz interval. Payload length is the *actual output of `NgoWireProtocol.Encode`*, not a guessed JSON length. This is a direct improvement of W9 12/8/4Hz while retaining bandwidth backpressure guard for large full-state snapshots. Host remains sole simulator; **client prediction, fake physics or wire schema change were not added**.
2. **Bounded observable PC1-PC2 convergence:** `NgoGameSession` now prints rate-limited host marker `CC_W10_NET_HOST revision=N action=N turn=N phase=X balls=N packedBytes=N chunks=N periodMs=N` and client marker `CC_W10_NET_CLIENT revision=N action=N turn=N phase=X balls=N received=N skippedRevisions=N` after an accepted authoritative packet. Log interval is >=1s by source-enforced `NetworkSnapshotTrace.Due`; a reset starts counters in a new NGO session. This is a separate **diagnostic instrument, not proof of parity**; `skippedRevisions` is a monotonic difference in accepted serials, **not** a literal count of network packet loss, since the assembler may deliberately supersede stale chunks. No private IP, invitation code, UGS token, account or connection payload logged.
3. **Prior W9 ACK guard retained:** a result only changes P2 pending flag and local ACK counters when the current pending sequence matches; new-session reset clears `pendingSequence`. This is a transport-lifecycle best effort, **not identity-authenticated resume** (sequence numbers can recur; stale callbacks remain future adversarial test requirement).
4. **Pure managed tests:** update five prior W9 `NetworkSeatTests()` assertions to match selected 20/12/8/4 policy and idle rate; add two targeted `Test()` definitions for invalid payload size and logging time rollback/non-finite/boundary conditions. **30 total test definitions** in the existing suite (23 W3 baseline + five W9 + two W10), no `Tests/Program.cs` change.
5. **No production physics or rendering edit:** client still receives snapshots and replaces authoritative state; smoothing requires exactly *one* selected presentation implementation (see section 3). This patch targets time quantization, not a certified cure for visual teleporting.

## 2. Precise W9 conflict decision — for A70/HQ integration, NOT MERGED BY A41

**Conflict C-01, P0, SAME C# PATHS:** [A30 PR #175](https://github.com/C8LyNn/aplikacja-turnieje/pull/175) and [A41 #163](https://github.com/C8LyNn/aplikacja-turnieje/pull/163) both change `Assets/CoreClash/Networking/NetworkGameSession.cs`, `NgoGameSession.cs` and `Tests/NetworkSeatTests.cs`.
- A30's `NetworkSnapshotCadence.For` sends **20Hz unconditionally while Moving** regardless of full snapshot size, 4Hz otherwise; its network diff does not include A41's stale intent ACK guard or compressed payload throttle. A30's one cadence test assumes unconditional 20Hz.
- **A41 recommended single-source network selection:** choose **A41 W10 adaptive function + W9 ACK guard + 30-case managed seat suite**; *exclude* A30's `NetworkSnapshotCadence` and its corresponding test entirely. Do **not** merge both scheduling helpers or keep a contradictory unconditional-20Hz test. This is a source/readability/risk decision; **measured performance or full convergence is NOT verified**, A60 may reject the choice after actual A/B profiling.
- Only A70 in a **new disposable integration candidate** may selectively import the chosen hunks; A41 has not edited A30 or A70 files and has not merged anything.

**Conflict C-02, UI, P0/P1, others own paths:** [A20 PR #168](https://github.com/C8LyNn/aplikacja-turnieje/pull/168), [A21 #170](https://github.com/C8LyNn/aplikacja-turnieje/pull/170), [A83 #160](https://github.com/C8LyNn/aplikacja-turnieje/pull/160), [A30 #175](https://github.com/C8LyNn/aplikacja-turnieje/pull/175) all address local turn messaging on `MatchView.cs`; some also alter `BoardView`, `CoreClashApp`, and test files. **Prefer A20 #168 as the primary local-turn/arrow UX source**; do not combine multiple implementations of “YOUR TURN”. A30 additionally introduces P2 world-to-view Y flipping; A20 doesn't implement that transformation; require a **separate selected P2 transform** reconciled with chosen render smoother before integrating. Do not transplant A30's entire broad 9-file patch (it would reintroduce the conflicting network cadence). A10/HQ decide whether 180° P2 view is mandatory and confirm power-bar removal semantics.

**Conflict C-03, P2 smoothing, P0, incompatible alternatives:** [A34 #174](https://github.com/C8LyNn/aplikacja-turnieje/pull/174) has a **wired display-only** `RemoteBallSmoother` in `BoardView/BallView/CoreClashApp`; [A50 #169](https://github.com/C8LyNn/aplikacja-turnieje/pull/169) offers a separate *not-wired* `RemoteBallPoseSmoother` helper. **Choose one**: for an integration candidate, A34 is the more complete *visual* option, subject to A60 QA. Do not load both algorithms or accept two active visual histories. A34/A30/A20 have overlapping `BoardView.cs` changes; integration must reconcile these by code-level tests, not automated blind merge.

**Conflict C-04, deck content, P1:** [A32 #173](https://github.com/C8LyNn/aplikacja-turnieje/pull/173) makes visible hand stock local to the current client, potentially overlapping A20/A30 UI. Selectively reconcile from one source and preserve authoritative input gating. Do not silently advertise opponent's cards as “YOUR DECK”.

**Nonconflicting diagnostic tools:** A31 #153, A51 #172, A43 #171, A33 #176 and A72 #158 provide different complementary admission/log/UI tooling; they are not proof that either network patch works physically.

**A70 integration gates:** clone *new disposable ref from pinned RC1*; choose exactly one network rate implementation (A41 W10); choose one turn-UX implementation and one smoother; use targeted hunk selection for overlapping A30/A20/A34/A32 paths; run source/protocol/asset allowlists; A72 build exact new HEAD and A60 independently validate it. **NEVER write to frozen RC1/Stage2, main, R16, V148 or public website.**

## 3. What is fixed vs still pending

| User symptom | Current delivery | Required remaining proof |
|---|---|---|
| P2 ball jumps at 5Hz snapshot boundary | Networking broadcast now up to 20Hz for small payload, with controlled fallback; wired A34 smoother is *separate PR* | Real 2-PC frame-time/packet distribution, positions and visible motion, reject jitter regression |
| PC1–PC2 state mismatch / duplicate shot | Server authority + Protocol149 unchanged; W9 stale ACK guard preserved; 1Hz host/client actionSerial+turn+revision trace added | Compare actual two-device traces and game state checksums, reject phantom action; no parity proven by cadence alone |
| Wrong P2 “YOUR TURN” | No UI change A41; A20 #168 has owner-relative text candidate | Reconciled build, A60 inspect local turn P1/P2 by screen AND accepted commands |
| P2 view and aiming arrows | No UI edit A41; competing A30 perspective vs A20 arrow + A34 smoother | Code-selected inverse coordinate transform / mouse+touch hit-test and physical screenshots |
| Redundant power bar | Not touched A41; waits for explicit A10/HQ decision | Approved UI patch and physical UX regression |
| Fresh Windows build | Not performed A41 (A72 ownership); protected old RC1 Player is NOT new candidate build | A72 build exact integrated HEAD, publish complete Player SHA256 inventory, A60 independently test PC1+PC2 |

## 4. Tests honestly executed

**Actual source/logic checks performed on real GitHub file contents in this agent environment:**
- **28/28** static source and lexical structural checks PASS: 3 owned files read back; C# brace/paren/bracket balance; networking owner/Protocol149/sender gate preserved; compressed-byte selector; send-before-pacing; log markers and privacy/clock guard/reset; sequence receipt check; exactly 30 `Test()` declarations.
- **11/11** V8-executed numeric policy *model* boundary assertions PASS, evaluating policy values written in the source for idle, <8KiB, 8KiB, 16KiB, 64KiB and invalid values. **These evaluate a JavaScript model, not compiled C#.**
- GitHub exact blob readback: `NetworkGameSession.cs` = `5a833e1821218d820e8f6e92b08ccbcd6cebfed0`; `NgoGameSession.cs` = `83e814e8cbdd6045f2c4161ae1dba4fc93341257`; `Tests/NetworkSeatTests.cs` = `5263c696fd8fa65a202fb885311af20792bf0e34`.

**NOT RUN:** .NET 9 C# compiled managed suite, Unity 6000.4.0f1 editor/build, actual NGO LAN transport, two Windows PCs, new Player.log, real latency/jitter/shaping/physics/visual FPS, WebGL/Android, independent A60 QA. Runtime PASS and resolution of teleporting remain **HOLD**. Historical W6/RC1 361 managed/13 codec passed tests are not evidence for W10 bytes.

**Exact A60/A72 next steps:** when A70 assembles an authorized isolated integration candidate, A72 builds that **new exact SHA** with source/binary hash; run managed `NetworkSeatTests` and codec; run host and client on two actual Windows PCs. Verify both log markers with synchronized UTC clocks, legal P1 then P2 shot, monotonic snapshots, same latest `actionSerial` and `turn`, no unauthorized action, no systematic visual snap of P2 ball; compare render time and NGO send queue at 20/12/8/4 thresholds. Use direct device captures, not same-PC simulation.

## 5. HANDOFF

```text
PROJECT: CC-001
WAVE: R17-W10 — INTEGRATION & MULTIPLAYER FIX
AGENT: A41 — Backend / Multiplayer
HQ: #97
OWN BRANCH: feat/cc001-r17-w10-a41-network-pacing-trace
BASE SHA: caa7d9c3b8e619533096b4d5d0feb0d71dd2b3f4 (A41 W9)
RC1 PROTECTED SHA: 10f64e4d213f17a352ed8fa83bc75884a39549f0
FINAL COMMIT SHA: see GitHub commit and HQ handoff after report write
CHANGED W10 PATHS: NetworkGameSession.cs; NgoGameSession.cs; NetworkSeatTests.cs; this A41 report
IMPLEMENTED: adaptive 20/12/8/4Hz motion and 4Hz idle; 1Hz privacy-safe paired trace; two new C# regression definitions
ACTUAL TESTS: 28/28 static source checks, 11/11 V8 numeric policy model assertions; C# NOT_RUN
INTEGRATED: NO — A70 owns isolated integration
RELEASED: NO
BLOCKED: no local .NET/Unity, no A72 exact combined-SHA new Windows build, no physical paired A60 QA, no unified P2 UI/smoother
HANDOFF: 00/HQ, A70, A60, A72; A20/A31 coordination
```

**DESIGNED YES / IMPLEMENTED YES (A41 owned source) / TESTED STATIC+JS MODEL ONLY / INTEGRATED NO / RELEASED NO.** No merge or public deployment.
