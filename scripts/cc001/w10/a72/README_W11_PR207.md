# CC-001 R17-W11 A72 — Frozen QA Windows Player build kit

**Authoritative A70 QA-freeze** `integration/cc001-r17-w11-qa-freeze-20261030` at **exact SHA** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. This ref is separate from moving draft PR #207. **RC1** `10f64e4d213f17a352ed8fa83bc75884a39549f0` remains unchanged. Owner rules: Mitosis exactly V148, Furnace FIRE+periodic damage only, HP R16. No gameplay edits.

**Status:** implemented tool changes; native Windows Unity/.NET and physical PC1–PC2 NOT_RUN from this Linux environment. A source static check is not a build.

## Windows 11 operator steps
Install Git for Windows (private-repo authentication), Node 22, .NET SDK **9**, Unity Editor **6000.4.0f1** + Windows x64 Build Support + license. Never share secrets.
Get A72 PR #188 branch `feat/cc001-r17-w10-a72-build-evidence` and preserve script filenames together. First run:
```powershell
node .\w11-source-readiness.cjs --self-test
node .\build-w10-rc1.cjs --self-test
node .\verify-w10-player.cjs --self-test
```
Run `URUCHOM_W11_PR207.cmd` (historical filename; NOW QA-FREEZE-PINNED), or:
```powershell
.\Start-W10-WindowsBuild.ps1 -IntegrationRef 'integration/cc001-r17-w11-qa-freeze-20261030' -CandidateSha '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3'
```
Builder checks strict ref SHA before detached checkout; protected BuildTools, Protocol149 and settings, frozen RC1 ancestry, original source bytes/EOL, six W11 static source contracts and forbidden diagnostics. It runs **.NET9 managed C# tests in a separate detached Git worktree**, storing original `logs/managed-dotnet9.log`, `managed-summary.json`, `managed-test-results.json`. Unity Windows Player build starts only after that suite reports passed>0, failed=0, exit=0.

Preserve original Unity editor/console logs, build report, compiler-response/defines, pre/post source snapshots, complete unflattened Player binary path/size/SHA256 manifest, `receipt.json` and generated `CC001_W11_A72_WINDOWS_EVIDENCE.zip` + `EVIDENCE_SHA256.txt` unchanged even on HOLD. Transfer privately to A60, not in public GitHub issue text. A60/A31 must independently check identical full binary on **two physical PCs**, P2 exact-once, turn/aim/deck, authoritative revisions/state parity, portal/teleport/swap visuals and smoothing. A72 builder cannot certify G3.

`GO_SOURCE_SHAPE_ONLY` = static; `PASS_BUILD_EVIDENCE_ONLY` = native binary build only; `PASS_BINARY_INTEGRITY_ONLY` = file identity only. **W11 closure/G3/G4 HOLD, W12 final integration HOLD, main/RC1 merge/release STOP**. Legacy `integration/cc001-r17-w11-multiplayer-qa-candidate-20261030` and `173273122c11cbf738e8b954e32506a6196fe8ec` are intentionally disallowed; older W10 launchers ALT_HOLD. Existing evidence schema remains W10-prefixed for A42 compatibility, candidateSHA and hashes must match W11.
