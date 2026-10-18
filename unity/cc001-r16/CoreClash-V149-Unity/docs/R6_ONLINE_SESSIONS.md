# R6 Internet sessions and LAN

## Implementation

- Unity 6000.4.0f1, Netcode for GameObjects 2.13.3 and Unity Transport 2.6.0 remain the baseline. Multiplayer Services is pinned to **2.2.4**. Its official registry manifest supports Unity 6000.0 and depends on Transport 2.6.0. Newer MPS 2.3/2.4 require Transport 2.7, so they were not selected for this change.
- `NgoInternetSession` initializes Unity Gaming Services when Internet Create/Join is requested, signs in anonymously, and uses MPS Sessions. A created session is private with `MaxPlayers=2`, includes its Windows host, and uses `WithRelayNetwork()`.
- Both creation and joining explicitly use `WithNetworkOptions(new NetworkOptions { RelayProtocol = RelayProtocol.WSS })`. The native Windows host and native/browser clients therefore use secure WebSockets through Relay. Direct LAN retains plain WebSockets and the local HTTP browser invitation.
- A custom `INetworkHandler` replaces the SDK's default NGO integration. It resets network state, calls `CoreClashApp.BeginNetworkGame`, constructs the host's `NetworkGameSession`, configures Relay data, and invokes exactly one NGO `StartHost` or `StartClient`. No second automatic NGO start is allowed.
- Windows is the authoritative P1 host. Android and WebGL join as P2. They receive the host's snapshots through the same existing `NgoRpcBridge`, snapshot assembler, revision checks and state adapter. Clients do not run an independent match simulation. Changing transport does not change physics or game data.
- Existing host intent checks remain: only the bound remote seat may submit for P2, owner and turn validation is enforced, sequences must increase, malformed/oversized JSON is rejected, and snapshots originate from the host. MPS membership adds a two-player service limit; it does not replace NGO's independent seat reservation and approval limit.

## Player flow

1. In Match Setup, the Windows host selects both decks, opens Multiplayer, and selects Create Game → Internet.
2. The host shares the six-character game code. Player 2 opens Join Game → Internet and enters that code or an Internet invitation URL.
3. Internet is the default connection choice. Same Wi-Fi / LAN retains native available-game discovery, local browser invitation URLs, and direct connection controls inside Advanced.
4. Internet browser invitations use `?joinCode=ABC123`. `Resources/Data/network-settings.json` may provide a real published HTTPS `browserGameUrl`; the host then offers Copy Internet Join Link. Without a published URL, sharing the game code works and no hosting URL is fabricated. An optional field in the create panel's Advanced section can also supply that published URL.
5. LAN native discovery runs only while searching the LAN join tab. LAN advertisement and the local WebRoot HTTP server run only for a direct LAN host, never for a Relay session.

## Cloud configuration required

The user supplied project `f87462cd-20c0-432c-9108-8f07f77ad27b`. That ID is persisted in PlayerSettings and embedded in all three builds. Actual anonymous Authentication, session creation, Relay code joining and WSS traffic passed with a Windows host and WebGL client on one PC (`Evidence/r6-internet-smoke.json`). An empty/invalid runtime ID produces a setup message with LAN as the alternative. No published website address was invented. The Editor still emits its link/login warning; this is recorded rather than suppressed.

A WebGL game needs an actual HTTPS host for Internet invitations. The Windows LAN WebRoot server is only a same-network distribution route. Its private HTTP URL is deliberately not turned into an Internet invitation.

## Cancellation and lifecycle

MPS 2.2.4 has no cancellation-token overload for CreateSessionAsync/JoinSessionByCodeAsync. An operation ticket invalidates pending callbacks immediately. A canceled request cannot subsequently initialize a match or start NGO. Its resource gate stays busy until any returned session is deleted/left and NGO shutdown finishes, preventing an old session's StopAsync from stopping a replacement LAN/Internet connection. A new local match can proceed because the pending callback has already been invalidated.

The custom network handler records startup failures and permits MPS to return its session handle, so the caller can explicitly release that membership rather than losing access to it during an exception. A canceled late result is also released. Host disconnect deletes the cloud session; client disconnect leaves it. Host migration is not enabled, so an Android/browser client cannot inherit simulation authority. On transport failure, lost host, expired game, cancellation, or service removal, the lobby provides a recoverable setup/join path. Network startup keeps its existing connection timeout, and a Relay client startup has a 30-second wait.

If a service request itself fails before the SDK returns a session handle, cloud resource expiration and SDK cleanup remain relevant. Abrupt process/network loss may take service timeout to clear membership; a freshly created game is the recovery path if its old code remains full.

## Validation and limits

- Test-first pure regressions cover six-character code normalization, explicit `joinCode` URL parsing, malformed/duplicate/encoded duplicate parameters, preservation of a published game path and benign query parameters, removal of stale LAN/old-code parameters, rejection of private LAN invitation bases, canceled callback invalidation, cleanup gating, and late completion from an older operation.
- The isolated online helper suite was observed red with the missing behavior and then passed all three tests after implementation.
- The main pure .NET suite includes these cases through `OnlineSessionTests()`. The parent integration run records final suite/build/UI evidence separately.
- **DONE within single-PC scope:** actual linked-project anonymous sign-in, private session/Relay allocation, WebGL join by code, resulting state, accepted remote intent and rejection of spoof/duplicate commands. The test uses real service traffic and distinct native/browser participants.
- **NOT TESTED:** physical cross-NAT Windows↔Android/WebGL play, expired/full Cloud-session backend responses, and cancellation of a real in-flight service request. Pure cancellation-gate checks do not establish those backend/device behaviors.
- Browser mobile device profiles and screenshot/layout checks do not establish native Android package compatibility. Android/IL2CPP and actual touch hardware need their own build/device validation.
- LAN and Internet are host-authoritative listen-server modes. Closing the Windows host ends the game. Anonymous authentication supplies a service identity; it is not an account recovery or anti-cheat system against a dishonest host.

## Official API evidence inspected

- [MPS 2.2 manual](https://docs.unity3d.com/Packages/com.unity.services.multiplayer@2.2/manual/index.html)
- [Official public package registry](https://packages.unity.com/com.unity.services.multiplayer)
- [Official MPS 2.2.4 package source](https://download.packages.unity.com/com.unity.services.multiplayer/-/com.unity.services.multiplayer-2.2.4.tgz): `SessionOptionsExtensions`, `NetworkOptions`, `NetworkConfiguration`, `INetworkHandler`, `GameObjectsNetcodeNetworkHandler`, `SessionManager`, `ISession` and `IHostSession` declarations were inspected before implementation. The temporary downloaded source remains under ignored `.utmp/mps/` for local API inspection.
