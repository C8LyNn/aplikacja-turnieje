# CC-001 R17-W4 — ROLE-LOCKED AGENT ROUTING

**KRYTYCZNE:** To jest mapa, NIE uniwersalny prompt do wykonania. Zawsze wklej konkretny `ROLE_LOCK_<ID>.md`, a nie opis zbiorowy. Obecna fala R17-W4 nie jest zamknięta i nie tworzymy W5.

| **A60-G0** | Independent QA G0 | [Issue #126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126) | [ROLE_LOCK_A60-G0.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A60-G0.md) | READY NOW |
| **A73** | Git Integration | [Issue #136](https://github.com/C8LyNn/aplikacja-turnieje/issues/136) | [ROLE_LOCK_A73.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A73.md) | READY NOW |
| **A72** | Build & CI | [Issue #113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113) | [ROLE_LOCK_A72.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A72.md) | READY NOW |
| **A40** | Unity Gameplay | [Issue #92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92) | [ROLE_LOCK_A40.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A40.md) | READY NOW |
| **A50** | Simulation / F02 | [Issue #138](https://github.com/C8LyNn/aplikacja-turnieje/issues/138) | [ROLE_LOCK_A50.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A50.md) | READY NOW |
| **A70** | Integration / Release | [Issue #137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137) | [ROLE_LOCK_A70.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A70.md) | WAIT |
| **A71** | Source Integrity | [Issue #140](https://github.com/C8LyNn/aplikacja-turnieje/issues/140) | [ROLE_LOCK_A71.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A71.md) | WAIT |
| **A74** | Repository Hygiene | [Issue #141](https://github.com/C8LyNn/aplikacja-turnieje/issues/141) | [ROLE_LOCK_A74.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A74.md) | WAIT |
| **A20** | UX/UI & Game Feel | [Issue #95](https://github.com/C8LyNn/aplikacja-turnieje/issues/95) | [ROLE_LOCK_A20.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A20.md) | WAIT |
| **A31** | Networking | [Issue #94](https://github.com/C8LyNn/aplikacja-turnieje/issues/94) | [ROLE_LOCK_A31.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A31.md) | WAIT |
| **A60-CANDIDATE** | Independent Candidate QA | [Issue #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139) | [ROLE_LOCK_A60-CANDIDATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A60-CANDIDATE.md) | WAIT |

## Jak sprawdzić ID
W pierwszym wierszu agent musi przedstawić format:
`IDENTITY_OK | CC-001 | <ID Z KOLUMNY 1> | ISSUE #<NUMER Z KOLUMNY 3> | <DOKŁADNY GATE Z ROLE_LOCK>`

Dla pierwszego wątku QA: `IDENTITY_OK | CC-001 | A60-G0 | ISSUE #126 | READY NOW`.
`A10` zamiast `A60-G0` to FAIL — bez wykonania plikowych modyfikacji.

A60-G0 i A60-CANDIDATE są dwiema fazami TEGO SAMEGO agenta, ale odrębnymi Issue, gałęziami i bramkami. Tylko A60-G0 ma READY.

## Bezpieczna izolacja prac
A60-G0 — tylko source QA docs/cc001/swarm/w3/A60/**.
A73 — tylko docs/cc001/swarm/w4/A73/**.
A72 — tylko .github/workflows/cc001-r17-managed.yml + scripts/cc001/w4/a72/** + docs/cc001/swarm/w4/A72/**.
A40 — tylko pięć Unity lifecycle plików z dispatchu + docs/w4/A40/**.
A50 — tylko ElementalEffects.cs + CollisionResolver.cs (WYŁĄCZNE) + ElementalTests.cs + docs/w4/A50/**.
A70/A71/A74/A20/A31/A60-CANDIDATE — WAIT, zgodnie ze swoją unikalną kartą roli.
A10, A41 i A51 nie mają nowych samodzielnych aktywnych zadań W4 w tej paczce. Kontekst/historyczne raporty A10 nie nadają agentowi tożsamości A10.

Wszystkie gałęzie istnieją; przed działaniem pobierz na żywo aktualny commit HEAD. Brak merge/main/deploy, żadnych fałszywych PASS.
