<!-- R16 CURRENT -->
# Aktualny stan: R16 / 18.10.2026

Źródła R15 zostały rzeczywiście sprawdzone i rozwinięte. 269 testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. StandaloneWindows64: Succeeded; WebGL: Succeeded; Android: Succeeded.

Czytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.

**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**
<!-- R16 END -->

# V149 R9 networking status

## DONE — within the verified prototype scope

- NGO 2.13.3 + Unity Transport 2.6.0 + Multiplayer Services 2.2.4. Windows is the authoritative host; Windows, Android and WebGL use the same C# commands/state. Clients never step match physics.
- Internet: private two-player Sessions, anonymous Authentication, Relay WSS, six-character codes and `joinCode` invitations. Real Windows↔WebGL service traffic passed on one computer: authoritative state, legal remote intent, rejected owner spoof and duplicate command. R9 additionally verifies live armed Mine and Time Bomb fuse=2 on both peers after legal shots. Current evidence: `Evidence/r9-internet-smoke.json`; R8 bumper-state sync remains historical. Countdown/detonation outcomes are covered by native/C# tests; they are not a separate full remote match claim.
- LAN: Windows advertisements, automatic sender-IP joining, expiring protocol-checked room rows, direct WebSocket transport and the Windows WebRoot invitation. Browser `joinHost`/`joinPort` needs no manual IP. Current native/native + native/WebGL run: `Evidence/r9-lan/lan-runtime.json`; plain invitation and seat-replacement baseline evidence remains in R6.
- Failed joins, host loss, cancellation, same-manager retry and return to local play passed through ordinary browser UI against a real Windows host: `Evidence/r6-lan-recovery.json`.
- Native P2 seat replacement on the ongoing LAN match, sequence reset and spoof/duplicate rejection: `Evidence/lan-rejoin.json`.
- Internet operation tickets prevent canceled service results from starting a later match. Cleanup blocks a replacement transport until the previous request/session and NGO have ended. Pure helper regressions remain in the current 180-test suite.
- Actual backend full-room (409/16004), invalid-code (400/16010), missing-code (404/16001), departure/retry, host loss/local fallback, and cancellation while a genuine successful join response is held: `Evidence/r7-internet-lifecycle.json`, 14 checks. The canceled membership is deleted/left without starting Relay; the same browser player subsequently joins. No fake successful service response is used. MPS 2.2.4 loses typed full/invalid-code reasons; a narrow adapter now supplies fixed player guidance without exposing raw details.

## Player flow

Windows host selects both decks, then **MULTIPLAYER → CREATE GAME → INTERNET → CREATE GAME**. Share the code; P2 uses **JOIN GAME → INTERNET**. Keep Windows running.

For the same network, select **SAME WI-FI / LAN**. Native P2 clicks a discovered room; browser P2 opens **COPY LAN JOIN LINK**. Direct IP/port fields are confined to **ADVANCED → DIRECT LAN CONNECTION**. Discovery does not grant authority. Host checks seat ownership, turn, sequence, stock and malformed input independently.

The configured public project ID is `f87462cd-20c0-432c-9108-8f07f77ad27b`. Runtime Authentication/Session/Relay access was verified, rather than inferred from that ID. No service-account secret is embedded in the project.

## PARTIAL

- Listen-server prototype: Windows host, one P2, host chooses both decks. No reserved authenticated seat, host migration, production interpolation or bandwidth/load certification.
- The supplied Replit address serves an older WebGL build. Its separate read-only audit found dropped invitation parameters and static-path fallback issues; current R9 has not been deployed. The embedded `browserGameUrl` remains empty, so players share a code with a served compatible build or use the host's Advanced URL field. Do not assume R9 can play with that older public runtime. Updating the website requires separate approval.
- Direct LAN uses local HTTP/plain WebSockets. Relay WSS is the Internet route. The local private LAN URL is never advertised as an Internet URL.
- Anonymous identity is sufficient for the prototype, not account recovery or protection from a dishonest authoritative host. Abrupt exit/loss can leave service membership until timeout; create a new game if the old code remains full.
- Unity batch builds emit one ServicesCore Editor-link/login warning. Runtime Project ID is embedded and actual service play passed. No warning was hidden; counts remain in `Evidence/build-*.json`.

## NOT TESTED

Physical Windows↔phone/tablet LAN or separate-network cross-NAT matches; native Android runtime/networking; Safari/iOS; high latency/loss/load; session expiration timing after abrupt process loss. Browser touch and safe areas are emulated. Real service exchange on one PC does not prove these cases. A missing-code response was tested; the service's chronological expiration policy was not.

## NOT STARTED / OUT OF SCOPE

Publishing current R9 to the supplied HTTPS website, store publication, native iOS build, QR generation and WebGL-host parity. The separate HTML legacy runtime does not join Unity sessions.

Current checks: `node Tools/r6-internet-smoke.cjs --tag=r9 --explosives`, `node Tools/lan-runtime-smoke.cjs --output=Evidence/r9-lan`. They use their own local processes, isolated browser contexts and ports. R7 lifecycle and R6 recovery/rejoin evidence is historical; those suites were not repeated in R9. Account setup is in `docs/R6_UNITY_CLOUD_SETUP_PL.md`; deployment/device steps are in `docs/R7_WEB_PUBLICATION_PL.md` and `docs/R7_DEVICE_ACCEPTANCE_PL.md`.
