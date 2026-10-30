# CC-001 — R17-W12 / A82 Displacement Trace Gate

**Scope:** executable offline Node 22 checker for the mechanics of `PORTAL`, Warp `TELEPORT`, and two-ball `SWAP`. Checks an accepted P2 authoritative revision against a P2 visual-pose observation. **It is not a Unity/NGO runner, producer of PC1/PC2 telemetry, Windows build, or G3/G4 certification.**

**W11 QA freeze:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` on `integration/cc001-r17-w11-qa-freeze-20261030`, immutable for ongoing A72/A60 tests. The freeze source only explicitly snaps `PORTAL`. Newer moving #207 source includes A70-selected A34 `TELEPORT` + two-ball `SWAP` support. Do not update the freeze, claim the new patch is in freeze, or remerge closed duplicate A82 PR #217.

## Commands

```sh
node --check scripts/cc001/w12/a82/check-displacement-trace.cjs
node --check scripts/cc001/w12/a82/check-displacement-trace.test.cjs
node --test scripts/cc001/w12/a82/check-displacement-trace.test.cjs
node scripts/cc001/w12/a82/check-displacement-trace.cjs --expected-sha 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3 scripts/cc001/w12/a82/example.synthetic.json
```

The included example is **synthetic**, not data from physical PC1/PC2.

## Exact trace contract

UTF-8 JSON with `schema:"CC001-A82-DISPLACEMENT-TRACE-v1"`, `sourceSha`, `evidence.captureType` (`synthetic` or `operator`), and `samples[]`. Each sample requires `device:"PC2"`, `observation:"POST_APPLY_POST_OBSERVE"`, `phase:"Moving"`, monotonic `revision`, `actionSerial`, `cursorBefore`, `cursorAfter`, `events[]` (`id,kind,ballId,otherId`), `hostBalls[]` and `renderedBalls[]` (`id,x,y`). `hostBalls` and P2 smoother output must refer to **the same accepted revision** and the same **world coordinate frame before P2 viewport inversion**. An authorized capture/diagnostic harness is needed; network logs and screenshots alone do not automatically supply all fields. Do **not** fill observations from expected state.

A new `PORTAL`/`TELEPORT` must snap actor `ballId`, a new `SWAP` must snap both `ballId` and `otherId`. `id<=cursorBefore` events do not retrigger. Distance tolerance 0.5 world units; ordinary non-displacement effects are **not** asserted to snap.

## Results and limitations

- `exit 0` / `PASS_SCOPED`: provided input meets this narrow check. `physicalG3Status` is always `NOT_ASSESSED` (even operator-labelled data).
- `exit 1` / `FAIL`: incompatible SHA, invalid revision/cursor/pose, or missed exact snap.
- `exit 2` / `HOLD`: no/invalid evidence or incomplete `PORTAL`/`TELEPORT`/`SWAP` coverage.
- `exit 64`: wrong arguments.

**Proof boundary:** PASS on a fabricated fixture or self-reported operator file is not a physical two-PC PASS. A60/A31 must independently verify original exact-SHA Windows Player, same revision state, raw logs, and observed frames. A72 owns Windows build; A70 owns integration. A82 changes no Unity gameplay, physics, Mitosis V148, Furnace, HP R16, RC1, Protocol149, or protected QA freeze.

**Status:** Node CLI 23/23 real tests executed on byte-identical source/test files; Unity/native/PC1-PC2 NOT_RUN.
