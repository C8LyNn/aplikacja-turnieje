# R9 — three distinct V148 explosive triggers

Bounded continuation of the approved migration and the user's direction to resemble the HTML prototype. The existing contact/STOP/TURN/death, status display and authoritative snapshots are extended; no architecture, roster, imported statistic, canonical or featured selection changes. No website synchronization/publication. The approved amendment in PROPOSED_DESIGN.md explicitly permits implementation without another planning checkpoint.

Source runtime probes confirm: Mine arms on STOP, ignores unarmed/friendly contact, triggers on a later weak enemy TOUCH, and is disarmed by enemy Frost's entry into its ring; Time Bomb arms on STOP and counts two own turn starts; Bomb explodes on STOP or premature death, with friendly fire. Source SHA256 is checked before/after.

Implement the same primary intent cleanly: Mine arming is authoritative ball state with a derived ring; Time Bomb has an explicit remaining fuse and idempotent turn tick; transformation clears explosive history. Blast triggers are consumed before area damage can recurse. A living Bomb's repeated DEATH payload must not consume the actual ball. STOP re-arms/resets the timer, matching the source. General status/force/rounding follow the native engine.

Test-first outcomes: arming and separation, friendly fire, Frost disarm, replay, early destruction, jam suppression, idempotent own-turn countdown, Echo/Agony/Mimic, serialized live state, full mixed matches. An observed Echo/Slingshot chain reaches the existing 28-second hard cap; retain that bounded behavior, resolve the action once, and emit a single guard event. Do not extend the cap or suppress primary abilities to hide it.

Verify the full C# suite, independent code review, native staged visuals plus a legal rendered match, Windows/WebGL/Android builds, real Windows-host/WebGL-client state, LAN, phone gestures and Android package signature. Preserve R8 evidence and deliver a new local R9 package with explicit limits. Physical-device and cross-NAT acceptance remain separate.
