# R7 — Internet recovery and publication preparation

Continues the approved cross-platform work from R6. Gameplay, physics, abilities, catalog and decks stay unchanged. R6 artifacts and evidence remain historical.

1. Exercise real Cloud full-room and missing-code responses, client departure/rejoin, loss of host and local fallback through the normal WebGL interface.
2. Delay a genuine successful Cloud join response, cancel in the interface, then deliver the response. Verify stale callbacks cannot start a match, membership is released and the same player can join again. Record the test interception explicitly; do not simulate a successful backend response.
3. Repair only reproduced material failures. Add focused regressions before changing runtime behavior; rebuild affected targets and repeat their relevant checks.
4. Prepare a WebGL upload package and a deployment verifier for the actual HTTPS hosting URL. Ask for the destination while independent work continues. Do not invent or publish to an unrelated domain.
5. Check for connected Android hardware, document physical-device limits, and update status with fresh evidence.

Initial state: R6 commit ab73148; clean working tree. ADB enumeration succeeded with no connected devices. Public hosting destination is not yet supplied. All Cloud tests are separate processes on this PC, not a cross-NAT hardware test.

Finding: the real full-room response is HTTP 409 / Lobby 16004, detail `lobby is full`. Invalid alphabet is HTTP 400 / Lobby 16010. Pinned MPS LobbyConverter discards these reasons and inner exceptions and emits SessionError.Unknown. The generic guidance was reproduced. Two focused C# regressions were observed red (138 passed / 2 failed); sandbox-only socket failures were excluded by rerunning with real sockets enabled. A narrow detail adapter preserves generic fallback for other errors and never displays raw backend details.

Completion: 140 core tests, 14 real Cloud lifecycle checks, real Relay authority + LAN rechecked, rendered Windows full match, phone regression (30 checks/21 images), Android package checks and all three builds pass. Deployment verifier had 11 tests; independent review caught root404/direct-index200 and its red→green fix. Final local probe verifies all actual WebGL files under a versioned subdirectory. Physical Android availability: no devices; public destination: not supplied. Both remain explicit external follow-ups, with separate Polish guides. No gameplay source or data changed.
