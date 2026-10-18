# CC-001 / Core Clash V149 Unity — R11 Source Candidate

R11 is a **source-only** continuation of the exact R10 source candidate (`b339d1b21a2d36aafd403d0f96eb8e036cf02c46b0e5fbf3d05add9a101199fb`). R10 and R11 are **NOT** compiled or runtime-tested in this environment. Preserve existing reference HTML, 36 canonical decks, 4 class-demo presets and all catalog statistics. No live publication.

- Full sources: `CoreClash-V149-R11-Source-Candidate.zip`.
- Changed files: `CoreClash-V149-R11-Overlay.zip` (paths relative to project root inside the `CoreClash-V149-Unity` directory).
- Patch: `CoreClash-V149-R11-Changes.patch` (apply from project root, after verifying the exact R10 baseline).
- Evidence/report: `CoreClash-V149-R11-Candidate-Report.md`; detailed in-project `docs/R11_CANDIDATE_REPORT_PL.md`.
- Tests: `dotnet run --project Tests/CoreClash.Tests.csproj -- .` from the project root, then data/network scripts, Unity compile + native smoke. No status upgrade until independent pass.

**Warning:** Do NOT replace user's live R9 workspace directly. Work on a disposable copy/branch of R10, and merge only after QA.
