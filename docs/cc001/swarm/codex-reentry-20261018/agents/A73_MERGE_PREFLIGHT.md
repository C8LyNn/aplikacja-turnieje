> **WAŻNE — IDENTITY LOCK / WERSJA POPRAWIONA**
> Ten starszy plik zawiera szczegółowy opis techniczny, ale NIE JEST punktami wejścia. Najpierw otwórz **[ROLE_LOCK_A73.md](../ROLE_LOCK_A73.md)**.
> **TEN AGENT = A73 | ISSUE #136 | GATE READY NOW.** Nie jesteś A10. Nie zgaduj numeru agenta z pozostałych dokumentów.
> Pierwszy wiersz odpowiedzi: `IDENTITY_OK | CC-001 | A73 | ISSUE #136 | READY NOW`.
> Gdy historia sesji jednoznacznie wskazuje innego agenta, wstrzymaj zapis i zgłoś `IDENTITY_CONFLICT`.

# CODEX TASK — A73 / Exact W3 branch + conflict preflight
PROJECT: CC-001 — Core Clash Unity; WAVE: R17-W4 recovery
ISSUE: https://github.com/C8LyNn/aplikacja-turnieje/issues/136
ROLE: A73 — Git Integration
OWN BRANCH: feat/cc001-r17-w4-a73-merge-preview
SNAPSHOT HEAD: 661660d3a3dc8a4fa2c9afea489050247f64c38c
MODE: READ-ONLY INTEGRATION ANALYSIS — DO NOT RUN AN ACTUAL MERGE
READY NOW. This task must NOT wait for A60 G0 to plan integration.

Read W4 MASTER DISPATCH, 02_VERIFIED_STATE_AND_GATES.md, 04_HANDOFF_AND_TEST_EVIDENCE.md, and prior A73 W3 report in Issue #127. Refetch all heads before comparison. Exclusive new file ownership docs/cc001/swarm/w4/A73/** only. Do not touch source/gameplay branches.

INPUT HEADS TO REVERIFY, NOT TRUST BLINDLY
A70 certified frozen de1fe4b88fce3bd08ef383165dc2cd622af2536b;
W4 common dispatch 661660d3a3dc8a4fa2c9afea489050247f64c38c.
W3 A10 05eb15293dad4d61271e7c200ce661f1080f5288;
A20 1f87595a9d73de30179e5158a5848eae3b965885;
A41 8eb0b2517c049c95fc2257d73f0139d7bc17fd2c;
A50 4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5;
A51 92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5;
prior A73 7d57f92aea3660aa1b2183e937e357b409e8c19d.
W1/W2 ancestry MUST be checked: A50 and A51 share W1 history; W2 branches inherit HQ docs; never double cherry-pick common commits. A10 #98 still an open design PR at prior inspection. V148 F01 source truth: structures HP5, not HP2.

MISSION
Produce an actual current AFTER-W3 path/ancestry matrix, exact allowed-file intersections, cherry-pick/merge-order proposal, gate dependency graph and conflicts. When git tooling is available, perform a NON-DESTRUCTIVE three-way conflict preview (e.g. merge-tree) against a disposable object/checkout WITHOUT moving any shared refs; clearly report if NOT_RUN.
Mark W3 A50 RED (unexecuted) test additions as not production-ready. Candidate A70 #137 is documentation-only until G0 PASS + this map. Identify which independent W3 doc/test/source deltas can be accepted first; source integration must remain GATED. Give commands and no hidden branch changes.

OUTPUT
Publish docs/cc001/swarm/w4/A73/R17_W4_A73_POST_W3_DELTA_CONFLICT_REPORT.md on own branch. Include exact source heads, changed paths, compare outputs, conflict classification, tested vs not tested, candidate sequencing, exact commit, Issue #136 HANDOFF. No merge/rebase, no PR retarget, no main/site/deploy operation.
