# Core Clash V149 implementation ledger

Plan: docs/IMPLEMENTATION_PLAN.md
Spec: docs/PROPOSED_DESIGN.md

Architecture approved and implementation explicitly authorized by the user. Featured decks are provisional; no further deck decision blocks implementation.

Ruling: execute inline without another plan-approval pause — the user explicitly said proceed with implementation now and continue after design approval — implementation remains reviewable in the new project repository.

Ruling: use a new standalone project repository under Desktop rather than a worktree — Desktop is not a functioning repository and no existing Core Clash Unity checkout was supplied — no original project is changed.

Pre-flight: source hash and size verified; runtime reference loads; source-provided regression suites 92/92; content audit has 12 archetypes/36 decks with no missing IDs. Unity 6000.4.0f1 has Windows/WebGL modules. Licensing/build execution not yet tested.

Task 1: in progress.

Task 1: complete — runtime catalog 227/224/12/36 and four replaceable user presets validated, original hash unchanged; actual Unity editor bootstrap compile passed.
Task 2: complete — core turn/stock/bonus/replay/physics/pressure/win checks green; first Windows and WebGL builds each succeeded with zero errors/warnings.
Task 3: primary selected handlers implemented; 65 C# tests currently green including 4 complete native-simulation matches, all nine selected types deployed in every match, zero motion-guard activations.
Task 4: first actual WebGL browser QA passed boot, builder, mouse launch, portrait touch launch/cancel; reported landscape clipping and preset name overlap have been repaired in source, awaiting fresh build/retest.

Ruling: V148 is now a design reference rather than a parity specification — explicit user scope correction — native behavior can intentionally differ and must be documented instead of claiming source parity.
Ruling: remove the legacy global rebound multipliers for normal collisions/walls — a behavioral test demonstrated ordinary collisions adding kinetic energy, inconsistent with a stable native game — ball-specific stats stay imported, but native trajectories differ intentionally.
Ruling: Ward cleans all modeled negative statuses and Plagueleech binds/infects a clean enemy; Penitent transfer does not immediately reinfect its ally — these implement clear ability intent rather than source condition/spread bugs, authorized by the scope correction — source runtime reports retain the actual legacy behavior separately.
Ruling: retain the exact latest user deck selections rather than substituting Venom — native Plagueleech implements its intended initial contact and source audit confirms the primary toxin/cleanse combinations independently — legacy Plagueleech limitation is disclosed.

Final task update: 1–4 complete within the reported vertical-slice scope; task 5 delivered a tested direct NGO/Unity Transport WebSocket prototype, documentation and review. Relay/Sessions, native Android, production deployment and data-only ability handlers remain explicitly incomplete. Final runtime evidence is refreshed after the final build rather than inherited from baseline builds.

Ruling: freeze gameplay physics/continuous fields during aiming — a new regression showed a black-hole field moving a target while planning — stable native turn-based play takes priority over legacy quirks.
Ruling: preserve the authored scene between platform builds — the first real Windows/WebGL test exposed mismatched NGO scene identities when each build recreated objects — reopen/reuse the same scene, then repeat the real two-role test.
Review: independent core review found stale ICE bookkeeping blocking Penitent and Gravity Mine detonating at a displaced source. Both were reproduced with failing tests, repaired and independently rechecked; no remaining Important/Critical core finding. A final opaque LAN panel fixes portrait header text bleeding through the expanded overlay.
Verification: 80 native behavioral checks including 11 staged causal showcases and 4 complete local matches; 13 codec checks; final Windows/WebGL compile and actual browser/network smoke evidence under Evidence/. The original certified source is rehashed before handoff.
Ruling: preserve the explicitly requested local experimental branch and project — this is a new standalone repository with no upstream/base integration target and the user specified the working branch — no merge/push/PR or cleanup approval flow is needed for delivery.

## R2 presentation convergence and simple LAN join

The user's R2 review preserves the existing simulation and NGO authority boundary. The subsequent Simple LAN Join request explicitly extends the multiplayer presentation scope with native discovery and browser invitations. The supplied requirements are the bounded design for this implementation; they do not reopen the already approved migration architecture.

Implemented: four featured cards with nine orb previews and P1/P2 selection; secondary full library/builder; desktop portrait arena and fixed controls; 3×3 visual tray; team HP/turn HUD; glossy orbs, arena zones/boundaries and aim/power cues; clean player details; F1 developer metadata. New player text lives in presentation-copy.json. Imported roster, featured selections, canonical decks, ability handlers and physics remain unchanged in R2.

Implemented: Create Game / Join Game, native bounded UDP advertisements and expiring room directory, automatic sender-address connection, copyable invitation and native read-only WebRoot server, public WebGL joinHost/joinPort startup, Advanced-only IP/port fields. The original authority, ownership, sequence, turn and malformed-command checks remain in place. WebGL does not attempt UDP discovery. QR is deferred under the user's allowed copyable-link fallback.

Verification corrections: actual rendered captures exposed thin rounded-rectangle minimum sizes, clipped vertical lines and a covered Multiplayer entry. These were repaired in presentation only and both release targets rebuilt. Turn selection regression was reproduced with failing tests and repaired by falling back to Standard when a selected identity is outside the active player's deck or exhausted. A startup frame guard prevents the Start click from leaking into launch input. Hidden native windows did not repaint on this machine; the accepted capture run explicitly used a visible D3D11 window and validated nonflat, distinct image content.

Current checks: 93/93 C# checks and 13/13 wire checks; real native release rendering, six screenshots and a full local match (33 launches, 32 turns, zero motion guards). Both release builds succeed with zero errors/warnings and no Development Build watermark. Final browser/discovery/invitation runtime evidence is recorded separately in Evidence/. A fresh read-only reviewer found no actionable Critical or Important issue in the R2 code. Physical second-device Wi-Fi, phone hardware and native Android remain untested; no Relay/Sessions or website deployment is claimed.

Delivery keeps the earlier ZIP unchanged and creates a separate R2 archive. Seal checks bind current native managed assembly/resources/scene, browser build and invitation WebRoot to their accepted runtime evidence.

## R3 continuation toward the HTML presentation

User explicitly requested continuing convergence. This is a bounded continuation of the approved R2 direction: first-wall aim guide, stronger feedback from existing semantic events and corrections to the documented small-screen problems. No Core/Physics/Networking/Data gameplay source, ball ability, stock, canonical deck or featured selection changes.

Pure helper regressions were observed failing before implementation, then verified with the full suite. New coverage includes radius-aware reflection, corner handling, invalid aim, real damage/heal events, duplicate snapshot observation, initial history suppression, new-match event-ID reuse, effect expiration after match end and a bounded burst buffer. Full C# suite is now 102/102.

An independent read-only reviewer found a short-landscape library/footer overlap introduced by narrow stacking. The layout now keeps horizontal player choices on short wide screens and reserves footer height before sizing scroll regions. Native render inspection also caught crowded effect labels; labels are shortened and overlap-suppressed while actual rings/particles remain bounded. Final paired builds and runtime evidence supersede the initial inspection build. R2 archives remain unchanged for rollback; R3 is packaged separately.

The reviewer rechecked the final fix at 667×375 / 667×384 and reported no remaining Critical or Important finding. Final native evidence passes with 51 legal launches, 50 turns, a base-HP tie-break result and zero motion guards. The final native UDP/native-client, host-served WebGL invitation, plain invitation without client smoke flags and original direct-network regressions all pass; ownership spoof and duplicate commands remain rejected. Physics, core ability files, network authority code and catalog/deck data have no R3 diff.

## R4 post-V148 archive review

User supplied six reference packages and requested useful feasible improvements. Historical platform exports were inspected without executing or installing them; no replacement C# patch was present. Selected HTML Quick Play blocks were adapted to our generator/featured JSON, while automatic restore/polling/preferences were omitted because the source contained cancellation/stale-state problems. All certified source, canonical decks and ability/stat data remain unchanged.

Research recommendations were reduced to three concrete engineering gaps: unique ASCII identity labels, non-hue P1/P2 plus simultaneous static state labels, and live instance-bound inspection available without launch ownership. Two review findings were repaired before final builds: an empty-space right-click no longer swallows left-up, and F1 follows the inspected instance's current transformed identity. A separate LAN review found an expired reservation could be replaced before SDK cleanup; approval now expires/disconnects it before reserving a new client.

LAN P2 now releases on disconnect and a replacement SDK connection receives the same ongoing match with its own sequence counter. Real native SDK IDs 1 then 2 completed actions 2 then 3 against one host; both clients' forged-owner and duplicate intents were rejected. This is an open LAN seat, not authenticated identity recovery.

The Android module/SDK/NDK is now installed. A current ARM64/IL2CPP APK was built from this checkout with INTERNET enabled and verified statically, including signature. Final Windows/WebGL/Android reports each have zero errors/warnings. Android device execution/networking is NOT TESTED. Final C# checks: 114/114; wire checks: 13/13; browser checks: 18 with 41 captures and zero errors/failed requests; native rendered full match: 51 launches/50 turns/zero guards. Fresh direct networking, UDP/native P2, host-served WebGL and ordinary invitation regressions all pass. Detailed archive decisions are in POST_V148_ARCHIVE_REVIEW.md; R3 ZIP remains intact. Debug DoNotShip/DontShip exports are omitted from R4 packaging.

## R5 mobile setup and LAN recovery

Continued the approved class-demo work without changing Core/Physics/Data, ball abilities/stats, canonical decks or featured composition. Fixed the R4 phone library's clipped name and preview/action overlap with measured text and separate narrow-row bands; measured builder guidance now flows the search/roster position. Six geometry checks demonstrated five old-layout failures before passing with the real new helper; full managed suite is 120/120.

A real unavailable public invitation first reproduced the R4 frozen empty arena. Joining now stays visible and cancellable; failure or client host loss schedules SDK cleanup then restores actionable setup/join only after shutdown completes. Retry uses the normal same-manager transport path, and intentional cancel/disconnect suppresses error reopen. Player-facing failures use ordinary text; raw SDK details remain in logs. The host's released-P2 seat and duplicate/spoof/turn checks are preserved. A read-only review checked installed NGO2.13.3 lifecycle behavior and found no actionable defect in the scoped direct-LAN and layout changes.

Final evidence: 120 managed checks, 13 wire checks, 25 browser checks / 49 captures, 10 real public recovery checks, a native 51-launch / 50-turn full match with zero motion guards, and refreshed native UDP/native P2, host-served WebGL, plain invitation, direct NGO and sequential P2 regressions. All three release builds succeed with 0 errors / 0 warnings. Current ARM64/IL2CPP APK is 18,981,260 bytes and passes seven package/signature checks. Device execution, physical separate-device Wi-Fi, authenticated recovery and services/internet deployment remain untested or unimplemented. R4 ZIP and certified V148 source remain unchanged; R5 is a separate delivery.
