# CC-001 — R17-W3 / A51 Snapshot Admission Regression Tests

**Agent:** A51 — Simulation / Instrumentation  
**Issue:** [#125](https://github.com/C8LyNn/aplikacja-turnieje/issues/125)  
**Branch:** `feat/cc001-r17-w3-a51-snapshot-tests`  
**Status:** **IMPLEMENTED — NOT COMPILED / NOT EXECUTED**. This distinction is deliberate.  
**Owner:** 00/HQ, downstream review A60 and networking consultation A31.

## Immutable input and controlled source area

- Imported frozen source baseline: `de1fe4b88fce3bd08ef383165dc2cd622af2536b` (A70 source subtree `unity/cc001-r16/CoreClash-V149-Unity/`).
- Original R16 source ZIP: `CoreClash-V149-R16-Source-Candidate.zip`, **17,690,458 bytes**, SHA-256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` (independently checked).
- Original `Tests/StabilityR16Tests.cs` Git blob SHA1 `81307b95d857c2891318098c72d4e948471a6809`. Original `NetworkGameSession.cs` blob SHA1 `31688ddabb45aebeaa7fcf7149f6b58d2131834c`.
- Original test suite and `RejectSnapshotMutation` helper preserved; **no changes to** `NetworkGameSession.cs`, `Tests/Program.cs`, any other Unity source, protocol 149, certified V148, or public game versions.
- New source file is an **edit to existing** `Tests/StabilityR16Tests.cs` only. No Unity `.meta` additions.
- Prior first-wave 42 gameplay fixture definitions and W2 41-case snapshot JSON oracle preserved unchanged. This is a focused R17-W3 subset, not a rerun of all W2 cases.

## Implemented C# test coverage

`StabilityR16Tests()` already runs from `Program.Main`. It now calls `W3SnapshotAdmissionCases()`; each independent `Test(...)` registers with the existing managed suite. **23 new registered C# tests** cover **21 distinct W2 source IDs** (`SNAP-007` has two different decoder negative controls), plus one host intent test without `LanSeat` or wire changes.

| Case IDs from W2 #110 | Added C# test action | Critical assertion |
|---|---|---|
| SNAP-001 | Valid JSON revisions 17→18 | Both admitted; replacement state identical by value but distinct by object reference |
| SNAP-002,003 | Stale and duplicate revisions | Reject; retain exact previous object and value; next admissible revision succeeds |
| SNAP-004,005,006 | Protocol 148, empty string, null packet | Fail closed before decoding; no state replacement |
| SNAP-007 | Explicit decoding exception **and** malformed JSON via real System.Text.Json | Exception contained; correct payload at **same revision** accepted |
| SNAP-008 | Decoder returns null | Reject and accept valid same-revision retry |
| SNAP-011,012,013,014,016 | Null players, null nested stock/stamp/events, illegal `EARTH` status family | Corrupted JSON decoded through real JSON parser; rejected without mutation |
| SNAP-019,020,021 | Duplicate ball ID, zone ID collision, nextId cursor | Reject cross-entity identity conflicts; preserve last good state |
| SNAP-022,023,024,025 | NaN coordinate, Infinity velocity/portal exit/event | Test **in-memory floating point GameState** only — JSON does not legally represent NaN/Infinity |
| SNAP-029 | Zone with null `inside` collection | Reject decoded malformed nested collection |
| Additional: host command | Zero sequence, wrong-owner spoof, valid sequence 1 and duplicate | Invalid command does not mutate action serial / ball count; only valid intent advances |

### Observable test guarantees

- Construct an actual seeded `Sim()`, spawn a normal ball, serialize with `System.Text.Json` **IncludeFields=true**, admit revision 17.
- Inject precisely one corrupted revision 18 (or rejected envelope); assert rejected result and non-empty rejection reason.
- Assert **`Object.ReferenceEquals(lastGood, adapter.State)`** and equal serialized state value after rejection.
- Retry with valid state at the rejected **same revision 18** and require success. A second receipt of revision 18 is rejected. This indirectly proves the private admission cursor did not advance on invalid payload.
- Representable null/ID/status/collection cases use real serialization + JSON decoding; non-finite values are injected via explicit in-memory `GameState` decoder to avoid fabricating non-standard wire JSON.
- `SNAP-007` malformed JSON passes `{"balls":[` to the real JSON parser and verifies exception containment and subsequent recovery.
- The host intent test touches only `NetworkGameSession.Submit`, not LAN seat allocation or reconnect authorization (A41 ownership).

## Before/after scope

**Before:** existing R16 suite had four test groups validating individual invalid mutations but lacked a granular named regression mapping for 21 W2 negative-case IDs, explicit stale/duplicate/protocol/empty/null envelope coverage, actual malformed JSON decoder exception, and serialized state-value checks alongside object identity.

**After (authored source):** the existing suite registers 23 additional independent test cases with those properties. **Whether these tests compile and PASS under .NET9 is not yet verified**; do not count them as R17 runtime execution evidence.

## Actually executed, with evidence scope

1. Independently hashed original R16 ZIP: **17,690,458 bytes**, SHA-256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` — PASS.
2. Validated the two local R16 source blobs match their exact Git SHA1 from A70: PASS.
3. Executed in a disposable extracted R16 project: `node Tools/verify-data.cjs` — **EXIT 0 / PASS**, reported 227 records / 224 specials / 12 archetypes / 36 canonical + 4 provisional decks. This is **data/source validation**, not C# admission testing.
4. Ran local, non-delivered `python static_preflight.py` against new C# text and W2 corpus — **PASS**: 23 distinct `Test` statements, 21 distinct W2 case IDs, existing `Program.Main` suite registration present, R16 pre-existing helper/suite preserved, lexical delimiter/string check PASS and exact ZIP hash PASS. This is a **STATIC TEXT CHECK**, not a C# compiler or executed test.
5. GitHub commit readback and changed-path gate to be filled by verified commit and Issue HANDOFF.

**NOT RUN:** `dotnet run --project Tests/CoreClash.Tests.csproj -- <project-root>`; the current environment contains neither `dotnet` nor Unity executable. No actual new C# test has passed or failed. No Unity/native collider, NGO transport, compression/chunking, cross-device, Android, WebGL, WAN or physical tests were performed. R16 historical 269/269 is **historical delivery evidence**, not an A51 R17-W3 rerun. No claim of issue resolution, QA PASS or networking certification.

## Reproduction to be performed by a runner with .NET 9

Use a disposable checkout of the **specific Git branch/commit**. From `unity/cc001-r16/CoreClash-V149-Unity/`, execute:

```bash
node Tools/verify-data.cjs
# .NET SDK 9+ required; do not run historical test harness on protected source without a disposable copy.
dotnet run --project Tests/CoreClash.Tests.csproj -- "$(pwd)"
```

Report exact commit, `dotnet --info`, test exit code, named `R17-W3` cases, total managed pass/fail, test output and any failing traces. If failures arise, **preserve the failure as evidence** and escalate; do not casually broaden scope to networking, gameplay or protocol.

**Outside current managed target:** `NgoWireProtocol` and `NgoSnapshotAssembler` are excluded from `CoreClash.Tests.csproj` by `<Compile ... Exclude=".../Ngo*.cs" />`. W2 codec/assembler cases 030–041 remain NOT_RUN/NOT_PORTED; GZip decompression exception hypothesis is **UNVERIFIED** in the actual NGO/transport layer.

## Acceptance / status and HANDOFF

- **DESIGNED:** YES — 23 C# regression entries covering 21 W2 fixture IDs and a host intent guard.
- **IMPLEMENTED:** YES — test code only, no production fix or protocol change.
- **TESTED:** **STATIC SCRIPT PASS**, **MANAGED C# NOT RUN**, **UNITY NOT RUN**.
- **INTEGRATED:** NO — isolated feature branch pending HQ review and A60.
- **RELEASED:** NO.

**HQ / 00:** Take only this isolated test-file/report delta into the future controlled candidate, after verifying managed execution on approved .NET 9 tooling. **A60:** independently run full managed suite, validate test evidence and immutability. **A31:** own later NGO codec/assembler, transport and physical/network coverage; do not infer success from pure-adapter tests. **A41:** this commit does not touch LAN seat policy or reconnect semantics. All W2 codec/assembler and broader unported snapshot cases remain separately unverified.

**PROPOSED FINAL STATE:** W3 A51 TESTS AUTHORED — MANAGED VALIDATION PENDING.
