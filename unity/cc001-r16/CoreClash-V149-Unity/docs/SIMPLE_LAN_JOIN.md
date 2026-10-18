# Simple LAN join

In the Windows game, choose both decks in Match Setup, open **MULTIPLAYER**, then **CREATE GAME**. The room name is optional. The host becomes Player 1 and waits for Player 2. Input stays gated by the existing NGO connection and authoritative turn validation.

Another Windows player opens **MULTIPLAYER → JOIN GAME** and chooses **JOIN** beside the discovered room. Each row shows its display name and `1 / 2` or `2 / 2` players. The connection uses the actual UDP sender IP and the advertised gameplay port. Full rooms cannot be selected. Missing advertisements expire after 4.5 seconds. Both players must be on the same LAN, with peer traffic allowed by the network and Windows Firewall.

For a browser player, the Windows host chooses **COPY JOIN LINK**. Open that URL on the second device on the same Wi-Fi / LAN. It loads the packaged WebGL game and joins Player 2 automatically from `joinHost` and `joinPort`, for example:

`http://192.168.1.42:8080/?joinHost=192.168.1.42&joinPort=7777`

The browser can also paste an invitation under **JOIN GAME**. WebGL never creates a UDP socket and cannot discover or host rooms. IP and gameplay-port input fields exist only under **ADVANCED → CONNECT MANUALLY**. QR generation is not required for this flow.

After P2 disconnects, the Windows host keeps the current match and advertises a free seat again. A new client may join the room or open the same browser link. A disconnected client returns to Join Game after transport cleanup; pending joining can be canceled in the visible panel. This is open seat replacement; no authenticated identity, reserved-seat grace period or reconnect token is implemented. Android is also client-only in this milestone; its APK is built, but joining from a physical Android device remains untested.

## Packaging

After building Windows and WebGL, run `Tools/lan-package-webroot.ps1` (or copy the contents of `Builds/WebGL` into `Builds/Windows/WebRoot`). Distribute the entire Windows folder, including WebRoot. At host creation, a native-only `TcpListener` serves that read-only WebRoot. It tries HTTP port 8080, then an OS-assigned port if 8080 is occupied, and includes the actual port in the copied link. It selects an active private IPv4 address, preferring Wi-Fi / an interface with a gateway. If no private IPv4 exists, the lobby explains that a LAN connection is needed. If WebRoot is missing, native discovery still works and the lobby explains why a browser link is unavailable.

The server supports GET and HEAD, serves only canonical paths inside WebRoot, refuses traversal and junction/symlink paths, limits headers to 8192 bytes, files to 256 MiB, requests to one active connection, and uses receive/send timeouts. It sends Unity-compatible JavaScript/WASM MIME types, compression headers for `.br` / `.gz`, and COOP/COEP headers. It needs no HttpListener URL ACL or administrator setup. The host’s TCP gameplay port is 7777 by default; discovery uses UDP 47749. Windows Firewall must allow the native game’s local network traffic. Guest Wi-Fi / client-isolation networks may prevent peer connections.

## Discovery and authority boundary

Every advertisement contains exactly five newline-separated fields: protocol identifier `CORECLASH_LAN`, version `149`, Base64-encoded room display name, gameplay port, and player count. It contains no IP field, game state, identity, credentials, command, or authority claim. Names are at most 48 characters / 144 UTF-8 bytes and cannot contain controls. Payloads over 512 bytes, invalid UTF-8/Base64, unknown identifiers/versions, invalid ports, and counts outside 1–2 are rejected. The room directory retains at most 128 entries.

Discovery only supplies an endpoint to the existing `NgoGameSession.Join`. Connection approval, sender-to-player assignment, server-only snapshot RPCs, command-owner checks, turn validation, monotonically increasing intent sequences, and bounded snapshot assembly remain in the existing transport/game code. A discovered room is an invitation, not proof that a peer is trusted.

## Verification

`dotnet run --project Tests/CoreClash.Tests.csproj -- <project-root>` includes protocol rejection, TTL, invitation parsing, canonical path/MIME checks, an actual loopback UDP packet, and actual TcpListener GET/HEAD/method/traversal behavior.

After packaging both release players, run `node Tools/lan-runtime-smoke.cjs`. This starts real native hosts and validates (1) a native Player 2 connected to the endpoint received through a real UDP advertisement, and (2) a real WebGL Player 2 loaded from the host’s own WebRoot server and joined through the normal invitation parameters. Explicit smoke flags make both sessions execute legal actions plus reject forged-owner and duplicate intents. The runner writes `Evidence/lan-runtime.json`, native logs, and a WebGL screenshot. Without the explicit smoke-and-role flags, the smoke driver remains inert in release builds.

Run `node Tools/lan-plain-invitation-smoke.cjs` to verify the normal browser experience separately: its browser URL contains only `joinHost` and `joinPort`, with no client smoke or role flags. It must log `CC_LAN_INVITATION_JOIN` and receive authoritative state without `CC_NET_AUTOSTART` or `CC_NET_SMOKE_*` client output. The report and screenshot are `Evidence/lan-plain-invitation.json` and `.png`. Both LAN runners record SHA-256 hashes and byte counts for the Windows managed gameplay assembly, resources, scene, and packaged WebGL data/WASM, then verify that those files remained unchanged through the run. A rebuild requires fresh runtime evidence.

Final R5 release verification recorded on 2026-10-16: **120 managed tests passed, 0 failed**; both native UDP/native P2 and native HTTP/WebGL P2 cases passed; the original `Tools/network-runtime-smoke.cjs` transport regression passed; and the separate plain invitation passed with HTTP 200, authoritative state, and no browser page errors. Automated gameplay sessions accepted legal actions and rejected forged-owner and duplicate intents. LAN and plain-invitation reports record `buildFilesUnchanged: true` for the packaged players. `node Tools/lan-rejoin-smoke.cjs` additionally verifies released P2 advertisement and a replacement SDK client accepting sequence 1 against the same uninterrupted host/match. See `Evidence/unity-tests.json`, `Evidence/lan-runtime.json`, `Evidence/network-runtime.json`, `Evidence/lan-plain-invitation.json` and `Evidence/lan-rejoin.json`.

That runner tests real native/WebGL transports on one computer. It does not establish that a separate physical phone/PC can traverse a particular Wi-Fi router or firewall; test that separately on the actual presentation network.
