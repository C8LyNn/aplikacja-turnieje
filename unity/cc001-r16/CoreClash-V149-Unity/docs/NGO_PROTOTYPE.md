# NGO LAN prototype

Architecture and execution were approved for a modest native Windows host plus WebGL client prototype. Host chooses both decks in the existing setup screen. Host is owner 0, the first approved remote peer is owner 1. The existing `NetworkGameSession` validates connection owner, turn, command legality and sequence. Clients send intents only and never step authoritative simulation; accepted host snapshots apply through `NetworkGameStateAdapter`.

Implementation plan: (1) verify official package APIs; (2) test bounded compressed snapshot framing; (3) add a scene NetworkObject/RPC bridge with Unity Transport WebSockets and small host/join controls; (4) add optional development smoke driver; (5) coordinate an exclusive Unity compile/build window; (6) test native host and WebGL client exchanging a valid remote command and replicated state. No original source/core/UI rewrites or external service provisioning are part of this task.

Pinned packages: `com.unity.netcode.gameobjects` 2.13.3 (minimum Unity 6000.0) and `com.unity.transport` 2.6.0 (NGO's exact dependency; minimum Unity 2022.3), verified against [Unity's public package registry](https://packages.unity.com/com.unity.netcode.gameobjects) and downloaded official package source on 2026-10-15. Editor: Unity 6000.4.0f1.

This is a direct LAN WebSocket connection, not a Relay/Sessions implementation. Authentication, Unity project/service credentials, Relay allocations/join codes, Session/lobby matchmaking, secure internet traversal and TLS hosting remain outside this prototype. No service credentials are requested or provisioned automatically.

## Using the prototype

1. On the Windows build, choose both decks in setup, then **MULTIPLAYER → CREATE GAME**. The native host owns Player 1 and waits for a second player before accepting gameplay input.
2. A Windows client chooses **MULTIPLAYER → JOIN GAME → JOIN** beside a discovered room. A browser client opens the host's copied invitation link, which loads the packaged WebGL and autojoins. The first approved connection owns Player 2. The host's snapshot supplies both decks, stock, events and current board.
3. Only the connection whose player owns the current turn can submit a command. P2 disconnect now releases its seat without resetting the host's match. A new client may use the same room/invitation to receive the current state and occupy P2. This is open LAN seat replacement, without authenticated player recovery or reserved reconnect tokens.

Manual IP/port fields remain under **ADVANCED → CONNECT MANUALLY**. Windows UDP discovery uses actual sender IP, a bounded protocol/version advertisement and expiring rooms. The native host serves the sibling WebRoot directory for browser invitations; [Simple LAN join](SIMPLE_LAN_JOIN.md) documents this additional presentation layer. WebGL is client-only. HTTP LAN invitations use the existing plain local WebSocket transport; an HTTPS production page needs secure WSS/TLS or Relay WSS. No public discovery or NAT traversal is implemented.

## Authority and payload boundary

`NgoGameSession.ConfigureScene` installs an official `NetworkManager` and `UnityTransport`, plus a scene `NetworkObject` with `NgoRpcBridge` on the app object. There is no spawnable player prefab dependency. NGO scene synchronization maps this authored object between builds.

The sole remote seat is reserved at approval for at most ten seconds and bound to the SDK client ID after scene synchronization. Disconnect and reservation expiry release it; expiry explicitly disconnects the old SDK peer before a new approval can replace it. Only a committed new connection resets P2's sequence counter. Old or unassigned senders cannot submit or acknowledge gameplay. RPC command JSON is capped at 1024 characters. `NetworkGameSession.Submit` rejects spoofed owners, duplicate sequences, stale/wrong turns, invalid vectors, missing stock and other illegal actions. Full state or transforms are never accepted from a client.

The host captures `GameState` with `JsonUtility`; this includes its event list. The envelope is GZip-compressed and split into reliable 900-byte RPC chunks. Compressed data is capped at 256 KiB, decompressed JSON at 2 MiB, and chunk counts/indexes are validated. The client assembles a complete new revision, then validates it through `NetworkGameStateAdapter` before applying it. Partial/stale snapshots cannot update the board. Moving snapshots are sent at 5 Hz; settled snapshots at 1 Hz, with accepted commands and initial synchronization requesting an immediate snapshot. Clients display host snapshots without prediction or interpolation. This is an intentionally modest LAN prototype.

## Development smoke automation

`NgoSmokeDriver` is inert during normal play. Explicit command-line/query flags in the release players can start the two roles and submit one real legal command from each side. It also sends a remote owner-spoof and duplicate sequence through the real RPC path; both must be rejected by the host before either PASS marker is emitted. It only automates the network smoke, without changing the gameplay core.

- Native host arguments: `--cc-network-host --cc-network-smoke --cc-network-port 7777`.
- WebGL query: `?ccNetwork=join&ccAddress=127.0.0.1&ccPort=7777&ccSmoke=1`.
- `node Tools/network-runtime-smoke.cjs` launches an isolated hidden native host and headless Edge client on dynamically selected local ports; it records `Evidence/network-runtime.json`, `Evidence/network-host.log` and `Evidence/network-webgl-client.png`.
- `Tools/network-native-smoke.ps1` checks native scene bridge/WebSocket startup alone.
- `node Tools/network-codec-test.cjs` runs the pure managed codec checks independently of Unity.

Verification includes **13 managed wire tests** and **120 C# gameplay/presentation/LAN checks**, plus actual native/WebGL end-to-end state, valid remote intent, owner-spoof rejection and duplicate-sequence rejection. Current R5 discovery/invitation evidence is `Evidence/lan-runtime.json`; direct transport is `Evidence/network-runtime.json`. `Evidence/lan-rejoin.json` records two sequential real P2 connections against one uninterrupted host, fresh SDK IDs, a reopened advertisement and sequence 1 accepted as match action 3; both clients' spoofs/duplicates remain rejected. These are single-PC tests. The first R1 run exposed a scene-object mapping failure because setup recreated objects separately per platform; `BuildTools` now reopens/reuses the same scene and preserves IDs. Earlier R1 failure evidence remains separately in `Evidence/network-first-failure.json` and `network-first-failure-host.log`.

## Exact UGS Relay/Sessions gap

The preferred internet follow-up is Unity's unified Multiplayer Services SDK with an authenticated Unity project and a two-player Session using Relay. That requires linking the project to a real Unity organization/project, initializing Unity Services and Authentication, creating/joining a Session or Relay allocation/join code, and configuring Unity Transport with the allocation's Relay server data. WebGL uses the WSS connection path. This prototype does not install the services SDK, sign in, allocate Relay resources, create Sessions or implement that UX. Direct host/join currently calls `SetConnectionData`; the service-backed path must supply Relay/session network configuration instead. [Unity's NGO/Relay guide](https://docs.unity.com/en-us/mps-sdk/tutorials/relay-and-ngo) and [Relay networking protocols](https://docs.unity.com/relay/networking) document that follow-up.
