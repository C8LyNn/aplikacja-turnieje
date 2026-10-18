# Core Clash V149 Unity — R12 Source Candidate

Source-only extension of **exact R11 source candidate**, which also includes uncompiled R10. **NOT BUILT / NOT TESTED IN UNITY / NO PUBLIC DEPLOYMENT**.

- R11 baseline SHA256: `c59e075956d0f8d14cea1919d85b9498b19e71c6a295a7930103ad668cf32792`.
- R12 report: `docs/R12_CANDIDATE_REPORT_PL.md`.
- New mechanics: Hatchery, Replicator, Mitosis ball contacts, Swarm Core, Conscriptor.
- New tests: `Tests/EvolutionTests.cs`, registered in `Tests/Program.cs`.
- Existing catalog, archetypes, 36 canonical decks, four demo decks and reference HTML are **unchanged**.
- AbilitySupport and R9 evidence are intentionally unchanged until real C#/Unity QA. Do not claim `UNITY_READY`.
- Run from project root after extracting to a disposable Windows checkout: `node Tools/verify-data.cjs`, `dotnet run --project Tests/CoreClash.Tests.csproj -- .`, `node Tools/network-codec-test.cjs`.
- Do not deploy or overwrite the author's local project without explicit authorization.
