> **WAŻNE — IDENTITY LOCK / WERSJA POPRAWIONA**
> Ten starszy plik zawiera szczegółowy opis techniczny, ale NIE JEST punktami wejścia. Najpierw otwórz **[ROLE_LOCK_A50.md](../ROLE_LOCK_A50.md)**.
> **TEN AGENT = A50 | ISSUE #138 | GATE READY NOW.** Nie jesteś A10. Nie zgaduj numeru agenta z pozostałych dokumentów.
> Pierwszy wiersz odpowiedzi: `IDENTITY_OK | CC-001 | A50 | ISSUE #138 | READY NOW`.
> Gdy historia sesji jednoznacznie wskazuje innego agenta, wstrzymaj zapis i zgłoś `IDENTITY_CONFLICT`.

# CODEX TASK — A50 / Frostguard F02 coordinated physics repair
PROJECT: CC-001 — Core Clash Unity; WAVE: R17-W4 recovery
ISSUE: https://github.com/C8LyNn/aplikacja-turnieje/issues/138
ROLE: A50 — Simulation / Parity / Acceptance
OWN BRANCH: feat/cc001-r17-w4-a50-f02-physics
SNAPSHOT HEAD: 661660d3a3dc8a4fa2c9afea489050247f64c38c
READY NOW for isolated test-first implementation; merged candidate and release remain GATED.

Read W4 MASTER DISPATCH, 02_VERIFIED_STATE_AND_GATES.md, 04_HANDOFF_AND_TEST_EVIDENCE.md, W3 A50 issue #124 commit 4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5 and W2 A50 F02 golden oracle Issue #109. Recheck branch and source heads before editing.
Exclusive allowed source paths inside unity/cc001-r16/CoreClash-V149-Unity/:
- Assets/CoreClash/Core/ElementalEffects.cs
- Assets/CoreClash/Physics/CollisionResolver.cs — A50 EXCLUSIVE OWNER DURING THIS WAVE
- Tests/ElementalTests.cs
- docs/cc001/swarm/w4/A50/** (repo relative)
No BallPhysics.cs, GameState.cs, network/snapshot codec, Tests/Program.cs, data/catalog, A40 lifecycle paths or V148 reference. Need extra file? HOLD that portion and request precise HQ expansion.

MISSION
Carry W3 intentionally-red F02 tests into your OWN W4 branch only after checking ancestry/changed file, then implement smallest faithful repair:
- V148 Frostguard STOP plain anchor, anchor flag active, zero synthetic Earth anchor stacks.
- ForceScale 0.30 while anchored; collision mass 2.00 x base for plain Frostguard.
- On replay/release restore expected 1.0/1.0 plain state and remove synthetic residual, while preserving legitimate preexisting Earth stacks (negative control).
- Preserve shields and FIRE/ICE mechanics and snapshot-serializable relevant state.
- Source-grounded minimal tweaks to CollisionResolver and ElementalEffects; no opportunistic unrelated physics.
- RED before fix and GREEN after fix are only claims if REAL .NET tests run and exit codes logged. If .NET unavailable, label expected RED/GREEN as SOURCE-PREDICTED NOT_RUN; maintain candidate HOLD.
- Test impact in native physics if available, and report absent native runtime separately.
- Critical F01: actual protected V148 construction HP initializes as 5, not 2; do not modify ConstructionEffects or construction collision gate under F02 task.

OUTPUT
Commit actual minimal code and tests on own branch, publish docs/cc001/swarm/w4/A50/R17_W4_A50_F02_REPAIR_HANDOFF.md, before/after mechanics, exact SHA, actual test results and NOT_RUN. Report to existing Issue #138; hand off to A60 for independent exact-commit QA. No merge to main, no release.
