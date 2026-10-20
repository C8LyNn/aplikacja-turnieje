# CC-001 — R17-W6 / A31 — Stage 2 physical network validation execution pack

**PROJECT:** CC-001 — Core Clash Unity  
**ISSUE:** #94 — physical crossplay/reconnect/jitter/long-match reliability  
**AGENT:** A31 — Networking / Multiplayer  
**MODE:** AUTHORIZED PREPARATION ONLY; no G3 physical claim  
**DELIVERABLE STATE:** READY_FOR_ENVIRONMENT, G3=WAIT

## 1. Exact pins and non-substitution gates

- Frozen R16: `de1fe4b88fce3bd08ef383165dc2cd622af2536b` (unchanged).
- Stage 2 source-integrated commit: `e58ba23a9f20e7a0865668655bd1e819845474bc`.
- **Stage 2 final candidate SHA:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`.
- A72 corrected managed runner: `1d9be1b1cd39b5b768036ef4d711bf15e4088318`.
- Historical A41 support report: `docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md`, branch `feat/cc001-r17-a31-network-crossplay` at `a914d4c5102c726f4dc7686c9316126dd9e4258e` before this report.
- Reported by HQ: Windows EXE SHA-256 `97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3`; managed 351/351 and codec 13/13 *local PASS*, independent A60 admission pending; Windows native smoke 50 turns/51 launches *local PASS*. The underlying HQ archive is **not available in this A31 thread**. These are third-party reported evidence, not newly A31-verified tests.
- HQ raw archive `handoff-20261020-030137.zip` claimed SHA-256 `20a16c90f4997c40959081d45f6a451834e8983e590a3ec38247da8747815c31` — **NOT RECEIVED BY A31**.
- **Fresh Stage 2 WebGL build:** NOT_RUN / no supplied hash. **Fresh Stage 2 Android build:** NOT_RUN / no supplied hash.
- Protocol 149 unchanged; no claim of identity-authenticated same-user resume. No release, main merge, new backend or production deployment.

## 2. Runtime-grounded call paths and relevant invariants

All path references below were read at the **exact Stage 2 final commit**, not inferred from design prose:

- `Assets/CoreClash/Networking/NgoLanLobby.cs`: Windows-side `CREATE GAME` / `JOIN GAME`; Internet or `SAME WI-FI / LAN` selection; native LAN game port default **7777**; browser invitation can rely on adjacent `WebRoot`; Android/WebGL cannot act as host. Actual GUI state/input may differ by platform, so record on-screen selections.
- `Assets/CoreClash/Networking/NgoInternetSession.cs`: client Internet join by code, Unity anonymous Authentication, private max-2 Unity Multiplayer Sessions, Relay **WSS**; Windows can create, WebGL/Android may join; service project configuration must actually be present in the built player.
- `Assets/CoreClash/Networking/NgoGameSession.cs`: `NetworkConfig.ProtocolVersion=149`; host-side P2 seat approval and sender ownership `seat.Owns(sender)`; host `NetworkGameSession.Submit`; client receives authoritative snapshots; exposed counters `ReceivedSnapshots`, `AcceptedRemoteIntents`, `RejectedRemoteIntents`, `LastAppliedRevision`. Relevant runtime log markers: `CC_NET_PEER_CONNECTED`, `CC_NET_INTENT_ACCEPT`, `CC_NET_INTENT_REJECT`, `CC_NET_STATE_APPLIED`, `CC_NET_DISCONNECT_DETAIL`, `CC_NET_SNAPSHOT_ERROR`, `CC_LAN_CONNECTION_FAILED`.
- `Assets/CoreClash/Networking/NetworkGameSession.cs`: reject wrong command owner and non-increasing command sequence; update last accepted sequence **only on successful** `sim.TryCommand`; replacement seat calls `ForgetConnection(1)`. Snapshot protocol is 149 and nested state is validated before applying.
- `Assets/CoreClash/Networking/LanSeat.cs`: one P2 seat, pending reservation expires after **10 seconds** in the managed state machine, release on disconnect. A freed P2 seat is **not** cryptographic identity recovery.
- `Assets/CoreClash/Networking/NgoWireProtocol.cs`: compressed payload upper limit **256 KiB**, decompressed JSON **2 MiB**, chunk payload **900 bytes**, revision/index/count validation; exercise malformed payloads only using a separately authorized controlled QA injection fixture, **not** an unapproved multiplayer-source patch.
- `Assets/CoreClash/Networking/NgoRpcBridge.cs`: server receives sender client ID from NGO RPC context; client applies snapshot/result only when originating from server. Tests must measure actual host behavior, not assume a client can forge sender metadata through normal UI.
- `Tests/NetworkSeatTests.cs`: existing managed cases cover owner sequence, seat replacement, spoof rejection, invalid packets and retries; the **351/351 local managed PASS does not prove these outcomes through NGO transport on physical devices**.

Source-claim limits: intended publish cadence approximately 0.2 s while Moving and 1 s otherwise is scheduling logic, **not an observed network latency guarantee**. Do not invent an acceptable FPS, packet-loss, jitter, recovery-seconds or divergence percentage threshold without HQ acceptance criteria.

## 3. Required environment / stop conditions

Before ANY physical test, complete these preflight checks and record each verdict separately:

| ID | Check / objective | Required evidence | Gate |
|---|---|---|---|
| PRE-01 | Host executable is a complete Stage 2 Windows build | EXE SHA-256; full build folder manifest and `*_Data` files; signed-off Stage 2 source SHA; Unity editor/build log evidence | LOCAL G2 Windows report exists; binary/full build not in A31 |
| PRE-02 | Windows client on **separate physical machine** matches Stage 2 | Host + client device labels, OS, build SHA, distinct physical endpoints | NOT_PROVIDED |
| PRE-03 | New Stage 2 **WebGL** build, independently served from supported origin | Fresh build directory/hash manifest, browser/version, server URL, network configuration, origin HTTPS/WS policy | NOT_PROVIDED |
| PRE-04 | New Stage 2 **Android** APK/AAB installed on actual phone/tablet | Binary SHA-256, package/version, OS/device and grant state | NOT_PROVIDED |
| PRE-05 | LAN Internet topology + safe, authorized game session | private LAN address/port, Windows firewall behavior; or configured UGS Relay/WSS, redacted session ID and invitation, network split | NOT_OBSERVED |
| PRE-06 | Independent reviewer + raw log and evidence capture | Separate clock-synchronized host/client logs with UTC time; raw files, SHA256 manifest, exact commit and test ID | NOT_OBSERVED |

**Preflight fail-closed:** no valid per-target build → that platform's cases **BLOCKED_NO_BUILD**, not FAIL or PASS. A supplied binary must be verified byte-for-byte; an EXE digest alone does not certify its adjacent Unity Data directory. Do not use the **historical R16** WebGL/Android reports as proof of these prerequisites.

## 4. Executable test case catalog

Status of ALL cases below in this A31 handoff: **NOT_RUN**. They are instructions and oracles for future physical execution. Execute each case against pinned Stage 2 and log exact source/binary identity; any NEW candidate SHA invalidates prior case applicability without explicit re-baselining.

| Case | Platform / topology | Actions — real-device stimulus | Pass oracle and negative control |
|---|---|---|---|
| NET-W6-01 | Windows host ↔ distinct Windows client, LAN | Create game on host in LAN, join client by LAN tab / Advanced IP or discovery; finish a legal P2 turn | Host P2 accepted, distinct client ID, `CC_NET_INTENT_ACCEPT owner=1`, new authoritative revision applied on client, board HP/turn/action serial converge. Negative: client is not host/owner0 |
| NET-W6-02 | Windows ↔ Windows, LAN | Play to natural result with alternating P1/P2 commands; record every turn/revision | Both endpoints show same winner/base HP/final phase; no lost/duplicate actions. Existing Windows **single-player** 50-turn smoke is not equivalent |
| NET-W6-03 | Windows host ↔ fresh Stage 2 WebGL client, LAN | Host LAN game, serve Stage 2 WebGL page via valid URL and `WebRoot` invitation or explicit join | Browser receives host state and can submit legal P2 intent; host authoritative. Negative: browser must not be allowed to CREATE HOST |
| NET-W6-04 | Windows host ↔ fresh Stage 2 WebGL, Relay/WSS across distinct networks | Host Internet private session with Unity Cloud services, join from separate network/browser using invitation | Real Relay WSS connection, source/target app build hashes and host/client logs, accepted legal remote turn, state convergence. Negative: invalid invitation does not open a seat |
| NET-W6-05 | Windows host ↔ fresh Stage 2 Android, LAN | Join via LAN on physical Android, interact with touch to play P2 turn | Host accepts only P2 intent, game state/revisions converge; record phone OS and rendering/input result. Negative: Android CREATE HOST denied |
| NET-W6-06 | Windows host ↔ Android, Internet/Relay | Host on wired/Wi-Fi network, phone on cellular or independent uplink, join by authorized session | Remote TURN and snapshot convergence from genuinely distinct egress network. Negative: failed Unity Cloud setup is reported as BLOCKED_CONFIG, not a gameplay FAIL |
| NET-W6-07 | Seat occupancy (two players maximum) | With P2 joined, attempt another authorized test client on a different endpoint | Third seat rejected with `FullRoomReason` or equivalent, existing P2 session unaffected; no extra owner or action |
| NET-W6-08 | Abrupt P2 disconnect during Aiming | Join legal P2, disconnect before firing, rejoin as a **new connection** | Old sender unbound; new P2 receives current host state. Distinguish **seat refill** from identity-authenticated recovery; examine session ownership and new sequence semantics |
| NET-W6-09 | Abrupt P2 disconnect during Moving | Disconnect while shots/physics are in motion, then join replacement seat | Host remains authoritative and deterministic; stale P2 intent does not apply after rebinding; client converges after a new full snapshot |
| NET-W6-10 | Host departure (LAN and, separately, Relay) | Windows host quits unexpectedly while P2 is active | Client detects transport failure and returns to appropriate recoverable UI; no phantom authority; fresh room required. Do not assert host migration |
| NET-W6-11 | Stale/duplicate/out-of-order P2 intents | In controlled **authorized instrumentation**, replay same sequence, then lower sequence, then permitted new legal sequence | Duplicates/stale/wrong owner cannot advance host action serial; next legal sequence is admitted when its turn/phase permits. Block if no safe injection fixture |
| NET-W6-12 | Owner spoof/unbound sender | Controlled **authorized instrumentation** sends owner0 from P2; attempt intent from unapproved seat | `RejectedRemoteIntents` / log rejects, no state mutation. The NGO `SenderClientId` is transport-derived: normal UI cannot forge it; no unapproved RPC injection |
| NET-W6-13 | Snapshot stale/corrupt/chunk-missing | Authorized local test harness injects stale revision, bad chunk count/index, nonvalid nested state and later valid snapshot | Invalid state must never replace last good state; later valid authoritative revision admitted as specified. Never test against public unrelated servers |
| NET-W6-14 | Latency/jitter/loss | Authorized link shaping on **test network** with declared latency/loss/reorder profiles, repeat NET-W6-01 and 2 | Record exact measured input acknowledgment and snapshot convergence, dropped/late packets, retries, disconnects. Numerical PASS thresholds require HQ; without them label MEASURED_UNASSESSED |
| NET-W6-15 | Long-match reliability | Two real endpoints run to at least 50 turns and full result; repeat with a different deck if available | Record player inputs, authoritative action sequence, late/current revisions, final state, memory/CPU trend. Stop early as FAIL only for actual crash/lost-turn/desync; do not invent soak duration |
| NET-W6-16 | LAN invitation / network resilience | Host private Wi-Fi, use invitation/browser URL, temporarily disable discovery; use manual host IP fallback | Join succeeds by documented alternative where available; missing adjacent `WebRoot` blocks browser invitation only, not all LAN/native joins |
| NET-W6-17 | Reconnect and foreign-code policy | Disconnect P2; another invited client attempts occupied/free seat according to configured policy | Characterize observed admission, **do not mark new client admission as verified same-user identity**; escalate product/security policy if needed |
| NET-W6-18 | Cross-platform host restriction / service failure | From WebGL/Android attempt host/create; from Windows with unlinked cloud project request Internet create | WebGL/Android refused host/create; Windows reports missing UGS setup clearly without claiming cloud connectivity PASS. No server/database workaround |

## 5. Operator execution procedure

For each test case:

1. **Preflight:** identify host and client as separate real devices, collect Stage2 commit, Windows EXE/build folder hash manifest, WebGL/Android *fresh* build hashes where applicable, OS/Unity/NGO/UTP versions, network topology, port or sanitized Unity session identity, local UTC offset. Keep private player IDs and invitation tokens redacted in shared reports.
2. **Start host first** using `MULTIPLAYER → CREATE GAME → SAME WI-FI / LAN` for direct network or `INTERNET` with configured Unity Services. WebGL/Android are **clients only**. Do not use localhost `127.0.0.1` from a separate physical device.
3. **Join the client** via `MULTIPLAYER → JOIN GAME` and appropriate LAN/Internet flow. Capture UI/status before and after. Verify on host `CC_NET_PEER_CONNECTED` and on client `CC_NET_STATE_APPLIED`; capture both UTC log times.
4. **Exercise one explicit legal P2 action** in a valid player turn. Capture owner ID, accepted command sequence and `actionSerial` plus before→after authoritative state; do not count clicking `JOIN GAME` as a gameplay input test.
5. **Run negative stimulus** only if an approved fixture exists. A normal Play-mode operator cannot assert a spoof test was run without an actual spoof attempt. Separate the failure of a deliberately malformed packet (expected REJECT) from network failure.
6. **Finish or terminate** with explicit cause and save host and client raw logs and screenshots. Link files to case ID and candidate/target build. Hash before sanitizing; publish separately hashed redacted evidence and retain originals in an access-controlled location if required.
7. **Classify verdict:** `PASS`, `FAIL`, `BLOCKED_NO_BUILD`, `BLOCKED_NO_DEVICE`, `BLOCKED_CONFIG`, `BLOCKED_NO_FIXTURE`, `MEASURED_UNASSESSED` or `NOT_RUN`. Only `PASS`/`FAIL` supported by captured case-specific raw evidence and predetermined oracle; do not infer from managed codec, static source or single-player native smoke.

### Reproducible hash preflight (Windows PowerShell, operator-side only)

The following is a **command template, not executed by A31**. Fill variables with existing local files:

~~~powershell
$Candidate = "a67a37a0e4105dd680f52ae6728e93face61f4ce"
$HostExe = "C:\REPLACE_WITH_ACTUAL_STAGE2_BUILD\CoreClash.exe"
$ExpectedHostExeSha = "97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3"
if (-not (Test-Path -LiteralPath $HostExe -PathType Leaf)) { throw "BLOCKED_NO_BUILD: host executable absent" }
$Actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $HostExe).Hash.ToLowerInvariant()
if ($Actual -ne $ExpectedHostExeSha) { throw "BLOCKED_SHA_MISMATCH: exact Windows EXE not matched" }
"HOST_EXE_SHA256_PASS=$Actual CANDIDATE=$Candidate"
# Hash each complete build folder file and each raw host/client logfile for traceability:
Get-ChildItem -LiteralPath (Split-Path -Parent $HostExe) -File -Recurse |
  Sort-Object FullName |
  ForEach-Object { "{0}  {1}" -f (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant(), $_.FullName }
~~~

This EXE hash is from the HQ evidence manifest, not a fresh byte check in this thread. A matching EXE alone does not establish complete binary release/build provenance. Don't upload raw invitation secrets, player tokens, IPs or personal device identifiers to a public Issue.

## 6. Evidence manifest contract

Each completed test produces a case-specific JSON or equivalent ledger with **required fields**:

- `case_id`; `observed_at_utc`; `operator` (non-sensitive ID); `candidate_sha`; `host_build_sha256`; `client_build_sha256`; `host_build_manifest_sha256`; `client_platform`; `host_os`; `client_os`; `unity_version`; `ngo_version`; `network_mode` (LAN/RelayWSS); `network_topology_redacted`.
- `preflight_verdict`, `stimulus_steps`, `expected_outcome`, `observed_outcome`, `host_owner`, `client_owner`, `intent_sequence_before_after`, `action_serial_before_after`, `snapshot_revisions_before_after`, `host_received_rejected_counters`.
- `host_log_sha256`, `client_log_sha256`, `screenshots[]` (path and SHA256), `exit_code` (when a process/runner was actually invoked), `verdict`, `blocker_code`, `reason` and `independent_reviewer`.
- A public handoff stores **redacted pointers and hashes**, not raw join codes, Auth tokens, full private IP/network topology, unredacted player identifiers or device secrets.
- Enforce **one case ID per observation**; no case PASS can be transposed between a Windows single-player run, managed codec and actual cross-device multiplayer.

## 7. Present state / roles / handoff

**OWN SCOPE:** Documentation-only A31 test protocol under previously authorized exclusive `docs/cc001/swarm/w4/A31/**`. No changes to networking source, tests, Unity scene, packages, .meta, V148, frozen R16 or Protocol 149.

**CURRENT GATES:** G0/source PASS; Stage2 provenance PASS; G1 managed/codec **LOCAL PASS / A60 independent intake pending**; G2 Windows build and native 50-turn smoke **LOCAL PASS / A60 intake pending**; Stage2 WebGL/Android **NOT_RUN**; G3 real crossplay **WAIT**; G4 independent QA **IN PROGRESS**; release **STOP**.

- **DESIGNED:** YES — exact-source runtime-grounded 18-case execution protocol and evidence collection template.
- **IMPLEMENTED:** DOCUMENTATION ONLY; no networking code/test harness built.
- **TESTED:** static source inspection and metadata readback only; no executable physical networking run.
- **INTEGRATED:** NO (A31-only documentation branch).
- **RELEASED:** NO.
- **NOT_RUN:** ALL 18 NET-W6 physical/controlled injection scenarios; fresh Stage2 WebGL/Android build; independent raw HQ evidence verification (A60 owns).
- **HANDOFF:** A00/HQ → A60 for G1/G2 acceptance, A72 for build/evidence compatibility; A20 for device UI; A41/A51 only for bounded network/snapshot fixtures if independently authorized. A31 resumes cases strictly after platform-specific G2 build and hardware availability.

**FINAL A31 SCOPE VERDICT: READY_FOR_ENVIRONMENT / G3 WAIT**.
