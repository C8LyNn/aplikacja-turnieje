# CC-001 R17-W12 — A51 shared-field PC1/PC2 native trace correction

- **Agent:** A51 — Simulation / Instrumentation; no game/UI/network source ownership.
- **Issue:** #125, HQ #97; existing draft PR #172 (branch `feat/cc001-r17-w9-a51-pc-pair-trace`).
- **Immutable QA-freeze source:** `integration/cc001-r17-w11-qa-freeze-20261030` SHA `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. This is an analysis input, not the A51 branch or a built executable. Further #207 commits are excluded from frozen QA.

## Confirmed defect and bounded fix

`CC_W10_NET_HOST` (A41) records revision/action/turn/phase/balls/**chunks**/packet size/period. `CC_W10_NET_CLIENT` records revision/action/turn/phase/balls/received/skipped, but **not chunks**. Before W12 the A51 analyzer compared `chunks` unconditionally, so a perfectly legal same-revision A41 host/client pair produced `SAME_REVISION_FIELD_MISMATCH`. This was a defect in A51 diagnostics, not proof of multiplayer divergence.

Now A51 compares the three mandatory common fields `actionSerial`, `turn`, `phase` and optional `balls`/`chunks` **only when both participants actually emitted the field**. A31 per-snapshot `CC_NET_TRACE_TX/RX` both emit `chunks`, so its real mismatches remain detectable. All conclusions remain `MATCHED_METADATA_ONLY` at best; no implicit `G3 PASS`, no transport timing or visual frame certification, no new Protocol149 field, no Unity source change. This is a specific correction to the existing diagnostic product, not a second competing parser or gameplay variant.

## Actual reproducible tests

- `node --check scripts/cc001/w12/a51/native-metadata-shared-fields.cjs` — exit 0.
- `node --check scripts/cc001/w12/a51/native-metadata-shared-fields.test.cjs` — exit 0.
- `node --test scripts/cc001/w12/a51/native-metadata-shared-fields.test.cjs` — **14/14 PASS, exit 0** on local Node process.
- A51 existing analyzer wiring is separately tested against fetched exact GitHub source with source-evaluated controlled fixture rows; do **not** claim native OS execution of the pre-existing 45-test suite unless it was actually run.
- .NET9/Unity/Windows Player, two physical PCs, native W11 QA freeze runtime and complete parity: **NOT_RUN** in A51 environment.

## Boundaries and next owners

A70 must preserve the frozen QA source SHA; A72 must produce the exact SHA-matched Windows build, A60/A31 independently perform paired PC1–PC2 real-device QA. A51 helper is offline trace post-processing only. The existing A41 SHA256 wire-state comparator remains the only owner for digest comparison on builds that contain those markers; it is absent from the frozen QA source. No source/physics, Mitosis, Furnace, R16 HP, V148, Protocol149, main, or release changes. No merge.

**STATUS:** DESIGNED YES / IMPLEMENTED YES (A51-only) / TESTED Node scoped 14 PASS + source evaluation separately / INTEGRATED NO (draft PR) / RELEASED NO. Final W11 remains HOLD without A72 native Windows & A60 physical PC1–PC2 evidence.
