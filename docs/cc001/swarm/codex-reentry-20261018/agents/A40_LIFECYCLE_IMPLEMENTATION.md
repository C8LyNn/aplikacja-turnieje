> **WAŻNE — IDENTITY LOCK / WERSJA POPRAWIONA**
> Ten starszy plik zawiera szczegółowy opis techniczny, ale NIE JEST punktami wejścia. Najpierw otwórz **[ROLE_LOCK_A40.md](../ROLE_LOCK_A40.md)**.
> **TEN AGENT = A40 | ISSUE #92 | GATE READY NOW.** Nie jesteś A10. Nie zgaduj numeru agenta z pozostałych dokumentów.
> Pierwszy wiersz odpowiedzi: `IDENTITY_OK | CC-001 | A40 | ISSUE #92 | READY NOW`.
> Gdy historia sesji jednoznacznie wskazuje innego agenta, wstrzymaj zapis i zgłoś `IDENTITY_CONFLICT`.

# CODEX TASK — A40 / Five-ability Lifecycle + RETURN implementation
PROJECT: CC-001 — Core Clash Unity; WAVE: R17-W4 recovery
ISSUE: https://github.com/C8LyNn/aplikacja-turnieje/issues/92 (EXISTING)
ROLE: A40 — Unity Gameplay Implementation
OWN BRANCH: feat/cc001-r17-w4-a40-lifecycle-return
SNAPSHOT HEAD: 661660d3a3dc8a4fa2c9afea489050247f64c38c
READY NOW — isolated test-first development; integration remains HOLD.

Read W4 MASTER DISPATCH, 02_VERIFIED_STATE_AND_GATES.md, 04_HANDOFF_AND_TEST_EVIDENCE.md, original A10 W1 semantic contract from PR #98 / Issue #91, and A10 W2/W3 material where applicable. Verify current Issue and source SHA before editing.
Exclusive allowed source paths under unity/cc001-r16/CoreClash-V149-Unity/:
- Assets/CoreClash/Core/LifecycleEffects.cs
- Assets/CoreClash/Core/GameState.cs
- Assets/CoreClash/Core/AbilityResolver.cs
- Assets/CoreClash/Core/TurnSystem.cs
- Tests/AbilityTests.cs
- docs/cc001/swarm/w4/A40/** (repo-relative, NOT inside Unity project)
NO CollisionResolver.cs (reserved EXCLUSIVELY for A50), no ElementalEffects.cs/ElementalTests.cs, no network/snapshot wire files, no Program.cs, no data/catalog changes, no V148/reference edits. Missing required path -> document blocking proof and request HQ new scope BEFORE editing.

MISSION
Implement the exact narrow five ability batch and acceptance cases from approved A10 R17 lifecycle semantic contract:
1 Phoenix — actual death emits RETURN:REPLAY_RETURN to owner hand, 5 HP, available after own turn, regenerates +5 per own turn capped; hand replay later normal SPAWN, no stock duplication.
2 Revenant — actual DEATH yields one deterministic host RNG selected legal form at 10 HP, suppress normal SPAWN, emit RETURN:REVIVE, enforce identity/ownership/safe placement.
3 Soul Anchor — revive newest eligible allied grave record near recorded death position at 10 HP, consume grave entry only after legal placement; emit RETURN:REVIVE once, preserve lineage and cap/replay safety.
4 Dirge — repeat eligible ally DEATH effect body without emitting false DEATH or killing target; no erroneous graveyard/reward hook.
5 Den Mother — per-instance 1/turn eligible death observer producing Broodling 5 HP token/normal SPAWN without stock/RETURN.
Validate explicit negative cases, ordering, snapshot continuity in existing allowed code where feasible. Do NOT silently redesign global lifecycle. Protected executable V148 semantics win; Dirge SHORT metadata mismatch does not authorize adding a new range gate.
Tests FIRST in existing Tests/AbilityTests.cs, then minimal implementation. Each stage source-proven; when .NET/Unity present, actually run targeted and regression tests. If no toolchain, report authored but NOT_COMPILED. Preserve status DATA_ONLY until A60 independent acceptance; do not reclassify five abilities yourself.
Deliver feasible partial code rather than a plan-only memo; if a required unowned serialization or physics file blocks full correctness, STOP that portion, capture exact call stack and scope request.

OUTPUT
Only own branch, actual source/test diff and report docs/cc001/swarm/w4/A40/R17_W4_A40_LIFECYCLE_IMPLEMENTATION.md; include commands/exits, five status axes, SHA and HANDOFF on original Issue #92. No merge, force push, public build, or release.
