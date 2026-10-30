# CC-001 / R17-W9 — A41 authoritative snapshot cadence + intent ACK repair

**Agent:** A41 Backend / Multiplayer · **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97)  
**Source base:** `integration/cc001-r17-w8-phoenix-rc1` — `10f64e4d213f17a352ed8fa83bc75884a39549f0`.  
**Branch:** `feat/cc001-r17-w9-a41-snapshot-cadence-ack`. **Protocol 149:** preserved.  
**Scope:** isolated networking-only P0 repair candidate. No UI/gameplay/RC1/V148/source-import changes, no merge/release.

## Source-grounded before / after

1. **PC2 ball jumps (P0):** `NgoGameSession.LateUpdate` sent host-authored full state every `0.2f` during Moving (**5 Hz**) and `1f` in other phases; `CoreClashApp.Update` explicitly does **not** run client simulation, and `ReceiveNetworkState` installs each authoritative state directly. This makes motion appear as discrete jumps at 5 Hz even with perfect transport. **Change:** send motion snapshots at **12 Hz** for compressed payloads below 16 KiB, **8 Hz** for 16–64 KiB, **4 Hz** from 64 KiB upward to avoid reliable NGO backlog; idle states refresh at 2 Hz. Always derive rate from the *actually compressed payload length*. Host remains the only physics authority. No wire or snapshot schema change.
2. **P2 stale acknowledgement (P0):** `ReceiveResult` previously updated local accepted/rejected counters and status even if no matching command was pending, allowing delayed result messages to report a misleading outcome. **Change:** results may affect local pending flag/counters/status only when `NetworkIntentReceipt.MatchesPending(pendingIntent,pendingSequence,sequence)` is true; session reset clears `pendingSequence`. Does not alter host command acceptance.
3. **Ownership/turn semantics:** A41 preserved `LocalOwner=>hostRole?0:1`, `seat.Owns(sender)` and `NetworkGameSession.Submit` owner/monotonic sequence guards. Existing `CoreClashApp.CanChoose` already gates input on `State.turn==LocalOwner`. **Not repaired in this branch:** `MatchView.TurnText()` unconditionally displays “YOUR SHOT” for whoever owns `State.turn`, even on the other client's screen; deck/HUD presentation also shows active-turn cards rather than local P2. This belongs to UI/A20 or assigned presentation agent. Neither rotating P2's board nor aiming arrows nor power-bar changes are included.
4. **Known limitation:** sending a full replacement snapshot 12 Hz improves granularity but does **not** implement render interpolation or certify absence of actual packet loss/CPU/jitter; no real PC1–PC2 test run. Depending on state size, adaptive 4/8 Hz fallback can still look jumpy. Instrument a bounded physical test before claiming P0 resolved.

## Files and test coverage

| File | Delta |
|---|---|
| `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NgoGameSession.cs` | adaptive snapshot schedule after serializing/compressing and publishing RPCs; stale-ACK guard, session sequence reset |
| `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NetworkGameSession.cs` | pure `NetworkSnapshotRate` and `NetworkIntentReceipt` helpers; no existing state adapter or wire contract modified |
| `unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs` | 5 additional C# test definitions for 12/8/4 Hz boundaries, idle rate, stale/duplicate ACK, sequence lifecycle (23→28 suite entries) |
| this A41 report | provenance, limitations and HQ handoff |

**Actually executed:** 17/17 GitHub source/static contract checks PASS on exact committed blobs; verified `LocalOwner`, authority, Protocol 149, sender-seat gate, command-sequence guard, removal of fixed 5 Hz moving cadence, compressed-byte interval selection and ack guard/counter ordering; 28 test definitions, 5 W9 additions. GitHub source readback and base-to-branch changed path check. Static checks are **not** C# runtime tests.

**NOT EXECUTED:** .NET 9 managed suite (toolchain absent here), Unity 6000.4.0f1 compile, NGO player networking, two-device PC1/PC2 connection, measured latency/packet throughput, snapshot assembly soak, real P2 visual/arrow/turn validation. A60 must independently compile and verify on the exact PR SHA; A70 integrates only after gate. Do not inherit prior 361/361 as proof of this patch.

**Suggested focused PC1–PC2 acceptance (NOT RUN):** once builds exist for this PR, host and client each record UTC `CC_NET_INTENT_ACCEPT`, `CC_NET_STATE_APPLIED` and action serial; run initial P1 shot, then P2 shot; verify P2 never sees “YOUR TURN” during P1 turn after UI owner fix, accepted owner=1 sequence exactly once, state revisions monotonic, no unexplained authority rewinds, and compare 5 Hz RC1 vs adaptive cadence on same network with host/client frame captures. Profile reliable transport queue/chunk counts and CPU before raising rates. Distinguish source-level scheduling fix from actual visual PASS.

**Further handoff:** A20/presentation owner: local-facing “YOUR TURN”, P2 board perspective and aim arrow; A10: P2 power-bar change only after approval; A31: real LAN logs/thresholds; A60: independently compiled+device QA; A70: isolated integration. **Never merge to main or release from A41.**

## Status

DESIGNED: YES  
IMPLEMENTED: YES — limited networking source + managed tests authored  
TESTED: SOURCE/STATIC ONLY — **NOT_COMPILED, NOT_DEVICE_TESTED**  
INTEGRATED: NO  
RELEASED: NO  
P0 MULTIPLAYER FULLY RESOLVED: **NOT VERIFIED**; requires device and UI work.
