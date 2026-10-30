# CC-001 R17-W11 — A51 native snapshot trace support (test-only)

**Owner:** A51 — Simulation / Instrumentation. **HQ:** #97, **A51 Issue:** #125, **existing A51 PR:** #172. **Status:** instrumentation IMPLEMENTED; native Windows / two-PC G3/G4 verification NOT_RUN. No Unity sources, physics, gameplay, rendering, transport, Protocol149, RC1, R16, V148, main or production release changed.

## Why another executable was needed

A51 W9/W10 PR #172 already includes `pc-pair-trace.cjs` and **26/26 synthetic tests**, and can verify externally captured JSONL with state hashes. W10 created two distinct **actual** Unity `Player.log` formats that the original W9 parser did not recognize:

- A41 #180, `NgoGameSession.cs` Git blob `83e814e8cbdd6045f2c4161ae1dba4fc93341257`, upstream commit `58fac359a0bd027d8e148f66c5cca090d92035bb`: `CC_W10_NET_HOST revision=... action=... turn=... phase=... balls=... packedBytes=... chunks=... periodMs=...` and `CC_W10_NET_CLIENT revision=... action=... turn=... phase=... balls=... received=... skippedRevisions=...`. These are rate-limited sampled lines (~1/sec), **not** a complete snapshot record. Missing matching log lines do not establish dropped packets.
- A31 #184, `NgoGameSession.cs` Git blob `252c2f7c6bca9700e12a931a94207d1d05ec80eb`, upstream commit `db18cb9a614b75d23bf5e4d4afe62912b7f6be4e`: **F1 developer-overlay-gated** `CC_NET_TRACE_TX rev=... serial=... tms=... turn=... phase=... bytes=... chunks=...` and `CC_NET_TRACE_RX rev=... serial=... tms=... turn=... phase=... chunks=...`. They are opt-in; when F1 is off, absence is not evidence of dropped packets. `tms` values are device-local **monotonic** clocks, not synchronized wall clocks.

New isolated Node 22 files:

- `scripts/cc001/w11/a51/native-snapshot-trace.cjs` — a working CLI and programmatic parser for these exact existing producer schemas. No network access; reads external local files and prints only privacy-minimized aggregate JSON.
- `scripts/cc001/w11/a51/native-snapshot-trace.test.cjs` — 26 executable positive/negative regression checks, including malformed tokens, duplicate/reversed revisions, wrong-side logs, mixed producer families, matching-revision `actionSerial`/turn/phase/chunks/ball-count disagreement, no false latency, no false payload-parity, no PII leak, deterministic output and fail-closed CLI output handling.

Usage on an **A70/A72-authorized exact-SHA** Windows build *after collecting original logs on independent PC1 & PC2*:

```bash
node scripts/cc001/w11/a51/native-snapshot-trace.cjs --pc1 /secure/PC1_Player.log --pc2 /secure/PC2_Player.log --out /secure/cc001-w11-native-trace.json
```

- Output retains **input raw SHA-256 and byte lengths**, but not raw text/IPs/connection IDs. Restrict originals to private QA storage; do not post unredacted `Player.log` to public GitHub.
- The parser reports an ERROR on duplicate/conflicting same-revision observations. It does not silently overwrite later data.
- If two exact native markers refer to the same revision, compares **available metadata only**; it cannot compare payload hashes, absent in both native formats. `sameRevisionMetadata=MATCHED_METADATA_ONLY` is deliberately **not** `G3_PASS`. Source build SHA and run/session ID must be established by independent A72 manifests and operator evidence.
- It is invalid to interpret A41 sampled rows as loss/jitter telemetry or compare A31's `tms` across two PCs to derive latency. A41's cumulative `skippedRevisions` reflects source admission gaps but is not on its own network loss attribution.
- No ball positions are present in either format. Visible stutter, legal teleports (Blink/Time Shift/PORTAL), view/power/aim and true authoritative state parity must be judged separately by A60 on real binary/frame evidence.
- A31 #184 is stacked against an *older A41 parent*, not necessarily the final selected W10 #180 or A70 candidate; only trace formats actually present in the chosen build are valid evidence. Never pretend that two producer families are one compatible source; mixed input returns `MIXED_TRACE_PRODUCERS` ERROR.

## Current code owner / candidate gates (observed 2026-10-30)

- Frozen protected RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0` **unchanged**.
- A70 official W10 developer draft PR #181 head `3d377767e72473cebd90e49293a0cd5dada70464`. A30 stacked corrective addon #189 head `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193` **not yet accepted by A70 at the time of this A51 check**. These SHAs are not interchangeable for tests/build.
- A50 selected A34 wired display smoother #174 over A50 unwired helper #169 (`CLOSED UNMERGED`); A41 size-budgeted network pacing competes with A30 fixed cadence. Do **not** stack both or merge whole conflicting PRs in A51 role.
- A60 #139 reports official #181 lacks live smoother and retains post-shot strength strip; #189 proposes fixing both but is an unintegrated draft. A72 #188 Windows operator kit currently pins **#181 SHA**, so must be rebuilt/reapproved if A70 adopts #189 or any further source changes.

## Actual tests and provenance

On isolated Linux with Node 22.16.0:

| Command | Exit | Result |
| --- | --- | --- |
| `node --check scripts/cc001/w11/a51/native-snapshot-trace.cjs` | 0 | PASS |
| `node --check scripts/cc001/w11/a51/native-snapshot-trace.test.cjs` | 0 | PASS |
| `node scripts/cc001/w11/a51/native-snapshot-trace.test.cjs` | 0 | **26/26 PASS** |
| existing W10 `node scripts/cc001/w9/a51/pc-pair-trace.test.cjs` | 0 | **26/26 PASS**, unchanged existing tool |
| `command -v dotnet` | 1 | NOT_INSTALLED |
| `command -v Unity` | 1 | NOT_INSTALLED |

**Not run:** actual paired raw PC1–PC2 logs; Unity/.NET managed/codec tests on this W11 code; native Windows Player build; rendering FPS measurements; multiplayer G3; independent A60 QA; full state byte-for-byte parity; game production release. The new 26 source-format assertions use synthetically constructed log lines patterned **exactly after A31/A41 committed code**, not recordings of real transport.

## A51 handoff

**A70** select and integrate one compatible snapshot rate/presentation path on an isolated candidate; confirm exact new SHA and which A31/A41 trace producer was actually included. **A72** build complete Windows Player at that exact SHA and preserve original evidence. **A60** execute independent two-PC QA, verify same executable and source SHA on both, real legal P2 accepted intent, revision/action state evidence, visual smoothness/aim and actual P2 turn/deck, no power meter. **A31** only if authorized may wire one minimal trace producer; no new wire or Protocol149 changes. **A51** can consume the original log pair via the new CLI and report metadata anomalies, without claiming G3/G4.

**DESIGNED=YES / IMPLEMENTED=YES (Node native-format parser) / TESTED=52/52 scoped Node tests PASS (new26 + existing26) / INTEGRATED=NO / RELEASED=NO / P0_MULTIPLAYER=HOLD / G3=HOLD / G4=HOLD.**
