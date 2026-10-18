# CC-001 / Core Clash V149 Unity — R15 handoff

**Candidate, not a verified build.** R15 is a narrow state/reliability increment on top of the entire R14 source candidate. It is **not** a new gameplay/spec version and does not alter the V148 HTML reference, the imported roster, any deck or featured membership, or public deployment.

## Changes

- `GameState.randomState` owns the nonzero xorshift32 stream, previously private to `AbilityResolver`. Wildcard/Collector/Necromancer now draw from state that survives network JSON snapshots and host-side state restoration. Seed is the unchanged `149`; the algorithm and random draw order have not been changed intentionally.
- `NetworkGameStateAdapter` verifies essential nested state, owner, geometry and RNG values before replacing the last valid snapshot or advancing its revision. It keeps the same protocol `149` and does not perform independent physics.
- Four runtime regression tests in `Tests/StabilityR15Tests.cs` cover random sequence, restoration, and corrupt snapshot rejection.
- `Tools/r15-static-audit.cjs` checks source contracts. `Tools/r15-qa.ps1` and `Tools/r15-qa.cjs` run the complete R14 test suite (including R15) in an **isolated copy**, not the canonical project. Outputs go under `G:\Mój dysk\ChatGPT\CoreClash\QA\R15` if Google Drive Desktop is available, otherwise next to the sources. Local folder presence is not proof of cloud sync.

## Acceptance on the user's Windows machine

```powershell
pwsh -NoProfile -File .\Tools\r15-qa.ps1
```

The runner requires Node, .NET 9 to execute managed tests, and optionally Unity for a Windows build. Inspect `r15-results.json`, `r14-results.json`, compiler logs, newly written gameplay evidence, and cloud upload state separately. A **STATIC_PASS_ONLY** or **BLOCKED_DOTNET** result is not certification.

After a clean managed pass, execute native Windows gameplay and cross-ability full matches, then WebGL/mobile and network smoke. Do not move the readiness registry from `37 UNITY_READY / 32 PARTIAL / 158 DATA_ONLY` until real runtime verification and explicit decision. No Replit publication or site synchronization is authorized by this handoff.

## Known limits

- Reproducible random draws from a restored GameState are improved; this does **not** mean full deterministic save/resume (contact caches and transport/session counters are not part of the serializable game state).
- This environment does not include .NET 9, PowerShell or Unity. C# test definitions have not been compiled or run here.
- R15 only rejects malformed snapshots; it does not provide authentication, host migration, latency compensation, or session resume.
