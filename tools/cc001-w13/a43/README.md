# CC-001 R17-W13 / A43 — read-only PC2 frame evidence

**Owner:** A43 Telemetry. **P0 W11 QA freeze (NOT modified):** `integration/cc001-r17-w11-qa-freeze-20261030` @ `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. The later moving #207 is a separate source, not an interchangeable QA binary.

This adds a small **optional frame-observation analyzer** for A60/A31. It complements A43's existing network log analyzer from W9–W12. It does not instrument Unity, capture actual frames, certify a Windows binary, assess network transport latency, or assert physical G3 PASS. The input must come from an independently approved P2 visual capture; the freeze's existing 1Hz `CC_W10_NET_CLIENT` log is NOT sufficient for the frame-level contract.

## Run using Node.js 22

```sh
node tools/cc001-w13/a43/frame-evidence.cjs pc2-frames.ndjson pc2-frame-report.json
node --test tools/cc001-w13/a43/frame-evidence.test.cjs
```

An input file is newline-delimited JSON. The **first** line declares the source and client role:

```json
{"kind":"header","role":"client","schema":"CC001_A43_W13_FRAMES_001","origin":"runtime","sourceSha":"3f972cdbaea6289a7e33ce608f5d3256cfdab0a3"}
```

Each subsequent line is one ball observed *on a P2 render frame after drawing the current authoritative state*. All positions must be in **canonical world coordinates**, not vertically inverted P2 pixels. `ms` must be monotonically increasing on PC2 only; never subtract PC1 timestamps to infer network latency.

```json
{"kind":"frame","frame":1,"ms":0,"ballId":1,"revision":10,"actionSerial":2,"phase":"Moving","event":"NONE","x":10,"y":20,"authX":12,"authY":20,"speed":15}
{"kind":"frame","frame":2,"ms":16,"ballId":1,"revision":10,"actionSerial":2,"phase":"Moving","event":"NONE","x":11,"y":20,"authX":12,"authY":20,"speed":15}
{"kind":"frame","frame":3,"ms":32,"ballId":1,"revision":10,"actionSerial":2,"phase":"Moving","event":"NONE","x":12,"y":20,"authX":12,"authY":20,"speed":15}
```

`x/y` = actual P2 **rendered** pose after smoother; `authX/authY` = accepted authoritative replica pose from the same revision; `speed` = authoritative velocity length. `frame` = engine/capture frame index. For all balls observed on one frame, `frame/ms` must be identical and `ballId` distinct.

The analyzer computes sample-interval p50/p95/p99 only if frames are contiguous and `origin=runtime`; a **video** origin produces no claims about native engine frame times. It flags revision rollback, potential visually held moving pose for 180ms, and post-event `PORTAL` snap discrepancy in world coordinates (>0.5 units). These are investigation signals, **not automatic gameplay failures**. Only PORTAL visual snap exists in the frozen source `RemoteBallSmoother.cs`; later #207 TELEPORT/SWAP visual changes are not tested against the freeze and are explicitly out of scope.

**Exit code:** 0 = observational result (including diagnostic signals; never G3 PASS), 1 = wrong *declared* source SHA, 2 = insufficient observations, 3 = bad input/filesystem. Output is fail-closed on duplicate frame+ball samples, clock rewind and missing mandatory numeric fields; refuses to overwrite the input or an existing output file. Includes original input SHA256/byte size and excludes original input lines, secrets, private IPs and paths.

**A60 physical acceptance remains separate.** Operator-declared `sourceSha` is not proof of installed Player build identity. A72 must first provide real Win64 Unity 6000.4.0f1 Player and .NET9 outputs from precisely `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`, with complete unmodified PC1 and PC2 file hash receipts. A60/A31 must then independently observe real P2 action acceptance, turn/aim, snapshot/ball state parity and frame smoothness. Frozen source is protected; no merge to RC1/main, no release. Mitosis V148, Furnace FIRE zone/ticks, and HP R16 remain unchanged.

**W13 code/test:** two additive `tools/cc001-w13/a43/` CJS files, Node22 `--test` **16/16 PASS** executed on byte-identical source; physical Windows build/PC1–PC2 **NOT_RUN** by A43.
