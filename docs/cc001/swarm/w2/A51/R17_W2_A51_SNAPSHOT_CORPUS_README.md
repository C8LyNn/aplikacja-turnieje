# CC-001 R17-W2 / A51 — Network snapshot negative-case corpus

**Issue:** [#110](https://github.com/C8LyNn/aplikacja-turnieje/issues/110)  
**Branch:** `feat/cc001-r17-w2-a51-snapshot-fixtures`  
**Owner:** A51 — Simulation / Instrumentation  
**Input:** exact V149 Unity R16 `CoreClash-V149-R16-Source-Candidate.zip`  
**Input SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**Status:** `DESIGNED / STATIC_SCRIPT_PASS / RUNTIME_TEST_NOT_RUN / NOT_INTEGRATED / NOT_RELEASED`

## 1. Scope and immutable boundaries

This is **R17-W2 pre-import standalone fixture data**, not a networking implementation, gameplay patch, C# test run, Unity build, physical-network experiment, or a reason to mark snapshot admission production-ready. It is separate from the prior **A51 R17-W1 42 ability fixtures** and from A41 reconnect/identity work. The previous W1 artifacts are neither edited nor replaced.

V148 `Reference/V148_reference_original.html` and all V149 Unity gameplay/network sources are untouched. No updates to protocol 149. The **corpus contains zero observed R17 runtime results**.

## 2. Source-truth boundaries, with line references (R16 exact archive)

| Component | Grounded behavior | Source anchor |
|---|---|---|
| `NetworkGameStateAdapter.Apply` | Rejects null packet, protocol mismatch (`149`), stale/duplicate revision, empty JSON; catches decoder exceptions; validates before replacing state or incrementing admitted revision | `Assets/CoreClash/Networking/NetworkGameSession.cs:27–35` |
| `IsValidState` | Inspects spec/RNG, players, nested lists and objects, ball/structure/zone/event geometry, ID uniqueness, nextId, status stamps, saved states | same file `:37–99` |
| `SessionSnapshot` | Exactly `protocol`, `revision`, `stateJson`; corpus does not invent additional transport fields | same file `:6` |
| `NgoWireProtocol` | GZip; `MaxJsonBytes=2×1024×1024`; `MaxCompressedBytes=256×1024`; `ChunkBytes=900`; `MaxChunks=(MaxCompressedBytes+899)/900` | `Assets/CoreClash/Networking/NgoWireProtocol.cs:9–43` |
| `NgoSnapshotAssembler.Add` | Rejects invalid index/count, duplicates, stale revisions and total compressed size; returns `false` for incomplete assembly; decodes complete payload without a local exception handler | same file `:44–62` |
| Baseline, prior negatives | Test helper boots `Sim()`, spawns `normal`, serializes with `System.Text.Json` `IncludeFields=true`, accepts revision `1`, rejects mutation at revision `2`, then accepts valid revision `2` | `Tests/StabilityR16Tests.cs:35–49` |

**Critical distinction:** `NgoSnapshotAssembler.Add(...)` can throw when a final corrupted GZip chunk reaches `NgoWireProtocol.Decode(...)`. Such a case is **EXCEPTION**, not `false`/normal rejection, and not evidence of a remotely exploitable bug. Whether its caller catches the exception and recovers must be **runtime verified** by A31/A60. The code does not define a chunk timeout; a missing chunk remains pending in the pure assembler.

## 3. Fixture inventory — exactly 41 cases

The JSON manifest is the authoritative exact case specification; all fixture IDs are immutable `CC001-R17-W2-A51-SNAP-001` through `-041`.

| Family | Count | Cases |
|---|---:|---|
| `ADAPTER` | **29** | legal revision progression, stale/replayed revision, wrong protocol, missing payload, null packet, thrown/null decoder, invalid spec/RNG, nested player/stock/event/status/structure/zone/graveyard, invalid stamp family, shared-ID collisions, nextId errors, NaN/Infinity geometry, nested saved-state nonfinite |
| `CODEC` | **5** | valid GZip roundtrip, oversized compressed payload, oversized inflation, oversized raw encode input, corrupt gzip exception |
| `ASSEMBLER` | **7** | out-of-range index, excessive count, duplicate chunk with later completion, omitted chunk, replayed completed revision, inconsistent count, final corrupted chunk exception |

All **41** entries have a source file/line anchor, typed input representation, deterministic fixture seed string, chronological packet order, expected behavior, last-good-state/revision contract, telemetry expectation, and `runtime_test_status=NOT_RUN`. Entries involving exact exception type or recovery after broken GZip carry `SOURCE_EXPECTATION_NEEDS_HARNESS` and a clear open question rather than inventing evidence.

## 4. Baseline, mutations and legal JSON rule

For adapter cases construct a **fresh** R16 `GameSimulation` with the same `Sim()` fixture and one `normal` ball (`Spawn(0, "normal", 200, 450)`) as `StabilityR16Tests.cs`. Serialize the baseline `GameState` using `System.Text.Json` and `IncludeFields=true` (this is a **future C# harness recipe**, not executed here). Create a fresh adapter and admit snapshot revision `1` to obtain `S1`. Each negative case injects **one mutation** into a decoded clone at revision `2`, rejects it while retaining exactly `S1`, and then attempts a **valid revision 2**; success verifies failure did not poison the revision. Do not share mutable state between cases.

The JSON corpus describes *instructions* for C# in-memory mutation, not literal malformed packets. **Raw strict JSON cannot encode bare `NaN`, `Infinity` or .NET float objects.** Therefore nonfinite cases are `IN_MEMORY_GAMESTATE` with explicit `float.NaN/float.PositiveInfinity` instructions. A future JSON parser-failure test must use separately specified raw bytes; never silently translate the token `"float.NaN"` into a legal network JSON numeric payload. `PACKET_METADATA`, `COMPRESSED_BYTES`, `CHUNK_METADATA` and `INVALID_UTF8_OR_GZIP_BYTES` are likewise different transport layers.

For the two-chunk fixtures, a future harness must create an actual valid compressed payload requiring **exactly two 900-byte chunks**, rather than assume an arbitrary short JSON will compress to two chunks. For the inflation-over-limit case create a gzip stream within the 256 KiB compressed cap that inflates beyond 2 MiB. These are executable **recipes**, not prebuilt binary fixtures.

## 5. Expected invariant and future telemetry

On an invalid `NetworkGameStateAdapter.Apply`:

1. `Apply=false`, reason is a rejection reason, state still references the identical last-good `S1` object.
2. Its canonical serialized value/hash does not change.
3. Admitted revision does not advance. A corrected *same revision* `2` is accepted.
4. Earlier revision `1` remains rejected after `2` is committed; no rollback.

On wire rejection before admission, no adapter state change is possible **provided** the upstream integration does not call `Apply`. For assembler `false` may mean **waiting for remaining chunks**, not invalidating the revision; capture `PENDING` separately from `REJECT`.

Future event telemetry (`telemetry_schema.fields` in JSON) includes `case_id`, `step_index`, `fixture_seed`, source SHA, packet revision, input representation and input SHA, expected/observed outcome, exception class/message, state before/after hash, reference equality, observed revision/retry behavior, runtime commit SHA and notes. Trace only actual runtime observations; do not populate `observed_*` with source predictions.

## 6. Static preflight (executed) and the correct runtime gate

After extracting the verified R16 ZIP into an **isolated disposable copy**, run:

```bash
node scripts/cc001/r17-w2-a51-snapshot-preflight.cjs \
  --corpus=docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json \
  --source=/path/to/CoreClash-V149-Unity \
  --archive=/path/to/CoreClash-V149-R16-Source-Candidate.zip
```

The standalone Node script verifies: exact R16 archive SHA when supplied; all four direct-source SHA values; source anchor line-range validity; schema, case IDs and order; classification and negative/positive coverage; status honesty; NaN/Infinity representation policy; per-case telemetry fields. It **never runs** Unity, NGO, C# or the network codec. `--schema-only` explicitly skips source checks and cannot substitute for the full check.

**Actually executed A51 W2 (2026-10-18):** Node `v22.16.0`, exact R16 ZIP SHA `MATCH`, 41/41 corpus checks `STATIC_SCRIPT_PASS`, four source hashes `MATCH`. Negative-control mutations of the JSON are rejected by the script; no runtime fixtures executed. Previous R16 269/269 managed test and same-PC network smoke are historical evidence only.

**Later runtime sequence for A31/A60 (NOT RUN):** load R16 C# tests in accepted exact source baseline; add test-first cases for adapter semantics and single-step `NgoWireProtocol`/`NgoSnapshotAssembler` calls; record valid/invalid chronological packet trace and `Object.ReferenceEquals`; test malformed gzip exceptions and recovery at actual caller boundary; run network/serialization regression with observed outcomes before any readiness promotion. Do not change protocol 149 without explicit approval. No physical-device/network execution is part of this work.

## 7. Open risks / quality classification

- **R17-A51-W2-01:** Corrupted final GZip chunk can throw from `NgoSnapshotAssembler.Add`; verify **caller exception-handling** and whether following higher-revision payload is correctly processed. No bug/security judgment without reproduction.
- **R17-A51-W2-02:** A no-final-chunk assembly is **PENDING**, not a completed rejected snapshot; recovery policy depends on higher-level transport.
- **R17-A51-W2-03:** Source validation supports standard C# in-memory nonfinite values; actual wire `JsonUtility`/codec parsing of malformed lexemes requires separate harness.
- **R17-A51-W2-04:** Source baseline R16 downloaded and SHA verified; R17 A70 Git import and A60 native runtime gate independently owned.
- **R17-A51-W2-05:** Exact exception class/message and state after thrown assembler decode require future runtime evidence.

## 8. Handoff and status vocabulary

- **DESIGNED:** YES — 41 independent, source-anchored snapshot test definitions; deterministic schedule; trace schema.
- **IMPLEMENTED:** YES — isolated JSON data and pure Node static preflight only; **NO** Unity/game/network source implementation.
- **TESTED:** `STATIC_SCRIPT_PASS` for artifact/schema/source provenance; `RUNTIME_TEST_NOT_RUN` for **41/41**.
- **INTEGRATED:** NO.
- **RELEASED:** NO.

**HANDOFF → 00/HQ:** review data+provenance and route later runtime gate without merging this pre-import task. **A31:** use separate C# test harness for protocol 149 adapter/codec/assembler, observe actual exception and recovery. **A60:** independently audit results and classify `PENDING` vs `REJECT` vs `EXCEPTION`; do not close any QA gate on static checks. **A70:** no dependency or code change requested.

**OUT OF SCOPE:** production edit, gameplay, 42 W1 ability cases, A41 seat identity, HTML V148, live deployment, merge.
