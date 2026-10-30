# CC-001 — R17-W9 / A40 P2 gameplay turn authority regression delivery

**ROLE:** A40 — Gameplay / Lifecycle + RETURN. This thread's original direct assignment governs identity; Issue [#92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92).  
**HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97); latest verified NET-W6-01 operator incident [comment 6401386657](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6401386657).  
**WAVE:** R17-W9 — MULTIPLAYER REPAIR.  
**PRIORITY:** P0 seat/turn gameplay regression guard, NOT a claim of network fix.  
**START/BASIS:** RC1 immutable commit `10f64e4d213f17a352ed8fa83bc75884a39549f0` (full accepted Windows Player source).  
**OWN ISOLATED BRANCH:** `feat/cc001-r17-w9-a40-p2-turn-contract`.  
**INITIAL TEST COMMIT:** `9abe1e7721e561d1006180dd4113860ed8546ea9`.  
**FINAL HEAD:** See Issue #92 and draft PR after report commit, which cannot embed its own hash.  
**NO CHANGES:** protected RC1 source ref, R16, V148, Protocol149, multiplayer transport, presentation, camera/aim arrows, physics, `main`, release.

## What was implemented (not another audit)

Added **three executable managed C# regression cases** directly to the existing A40-owned `unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs`:

1. **W9 A40 P2 command cannot launch on P1 turn and P1 cannot act during P2 aim:** wrong-seat P2 intent before its turn is rejected without action/event/stock mutation. Valid P1 launch settles to owner1/turn2; wrong-seat P1 intent during P2 Aiming is rejected without event/stock mutation; valid P2 `fire` launches from `y=47` towards positive Y, ball `owner=1`, LAUNCH event and only **P2** inventory decrements.
2. **W9 A40 P2 bonus remains P2 turn and cannot grant P1 a phantom shot:** after first P2 action, `bonusPending` keeps P2 owner/turn/ownerTurns; P1 rejected with zero action/event mutation; P2 bonus action accepted exactly once; only then advances to P1/turn3 with `bonusUsed`.
3. **W9 A40 P2 Replay validates owner and keeps seat turn without duplicate launch:** P2 ball touching true home zone (`y=90`) is replayable; wrong owner rejected unchanged; legal P2 Replay accepted once and `replayedIds` updated; after settlement P2 remains current owner on same turn; duplicate rejected without serial/event increment.

These protect **authoritative GameSimulation turn/seat semantics** against subsequent A31/A20 integration. The tests deliberately exercise the engine, not NGO transport, rendering, or the player-relative UI. Existing comprehensive network tests belong to A31; no foreign test file edited. No speculative `GameSimulation` gameplay mutation was made: source review of `TryCommand` and `TurnSystem` found no confirmed P2 gameplay bug that justifies touching accepted RC1.

## Ownership and blocker routing: actual PC1 ↔ PC2 incident

- **P0 P2 ball teleport/jitter:** In `NgoGameSession.LateUpdate` host sends authoritative snapshots at `0.2f` seconds during Moving (5 Hz), `1f` while aiming; `ReceiveChunk` applies entire deserialized GameState, and `CoreClashApp.Update` steps physics **only for host**. The visible client board receives discrete 5Hz replacements rather than per-frame authoritative visual interpolation. This is a concrete **source-backed candidate mechanism** for operator-reported jumps, not a proven performance timing root cause (raw PC1+PC2 logs not available to A40). **A31** owns snapshot/interpolation/network cadence; do not blindly raise raw snapshot rate or introduce client-side host authority.
- **P0 wrong local YOUR SHOT label:** `Presentation/MatchView.cs TurnText()` prints `YOUR SHOT` whenever `phase==Aiming`, regardless of `NetworkLink.LocalOwner`. On physical P2 during host P1 Aiming this is semantically incorrect. **A20** owns presentation; label must be local-owner-relative, with host P1, remote P2, spectators and moving states distinguished; don't modify GameSimulation.turn.
- **P1 inverted/broken P2 aim arrows and perspective:** Presentation `BoardView`/`AimGuide`/input transform; route to **A20**, with A31 local identity. A40 no visual code writes.
- **P2 duplicate strength meter:** A20/A10 design gate, no A40 modification.

**Critical separation:** Network client must not decide legality based on UI labels: host validates `command.owner==connectionOwner`, turn, phase, and sequence. A visual label fix is not a license to reassign authoritative turn or swap server seats. Keep Protocol149 intact.

## Exact checks and limits

- **Actual tool action:** GitHub create isolated branch from exact RC1, commit three C# tests; remote file and SHA readback.
- **Static checks:** 8/8 source/scope predicates TRUE including P2 launch origin/direction, owner isolation, bonus, replay and commit ancestry; 3 named new test registrations; balanced C# curly braces. These are **not** compiled tests (GitHub API executions do not expose OS exit codes).
- **GitHub compare before report:** RC1 → test commit ahead1/behind0, exactly `Tests/AbilityTests.cs` changed (+60 lines, -0), blob `8f8b466f44fe09d1f7615e9b659fbdfa9a0acde3`.
- **Toolchain:** `command -v dotnet` returned no path in local container; real managed `dotnet run` / Unity P2 gameplay tests **NOT_RUN**. No PC1/PC2 device session or raw log bytes were accessed; historical R16/RC1 361/361 managed, 13/13 codec, A60 Windows acceptance cannot be reassigned to this **new test SHA**.
- **Runtime tests, exit codes, native image evidence:** **NOT_RUN / N/A**. No false PASS claims; A60/A72 should execute targeted tests only when actual runner/build environment available and QA permits.
- **PR:** a draft PR targeting RC1 source branch, not main, will be linked in A40 #92 and HQ #97. **DO NOT MERGE** into RC1; A70 alone assembles future isolated candidate after HQ review.

## Delivery and next steps

**DESIGNED:** YES (three focused gameplay invariants).  
**IMPLEMENTED:** YES (tests; no production source change).  
**TESTED:** static source 8/8 only; **C# runtime NOT_RUN**.  
**INTEGRATED:** NO.  
**RELEASED:** NO.  
**A40 OUTCOME:** TEST_ONLY_READY_FOR_QA / A31_P0_NETWORK_FIX_PENDING / A20_P0_P1_UI_FIX_PENDING.

**Handoff:** A31 issue #94 — client interpolation/snapshot and authoritative P2 evidence; A20 issue #95 — locally relative turn text and P2 presentation; A60 independent verification; A70 integrator and HQ #97. No overwrite of another agent's changes, no force push, protected source mutation, main merge or deployment.
