# V149 R6 — one game, adapted controls and presentation

The user has approved implementation of the Unity migration, Internet and LAN crossplay, and device-specific presentation. This pass continues that approval. It does not change gameplay data, abilities, balance, canonical decks or the four featured presets.

## Design

- Keep one C# simulation at 120 Hz. Only the authoritative host advances network matches; clients send validated intent and receive resulting state/events.
- Separate runtime (Windows, Android, WebGL) from device presentation (desktop, phone, tablet). A browser can use any presentation profile.
- Use a logical safe-area viewport for controls and layout. Convert pointer coordinates through the same viewport before constructing world-space launch intent. Keep the arena aspect ratio and launch rules identical.
- Phone: readable touch controls and compact stacked views. Tablet: larger arena and tray in either orientation. Desktop: mouse/keyboard controls and scalable windows. Cancel interrupted gestures and preserve primary-finger ownership.
- Keep automatic discovery and invitation links for direct LAN. Add Internet sessions with Unity Multiplayer Services 2.2.4, Relay and NGO using secure WebSockets for native/browser compatibility. The host's authority and replay/turn/command validation remain shared.
- Internet setup depends on a real Unity Cloud project and service access. Never fabricate a project ID or label untested Internet connections as working.
- WebGL gets a responsive full-window shell, safe-area padding, loading/error UI and fullscreen control. All join parameters reach the existing Unity runtime unchanged.

## Execution and verification

1. Implement and test pure device viewport transforms, profile layouts and primary-pointer behavior. Integrate all presentation views into the logical viewport.
2. Inspect the pinned official Multiplayer SDK; integrate its network handler with the existing NGO authority, cancellation and cleanup. Add join-code/invitation validation tests.
3. Add the responsive WebGL shell and editor/cloud-link helpers; assist the user with the account-bound Cloud step while implementation continues.
4. Run C# gameplay/network/presentation tests, compile Windows/WebGL/Android sequentially, and exercise the built browser at desktop, tablet and phone sizes/orientations.
5. Re-run actual Windows-to-WebGL LAN validation. Test Relay end to end if a real Cloud project is linked and enabled. Record any external/account/physical-device limits explicitly.
6. Obtain an independent code review, repair material findings, update migration/build/network status and produce a verified R6 delivery without overwriting historical R5 evidence.

Parallel ownership: device presentation/input; networking/SDK; root WebGL shell, Cloud setup, integration and verification. No parallel Unity builds.
