# CC-001 — R17-W11 / A41 — exact-revision state parity instrumentation (implementation)

**Agent:** A41 Backend / Multiplayer. **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).  
**Selected upstream candidate, NOT MERGED:** A70 [PR #181](https://github.com/C8LyNn/aplikacja-turnieje/pull/181) @ `3d377767e72473cebd90e49293a0cd5dada70464` and the A30 correction [PR #189](https://github.com/C8LyNn/aplikacja-turnieje/pull/189) exact HEAD **`3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`**.  
**W11 A41 own branch:** `feat/cc001-r17-w11-a41-snapshot-digest-parity` cut from exactly the #189 SHA above. These edits exist **only on A41 branch**; this is a proposed STACKED PR targeted at #189, not an edit to A30/A70 refs.  
**Protected RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` unchanged. **Protocol149/R16/V148/site/main:** unchanged. No merge, force push, build, release or deployment.

## 1. What was implemented — source change, not another audit

### Problem reproduced from actual integrated-source review

The A70 W10 candidate #181 and A30 corrected #189 have snapshot revisions, owner/turn, action serial and rate-limited host/client logs, but these fields **cannot detect when ball positions/HP/etc differ for the same revision**. A60 #139 explicitly requires authoritative parity proof. A31/A51 offline parsers are complementary, not payload parity certificates. The W10 original [A41 #180](https://github.com/C8LyNn/aplikacja-turnieje/pull/180) adaptive 20/12/8/4Hz logic and stale-ACK gate already appear in A30 #189: **do not duplicate or replace them again**. A30 #175 unconditional 20Hz is **ALT_HOLD/SUPERSEDED IN A30 #189**; this W11 delta does not import it.

### Actual W11 code

1. `Assets/CoreClash/Networking/NetworkGameSession.cs`: pure managed `NetworkStateDigest.ShouldSample(revision)` samples **revision 1 and multiples of 16** deterministically on both peers; `Compute(string stateJson)` returns full lowercase SHA-256 over UTF-8 serialization. No altered `SessionSnapshot`, simulation, command or wire fields. Null/empty string is rejected with a null result for test contract.
2. `Assets/CoreClash/Networking/NgoGameSession.cs`: after successful server `SnapshotChunkRpc` calls, emit `CC_W11_STATE_TX revision=R sha256=H action=A turn=T`; after valid client `NetworkGameStateAdapter.Apply` and state install, emit `CC_W11_STATE_RX revision=R sha256=H action=A turn=T`. **Both hash exactly the original `packet.stateJson` string**, not re-encoded state and not the smoother's display coordinates. No raw JSON, credentials, IP or connection ID. Sampling by revision rather than unsynchronized PC timestamps allows exact matching. At 20Hz it produces about 1.25 lines/sec; at 4Hz 1 line/4sec, plus first revision.
3. `Tests/NetworkSeatTests.cs`: **3 new C# managed test definitions** (standard SHA256(`abc`) vector, deterministic differing-state digest, revision sampling). Current integrated suite has **33 seat/test definitions (30 prior + 3 new)**. **C# NOT COMPILED OR RUN** here; .NET9 absent.
4. `scripts/cc001/w11/a41/state-parity.cjs`: standalone offline Node22 comparator taking two original redacted Windows Player logs from one matched run, comparing **same revision only**: digest, action serial and authoritative turn. It outputs counters only, not state JSON or hashes. Outcomes: `PASS_SCOPED` exit0 when >=1 matched sampled revision and no mismatch; `FAIL` exit1 on mismatched digest/action/turn, bad/malformed/role-confused/conflicting logs; `HOLD` exit2 on no common sampled revision. Host-only/client-only sample counts expose coverage gaps without claiming packet loss.
5. `scripts/cc001/w11/a41/state-parity.test.cjs`: **14 real Node22 positive/negative executable tests**, including actual child-process invocation with exit0 and exit1. No synthetic-only case can establish that a Unity scene/network rendered properly.

## 2. Exact tests that actually executed

**LOCAL EXECUTED, Node v22.16.0, exit 0:** `node --check state-parity.cjs`; `node --check state-parity.test.cjs`; `node --test state-parity.test.cjs`: **14/14 PASS, 0 FAIL**. Fixtures exercise valid same-revision digest, changed JSON digest, changed action/turn, missing overlap, sample coverage gap, repeated/conflicting revision, malformed hash, incorrect log role, unsafe revision, missing logs and native CLI exit status. Local files are byte-exactly mirrored in GitHub:
- `state-parity.cjs`: raw local SHA256 `90d8775da1984d6307a5ea42cb890b36829fea096d158ec519cbfcba6d9718f5`; local `git hash-object` and GitHub blob **`2fe1e88a993216bf26415ce02c2c567122c87262`** match.
- `state-parity.test.cjs`: raw local SHA256 `a5a81c3747f2ab0a2cfe7dda83aa284b9cb2d5550ce75ddd42eb574c796ed022`; local Git blob / GitHub blob **`2b9a60a73a357dec5980fcc359ca661cfa8c65ca`** match.

**GITHUB STATIC SOURCE CHECK:** 11/11 checks PASS: helper presence, sample IDs same on host/client, logs gated post approved/apply, SHA256, Protocol149, existing host authority/seat/sequence unchanged, total 33 authored managed test definitions, no raw packet JSON logged. This is source analysis, **not C# execution**.

**NOT RUN / NO ASSERTED PASS:** `dotnet` (not installed in this container), 33 C# managed tests, Unity Editor/Windows build, IL2CPP/WebGL/Android SHA availability, real NGO host/client session, actual two-PC fresh Player.log input, physics/render frame smoothness or full A60 QA. No actual paired W11 logs were provided, so `LIVE_STATE_PARITY=NOT_RUN`. Existing RC1 build and previous RC1 361/361 results **do not certify these new bytes**.

## 3. How A60 runs this on real PC1/PC2

After A70 explicitly accepts exact #189 + this stacked A41 delta in a new disposable integration HEAD, A72 prepares a fresh Windows build of **that exact SHA** and two verified matching Players. Test the physical private LAN on separate PCs; capture original local host and client Player.log plus independent UTC/machine identity/build SHA (redact the IP, room code, IDs and credentials before sending any logs to GitHub). For logs from **one session**, run:

```bash
node scripts/cc001/w11/a41/state-parity.cjs --host PC1-Player.log --client PC2-Player.log
node --test scripts/cc001/w11/a41/state-parity.test.cjs
```

`PASS_SCOPED` means only **matching sampled received wire JSON for at least one matched revision** (and action/turn); it **does not** prove that the client rendered those poses smoothly, that all revisions arrived or that two independent actual PCs were used. `FAIL` needs matched-revision raw logs and a repro; `HOLD` needs further sampling/overlap. Validate **one legal accepted P2 owner1 command**, strictly monotonic snapshots, no ghost duplicate intents, stable P2 ball visual interpolation and true TELEPORT/PORTAL snaps, local controls/turn/aim and no power meter separately.

**G3 remains HOLD** unless A60 independently inspects the new exact binary and actual original device evidence. Do not copy W10 or W8 historical screenshots/build hashes into a W11 PASS.

## 4. Selection / integration status

- A70's [#181](https://github.com/C8LyNn/aplikacja-turnieje/pull/181) is the integration owner candidate, but **A30 [#189](https://github.com/C8LyNn/aplikacja-turnieje/pull/189) is NOT MERGED at the time of this contribution**. #189 already integrates A41 W10 network policy, A34 as sole wired smoother, A20 latest UI/aim/power, A32 fail-closed local deck and P2 Y inverse input. **Do not rebase whole A41 #163/#180 or reintegrate whole A30 #175**. Add these five W11 paths **on top of owner-selected candidate only**.
- This additive parity instrumentation does **not** modify `RemoteBallSmoother`, `BoardView`, `MatchView`, `CoreClashApp` or `Tests/Program.cs` and therefore avoids those previously resolved collisions.
- **P0 synchronization, ball motion and P2 identity are NOT CERTIFIED** by digest instrumentation. This W11 deliverable makes the missing cross-PC wire-state parity falsifiable without exposing raw states.
- A72's earlier W10 builder [#188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) pinned to #181 SHA `3d377767...` **cannot attest #189 or W11 addon**; must retarget build proof to final integration SHA.
- **Actual status:** DESIGNED YES / IMPLEMENTED YES (source+CLI+tests) / TESTED NODE 14/14 + STATIC 11/11 / C# & UNITY NOT_RUN / INTEGRATED NO / RELEASED NO.

## HANDOFF A41 → 00/HQ / A70 / A60 / A72

```text
PROJECT: CC-001 | WAVE: R17-W11 | AGENT: A41 Backend / Multiplayer
BASE: A30 PR #189, 3a6fb11f70cbdd354ca319b6c48e5c080a1ae193
OWN: feat/cc001-r17-w11-a41-snapshot-digest-parity
FINAL SHA: see W11 stacked PR and HQ comment after this report write
CHANGED: NetworkGameSession.cs, NgoGameSession.cs, NetworkSeatTests.cs,
         scripts/cc001/w11/a41/state-parity.cjs, scripts/cc001/w11/a41/state-parity.test.cjs,
         this A41 handoff report
ACTUAL TESTS: Node22 14/14 PASS; GitHub source constraints 11/11 PASS
NOT RUN: C# 33 tests, Unity build, new binary, original PC1/PC2 real logs/physical QA
W11 IMPLEMENTED: per-revision sampled SHA256 TX/RX state digest + executable strict comparator
SELECTED: W10 A41 adaptive snapshot policy already on A30 #189, no duplicate
INTEGRATION: A70 only; BUILD: A72 exact new integrated SHA; QA: A60 actual two PCs
DESIGNED=YES IMPLEMENTED=YES TESTED=NODE+STATIC_ONLY INTEGRATED=NO RELEASED=NO
```
