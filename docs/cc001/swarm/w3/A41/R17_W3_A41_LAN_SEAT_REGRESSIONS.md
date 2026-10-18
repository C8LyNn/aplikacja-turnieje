# CC-001 — R17-W3 / A41 — LAN seat identity and sequence regression implementation

**Issue:** [#123](https://github.com/C8LyNn/aplikacja-turnieje/issues/123)  
**Agent:** A41 — Backend / Multiplayer (existing role)  
**Branch:** `feat/cc001-r17-w3-a41-lan-seat-tests`  
**Branch base SHA:** `e9e235a69a04eb57727defd308918321836d7f02` (W3 dispatch branch on frozen A70 source import; source baseline commit `de1fe4b88fce3bd08ef383165dc2cd622af2536b`)  
**R16 canonical source ZIP SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**Test implementation commit:** `a1f2e81488c92c3f187cab893fe1a70e324b8df4`  
**Status:** TEST CASES IMPLEMENTED, C# MANAGED EXECUTION **NOT RUN**. No release/merge.

## 1. Task boundaries and why no production fix was made

R17-W3 [master dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w3-parallel-source-development-20261018/docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md) authorizes **current R16 policy regression tests** in `Tests/NetworkSeatTests.cs`, and a narrow `LanSeat.cs` repair only if a real defect is reproduced. This is **not** the [R17-W2 A41 authenticated reconnect proposal](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a41-reconnect-design/docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md): HQ has **not** authorized active-match host-controlled seat replacement or token-based same-player recovery.

Source review shows current `LanSeat` permits one pending and one connected P2 ID, expires pending after ten seconds, and releases the connected seat on disconnect. `NetworkGameSession` separately enforces owner and monotonic command sequence; `NgoGameSession` is the transport-to-seat authorization bridge. Thus **seat refill is not identity-authenticated resume**. Existing Protocol 149 remains unchanged.

**No real baseline policy defect has been reproduced through executed managed tests in the available environment.** Therefore `LanSeat.cs` was intentionally **unchanged**; introducing a speculative change would violate the dispatch.

## 2. Exact changes

**Modified, owned test file only:**
`unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs`

- Original six test definitions preserved in place, unchanged.
- Added **17 R17 security and sequence regression definitions** to the existing `NetworkSeatTests()` suite (23 total), without adding new suite registration or editing `Tests/Program.cs`.
- Pure `LanSeat` tests use its actual public API. The owner-sequence tests use existing `Sim()`, `Shot()`, `Settle()`, `NetworkGameSession.Submit()`, and existing assertion helpers. These are tests of managed logic, **not** wire-level NGO/RPC, real transport or physical device behavior.
- No .NET assembly/package, Unity .meta, snapshot decoder, presentation, ability registry, protected reference or website changes.

**New owned report:** `docs/cc001/swarm/w3/A41/R17_W3_A41_LAN_SEAT_REGRESSIONS.md`.

**Exact production file NOT modified:** `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/LanSeat.cs` Git blob SHA `d2b81ce7594067fcf84ae2cc904891b54fd388df` unchanged.

## 3. Test-first acceptance cases added — all NOT EXECUTED

Each row identifies a new C# test assertion; **the status is NOT RUN**, regardless of whether the current source review predicts that it passes.

| ID | New test | Expected current-R16 behavior | Runtime |
|---|---|---|---|
| A41-01 | Pending seat expires exactly at ten-second deadline | At 9.999 still pending; commit at 10 denied; new ID may claim free slot | NOT RUN |
| A41-02 | Failed competing reservations cannot extend lease | Pending reservation remains owned by original ID until original deadline | NOT RUN |
| A41-03 | Invalid time and transport ID zero | NaN/±Infinity and ID 0 rejected without mutation | NOT RUN |
| A41-04 | Pending cannot own; exact commit once | No commands before Commit; wrong candidate and repeated commit denied | NOT RUN |
| A41-05 | Nonfinite `Expire` query | Invalid clock never clears pending; valid expiration still works | NOT RUN |
| A41-06 | Connected seat survives large clock advance | Only pending reservation expires; connected ID persists until released | NOT RUN |
| A41-07 | Stale disconnect while replacement pending | Released old ID cannot evict a distinct pending or committed new P2 | NOT RUN |
| A41-08 | Stale pending cancellation after new commit | Old pending ID cannot revoke a newly connected ID | NOT RUN |
| A41-09 | `Reset()` with pending and connected state | Reset invalidates former claims; subsequent fresh reservation succeeds | NOT RUN |
| A41-10 | 512 reserve/commit/release cycles | At most one owner/pending candidate; no stale occupancy between cycles | NOT RUN |
| A41-11 | Spoof P1 owner from P2 authority | Invalid owner claim cannot advance actionSerial; valid P2 can act | NOT RUN |
| A41-12 | Null, out-of-range owner, nonpositive sequence | Invalid intent never mutates host; subsequent legal sequence can act | NOT RUN |
| A41-13 | Duplicate and decreasing command sequence | An accepted command cannot be applied twice | NOT RUN |
| A41-14 | Invalid high sequence does not poison future sequence | Rejected simulation intent must not advance the sequence guard | NOT RUN |
| A41-15 | P2 next intent rejected during Moving | Bad premature command does not consume the legal bonus-shot sequence | NOT RUN |
| A41-16 | Released old P2 then new transport binding | Explicit seat.Owns(sender) gate rejects old transport; new P2 sequence=1, duplicate denied | NOT RUN |
| A41-17 | Expired candidate with stale callbacks | Stale callbacks do not revoke an unrelated valid replacement | NOT RUN |

These tests strengthen the W1 NET-08/09 and W2 IDR-01/02/03/09/10/11/13/14/20 designs, without claiming to execute or replicate the entire W1/W2 test corpus.

## 4. Evidence actually obtained

### 4.1 Inspected real source

Canonical R16 archive had already been downloaded and independently verified from original Drive package in A41's W1 audit. The W3 branch was read through GitHub: `LanSeat.cs`, `NetworkSeatTests.cs`, and relevant W2 source/trust decision. A70 source-import SHA and tree were supplied by W3 dispatch; no unexpected fork of `LanSeat.cs` was introduced.

**Readback of changed GitHub test file:** blob `e11649e9c13d33c48188f4f2dcb71b2bc10ecf05`, 23 test declarations (6 original + 17 new), all unique; braces/parentheses/brackets balanced by a lightweight JavaScript lexical delimiter scan. Checks also confirmed presence of spoof, timeout and sequence cases. **These are STATIC CHECKS ONLY** — balanced delimiters do not demonstrate C# syntax or executable semantics.

### 4.2 Exact GitHub diff

After the test-only commit `a1f2e81488c92c3f187cab893fe1a70e324b8df4`, GitHub compared the W3 branch with base `e9e235a69a04eb57727defd308918321836d7f02`: `ahead_by=1`, `behind_by=0`, only `Tests/NetworkSeatTests.cs` changed, +165 lines / 0 deletions. It did not touch `LanSeat.cs` or any other agent's file.

### 4.3 Why no actual managed or Unity PASS

The available container has **no `dotnet` / SDK 9 compiler** (checked `command -v dotnet` and `dotnet --info`); network access to obtain the SDK was also unavailable (DNS resolution failed). GitHub returned **zero workflow runs and no CI status checks** for the test commit at inspection time. Consequently:

- `dotnet run --project Tests/CoreClash.Tests.csproj -- <Unity-project-root>`: **NOT RUN**.
- Unity `6000.4.0f1` compilation and GUI/native smoke: **NOT RUN**.
- NGO, Relay/MPS/WSS, separate-device Android/WebGL, WAN jitter and actual reconnection: **NOT RUN**.
- No claimed red/green failure or runtime PASS. Historical R16 269/269 managed results are **not** new W3 evidence.

The authored test definitions are reviewed structurally, not compiled. Integration/QA must run them and may need to correct a failing test hypothesis before accepting source.

## 5. Security caveats and follow-up

1. **Old transport spoof protection is layered.** `LanSeat` alone checks numeric IDs; the actual `NgoGameSession` must check `seat.Owns(SenderClientId)` before delegating to `NetworkGameSession.Submit`. A41-16 deliberately models this composition; it **does not** prove that an NGO callback race has been tested on a real transport.
2. **Reused numeric ID across lifetimes** is not cryptographic continuity. A delayed callback with exactly the same numeric ID as a newly allocated transport cannot be distinguished by the current `LanSeat.Release(ulong)` signature alone. No narrowly justified fix is possible in allowed paths without a verified session-generation input from NGO. **OPEN / NOT REPRODUCED** — refer to A31/HQ, not a claimed exploit.
3. **Match reconnect semantics remain unchanged.** Release makes P2 vacant; next successful candidate may fill it. This is current behavior only, not the proposed host-authorization state machine of W2.
4. **No new backend or identity service.** Managed UGS/MPS/Relay transport is orthogonal to current LAN seat ownership; W3 does not change protocol 149, transport or authentication.
5. **Possible runtime/flaky acceptance:** A41-15 relies on R16's established P2 bonus-shot turn mechanics and needs managed execution; if R16 in that scenario produces a different phase/bonus, capture a real failing log and revise only the test hypothesis, never silently rewrite rules.

## 6. Next exact QA commands (after toolchain availability)

From the imported Unity project root (do not run old driver in canonical R16 ZIP directory; use disposable/copy checkout as R16 handoff requires):

```bash
# Require .NET 9 and a disposable working copy, so legacy Evidence writes do not mutate frozen baseline.
dotnet --info
dotnet run --project Tests/CoreClash.Tests.csproj -- "$PWD"
# Review RESULT, all 23 NetworkSeatTests entries, and generated Evidence/unity-tests.json.
# For clean-after test, use git status --short and git diff --check on OWN W3 branch.
```

**Caution:** the existing tests executable writes to `Evidence`. Isolate/backup it in a disposable worktree; never contaminate immutable R16 evidence. Follow up with Unity compile/native QA under A72/A60; verify exact return exit and logs. Do not promote physical crossplay from this test suite.

## 7. HANDOFF — A41 → 00/HQ, A60, A31

```text
PROJECT: CC-001
WAVE: R17-W3 — PARALLEL SOURCE DEVELOPMENT
AGENT: A41 — Backend / Multiplayer
ISSUE: #123
OWN BRANCH: feat/cc001-r17-w3-a41-lan-seat-tests
BASE SHA: e9e235a69a04eb57727defd308918321836d7f02
TEST IMPLEMENTATION COMMIT: a1f2e81488c92c3f187cab893fe1a70e324b8df4
FINAL COMMIT SHA: [capture report commit SHA in Issue #123 HANDOFF]
CHANGED PATHS: NetworkSeatTests.cs plus this new A41 report; no LanSeat.cs change
R16 SOURCE SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
RESULT: +17 managed LAN seat/command-authority test definitions; 23 total; no policy/runtime changes
TESTS ACTUALLY RUN: static GitHub readback (23 unique test names / balanced lexical delimiters / one-file test diff) PASS; .NET managed suite NOT RUN
NOT RUN: dotnet compile/tests, Unity, NGO, Relay, Android, WebGL, physical crossplay, WAN
DESIGNED: YES
IMPLEMENTED: YES (test code only; no LanSeat policy fix)
TESTED: STATIC ONLY; MANAGED NOT RUN
INTEGRATED: NO
RELEASED: NO
KNOWN LIMITATIONS: no dotnet9 / network SDK download; potential reused numeric transport ID cannot be solved inside LanSeat alone; no secured resume
HANDOFF: 00/HQ for acceptance, A60 for independently compiled validation, A31 for future transport/device tests
```

**No merge, force-push, release, live site update, V148 modification or off-scope file change.**
