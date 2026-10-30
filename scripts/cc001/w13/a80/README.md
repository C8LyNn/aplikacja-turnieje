# CC-001 / R17-W13 / A80 — frozen two-PC original-capture binding

**Goal:** bind the existing A80 W12 PC1/PC2 view/turn/aim checker to the actual private screenshot and log bytes, without claiming Unity/PC1-PC2 gameplay QA. **No gameplay source changes.**

## Frozen source / separate candidates

Only allowed W11 QA source: `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. PR #207's newer head is a **different code version**. The historical A80 W11 #201 was pinned to `173273...` and must not be silently repurposed. This W13 draft is **stacked on A80 W12 #236** and imports its unchanged `scripts/cc001/w12/a80/verify-freeze-view.cjs`. Verified dependency Git blob: `07fecb24578d1f54d2e43ba3d3699c923ee77916`.

## Commands

Node.js 18+; built-in modules only, no npm dependencies.

```sh
node --test scripts/cc001/w13/a80/verify-frozen-captures.test.cjs
node scripts/cc001/w13/a80/verify-frozen-captures.cjs --input PRIVATE/observations.json --root PRIVATE/captures --out PRIVATE/a80-w13-report.json
```

The input top-level object has `schema=cc001-r17-w13-a80-frozen-capture-v1`, `lane=W11_QA_FREEZE`, `qaSourceSha=3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`, `toleranceWorldUnits` between 0 and 2, and `pairs` containing ascending integer `index` plus exactly two W12 view-schema `observations` for PC1 (owner 0) and PC2 (owner 1). Add under **each** observation:

```json
"evidence": {
  "screenshotPath": "PC1/frame001.png",
  "screenshotSha256": "64-character-real-hex-sha256",
  "logPath": "PC1/Player.log",
  "logSha256": "64-character-real-hex-sha256",
  "captureUtc": "2026-10-30T19:00:01Z"
}
```

Paths MUST be relative to `--root`. Only original private files should be supplied; source/assembly SHA and world-state hash are independently derived by A72/A31/A60 and NOT derived by this tool. It checks SHA256 of actual screenshot and log bytes, PNG/JPEG/WebP file signatures, root confinement (including symlink escape), individual PC UTC clock ordering, duplicate image-byte evidence, exact frozen source, local UI/deck/turn and authoritative/view coordinate *annotations*. It does not decode screenshots, inspect images semantically, validate EXE source, or compare unsynchronized clocks across devices. Never upload raw Player.log, IPs, addresses, tokens or images publicly.

**Important freeze-specific telemetry boundary:** this frozen candidate provides sampled `CC_W10_NET_HOST/CLIENT` markers, **not** the later PR207 `CC_W11_STATE_TX/RX` full-state SHA telemetry. A source-bound full GameState digest is not established merely by supplying matching 64-hex strings. If A60 cannot obtain a legitimate same-revision digest from frozen code/evidence, leave digest missing and expect HOLD; do not fabricate parity.

## Verdicts and ownership

Exit `0` = `CAPTURE_BYTES_AND_ANNOTATIONS_CONSISTENT` (scope-limited logic only), `1` = `CAPTURE_CONTRADICTION`, `3` = `INSUFFICIENT_EVIDENCE`, `2` = usage error, `4` = bad input/file IO/attempt to overwrite. Report fields always include `physicalG3Status=NOT_ASSESSED`, `verifiedOriginalBuild=false`, `inspectedImageSemantics=false`, `verifiedDeviceOrigin=false`. Synthetic test PASS is NOT physical PC QA.

A72 builds the frozen Windows Unity Player and independently records the complete original EXE/DLL manifest; A60/A31 independently attest both actual devices, original logs/screenshot content, authoritative parity, P2 accepted-once, latency/teleport/smoothing and game behavior. A70 alone controls integration; no merge/main/release or W11 gate bypass.

Keep owner decisions: Mitosis exactly V148; Furnace FIRE zone+periodic damage only; HP unchanged from R16; RC1, Protocol149 and protected source unchanged.
