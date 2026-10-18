# CC-001 — R17-W2 / A41 — Identity-bound reconnect: security decision record

**Project:** CC-001 — Core Clash Unity V149 R16 → R17-W2  
**Agent:** A41 — Backend / Multiplayer (retained role)  
**Issue:** [#108](https://github.com/C8LyNn/aplikacja-turnieje/issues/108)  
**Ownership:** A41 only — docs/cc001/swarm/w2/A41/  
**Deliverable state:** DESIGN / SOURCE REVIEW; no implementation, live-network session, physical-device QA, merge or release.  
**Canonical input:** [R16 source ZIP](https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view), verified SHA-256 b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4, 639 archive entries, ZIP CRC check OK.  
**Prior W1:** [A41 authority/crossplay research](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a31-network-crossplay/docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md) (commit a914d4c5102c726f4dc7686c9316126dd9e4258e). The existing 14-case general crossplay matrix is NOT duplicated here.  
**Governance:** [R17-W2 canonical dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md); A31 owns runtime network work under #94, A70 source import, A60 independent QA, 00/HQ final policy and integration. V148 remains immutable.

## 1. Decision and security vocabulary

**Decision A41-DEC-W2-01 — RECOMMENDED FOR MINIMUM SAFE R17:** choose **Option A, explicit host-authorized seat REFILL, with NO automatic same-player identity recovery**. Treat a rejoining transport as a new Player 2 candidate, even if a person claims to be the same human. No credentials, protocol change or custom backend. If the match has started, do not silently give the disconnected P2 seat to the next holder of the room code. Provide host confirmation/reopen and an explicit replacement warning; whether play pauses, ends or awaits replacement is a product decision for HQ. This is a **PROPOSAL — NOT IMPLEMENTED**; R16 today automatically permits admission when the freed seat is vacant.

**Identity-bound resume is NOT delivered by Option A.** It must not be represented in UI, certification, marketing or test reports as verified "same player returned." True identity assurance requires a separate later decision on proof, confidentiality, validity and authorization. Option B (ephemeral token) is the preferred **FUTURE ONLY** architecture after secure-channel and protocol-compatibility approvals. Option C (UGS identity assisted) is an alternative for Internet mode, conditional on actual authenticated NGO admission binding; anonymous login alone is insufficient.

Terminology used in this decision:
- **Transport connection:** NGO client ID for a currently connected socket; neither a permanent player identity nor durable proof.
- **Seat:** simulation Player 2 / owner=1, controlled by server while an admitted connection currently owns that seat.
- **Seat refill / replacement:** a *new* admitted connection occupies an empty P2 seat with host knowledge; no claim of human continuity.
- **Identity-bound resume:** an applicant proves possession of a previously issued, still-valid entitlement for *the same specific player/seat within the same authoritative match epoch*; host decides atomically who is entitled to control P2.
- **Room code/link:** possession-based invitation and room discovery, not a resume credential.
- **Session epoch:** proposed host-generated, unpredictable or monotonically unique identifier for one running authoritative match, distinct from NGO transport IDs and command sequence. No such security contract is asserted in R16.
- **Protocol 149:** frozen NGO NetworkConfig.ProtocolVersion=149 and session snapshot protocol=149. Protocol number equality does NOT prove optional recovery-handshake interoperability or rule/content parity.

## 2. R16 facts and source-anchored security boundary

All paths and line references below refer to source *inside the verified R16 ZIP*, not assumed GitHub source-import state. Statements classified **SOURCE REVIEW** are not executed LAN/Relay tests.

| Anchor in R16 source | Observed fact | Security consequence / limit |
|---|---|---|
| Assets/CoreClash/Networking/LanSeat.cs:5–14 | Pending NGO ID has ten-second reservation; Connected is a single NGO ID; Release clears Pending or Connected; Owns checks connected ID; Reset clears both. | Seat ownership is **transport-ID-bound**; no secret, stable player identity, resume ticket or reconnect history exists in this class. |
| Assets/CoreClash/Networking/NgoGameSession.cs:131–142 | ConnectionApproval admits server-local or TryReserve(client ID); Connected commits P2 and calls authority.ForgetConnection(1). | Current approval checks capacity, not a previously bound human; the P2 command-sequence guard is reset on each accepted new transport. |
| NgoGameSession.cs:146–154 | Host disconnect callback releases seat and status says waiting for player to rejoin; client receives connection-lost/try-again guidance. | Current UX uses "rejoin" vocabulary but does not establish authenticated same-player recovery. |
| NgoGameSession.cs:158–176 | Submit enforces LocalOwner, pendingIntent; server ReceiveIntent checks seat.Owns(SenderClientId), then submits to authority. | Existing host authority and sender/owner checks remain mandatory. A new connection with valid seat ownership can issue owner=1 commands. |
| Assets/CoreClash/Networking/NetworkGameSession.cs:10–21 | Submit rejects owner mismatch and nonincreasing sequence, ForgetConnection(owner) resets prior sequence to 0. | Anti-duplicate is scoped to the currently bound owner sequence, **not** cryptographically to a continuous human across a new transport. |
| NgoGameSession.cs:184–205 and NetworkGameSession.cs:23–98 | Client admits only protocol-149, newer valid snapshots; host sends snapshots while connected. | After an admitted replacement joins, authoritative full-state resync is available as a network mechanism; no proven full session save/resume is implied. |
| Assets/CoreClash/Networking/NgoRpcBridge.cs:9–22 | Server receives RPC sender via SenderClientId; snapshot and result RPC are server-directed. | Authorization must keep using server-observed connection identity, never client-supplied owner strings alone. |
| Assets/CoreClash/Networking/NgoInternetSession.cs:24–66 | Host restricted to Windows; anonymous Unity Authentication; MPS private 2-player session; RelayProtocol.WSS. | Managed Internet infrastructure exists, but the inspected NGO seat approval path does not itself verify/rebind an authenticated UGS account ID to prior P2 seat. |
| NgoInternetSession.cs:76–101 | Host leave deletes the session; network transport stopped. | Current R16 has no host migration, persisted match authority or cross-host reconnect. Restart is a **new match**, not continuation. |
| NgoGameSession.cs:79–95,109–123 | LAN WebSockets configured with UseEncryption=false; Relay uses WSS and also sets transport UseEncryption=false. | Never transmit bearer recovery credentials on an assumed-confidential LAN channel without a transport security review. WSS to Relay must not be described as guaranteed end-to-end secret transport. |
| Assets/CoreClash/Networking/OnlineJoinAddress.cs:9–50 | Six-character invitation code or link with joinCode parsed. | Code/link is not seat-specific and can be forwarded; placing a resume token in query params would expose it via history/referrer/logs. |
| Assets/CoreClash/Networking/NgoLanLobby.cs:43–49,55–61,192–224 | Invitation triggers Join flow; failed connection returns to setup; current UI exposes create/join, invitation and disconnect. | No explicit host approval for a same-match refill and no secure player-continuity claim was found; runtime observation is still required. |

**Critical distinction:** R16 enforces current transport-to-P2 action ownership; it does **not** prove that *the person who reconnects* is the former P2. This is a design gap with conditional threat severity, **not a reproduced security exploit**. W1 reports same-PC spoof/duplicate rejection only. Physical cross-device sessions, network faults, Android suspend, browser refresh and authenticated resume remain NOT TESTED.

## 3. Option comparison and explicit decision

| Option | Security and game UX | Protocol/backend implications | Failure modes and recommendation |
|---|---|---|---|
| **A. Explicit seat refill; no same-player resume** | Host sees "P2 disconnected — P2 seat locked" during active game and deliberately chooses "Allow replacement". Joining applicant is disclosed as **new P2**, even if same user returns. Client receives current authoritative snapshot once admitted; old client cannot retain owner privileges. | Can retain Protocol 149, existing owner/sequence checks and managed UGS; requires later local host admission-state/UI changes and test-first verification, **not** W2 source edits. No database, credential or long-lived identity. | Cons: no secure recovery of same player, possible unfair substitution, lost unsubmitted intent, host may accidentally authorize impostor. **Chosen minimum R17** for optional casual replacement only; competitive/ranked same-player recovery remains unavailable. |
| **B. Match-epoch-bound ephemeral resume ticket** | Host issues random, unguessable, single-use credential to current P2 over an *approved confidential channel*; during bounded disconnect grace the seat stays reserved; on verified rebind invalidate prior ticket/transport/sequence epoch atomically, issue rotated ticket and send fresh snapshot. | Host-memory-only token record viable without database while host remains alive; secure transmission, new admission proof, token persistence/storage and possibly NGO ConnectionData/approval payload or pre-transport handshake all require explicit **Protocol 149 extension/compatibility change request** before implementation. | Theft/replay, races, Android/WebGL token loss, compromised client/XSS, clock timeouts, host reboot invalidating memory. **FUTURE ONLY** after threat model and transport security work; no default storage of raw tokens in URLs/logs. |
| **C. UGS session identity-assisted continuity** | Use verified UGS player identity/session membership to determine whether the returning participant is the same logical P2, optionally combine with B for proof of match-seat ownership. | Internet-mode only; requires secure binding between authenticated UGS identity, session membership and NGO connection approval; validate actual SDK guarantees/server-observable attestation; provider dependency, identity persistence and policy/privacy. No LAN-only solution; still cannot survive loss of host-authoritative simulation. | Anonymous account identity may reset after reinstall/browser data clear; forwarded room code insufficient; cannot blindly trust self-reported UGS PlayerId. **FUTURE ALTERNATIVE**; no claim current MPS provides this bridge. |

**Why A now:** smallest auditable state/UX change, no unreviewed credentials, no wire alteration, no custom API, avoids silently promising secure continuity. It does *not* solve identity-bound reconnect; product must explicitly choose casual replacement versus requiring a truly authenticated return. In a ranked/private anti-hijack product, **disable same-match replacement entirely** until B/C is designed, implemented, and certified; do not silently downgrade security.

**Open OWNER/HQ decision D-01:** Is an active-match slot transferable with host consent at all, or must match end/forfeit on P2 loss? If yes: does player P1 control transfer immediately, only at turn boundary, or only while no action is in flight? Proposed conservative default: **deny transfer until no unresolved action is pending**, show match paused/awaiting explicit host action, and take new full authoritative snapshot. These are policy proposals, not documented existing game semantics; avoid changing V148 rules implicitly.

**Open OWNER/HQ decision D-02:** May a reconnecting same human accept being classified as "new Player 2", with possible loss of local draft/input? If no, Option A does not meet product requirement and B/C must be scoped separately.

## 4. State model and trust policy for Option A (PROPOSAL — NOT IMPLEMENTED)

Illustrative **host-local** admission states, NOT additions to serialized snapshot or existing runtime:

1. **OPEN_BEFORE_P2:** no P2 ever claimed; admit first candidate subject to room capacity and transport checks.
2. **OCCUPIED:** exactly one current, approved P2 transport; deny all others; sender-owner validation remains in force.
3. **LOCKED_AFTER_DISCONNECT:** prior P2 left mid-match; host does not auto-admit any replacement; show status "P2 left. Waiting for host decision" (no "same-player recovery" wording).
4. **HOST_AUTHORIZED_REFILL:** host explicitly opts to admit a **replacement** applicant for this existing match; only one pending candidate at a time; reservation deadline remains bounded; if a command is in flight, defer admission to safe state.
5. **OCCUPIED_NEW_P2:** commit new transport identity and reset owner sequence only when old transport is revoked and old pending commands cannot execute; send one authoritative full snapshot and display "A new Player 2 has joined".
6. **ENDED:** host terminated match/service, no reconnect claim; cleanup UGS membership/transport. Host restart creates new epoch/match.

Admission invariant: **at most one currently authorized transport controls owner=1 at any time**; transition only via host-side state machine, not UI text or the client's asserted owner. Room code never unlocks LOCKED_AFTER_DISCONNECT by itself. Never advertise LOCKED as a privileged original-player reservation; Option A has **no** way to authenticate the original participant.

Command invariant: use sender NGO client ID and bound seat; reject intents from previously released IDs and from a new ID before host-approved commit. Action serial advances **at most once** for each legal command. During handoff, freeze/settle unsafe in-flight pending action first (exact timing defined by A10/HQ game rules), then reset command sequence **for new transport epoch only**, clear pending acknowledgements, recheck current turn, and resynchronize from host snapshot. Do not assume old local client state is valid.

Authority invariant: only Windows host calculates game state; clients offer player input intentions; no client-supplied snapshot, external OAuth subject, join code or UI assertion can override host ownership. Original P2 transport that remains live or late-sends after an identity transition is denied by host's currently bound transport check.

Expiry / id reuse: ten-second pending reservation in R16 is a **pending transport reservation**, not a token lifetime. A new host-local consent window should be finite and expire fail-closed (timeout to be selected by HQ/A31; do not infer 10 seconds is enough). NGO numeric client IDs may be reused across transport lifetimes; any future new epoch check must be bound to the current instance/lifecycle, not equality to a stale numeric ID alone. Do not represent a host UI click as cryptographic identity proof.

Rollback safety: disabled feature flag or failure to establish state must revert to **no same-match seat replacement**, not R16 silent auto-refill; product choice needed for behavior if earlier builds lacking flag connect. Lock state is local process memory and cannot survive restart by design.

## 5. Future Option B ticket security contract (NOT APPROVED FOR IMPLEMENTATION)

- **Issuer/validator:** authoritative Windows host (or approved identity service) issues CSPRNG random ≥128-bit token; never client-chosen. Store only a verifier/hashed representation and match-seat binding at host; constant-time comparison and minimum brute-force rate limiting.
- **Scope:** exact match epoch, owner=1, current credential generation, allowed client type/capabilities and time bounds; invitation code and raw NGO client ID alone do not authorize recovery. Optionally bind to a distinct authenticated UGS identity only if it can be *trustedly established by host*.
- **Lifecycle:** issue to already authenticated/admitted P2 over a confidentiality-reviewed path; fail closed after bounded grace, match end, host restart, explicit host revoke, owner transfer, credential use, or successful rotation. Old ticket invalidates atomically on rebind; disallow parallel reuse. Clear and rotate after successful reconnect.
- **Replay / race:** do not allow two transports holding same ticket to control P2; atomic single-winner compare-and-rebind, generation counter and short-lived challenge can mitigate captured-ticket replay; do not rely only on monotonically increasing PlayerCommand.sequence (R16 resets on new seat). Track revoked transport lifetime and reject outstanding intents.
- **Leakage:** never embed resume token in invitation link, command log, analytics, crash report, screenshot, clipboard, URL query string or localStorage by default. Android OS keystore and browser storage capabilities are separate designs; WebGL tab refresh and private browsing can lose credentials. XSS, debugging proxies and LAN plaintext paths threaten bearer possession.
- **Transport:** R16 LAN UseEncryption=false => **BLOCKER** for sending a bearer token in clear. Require audited encrypted/authenticated channel or cryptographic proof-of-possession that does not expose reusable secrets; don't assume Relay WSS equals TLS host-to-host. No security claim until validated.
- **Timeout/recovery UX:** countdown/grace and "Reconnect as previous P2" shown only if proof available; otherwise show "Join as new player" or explicit unsupported message. On credential expiry/theft suspicion, fail closed; host may offer manual Option-A transfer, *not as authenticated resume*.
- **Privacy/persistence:** token never guarantees cross-device continuity, account recovery, old match restoration after host crash or permanent save. Host-memory record disappears at process restart; persistent sessions require a separately authorized persistence architecture.
- **Compatibility:** proof carried via NGO connection approval payload / authenticated side channel would alter admission semantics even if NetworkConfig.ProtocolVersion numerically remains 149. This is a **formal CHANGE REQUEST**, with client-version gating and backward test matrix; no silent wire additions under R17-W2.

## 6. Transport/topology failure matrix

| Situation | Current R16/source-based observation | Option A proposed safe expectation | B/C future-only condition |
|---|---|---|---|
| **LAN direct join** | Plain WebSocket transport; first vacant P2 allowed by current LanSeat. | Pre-game join can fill; mid-match reconnect = only explicit host-confirmed replacement, no identity claim. | Future B requires confidentiality; C does not cover LAN by itself. |
| **UGS/MPS/Relay WSS** | Anonymous UGS SignIn; private MaxPlayers=2 session; join by six-char code; NGO seat also controls owner=1. | Preserve service admission but add local host lock/consent; membership alone ≠ authorized original P2. | C must map trusted session identity to NGO SenderClientId; provider session cap can block replacement even after NGO frees seat — confirm with live evidence. |
| **Host restart/crash** | Authoritative GameSimulation and LanSeat are process-bound; host leave deletes UGS session. | Old match ended; no implicit resume, old link/code invalid; create new match only. | B host-memory ticket dies on restart; C identity alone does not restore physics/match state. |
| **Android background/suspend** | Real app lifecycle not tested; client failure path returns to setup after disconnect. | Short interruption without NGO disconnect retains existing seat; actual disconnect enters locked host state, requires explicit new seat offer. | Token storage/grace behavior is unverified; test OS process kill and suspend separately. |
| **Browser WebGL refresh** | Loads new client/NGO transport; no persistent seat proof in current R16. | Fresh applicant, even if same browser; do not claim same-player resume. | Ticket persistence and secure browser storage are unapproved/unproven. |
| **Simultaneous genuine/duplicate joins** | LanSeat allows one pending/connected candidate; old transport may linger until disconnect callback. | Deny duplicate while occupied/locked; during host-open refill choose one pending candidate, commit atomically, explicit host consent. | B winner based on ticket validity/generation, not raw NGO client ID. |
| **Stale transport ID / delayed intent** | Host checks seat.Owns(sender); ForgetConnection resets per-owner sequence on new bind. | Revoke old transport before new commit, ignore queued old RPCs, ensure no late ack clears new pendingIntent; test under reordered callbacks. | Epoch/token generation fences required for stronger replay resilience. |
| **Invite forwarded / room code leaked** | Join code is shareable, nonidentity proof. | Host may choose a replacement; forwarded code alone must never unlock a locked active-match seat. | C cannot trust self-asserted player ID; B ticket must remain distinct from invite. |
| **Relay loss / Internet provider outage** | Transport may fail; cancel/cleanup paths are present, no host migration. | Deny silent fallback/reassignment; preserve honest failure and recovery UI. | Neither B nor C repairs missing host or cloud service by itself. |

**Operational caveat:** R16 MPS session membership and NGO approval are two independent capacity/identity gates. It is possible that a client cannot reach NGO admission even after LanSeat frees a seat because MPS still considers its former member present; this is a **HYPOTHESIS / NOT TESTED**, not an established failure. A31 must log cloud membership transitions and admission callbacks before selecting any replacement fix.

## 7. Threats, mitigations, ownership

| ID | Threat or failure | Consequence | Minimum Option A mitigation (PROPOSED) | Future B/C mitigation / owner |
|---|---|---|---|---|
| T01 | Forwarded or leaked join code is treated as same-person proof | Different person takes P2 seat | Lock active-game vacancy; host-confirmed replacement, explicit warning; room code only discovers room | Proof-bound token or verified identity; HQ product threat decision |
| T02 | Concurrent connect while incumbent still owns P2 | Double control / ambiguous UI | Deny second seat and pending candidate atomically | Single-winner generation+credential; A31 |
| T03 | Old sender intent arrives after P2 replacement | Old player gets action | Check current sender against host seat on every RPC; revoke before bind; avoid stale queues | Epoch fence with proven replay tests; A31 |
| T04 | Sequence resets on new connection | New connection can submit sequence=1, legitimately for new P2 but not proof of continuity | Label new binding as replacement, assert action counted once; no inferred old-player carryover | Token generation + per-generation sequence; A31 |
| T05 | Old ack/result arrives as new pending sequence | False "accepted" client UI | Reset/ignore prior lifecycle and validate result to active transport/session | Correlate ticket/epoch and command ID, version review; A31/A20 |
| T06 | Holder of join code triggers repeated join attempts | Seat probing, DoS / unfair denial | Bounded pending reservations, deny unapproved fills, backoff/log counts | Server-side rate limits, proof validation; A31/UGS |
| T07 | Resume credential leaks into URL/log/screenshot | Accountless session hijack | Option A issues no token | No raw credentials in query/logs; protected storage + encrypted channel; A31/A43 |
| T08 | Credential replay/expired token accepted (future) | Host seat takeover | No credential processing now; fail closed | Single-use rotated scoped verifier, TTL + generation, atomic compare; A31 |
| T09 | NGO transport ID reused | Stale ID mistaken for original identity | Never use numeric ID as permanent identity; enforce current transport lifecycle | Session epoch plus trusted proof; A31 |
| T10 | Android suspended; relay TTL or NAT expires | Unexpected disconnect, false "resume" | Transparent status, explicit host control, new snapshot; no continuity promise | Transport reconnect grace and app lifecycle QA; A20/A31 |
| T11 | Host dies/restarts | Game authoritative state lost | End old match honestly and invalidate room; do not resurrect from client snapshot | Durable authoritative persistence/new system separately approved; HQ |
| T12 | "Secure reconnect" over plaintext LAN | Bearer token interception | No tokens in Option A | Transport security gate before B; A31/security reviewer |
| T13 | Forged UGS PlayerId/anonymous identity | Identity impersonation | Never accept claimed PlayerId in R16 seat logic | Verified identity-to-transport binding, SDK behavior evidence; A31 |
| T14 | Old/incompatible client gets a nonzero P2 seat | State/protocol mismatch | Keep Protocol149 and reject incompatible clients where existing NGO checks apply; do not overclaim content equivalence | Formal negotiation and new compatibility tests; HQ/A31 |

Severity: T01/T02/T03 are **conditional P1 design risks** if the product promises player continuity / private competitive seats; not reproduced vulnerabilities. All other categories require feature-specific priority review. No authentication-service or database change is authorized.

## 8. R17-W3 minimal implementation candidate and migration (NOT IMPLEMENTED)

**Candidate A — explicit refill lock with host-controlled admission, preserve Protocol 149.**

1. **Governance gate:** HQ chooses match-interruption/forfeit and whether host-authorized P2 replacement is allowed in active game. Until approved, safest active-match default is **no replacement**.
2. **A70 baseline:** A31 begins only from imported exact R16 Unity source and SHA manifest; no edits on W2 branch.
3. **Test-first in future A31 branch:** build pure C# LanSeat/admission policy tests covering occupancy → disconnect → locked → host-authorize → one pending → commit, expiry, cancellation and revocation. Explicitly distinguish pre-match first join from mid-match replacement.
4. **Minimal runtime surface for later changes:** LanSeat (add admission policy state, not identity claims), NgoGameSession (Approval/Connected/Disconnected handling, safe pending/sequence epoch transition), NgoLanLobby (host "Allow replacement" and honest notices), optionally direct NGOWire test fixtures and reliable logs. Keep NgoInternetSession changes conditional on observed cloud membership mismatch.
5. **Safety:** preserve host-only simulation, RPC sender checks, per-connection duplicate rejection, no gameplay/catalog/deck/rule edits, no snapshots accepted from clients, no new cloud credentials, no NGO payload fields or protocol bump.
6. **Client UX:** on disconnect show "Connection lost — request host to allow replacement" and never "securely resumed". New admission resets client pendingIntent/adapter as appropriate and uses host authoritative snapshot. Host must explicitly confirm if a different player might control P2.
7. **A31 implementation evidence:** name exact source commit and diff, managed and native test logs, LAN/Relay tests, host + client timestamps, stale/duplicate spoof controls, rejected seat hijack attempts, positive replacement flow.
8. **A60 review:** confirm source provenance, no Protocol149 drift, option A only advertised as replacement, test execution vs designed cases, no V148 mutation; HQ alone handles integration/merge.

**Rollback:** if new admission state causes ambiguity, disable replacement in an active match and end/return to setup; do not fall back to silent unverified auto-refill. Implementation must explicitly define migration for already connected R16 clients; no assumption that they support host-lock UI.

**Future phase B/C:** separately write and approve protocol change request and security decision before adding bearer ticket, UGS identity attestation, host-bound persisted session data or cross-device identity. Such changes cannot be smuggled in while leaving ProtocolVersion=149 by name only. B/C cannot themselves provide persistent match restoration after host process death.

## 9. Non-executed acceptance contract for A31 + independent A60

The following are **SPECIFIED TESTS ONLY — ALL NOT RUN**. They are scoped to *identity/seat decision* and intentionally do not recreate W1's broad 14-case network performance matrix. Prior to W3 execution: select policy D-01/D-02, define precise expected disconnect timing/grace and collect two-sided, privacy-redacted proof; run as pure admission tests first, then NGO/Unity/device as applicable.

| ID | Scenario / deterministic setup | Expected security and game result (candidate A unless marked B/C) | Evidence tier required |
|---|---|---|---|
| IDR-01 | Empty lobby; one new LAN P2 request | Exactly one Pending → Connected seat; Player 2 controls owner=1 only | Pure policy + LAN NGO |
| IDR-02 | Second LAN connection while P2 already connected | Rejected, no owner change, no action serial increment | Pure + NGO |
| IDR-03 | Pending first candidate expires without Commit | Pending cleared; no phantom occupancy; unapproved midgame replacements remain locked | Pure + NGO |
| IDR-04 | Active P2 leaves at a safe boundary | Vacancy enters LOCKED_AFTER_DISCONNECT; host stays authoritative; no automatic refill | Pure + NGO |
| IDR-05 | Previously connected person tries immediately using same invite while LOCKED | Denied or shown awaiting explicit host authorization; **not** labeled authenticated return | NGO + UX |
| IDR-06 | Different person with forwarded code tries while LOCKED | Same denial; forwarding invite cannot bypass lock | NGO + LAN or Relay |
| IDR-07 | Host opts in to replacement at safe boundary | One new applicant allowed; UI states "new Player 2"; full authoritative snapshot; P1 simulation state unchanged | Pure + NGO |
| IDR-08 | Host authorizes then cancels before Pending commits | Candidate denied/removed, no P2 owner privilege; returns LOCKED | Pure + NGO |
| IDR-09 | Two replacement candidates race for host-authorized opening | One unique winner, loser rejected; no double seat and no multiple action execution | Pure + NGO |
| IDR-10 | Old disconnected transport sends late or duplicate intent | Rejected by current transport-to-seat binding; simulation action serial unchanged | NGO spoof/reorder |
| IDR-11 | New P2 sends sequence=1 following previous P2 sequence high value | Valid new owner sequence judged within new binding only; cannot mistake as identity continuity; no extra old command execution | Pure + NGO |
| IDR-12 | Old result/ack for sequence 1 arrives after new P2 pending sequence 1 | Must not clear new pending/accept counters incorrectly; investigate actual transport lifecycle before implementation | NGO adversarial fixture |
| IDR-13 | Client sends owner=0 from bound P2 transport | Rejected; host P1 action authority preserved | NGO negative |
| IDR-14 | Unbound third transport sends owner=1 intent | Rejected; no effect, regardless of guessed owner/sequence | NGO negative |
| IDR-15 | Real Android pauses briefly with connection intact | No second P2 seat; same active transport remains owner=1; no accidental replacement | Physical Android |
| IDR-16 | Android process killed / loses connection beyond heartbeat | Vacancy locked; return treated as replacement after host action; no claim of secure session recovery | Physical Android + host logs |
| IDR-17 | WebGL browser refresh midmatch | Old transport revoked; new browser connection is new P2 candidate; cannot reclaim owner based solely on same URL | Physical independent browser |
| IDR-18 | Internet MPS join code after disconnect while NGO seat free but cloud member still present | Capture real MPS and NGO admission states; if full, fail clearly and do NOT misreport as a code/identity bug | Relay/WSS real service |
| IDR-19 | Host process crash/restart during P2 match | Previous epoch/match cannot be resumed; old room unavailable/ended, create new host match, no client-authoritative restore | Windows + client |
| IDR-20 | Stale NGO ID coincides with later recycled ID | Current connection lifecycle, not numeric ID alone, determines ownership; reject old-generation packets | Adversarial harness |
| IDR-21 | Option B: expired or previously used credential presented | Reject without seat takeover; same-match epoch and one-time generation enforced | FUTURE protocol/security test |
| IDR-22 | Option B: valid credential concurrently used by two transports | Exactly one bound transport wins atomically; loser denied; prior ticket rotated/revoked | FUTURE race test |
| IDR-23 | Option B: stolen token in log/URL, plaintext LAN sniffing attempted | No token appears in URLs/logs; do not ship on unreviewed plaintext LAN; block B release until secure channel verified | FUTURE security test |
| IDR-24 | Option C: client sends fabricated PlayerId or a different anonymous UGS identity | Untrusted claim cannot regain earlier P2 seat; host must verify identity-to-transport binding | FUTURE UGS integration |
| IDR-25 | Legacy Protocol149 join to a future recovery-enabled host | Explicit compatibility policy: either safe Option-A admission or intentional rejection with action message; no silent incorrect identity privileges | FUTURE version matrix |
| IDR-26 | Successful replacement during unsettled Moving/action phase | Host does not transfer during unsafe in-flight action; waits to an approved boundary then sends full snapshot; zero duplicated actions | Pure + NGO |

**Pass criteria proposed (not measured):** exactly one authorized owner=1 transport at once; zero unauthorized owner actions; zero double-applied commands; host-authorized replacements visibly labeled; refused applications cannot advance action serial; new client converges to host authoritative snapshot; no restoration claim after host crash. Quantitative deadlines and jitter tolerances belong to A31/HQ execution phase.

**Required per-case evidence:** case ID; exact R16 source import SHA + client binary SHA (not ZIP hash reused as compiled hash); device/OS/platform; LAN vs Relay path; two independently collected UTC logs; current seat state and transport lifecycle; command owner/sequence/action serial; host/client snapshot revision and state digest; expected/actual; risk of personally identifying data; PASS/FAIL/BLOCKED; reproduction count; tester and A60 review reference. Redact raw invitation codes, private IPs and credentials.

## 10. Protocol 149 compatibility verdict

- **Option A — PROTOCOL 149 PRESERVED IN DESIGN:** no new RPC parameter, wire message, snapshot field or session rule needed for the proposed host-local seat lock and UI. Actual implementation must verify NGO callbacks preserve existing admissions and game semantics. R16 source anchors: NgoGameSession.cs:56,131–176; NetworkGameSession.cs:6,14–21.
- **Option B — CHANGE REQUEST REQUIRED:** adding an NGO connection approval proof, new challenge-response, ticket rotation or session generation that old clients cannot interpret changes admission semantics even if the protocol constant remains 149. Version negotiation, downgrade behavior, transport confidentiality and cross-platform tests must be approved before code.
- **Option C — CHANGE REQUEST / SECURITY REVIEW REQUIRED UNLESS EXISTING GUARANTEES VERIFIED:** do not assume MPS membership or anonymous sign-in is automatically cryptographically bound to SenderClientId at gameplay admission. An identity bridge has a trust boundary and possible SDK/API compatibility changes; neither Identity nor Relay provides saved host simulation.
- **No change executed:** Protocol 149 stays frozen; no new SDK config/UGS credentials/Unity source artifacts.

## 11. W2 verification, unresolved decisions and HQ HANDOFF

**Actually executed:** inspected specific R16 ZIP network source with numbered-line extraction, recomputed ZIP SHA-256 (MATCH), counted 639 entries (MATCH), ZIP CRC check OK, verified the already-existing W1 GitHub report (blob SHA 35d579a11f4d192f257dbbcaaaca812ace52343d) and read Issue #108/dispatch. A structural document-completeness check is a **STATIC DOCUMENT CHECK**, not a security/runtime pass.

**NOT RUN:** candidate A behavior, same-player reconnect, Unity compile/tests, NGO/Relay/LAN network connections, WebGL browser interactions, Android hardware, physical WAN, timing/jitter/loss, credential attacks, B/C token or provider identity tests. No risk here is claimed as exploit reproduced.

**Open items for 00/HQ:** D-01 replacement policy/phase boundary and penalty on disconnect; D-02 expectation of verified original-user continuity; optional consent window; how to handle an MPS member still occupying cloud capacity after NGO seat release; whether secure LAN transport is in scope for future B; exactly which user-facing term replaces "rejoin". A31 should not implement B/C before HQ policy and security change request. A60 owns independent gate.

**Status vocabulary:** DESIGNED=YES; IMPLEMENTED=NO; TESTED=SOURCE REVIEW + STATIC DOCUMENT VALIDATION ONLY; INTEGRATED=NO; RELEASED=NO.

**HANDOFF to HQ / A00 (and future A31/A60):**

PROJECT: CC-001  
WAVE: R17-W2  
AGENT: A41 — Backend / Multiplayer  
ISSUE: #108  
BRANCH: feat/cc001-r17-w2-a41-reconnect-design  
BASE COMMIT: f35145085127bdbb878e8ffdcf38705be8348e45  
FINAL COMMIT: [captured from GitHub write; see Issue #108 handoff]  
FILES: docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md  
INPUT R16 SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4  
DELIVERED: Decision record Options A/B/C; identity/seat/threat/transport matrices; conservative minimum R17 migration; 26 future acceptance scenarios; compatibility gate  
ACTUAL TESTS: R16 ZIP SHA256 MATCH, count 639 MATCH, ZIP CRC PASS; static document coverage verification (not Unity/security runtime)  
NOT RUN: Unity/NGO/Relay/Android/WebGL/physical-network/credential execution tests  
DESIGNED: YES  
IMPLEMENTED: NO  
TESTED: SOURCE REVIEW/STATIC ONLY  
INTEGRATED: NO  
RELEASED: NO  
OPEN QUESTIONS: HQ decisions D-01/D-02, MPS cloud seat behavior, secure transport precondition, grace/timeout and protocol change request for B/C  
HANDOFF TO: 00/HQ; A31 for later source-branch implementation; A60 for independent QA

**No merge, source modification, custom backend creation, credential generation, protected V148 change, tournament-site edit or public deployment.**
