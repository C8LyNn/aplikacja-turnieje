# CC-001 / Core Clash V149 Unity — R14 Integration & Gameplay Validation

**Status:** source/QA candidate; no Unity, .NET or networking runtime certified in this package. 2026-10-17.

**Strict baseline:** `CoreClash-V149-R13-Source-Candidate.zip`. R10–R13 source modifications were preserved; R14 adds independent tests and safe QA tooling only. No release, remote changes or change of balance.

## Current result (Linux analysis session)

- Static source audit: **7/7 PASS**. It checks the immutable V148 reference hash, roster/deck cardinalities, expected handlers and wiring, state fields, registration of integration tests, and the original 37/32/158 support status.
- Source data check: `node Tools/verify-data.cjs` **PASS**, with exactly 227 records, 224 specials, 12 archetypes, 36 canonical decks and 4 provisional showcases.
- Fail-first demonstration: a deliberate deletion from `catalog.json` **in an isolated throwaway workspace only** was rejected by the static audit (exit 1). The packaged source was not modified by the test.
- `.NET 9`: **BLOCKED** (`dotnet` not installed); network codec: **SKIPPED_DEPENDENCY**, not a gameplay failure.
- Unity Windows/WebGL/Android: **NOT RUN**. LAN/Relay/WebGL/mobile: **NOT RUN**.
- Historical `Evidence/unity-tests.json`, `Evidence/ability-support.json`, `Evidence/network-codec-tests.json` and the V148 HTML retain their SHA256 bytes. Test runners execute against an isolated **copy**, so new runtime reports cannot overwrite historical evidence.

## New cross-wave C# regression tests (written, not executed)

1. **Construction + Repair Pulse:** Wallmaker creates three segments; damaged segment is repaired by Repair Pulse, no unexpected new structure.
2. **Quartermaster + Commander:** generated Standard remains an allied ball and receives the Commander shield on the next own turn; stock remains managed by original command path.
3. **Replicator + Firebrand:** cloned R12 ball can be ignited by an enemy R13 ability while ownership remains unchanged; original outside range is unaffected.
4. **Structures + Hatchery + Furnace + network:** structure list, ball list and Furnace field round-trip through the existing authoritative state adapter.

The tests are registered in `Tests/Program.cs`. No claim is made that they compile or pass without .NET.

## Safe execution on Windows

Extract the *full* R14 ZIP to a fresh directory. Keep `Reference` beside `CoreClash-V149-Unity`.

From `CoreClash-V149-Unity` in PowerShell 7:

```powershell
pwsh -NoProfile -File .\Tools\r14-qa.ps1
```

Optional fast, **static-only** check:

```powershell
node .\Tools\r14-qa.cjs --static-only
```

Optional explicit destination (in the Windows `r14-qa.ps1` runner):

```powershell
pwsh -NoProfile -File .\Tools\r14-qa.ps1 -OutputRoot 'G:\Mój dysk\ChatGPT\CoreClash\QA\R14'
```

Optional Windows Unity build (Unity 6000.4.0f1 + Windows module required):

```powershell
pwsh -NoProfile -File .\Tools\r14-qa.ps1 -BuildWindows
```

The runner makes a fresh copy in its run directory and executes tests there. Default output is `G:\Mój dysk\ChatGPT\CoreClash\QA\R14` **only when** `G:\Mój dysk\ChatGPT` exists; otherwise it uses sibling `CoreClash-R14-QA-Reports` outside the source tree. Saving under a synchronized local folder does not prove actual cloud upload. `r14-results.json` shows PASS / FAIL / BLOCKED / SKIPPED_DEPENDENCY separately and hashes the original evidence before/after. The audit must be treated as unsuccessful if any required stage is blocked.

Do not use the legacy `r13-qa.ps1` when historical Evidence must be immutable: it directly runs legacy tests against the original tree and may overwrite baseline evidence. R14 resolves this by isolation.

## Release gates before promoting R10–R13

- Clean managed test run, including all preexisting test cases and R14 integration tests; zero failures.
- Independent full simulated legal matches in which at least one R10, R11, R12 and R13 ability has a visible outcome. Record turns, shots, team ownership, match end reason and motion guards; no disguised fixture as organic play.
- Native Windows build and smoke, then matched WebGL/Android builds; separate real-device touch/layout testing.
- Network seat validation, stale/duplicate command rejection, authoritative field snapshots. Relay between two genuinely separate hosts/networks is a separate acceptance step.
- Resolve documented Frostguard anchor parity and large-chain guard behavior; do not silently change balance.
- Only after those steps consider updating `AbilitySupport.cs` classifications and producing a signed, verified release manifest. User approval is required for web/Replit publishing.
