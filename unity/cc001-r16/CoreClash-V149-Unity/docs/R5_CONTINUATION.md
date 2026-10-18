# R5 — mobile setup and LAN recovery

Date: 2026-10-16. Bounded continuation of the approved Unity class demo.
V148 remains a design reference. This pass does not expand ability coverage,
change physics/stats, alter featured selections or remove roster/canonical data.

## Problems reproduced

R4's 390 px library gave wrapped names a fixed 23 px box and drew nine previews
under the P1/P2 controls. The builder helper also had less height than two lines
needed. The replacement measures the same font style used to draw and gives
narrow library rows separate name, nine-ball and action bands. Desktop and short
landscape retain compact rows when the text fits. See R5_MOBILE_LAYOUT.md.

A real unavailable public invitation in R4 left the client on an empty,
unresponsive match view. The regression first failed with the R4 compiled
player: Evidence/r5-lan-recovery-before.json and its screenshot. It is an
intentional historical failure, not the current acceptance report.

## Connection recovery

- Joining keeps a visible progress panel until the first authoritative state.
  A player can cancel without using Escape or entering a technical address.
- A failed start, an unanswered initial join (20 seconds), or unexpected loss
  of the client's host produces a readable reason and restores the Create/Join
  interface after NGO has finished shutting down.
- Retry reuses the existing NetworkManager only when it is neither listening
  nor shutting down. Old pending intents, chunk assembly and revisions are reset
  by the normal session-start path. Received client state never grants authority.
- Intentional cancel/disconnect suppresses failure recovery. Local play remains
  available after closing the lobby. No automatic background rejoin loop runs.
- The host keeps the ongoing match when P2 leaves. The R4 seat binding,
  fresh-connection sequence and spoof/duplicate validation remain unchanged.

This is direct LAN error handling, not authenticated identity recovery, Relay,
Sessions, secure website deployment or a physical-device cross-play result.
Runtime host-local Relay transport failure remains a future services concern;
this pass targets the currently supported direct-LAN flows.

## Verification

The managed suite includes six new geometry cases (320 px / 390 px phones,
667 px short landscape, 960 px desktop; nonoverlap, complete previews and usable
actions). The isolated old-layout run failed five of six; the new layout passed
all six. Full suite: 120/120. Wire framing/compression: 13/13.

The current acceptance reports are Evidence/r5-lan-recovery.json,
Evidence/r5-webgl-smoke.json, Evidence/r5-native-runner.json and the ordinary
network/discovery/invitation regressions. Tools/lan-recovery-smoke.cjs uses
actual public browser controls and native NGO hosts, without injected game
state: unavailable endpoint, same-player retry, host loss, local launch,
pending-join cancel, retry after cancel and public connected Disconnect.

Native Windows/Android hardware input, physical phone performance/thermal
behavior, separate-device Wi-Fi and authenticated internet recovery retain
their existing NOT TESTED / NOT STARTED classifications. Android APK build
and static package verification are separate evidence. R4 ZIP/report remain
historical artifacts, unchanged by this continuation.

Final release verification: **Windows / WebGL / Android: 0 errors, 0 warnings**.
Native Windows: **51 launches / 50 turns**, six rendered captures, zero motion
guards. Browser UI: **25 checks / 49 screenshots**, no page errors or failed
requests. Real public connection recovery: **10 checks**, including same-manager
retry, local launch after host loss, cancel/retry and intentional Disconnect.
The 18,981,260-byte Android APK passes seven static package/signature checks;
it has not been installed or executed on a physical device by this task.
