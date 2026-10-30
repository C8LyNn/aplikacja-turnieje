# CC-001 R17-W11 — A51 finalization: #207 sampled trace cadence gate

**Role:** A51 Simulation / Instrumentation. **Status:** IMPLEMENTED / SCOPED NODE PASS / NATIVE QA HOLD.  
**Official disposable W11 candidate:** A70 draft #207 at exact `173273122c11cbf738e8b954e32506a6196fe8ec`, RC1 exact protected ancestor `10f64e4d213f17a352ed8fa83bc75884a39549f0`.  
**Existing A51 draft:** #172, own branch `feat/cc001-r17-w9-a51-pc-pair-trace`, previous A51 commit `0ba8501f969ff47e1fa659ef50e60bb058e6757f`.

## Real code changed (A51-owned only)

1. `scripts/cc001/w11/a51/native-snapshot-trace.cjs` — added exact #207 *reported* cadence policy validation for A41 `CC_W10_NET_HOST` rows: moving `<8KiB = 50ms`, `8–<16KiB = 83ms`, `16–<64KiB = 125ms`, `>=64KiB = 250ms`; aiming/over = 250ms. Policy follows exact candidate `NetworkSnapshotRate.Interval`. This tests *self-consistency of logged metadata*; not actual delivery frequency, FPS, queue latency or frame smoothness. Also checks actionSerial monotonicity per source (rewind can be multiple sessions), rejects revision zero, chunk count zero, host encoded byte count zero and client accepted count zero, preserves all prior first-occurrence revision evidence and FAIL-closed metadata status on invalid fields. Schema version increment to `CC001_R17_W11_A51_NATIVE_TRACE_V2`, `candidateSourceSha` is a **policy source pin only**, not proof of runtime binary provenance.
2. `scripts/cc001/w11/a51/native-snapshot-trace.test.cjs` — added 14 concrete boundary/negative tests, preserved 26 preexisting tests.
3. This A51-only report.

**No Unity production C# edits, no new network packets, no protected RC1/R16/V148/catalog/Protocol149 modifications.** Design owner rulings remain Mitosis V148 mechanics, Furnace fire zone/tick only, R16 HP values; no ability or HP source is touched.

## Exact candidate inputs checked directly on GitHub

- #207 HEAD `173273122c11cbf738e8b954e32506a6196fe8ec`: `Assets/CoreClash/Networking/NgoGameSession.cs` Git blob `2e64b8d0bac82b58fc33e84f701f2331ac2feef0`, logs A41 `CC_W10_NET_HOST/CLIENT` and forwards accepted packet `revision` to `app.ReceiveNetworkState(adapter.State,revision)`.
- #207 `NetworkGameSession.cs` Git blob `5a833e1821218d820e8f6e92b08ccbcd6cebfed0` defines exact 20/12/8/4Hz compressed-size policy (idle 250ms). The host's `periodMs` is integer-truncated float interval.
- Selected A34 `RemoteBallSmoother.Observe` + `TryGetPosition` is wired via `CoreClashApp` and `BoardView`; source state/graphics selection only, not native performance evidence.
- A41 separate draft #205 produces sampled SHA256 `CC_W11_STATE_TX/RX`, but that producer is **not in #207**. A51 does not import or duplicate A41's separate digest comparator. Without actual same-run evidence or sampled payload hash, matching metadata does NOT prove binary state parity.

## Tests ACTUALLY EXECUTED

On local Linux, Node `v22.16.0`:

```bash
node --check scripts/cc001/w11/a51/native-snapshot-trace.cjs           # exit 0
node --check scripts/cc001/w11/a51/native-snapshot-trace.test.cjs      # exit 0
node scripts/cc001/w11/a51/native-snapshot-trace.test.cjs              # exit 0, 40/40 PASS
node scripts/cc001/w9/a51/pc-pair-trace.test.cjs                       # exit 0, 26/26 PASS
```

**66/66 total Node tests PASS**, including positive/negative source-format fixtures. CLI remains a read-only analyzer and does not certify G3/G4. An invalid metadata record triggers error finding + `HOLD_ERRORS`; the CLI itself writes a JSON report and is not a CI QA certification.

**NOT RUN**: actual .NET9/Unity managed test compilation, Windows Editor/EXE build, physical PC1+PC2 game and original Player.log, packet capture, A60 independent real-device QA, host/client movement smoothness, live snapshot data parity. Local `dotnet` and Unity executables unavailable. Old RC1/W10 build/test receipts cannot be transferred to #207.

## Handoff / gate

- **A70/Codex:** exact candidate #207 integration is a draft; keep immutable and don't apply alternate full-network/visual implementation. Report any candidate move before A72 build.
- **A72:** produce real Windows build of exact #207, full binary hashes + logs; if SHA changes, rebuild with new pin.
- **A60/A31:** feed *original paired logs* into this parser; distinguish metadata consistency vs proof of full state parity, P2 owner action exactly once and client visual smoothness. When A41 state digest #205 is separately admitted, use its own comparator for actual sampled wire-JSON comparison instead of silently promoting A51 metadata verdict.
- **HQ #97:** no W12 until W11 formal close; owner rules unchanged.

**Five axes:** DESIGNED YES / IMPLEMENTED YES (A51 tool only) / TESTED NODE 66/66 PASS, NATIVE NOT_RUN / INTEGRATED NO (own draft #172 only) / RELEASED NO.  
**Decision:** `A51_SUPPORT=PASS_SCOPED; A70_#207=SOURCE_STAGED; WINDOWS_BUILD=NOT_RUN; PC1_PC2_QA=NOT_RUN; G3/G4=HOLD; MAIN/RELEASE=STOP`.
