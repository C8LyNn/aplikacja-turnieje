# CC-001 — R17-W5 Stage 2 / A72 exact-SHA candidate policy unblock

**AGENT:** A72 — Build & CI  
**ISSUE:** [#113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113)  
**HQ NARROW AUTHORIZATION:** [#113 comment 6275616654](https://github.com/C8LyNn/aplikacja-turnieje/issues/113#issuecomment-6275616654)  
**GATE:** A72 SOURCE/POLICY BLOCKER RESOLVED; **G1 .NET9 MANAGED + CODEC HOLD / NOT_RUN**. No G2/G3/G4/RELEASE certification.

## Exact immutable inputs
- Own isolated branch: `feat/cc001-r17-w4-a72-managed-ci`
- Own START SHA: `ab6074f4903ba4958f5d749d7ae58e3c9512e242`
- Own PATCH commit: `b7bc56d82b1fae317267a1ebff83cd1ed539b8f7`
- Original candidate policy Git blob: `6fbcc751add54b1e10c652a5ea2d3995734d646a`
- Corrected candidate policy Git blob: `59d14bb7f761fdbdc71b9d814aa846c75fecaf2d`
- Original frozen R16: `de1fe4b88fce3bd08ef383165dc2cd622af2536b`
- A70 Stage 1: `ab624c2789b6efda015e742e8bd9bcbb86766735`
- A70 Stage 2 SOURCE commit: `e58ba23a9f20e7a0865668655bd1e819845474bc`
- A70 Stage 2 FINAL diagnostic SHA: `a67a37a0e4105dd680f52ae6728e93face61f4ce`
- A40 authoritative source: `bfa9bd4f86c60c7bd528a6d03581179e405be3aa`
- A50 authoritative source: `9b84a730b39d4033fcd283e2f555774138312ea2`

## Only implementation change

File `scripts/cc001/w4/a72/policy.cjs`:

```diff
 const CANDIDATE_SOURCE = new Set([
   'Assets/CoreClash/Core/LifecycleEffects.cs', 'Assets/CoreClash/Core/GameState.cs',
+  'Assets/CoreClash/Core/GameSimulation.cs',
   'Assets/CoreClash/Core/AbilityResolver.cs', 'Assets/CoreClash/Core/TurnSystem.cs',
```

Verified GitHub compare start → patch commit: exactly **one modified file, +1 line, 0 deletions**. The new entry is **candidate-only**: `baseline` and pinned `w3-*` modes and hashes are unchanged. No new CI workflow, main branch edit, source/content/migration change, bypass or release operation.

## ACTUAL TESTS EXECUTED (readback + V8; not managed C#)

Fetched committed `policy.cjs` back from GitHub by exact patch SHA. Parsed it with `new Function` as an in-memory V8 syntax check (PASS), then invoked its **actual exported functions** on direct GitHub exact-SHA compare output:

| Check | Observed | Expected | Result |
|---|---|---|---|
| Stage 1 frozen→`ab624c...` 36 paths / 5 Unity C# | ACCEPT | ACCEPT | PASS |
| Stage 2 frozen→`a67a37...` 45 paths / 13 Unity C# | ACCEPT | ACCEPT | PASS |
| Frozen baseline with zero changed paths | ACCEPT | ACCEPT | PASS |
| Exact 40-lowercase-hex Stage 2 SHA selection | ACCEPT | ACCEPT | PASS |
| Invalid candidate SHA | REJECT | REJECT | PASS |
| Inject `Tests/Program.cs` | REJECT | REJECT | PASS |
| Inject `Assets/CoreClash/Networking/NgoWireProtocol.cs` | REJECT | REJECT | PASS |
| Inject `Assets/Resources/Data/catalog.json` | REJECT | REJECT | PASS |
| Inject `Assets/CoreClash/Networking/NetworkGameSession.cs` | REJECT | REJECT | PASS |
| Inject `Assets/CoreClash/Core/Extra.cs` | REJECT | REJECT | PASS |
| Inject protected V148 reference | REJECT | REJECT | PASS |
| Inject tournament/server file | REJECT | REJECT | PASS |
| Inject path traversal `../other` | REJECT | REJECT | PASS |
| Existing `policy.selfTest()` | 16 PASS / 0 FAIL | 16 PASS / 0 FAIL | PASS |

Also verified the PRE-PATCH policy rejected actual Stage 2 because of missing `GameSimulation.cs` (negative reproduction), and the POST-PATCH policy accepts Stage 2 without accepting any of the above non-authorized paths. In-memory function checks have no shell exit code. No `node managed-ci.cjs` end-to-end run is claimed.

### Actual local OS process/toolchain probes

Local probe recorded at `/mnt/data/cc001_a72_w5_g1/toolchain_probe.log`, **SHA-256 `b187de13b0a7136f0a7d5e8aa8d9860a4bc775957f3827cbeea030fa4ca33098`**.

| Actual command | Observed | Exit code |
|---|---|---:|
| `node --version` | v22.16.0 | 0 |
| `dotnet --list-sdks` | dotnet: command not found | 127 |
| `dotnet --info` | dotnet: command not found | 127 |
| `git --version` | 2.47.3 | 0 |
| `timeout 8 git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` | DNS: could not resolve github.com | 128 |

Actual GitHub Actions for Stage 2 exact SHA: **0 observed runs**. Manual CI workflow not registered on default `main` (prior 404); this authorization explicitly prohibits registering it. No usable .NET SDK 9 or full repository worktree in shell, so **G1 managed (including Stage 2 A40/A50 + W3 changes) and codec 13: NOT_RUN**. Unity native/build/device G2/G3 and A60 candidate G4: NOT_RUN.

### Historical H-01 guard

A74 finding **H-01** remains valid. W2 A51 snapshot preflight pins frozen R16 `Tests/StabilityR16Tests.cs`, whereas Stage 1/2 deliberately contains its modified W3 A51 test blob. **No frozen W2 hashes were changed or skipped, no historical mismatch was called a gameplay PASS.** The Stage 2 current runner's own candidate validation is separate from any historical W2 hash oracle.

## Five-axis disposition & next handoff

- **DESIGNED:** YES; scoped fix only.
- **IMPLEMENTED:** YES, one permitted policy line in owned branch.
- **TESTED:** YES for GitHub source readback, V8 syntax/pure policy positive-negative checks. **.NET9+codec NOT_RUN**.
- **INTEGRATED:** NO by A72; isolated CI branch only. A70 Stage 2 is dev/diagnostic, not a production merge.
- **RELEASED:** NO.
- **STATE:** **POLICY CORRECTION PASS / G1 HOLD**.

**NEXT:** HQ/A00 provides a *usable disposable full checkout*, Node 22 and .NET SDK 9, then run the already existing `scripts/cc001/w4/a72/managed-ci.cjs --target=candidate --candidate-sha=a67a37a0e4105dd680f52ae6728e93face61f4ce --out=/tmp/cc001-a72-stage2-evidence` from the verified A72 runner branch. Preserve exact stage exit codes, fresh Evidence JSON, log SHA-256 and `results.json`, then submit to A60 independent G1 review. The old fixed W3 A50 intentionally-RED snapshot must not be relabeled green.

**FORBIDDEN/NOT DONE:** any default `main` workflow registration, public/live deploy, protected R16/V148/Protocol149 modification, force push, A40/A50 gameplay edits, arbitrary path acceptance, false G1 PASS.
