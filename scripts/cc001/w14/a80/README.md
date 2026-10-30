# CC-001 / R17-W14 / A80 — temporal authoritative snapshot gate

## Purpose and exact source lane

W13 A80 capture-integrity tool originally checked ascending pair indexes, per-PC UTC capture times, private original screenshot/log SHA256 and the **within-pair** P1/P2 frozen view contract. It did not check an individual PC's **authoritative snapshot chronology between pairs**. Two pairs could pass independently even when both machines regressed from revision 42 back to 41.

This isolated W14 update adds one pure `chronology(pairs)` module under `scripts/cc001/w14/a80/` and wires it directly into the existing `scripts/cc001/w13/a80/verify-frozen-captures.cjs`; no parallel analyzer, game networking sender, snapshot smoothing implementation or Unity gameplay change. Existing W13 test/README and W12 view tests stay in their own files.

## Execute

Node.js 18+, no npm dependencies:

```sh
node --test scripts/cc001/w14/a80/verify-snapshot-chronology.test.cjs
node --test scripts/cc001/w13/a80/verify-frozen-captures.test.cjs
node scripts/cc001/w13/a80/verify-frozen-captures.cjs --input PRIVATE/session.json --root PRIVATE/captures --out PRIVATE/a80-frozen-evidence.json
```

New checks across successive observations of EACH PC independently:

- `AUTHORITATIVE_REVISION_ROLLBACK` — authoritative revision decreased despite a later capture pair;
- `TURN_OR_PHASE_CHANGED_WITHOUT_REVISION`, `DIGEST_CHANGED_WITHOUT_REVISION` — contradictory authoritative state at unchanged revision;
- `ACTION_SERIAL_ROLLBACK`, `ACTION_SERIAL_CHANGED_WITHOUT_REVISION` — when action serial is independently available;
- `LOCAL_SEAT_CHANGED_WITHIN_CAPTURE`, `PLAYER_ASSEMBLY_CHANGED_WITHIN_CAPTURE` — PC ownership or binary identity changed within one capture session;
- `AUTHORITATIVE_REVISION_NOT_CAPTURED` -> evidence gap; `INTERVENING_REVISIONS_NOT_OBSERVED` -> non-fatal *note*, never inferred packet loss.

True game-logic telemetry must be source-derived. **The frozen source has W10 sparse host/client markers, not post-freeze W11 TX/RX SHA256 state hashes.** A matching observer-entered 64-hex digest is not proof that the frozen Player emitted it. If unavailable, keep the source-bound digest gate HOLD.

**Immutable W11 QA source only:** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Moving PR #207 and W13/W14 development are separate. Stacked branch parent is W13 A80 #240, which stacks on W12 A80 #236. A70 decides integration; A72 Windows Unity6000.4.0f1 and .NET9 original build artifacts; A60/A31 independently prove actual two-PC behavior. This tool's `physicalG3Status` remains `NOT_ASSESSED`, and neither Node test PASS nor Git blob parity is Windows/physical QA.

Owner decisions remain V148 Mitosis exact, Furnace FIRE-only zone + periodic damage, R16 HP, frozen RC1 and Protocol149 untouched. No main merge or release.
