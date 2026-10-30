# CC-001 R17-W11 — A72 exact PR #207 Windows 11 build kit

**Authority:** HQ Issue #97 and A70 Draft PR #207. **A72:** Build & CI; **A60:** independent two-PC QA; **A70:** source integration. This kit does **not** merge or publish the game.

## Frozen pin

- **Ref:** `integration/cc001-r17-w11-multiplayer-qa-candidate-20261030`
- **Exact commit:** `173273122c11cbf738e8b954e32506a6196fe8ec` (A70 PR #207)
- **Frozen RC1 base:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`
- **Unity:** Editor `6000.4.0f1`, Windows x64 Build Support, working license.

The Node builder **and** PowerShell launcher both demand the exact approved ref/SHA. A moving ref or mismatched SHA aborts before Unity. This ZIP contains no pre-built executable; native build has not been performed by A72 in Linux.

## Windows operator steps

1. On **Windows 11** install Git for Windows (private repo access via Git Credential Manager), **Node 22**, Unity Hub Editor **6000.4.0f1 with Windows Build Support**. Verify normal Unity licensing. Do not publish passwords or `.git-credentials` in issue comments.
2. Extract the ZIP to a **fresh folder** outside the game repository and **double-click `URUCHOM_W11_PR207.cmd`**. Alternatively open Windows PowerShell in that folder and run:

   ```powershell
   .\Start-W10-WindowsBuild.ps1 -IntegrationRef 'integration/cc001-r17-w11-multiplayer-qa-candidate-20261030' -CandidateSha '173273122c11cbf738e8b954e32506a6196fe8ec'
   ```

   PowerShell startup execution-policy bypass applies **only to the launched process**, no machine policy/administrator changes.
3. The launcher runs only local Node tests, then checks a disposable authenticated Git checkout for exact SHA/ref/RC1 ancestry, protected Protocol149 and settings, before/after Git source byte fidelity and strict historical EOL policy, **six source gates including revision monotonicity**, W7 debug defines, and one Unity Windows BuildTools invocation. It does not merge, reset or clean the protected branches.
4. Find the original evidence directory in `%USERPROFILE%\Downloads\CC001_W11_A72_*`. Preserve **`CC001_W11_A72_WINDOWS_EVIDENCE.zip`** and **`EVIDENCE_SHA256.txt`** **unchanged** even on HOLD. Capture original Unity editor/console logs, source SHA manifests, complete WindowsPlayer contents and manifest, compiler response files and original exit/BuildPipeline status. `PASS_BUILD_EVIDENCE_ONLY` is **not** independent QA and not proof of multiplayer smoothness.
5. Submit private raw artifact + receipt to A60 and notify HQ #97 with only sanitized status and SHA256. The Windows Player folder is inside ZIP under `WindowsPlayer/`. Once A60 attests build integrity, copy the **entire same** folder to both PC1 and PC2, separately verify each installed copy with `verify-w10-player.cjs` using extracted `summary.json` and the exact SHA, then A60 performs real native LAN paired tests.

## QA contract

A60 checks P2 accepted intent once, client authoritative snapshot revision/action/ball state convergence, no sustained queue buildup, legitimate PORTAL one-shot snap vs stutter, owner-relative turn/aim, own-bottom inverse pointer mapping, proper local deck, both strength bars absent. A70's changes must not alter V148 Mitosis, Furnace beyond FIRE zone + periodic damage, or R16 HP; **no release** without owner/HQ gates.

## Gates and compatibility

- `node w11-source-readiness.cjs --self-test` tests structural prebuild admission, not C# execution.
- `node build-w10-rc1.cjs --self-test` tests builder fail-closed invariants.
- `node verify-w10-player.cjs --self-test` tests byte-manifest verifier (new actual Player must be built first).
- Binary distribution verifier returns `PASS_BINARY_INTEGRITY_ONLY`; original path/size/SHA against builder `summary.json` must match across PC1 and PC2. G3 remains on hold until independent A60 native testing.
- **Never** use the superseded W10 3d377... operator kit or historical RC1 R4 Windows Player as a W11 build.
