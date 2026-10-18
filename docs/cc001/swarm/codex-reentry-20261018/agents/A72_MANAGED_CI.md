> **WAŻNE — IDENTITY LOCK / WERSJA POPRAWIONA**
> Ten starszy plik zawiera szczegółowy opis techniczny, ale NIE JEST punktami wejścia. Najpierw otwórz **[ROLE_LOCK_A72.md](../ROLE_LOCK_A72.md)**.
> **TEN AGENT = A72 | ISSUE #113 | GATE READY NOW.** Nie jesteś A10. Nie zgaduj numeru agenta z pozostałych dokumentów.
> Pierwszy wiersz odpowiedzi: `IDENTITY_OK | CC-001 | A72 | ISSUE #113 | READY NOW`.
> Gdy historia sesji jednoznacznie wskazuje innego agenta, wstrzymaj zapis i zgłoś `IDENTITY_CONFLICT`.

# CODEX TASK — A72 / Real .NET9 managed & codec CI
PROJECT: CC-001 — Core Clash Unity; WAVE: R17-W4 recovery
ISSUE: https://github.com/C8LyNn/aplikacja-turnieje/issues/113 (EXISTING, NOT A DUPLICATE)
ROLE: A72 — Build & CI
OWN BRANCH: feat/cc001-r17-w4-a72-managed-ci
SNAPSHOT HEAD: 661660d3a3dc8a4fa2c9afea489050247f64c38c
READY NOW for scoped CI implementation, even before G0. Runtime tests may remain NOT_RUN if toolchain unavailable.

Read W4 MASTER DISPATCH, 02_VERIFIED_STATE_AND_GATES.md, 04_HANDOFF_AND_TEST_EVIDENCE.md and A72 prior handoff at c49ef5855eed7eb5aef5534f5cc8334fe1585463. That predecessor delivered 32/32 STATIC checks, not new .NET/Unity runtime PASS.
Work ONLY on:
- .github/workflows/cc001-r17-managed.yml
- scripts/cc001/w4/a72/**
- docs/cc001/swarm/w4/A72/**
No Unity/C# gameplay or existing tournament workflows touched.

MISSION
Build an OPT-IN narrow CI/runbook for pinned exact candidate/agent refs using .NET SDK 9, isolated checkout and no mutation of frozen source. Confirm existing managed project Tests/CoreClash.Tests.csproj entry point and codec tests: verify true commands and suite count at source, do not invent them. Add appropriate positive + negative controls and exit-fail behavior, artifact log capture with exact commit SHA, and repository/branch/path filters that cannot run unrelated tournament CI or leak secrets. Prefer workflow_dispatch/manual opt-in until reviewed, no releases/deploys.
Run managed baseline, W3 tests and codec suite only if the full matching source is in disposable checkout; W3 tests are on separate unintegrated branches and must not be falsely claimed present on A72's own branch. A50 W3 RED fixtures are intentional until W4 production repair; never hide failures.
If runner cannot execute due to unavailable dotnet/Unity/checkout, publish implementation and exact NOT_RUN evidence; do not claim completed G1. Unity Editor and physical tests are NOT implicitly covered by managed CI.

OUTPUT
Publish practical CI script/workflow plus docs/cc001/swarm/w4/A72/R17_W4_A72_MANAGED_CI_HANDOFF.md, source/runtime exits, exact new SHA, changed paths, five status axes, final handoff to Issue #113. No main merge/force push/public deploy.
