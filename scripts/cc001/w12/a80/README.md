# CC-001 — R17-W12 / A80: frozen QA view-pair contract

## Immutable target

- **Only QA source:** `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
- Frozen RC1 base: `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
- Moving [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207) is a **separate** candidate. Newer TELEPORT/SWAP improvements are not part of the frozen QA tree.
- This branch starts from protected RC1 and changes **no** frozen ref, Unity gameplay, networking, Protocol149, V148, Furnace, Mitosis, R16 HP, main or release.

## Execute

```sh
node --test scripts/cc001/w12/a80/verify-freeze-view.test.cjs
node scripts/cc001/w12/a80/verify-freeze-view.cjs --input PRIVATE/paired-annotations.json --out PRIVATE/a80-w12-report.json
```

Requires Node.js 18+, no third-party packages. Exit 0 = supplied operator annotations logically consistent; 1 = contradiction; 2 = usage; 3 = evidence incomplete; 4 = invalid input/IO/output exists. An existing report is never overwritten. **Exit 0 is NOT physical two-PC PASS; `physicalG3Status` always `NOT_ASSESSED`.**

## Annotation contract

Top-level JSON:

- `schema: "cc001-r17-w12-a80-frozen-view-v1"`, `lane: "W11_QA_FREEZE"`, `qaSourceSha` exact QA pin.
- `toleranceWorldUnits` between 0 and 2, explicitly chosen as *annotation tolerance*, not a measured game error.
- `observations`: exactly two, `PC1` owner 0 and `PC2` owner 1, each supplying exact `sourceSha`, matching 64-hex `binaryAssemblySha256`, boolean `networkConnected`.
- `authoritative`: source-derived `revision`, `turn`, `phase` (`Aiming`, `Moving`, `Over`), and source-bound 64-hex `stateDigest`.
- `ui`: `yourTurnShown`, `inputEnabled`, `deckOwner`, `powerBarVisible: false`, `powerPercentVisible: false`.
- `balls`: entries with `id` (positive integer), independent source `canonical:{x,y}` and visually observed `view:{x,y}`; `sampleKind` is `SETTLED`, `MOVING_INTERPOLATED` or `EVENT_SNAP` with `eventKind`.

**Coordinates:** `canonical` and `view` must be calibrated **board-local logical units, width 540, height 900**, not raw screenshot pixels. The frozen `MatchPerspective` contract is `viewX=x` on both devices and `viewY = 900-y` on P2. The tool checks exact same-revision canonical ball identity/positions, same-revision supplied state digests, locally owned UI and per-device assembly digest equality.

**Do not compare intentional smoothing against canonical poses on ordinary `MOVING_INTERPOLATED` frames.** Such frames are explicitly marked *not assessed*. Frozen-source `EVENT_SNAP` is checked for `PORTAL` only; `TELEPORT` and both `SWAP` participants require a separate new-SHA candidate and trigger `EVENT_SNAP_NOT_IN_FROZEN_SOURCE_SCOPE` here. This is a known source-version limitation, not a proven measured defect.

## Evidence / ownership boundary

The tool does **not** read video, screenshots, real logs or EXE bytes; does not independently verify operator-provided source, state digest, binary hash or coordinates. Do not derive `canonical` from screenshots themselves or fabricate physical observations from unit fixtures. A72 must build **the exact frozen QA SHA** and prove original Player binary files; A60/A31 must independently inspect real two-PC evidence, accepted P2 intent, same-revision wire-state parity, teleport/fps/frame-time, screenshot calibration and UI. Existing A80 W11 [PR #201](https://github.com/C8LyNn/aplikacja-turnieje/pull/201) is historically pinned to `173273...` and **must not** be silently repurposed as QA-freeze proof.

**Status:** isolated executable A80 regression test code only; W11 native G3/G4 HOLD, W12 integration pending W11 closure, no protected source merge or release.
