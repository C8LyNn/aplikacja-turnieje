# CC-001 R17-W10 / A72 — guarded Windows build & QA handoff

**Owner** A72 Build & CI, Issue #113, HQ #97. **Protected baseline** RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, Frozen Stage2 `a67a37a0e4105dd680f52ae6728e93face61f4ce`. No game/physics/network/UI, R16, V148, Protocol149, Unity manifests, main or release changes in this PR.

## Implementation

This PR adds the **version-controlled independent complete Player distribution verifier** `verify-w10-player.cjs`, with 12 deterministic self-test cases. The **full one-shot Unity 6000.4.0f1 Windows builder, PowerShell launcher, and source integrity oracle** are NOW also committed byte-for-byte under `scripts/cc001/w10/a72/` on this **isolated A72 draft branch**. The identical four-file operator ZIP is supplied for Windows 11. This does NOT mean the PR was merged, the game built, or A70/A60 accepted a W10 candidate.

**Operator kit exact name:** `CC001_R17_W10_A72_WINDOWS_BUILD_OPERATOR_KIT.zip`; bytes **13,291**, SHA256 **`BC723EDDC9112D88FA7E242BC12BC1E75F27038D0640D0468500B1B7F7861DFA`**. Four ZIP members verified 4/4 CRC + original bytes:
- `build-w10-rc1.cjs` (17,803 bytes, SHA256 `8C8D528C5787332A078F424B8CE30F3805252A15E576710CAE3FDCDB04D042DD`);
- `verify-w10-player.cjs` (5,022 bytes, SHA256 `E54BB0D54490E1106EF677CDDAF534577B28E90C7B82E10BA041D6791649A8A9`), stand-alone counterpart of PR verifier;
- `Start-W10-WindowsBuild.ps1` (3,264 bytes, SHA256 `13D909C32FF7137BAE0338C8B11687E49F64EDFE09E9E2E96EAB32FC691E031D`);
- `README.md` (4,763 bytes, SHA256 `FB626518B7D8EDF0E3709286DDC133094F66D9FCF7743229254A642233CD184E`).

## Admission / no arbitrary branch build

**A70 must FIRST publish one integration ref** matching `integration/cc001-r17-w10-...` and exact 40-hex SHA after selecting compatible implementation(s). It has not yet been given to A72. The operator kit rejects RC1 itself, random feature refs, moved branch refs, non-descendants of RC1, modified Protocol149/ProjectSettings/BuildTools/.gitattributes/Packages manifest, missing Windows Unity toolchain, binary source mutation and any diagnostic define. It checks historical tracked CRLF/LF byte evidence, records every source Git blob SHA1/SHA256 and worktree SHA256 before and after, captures exact Unity exit and BuildPipeline result, generated C# compiler response files, and ORIGINAL full unflattened WindowsPlayer SHA256 inventory + logs. When Unity changes tracked source bytes, preserve full original evidence with status HOLD rather than pretend success or reset. It does not merge, release or run PC1/PC2 automatically.

## Physical QA and runtime restriction

To execute after A70 selects an exact candidate, extract ZIP on Windows 11 (Git for Windows/private repo auth, Node22, Unity Hub 6000.4.0f1 with Windows support) and run in PowerShell:

```powershell
.\Start-W10-WindowsBuild.ps1 -IntegrationRef 'integration/cc001-r17-w10-SELECTED' -CandidateSha 'EXACT_NEW_40_CHAR_SHA'
```

The command runs **one** detached-copy Unity Windows BuildTools build and produces `CC001_W10_A72_WINDOWS_EVIDENCE.zip` plus a SHA256 receipt in a fresh Downloads folder. Submit *original raw* artifacts privately to independent A60; no reuse of R8 DLL/EXE pins for W10. After A60 approves, copy ENTIRE same WindowsPlayer to PC1 and PC2, and on EACH PC run the source-verifier under Node22 with its original manifest and the SAME candidate SHA:

```powershell
node .\verify-w10-player.cjs --manifest=C:\PATH\evidence\summary.json --player=C:\PATH\WindowsPlayer --sha=EXACT_NEW_40_CHAR_SHA
```

**`PASS_BINARY_INTEGRITY_ONLY` is not successful synchronization**. Real PC1/PC2 accepted intent, position parity, smoothness, local turn identification, P2 perspective/aim arrow and approved strength UI must be independently verified by A60 on original build and logs/screens; A70 alone selects code. This verifier rejects missing, unexpected, tampered, duplicate, symlinked files, mismatched candidates and HOLD build manifest. It never starts Unity or the game, edits files, or forwards ports.

## Actual executed and pending tests

**Actually executed locally:** builder Node22 selftest **19/19 PASS**, stand-alone distribution verifier selftest **12/12 PASS**, syntax checks `node --check` PASS, Linux negative 'do not build on non-Windows host' STOP exit 2 as designed, operator ZIP CRC/round-trip 4/4 PASS. **GitHub checked-in verifier** independently re-read and syntax-verified by A72; no native Windows parser or Unity compile completed in this turn.

**NOT_RUN:** Unity Windows build at any NEW W10 SHA (none selected), new Player EXE/DLL evidence, two physical Windows PC QA, merged integration branch, approval of power UI. **GATE:** `A72_BUILD_KIT_READY` / `W10_CANDIDATE_SHA=WAIT_A70` / `WINDOWS_NEW_BUILD=NOT_RUN` / `A60_QA=WAIT` / `G3/G4=HOLD`, main merge/release/deployment STOP.

Prior accepted R4/W6 tests (361 managed/13 codec + 182-file RC1 Player) are historical source-scoped evidence, not a PASS for new W10 binaries or gameplay. Do not repeat them without a specific integration-change reason and A60 decision.
