# CC-001 / R17 — A41 Networking authority & crossplay reliability support

**Project:** CC-001 · **Baseline:** Unity V149 R16 · **Role:** A41 — Backend / Multiplayer (supporting A31)  
**Related GitHub issue:** [#94](https://github.com/C8LyNn/aplikacja-turnieje/issues/94) — primary owner **A31**, not A41  
**Workstream branch:** `feat/cc001-r17-a31-network-crossplay`  
**Status:** DESIGN / READ-ONLY SOURCE AUDIT. **No Unity runtime modification, no multiplayer certification, no public deployment.**

## 1. Scope, predecessor, and assignment boundary

R17 Master Dispatch assigns Issue #94 to **A31**; it does **not** grant a separate A41 issue or branch. This A41 contribution is a narrowly scoped design/evidence handoff on A31's named branch, using an A41-only documentation path to avoid changing its implementation. A31 remains responsible for engineering, executing physical-device crossplay, and signing off results. A70 must import the verified R16 source before any coding/compilation work relies on a source-tree baseline.

This continues, and does not supersede, A41 TASK 010:
- [Backend requirements audit 001](https://docs.google.com/document/d/1IR0e_qS65NM2ekdHxc1pzTwUiz9LrW0SEC1P3Tak_xw/edit)
- [Client/server boundary 001](https://docs.google.com/document/d/14MRaoTq0QpC_WbhprLN-v883gAw_xDQDsBJF3P34zT8/edit)

The TASK 010 static-first conclusion remains valid **for offline/single-browser delivery**. R16 optional Internet multiplayer already relies on **Unity Gaming Services (anonymous Authentication + Multiplayer Sessions/MPS + Relay over WSS)** plus an **authoritative Windows host process**, but there is no demonstrated requirement to build a *custom Core Clash application backend or database*. **Static HTML alone is not sufficient to operate Internet multiplayer**.

## 2. Authoritative R16 inputs and inspection

- [R17 dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md) and [R16 intake audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R16_AUDIT_20261018.md).
- [R16 source ZIP](https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view), SHA-256 **b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4**, independently matched from actual downloaded bytes.
- [R16 handoff](https://drive.google.com/file/d/1eV8ErfP1nRPPFxsn_y4D9WEBUqBqV0M-/view), [R16 report](https://drive.google.com/file/d/1hUG-xXyYOsxffoohAxdmWKlss-Gc5HGT/view), [R16 QA](https://drive.google.com/file/d/1ClWLqCYu5TPbbdJPUzZ9ae4Vokp5jliJ/view).
- [R16 ability registry](https://drive.google.com/file/d/1NhrMCpnC39V3DzeA5zSFayy89cJhiN_u/view): SHA-256 **46afd6351a66e30fae87e13dfeb75777d1f2eab13ff0a4425d698af8132879ce**; 42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY (registry is unrelated to network capability).
- Full ZIP: **639 entries**, ZIP member CRC check **PASS**. Original `Reference/V148_reference_original.html` present and untouched by this audit.

R16 historical claims, not re-executed here: 269/269 managed C#; 13/13 network codec; Windows↔WebGL **same-PC loopback**, Unity Relay/MPS/WSS **same-PC smoke**. Explicitly **NOT TESTED**: two physical devices on distinct networks, cross-NAT/WAN stability, jitter/packet-loss/reconnect soak, real Android app session, hosted WebGL use, physical tablet/iOS.

### 2.1 Exact inspected source and observations

All references below are *paths inside the verified R16 ZIP*, not claims that GitHub contains the imported Unity tree.

- `Assets/CoreClash/Networking/NgoGameSession.cs`: `NetworkConfig.ProtocolVersion=149` (line 56); connection approval and seat reservation (131–142); disconnect releases seat (146–154); host checks `seat.Owns(sender)` (167–176); snapshot assembly/validation (184–193); host snapshot cadence about 0.2 s while Moving / 1 s otherwise (195–205).
- `Assets/CoreClash/Networking/NetworkGameSession.cs`: bound owner and strictly increasing per-owner command sequence (15–19), `ForgetConnection(1)` on new transport binding, `SessionSnapshot.protocol=149`, pure nested snapshot admission before replacing last good state (27–98).
- `Assets/CoreClash/Networking/NgoRpcBridge.cs`: RPC receives `SenderClientId`; server intent RPC and server-origin snapshot/result RPC guard.
- `Assets/CoreClash/Networking/NgoWireProtocol.cs`: 900-byte chunks; 2 MiB raw JSON limit; 256 KiB compressed limit; snapshot revision/chunk checks.
- `Assets/CoreClash/Networking/LanSeat.cs`: one connected and one pending seat, ten-second pending reservation, release on disconnect, binding by transport client ID. It does **not** itself retain a user identity / cryptographic resume token.
- `Assets/CoreClash/Networking/NgoInternetSession.cs`: managed anonymous login; private two-player Unity session; Relay WSS. Internet host creation explicitly denies WebGL and Android (25–27); these clients may join. Session cleanup deletes when host leaves (89–95).
- `Assets/CoreClash/Networking/OnlineJoinAddress.cs`: validates six-character alphanumeric join code; sharing the code/link is invitation-based access, **not player identity proof**.
- `Tools/r16-network-smoke.cjs`: hardwired Windows executable and an author-local absolute Playwright installation; same-PC loopback test, not physical WAN; cannot be rerun as-is in this environment.

### 2.2 Independently executed static checks (not runtime tests)

**14/14 PASS**, performed on the downloaded R16 ZIP and JSON. Cases: exact ZIP SHA; 639 entries; ZIP member CRC; Protocol 149 NGO config; snapshot Protocol 149 admission; RPC sender identity field; sender-to-seat check; command owner/sequence guard; invalid-state rejection preserving last good state; bounded codec constants; Unity managed WSS relay; WebGL/Android non-host policy; disconnect seat release; and absence of a user-identity resume token in `LanSeat`. Registry SHA and counts also independently confirmed.

These checks establish code presence/integrity only. **NOT EXECUTED:** Unity compilation, C# runtime tests, NGO socket tests, Android/WebGL client launch, network emulation, true separate-device runs, real reconnect, attack reproduction, production deploy.

## 3. R17 evidence-driven network acceptance matrix

Each row requires **exact client artifacts/hashes; OS/device model; Unity/NGO/UTP/UGS package versions; protocol 149; independent host/client logs with UTC timestamps; network topology; observed state/input IDs; result PASS/FAIL/BLOCKED**. Do not promote same-PC smoke into a physical-device claim.

| ID | Configuration / stimulus | Pass / failure evidence required | Current state |
|---|---|---|---|
| NET-01 | Windows host ↔ separate physical WebGL laptop/PC over LAN | Two distinct machine IDs; connection, approved P2 seat, accepted legal intent, identical post-turn state/revision | **NOT TESTED** |
| NET-02 | Windows host ↔ Android APK on physical phone over LAN | Actual APK hash and phone/OS, touch-driven legal P2 input, synchronized board and reconnect UX | **NOT TESTED** |
| NET-03 | Windows host ↔ WebGL on a different external network via MPS/Relay/WSS | Two different public egress networks (redacted evidence), genuine relay session, cross-NAT join, legal turn | **NOT TESTED** |
| NET-04 | Windows host ↔ Android on different network (e.g., phone cellular data) | WAN path separate from host, relay continuity, legal turn and state sync | **NOT TESTED** |
| NET-05 | Latency/jitter/loss matrix on true two-endpoint session | Document shaped delay/loss/reorder profiles, command acknowledge rate and latency, snapshot freshness, eventual convergence; thresholds require A31/HQ approval | **NOT TESTED** |
| NET-06 | Abrupt P2 disconnect during Aiming/Moving, then join again | Host remains stable, old P2 connection released, no old pending intent applied, new P2 sees authoritative full state; clarify whether this is seat refill or authenticated resume | **NOT TESTED** |
| NET-07 | Different invite-holder connects during vacant seat after P2 disconnect | Characterize takeover behavior; require explicit product policy before calling it secure reconnection | **NOT TESTED** |
| NET-08 | Owner spoof attempt from connected P2 and unbound client | Host rejects owner 0 and unbound RPC sender; no simulation action serial advancement; include server logs | Same-PC R16 smoke **only** |
| NET-09 | Duplicate / stale / out-of-order command sequence across reconnect | Exactly-once game action; duplicate rejected; no cross-connection replay or double-shot; log `command.sequence` and action serial | Only basic R16 smoke; cross-rejoin **NOT TESTED** |
| NET-10 | Large/out-of-order/corrupt/chunk-missing state, stale revision, nested invalid state | No crash, bounded allocation, bad snapshot never replaces last good; later valid same/new revision admitted as specified | R16 codec/managed tests reported; WAN **NOT TESTED** |
| NET-11 | 50-turn / long-match soak over real network | Match completes, no lost turns/commands, bounded recovery and memory; record disconnects and max snapshot age | Only local full-match R16 evidence; network soak **NOT TESTED** |
| NET-12 | Host process loss / relay failure / lobby deletion / cancellation race | Honest session-ended state; no silent host migration, orphan room or stale transport; client returns to usable menu | **NOT TESTED** |
| NET-13 | Wrong Protocol 149 / stale rules-content/build-version client | Rejection with actionable reason before live match; no state corruption; note release-level negotiation does not automatically exist merely because NGO protocol is 149 | **NOT TESTED** |
| NET-14 | Full 2-player room, expired/malformed code, repeated joins, disconnect-and-rejoin | Seat cap respected, no client stuck pending, controlled error messages; collect logs of reservation expiry and cleanup | Only source/R16 limited smoke; physical **NOT TESTED** |

All matrix outcomes are intentionally provisional until A31 supplies proofs. A60 independently validates provenance. Do not declare `UNITY_READY` for network architecture on the strength of a code-path inspection.

## 4. Focused risks and trade-offs for A31/HQ

**RISK-A41-01 — Seat refill is not authenticated resume (P1 if competitive/private seat ownership is required; policy decision pending).** Source flow releases the seat on disconnect and permits a new connection to reserve the vacant P2 slot; sequence guard for owner 1 resets when bound to the new transport. `LanSeat` does not carry an authenticated identity claim or replay-resistant resume token. This may be acceptable for invite-only casual play, but a different code-holder may occupy P2 after disconnection. **Do not call it a proven exploit** without reproduction and explicit threat-model requirements. Test NET-06/07/09 first, decide whether reconnect means *same player* or *any new P2*; do not alter protocol 149 without HQ approval.

**RISK-A41-02 — Host authority is Windows-host continuity (P1 availability / UX).** A client cannot automatically inherit simulation authority when the Windows host disappears; `NgoInternetSession.LeaveAsync` deletes a host-owned session. Decide user experience and whether the product intentionally forbids host migration. NET-12.

**RISK-A41-03 — Real network performance is unproven (P1 verification).** Same-PC WSS loopback omits WAN path, mobile sleep/wake, Wi-Fi↔cellular handoff, asymmetric jitter/loss, firewall/captive-portal behavior and browser background throttling. Report real route conditions without logging raw personal IPs or invitation codes. NET-01..05/11.

**RISK-A41-04 — Command acknowledgment and snapshot freshness are distinct (P1 if packet loss causes perceived hangs).** `pendingIntent` prevents local resubmission while awaiting result; any missing ack or stale authoritative snapshots need explicit user-facing recovery and bounded retry/cancel policy. Observe, reproduce, design minimally after A70 import. NET-05/06/09/10.

**RISK-A41-05 — Service coupling vs custom backend (architectural).** A hosted HTML/WebGL loader may remain static, but Internet play needs functioning UGS services, credentials/configuration suitable for clients, host uptime and costs/quotas. Managed services are not proof of absence of backend dependencies. No need for a bespoke account database/API today; do not ship privileged service secrets in WebGL/APK.

**RISK-A41-06 — Protocol/version distinction.** `NetworkConfig.ProtocolVersion=149` and game snapshot `specVersion=149` do not on their own provide a negotiated `build_sha256`, content/rules version, Unity-vs-WebGL deterministic parity guarantee, or compatibility matrix. Preserve Protocol 149 now; propose extra compatibility checks only after separately approved version contract and backwards-compatibility review.

## 5. Required evidence bundle format for A31

For **every actual run**, record:
1. Repro ID, issue/branch/commit, exact imported R16 base SHA/reference and output builds' SHA-256. Do not use the ZIP SHA as if it were compiled binary SHA.
2. Hardware and OS identifiers at a privacy-safe granularity (two **distinct** physical devices), Windows host vs client, WebGL browser version or signed Android APK.
3. Topology: LAN / Wi-Fi ↔ cellular / independent Internet, provider Relay/WSS vs direct LAN, network shaping parameters with time window and tool/config, UTC clock alignment.
4. Seed, deck identifiers, initial game state digest, action sequence and owner, authoritative host action serial, snapshot revision/digest at each endpoint, turn count, completion conditions.
5. Host + client raw logs and packet/telemetry summaries **redacted** for invite codes, bearer credentials, raw IPs and PII, but retaining enough correlation to reconstruct chronology.
6. Expected vs actual, exact steps, PASS/FAIL/BLOCKED, reproduction frequency, severity, links to build/test evidence. Explicitly separate screenshot/visual browser emulation from physical-device tests.

Suggested gates (A31/HQ must select numeric thresholds before execution): bounded connect/reconnect time, command acceptance under loss, maximum state divergence duration, session memory growth, duplicate action count **0**, unauthorized seat/owner action count **0**, and full-match completion under named network profiles. No arbitrary latency or packet-loss numbers are asserted as certified thresholds.

## 6. Delivery dependency and non-actions

- **A70:** import R16 source with `.meta` intact; publish import SHA and exact manifest. Until that point, no A41 Unity code/testing commits.
- **A31:** execute NET-01..14 in priority order, triage implementation issues on its own workstream; ensure exact protocol 149 preservation unless separately authorized.
- **A60:** independently inspect device/network evidence and source integrity; audit ≠ repair.
- **A00/HQ:** own acceptance thresholds, competitive seat-resume policy, source import integration, compatibility decisions and merge/release gating.
- **A20:** coordinate physical Android UI/status/reconnect UX; physical touch test not covered by this audit.

No V148 modification. No backend/API/database creation. No UGS production credential creation/change. No tournament-site edits. No public staging/production release. No claim that compiling, testing multiplayer physically, or merging occurred.

## 7. HQ HANDOFF

```text
HANDOFF
PROJECT: CC-001
ROUND: R17
AGENT: A41 — Backend / Multiplayer (retained role)
PRIMARY ISSUE OWNER: A31
LINKED ISSUE: #94
BRANCH: feat/cc001-r17-a31-network-crossplay
WORK: Static source network audit + acceptance/evidence matrix + backend boundary
BASE: V149 R16 (ZIP SHA256 b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4)
DESIGNED: YES
IMPLEMENTED: NO (documentation only)
TESTED: 14/14 STATIC SOURCE/ARCHIVE CHECKS PASS; UNITY/PHYSICAL DEVICE NOT TESTED
INTEGRATED: NO
RELEASED: NO
A70 SOURCE IMPORT GATE: WAITING; A70 branch still on preparatory commit when observed
CUSTOM BACKEND REQUIRED NOW: NO; OPTIONAL ONLINE DEPENDS ON MANAGED UGS + WINDOWS HOST
OPEN RISKS: seat identity on rejoin; host-loss semantics; WAN/jitter; ack timeout; version negotiation
NEXT: A31 physical two-device/WAN matrix after A70, A60 independent verification
NO LIVE DEPLOY; V148 IMMUTABLE
```
