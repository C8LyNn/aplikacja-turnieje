# CC-001 — R17-W11 — A60 independent QA source-admission handoff

**Identity:** A60, independent QA; NOT A70 integrator or A72 Windows build owner.  
**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97  
**A60:** https://github.com/C8LyNn/aplikacja-turnieje/issues/139  
**A60 own draft PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/162  
**Target candidate:** [A30 W10 corrective PR #189](https://github.com/C8LyNn/aplikacja-turnieje/pull/189), exact **`3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`**.  
**Parent A70 official stage:** PR #181 exact **`3d377767e72473cebd90e49293a0cd5dada70464`**; PR189 ahead2/behind0 with exactly **18 changed paths**, still DRAFT, not accepted by A70.  
**Protected RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (do not alter); frozen Stage2 `a67a37a0e4105dd680f52ae6728e93face61f4ce`; R16/V148/Protocol149 protected.

## Actual deliverable: executable exact-source fail-closed regression gate

`unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w11-candidate-contract.cjs`.

```sh
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w11-candidate-contract.cjs --self-test
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w11-candidate-contract.cjs <REPO_CHECKOUT_ROOT> 3a6fb11f70cbdd354ca319b6c48e5c080a1ae193
```

- CLI refuses an unknown or moved checkout SHA by running `git rev-parse HEAD` in the supplied checkout. It inspects all **17** mandatory original files and checks for competing `Physics/RemoteBallPoseSmoother.cs`; exit **0** = 16 source-gates PASS, **1** = source regression, **2** = wrong checkout SHA, **64** = malformed/inaccessible input. **Exit 0 means source-structure-only PASS, never native Windows/PC1-PC2 PASS.**
- **Independently executed in V8 against actual GitHub file contents pinned to exact PR189 SHA:** **16/16 source predicates PASS**. No reference to claims made in PR description used as substitute for source bytes.
- **Independently executed 9 synthetic negative mutations on those actual read-only source strings**, all 9 were correctly rejected: incompatible fixed cadence; unwired remote smoother; missing PORTAL snap; wrong local seat; restored strength bar; wrong P2 X reflection; missing managed test registration; changed protocol149; stale ACK admission.
- Executed **6/6 independent control self-test assertions** from exact script in V8. NOTE: source was evaluated with JS `new Function`/injected assertion harness; this is genuine JavaScript code execution but **not** a claim that Node CLI ran in this turn on a full repo checkout.
- The original first attempt contained two **tooling false positives** (test project uses `<Compile Include="*.cs" />`, and `NetworkSnapshotTrace.Due` is invoked by NGO, not the utility class). Corrected in **A60-owned source**, then 16/16 independent rerun PASS; no gameplay modification. Added strict SessionSnapshot class protocol guard after a negative mutation found a weak overly-broad matcher. This script is therefore actively exercised, not a text-only review.

## Exact selected implementation, scoped source QA

| Gate | A60 result | Actual checks |
|---|---|---|
| `W11_PROTOCOL149_AUTHORITY` | **PASS_SOURCE** | SessionSnapshot protocol149, owner gate, seat ownership |
| `W11_ONE_NETWORK_POLICY` | **PASS_SOURCE** | A41 adaptive 20/12/8/4Hz by compressed size; rejects fixed A30 cadence |
| `W11_STALE_ACK` | **PASS_SOURCE** | A41 `NetworkIntentReceipt` guards pending sequence |
| `W11_ONE_VISUAL_SMOOTHER` | **PASS_SOURCE** | A34 `RemoteBallSmoother` in client `ReceiveNetworkState` and board draw; no A50 smoother in reviewed tree |
| `W11_PORTAL_ONE_SHOT` | **PASS_SOURCE** | fresh event id `PORTAL` triggers direct visual snap for that ball |
| `W11_P2_TURN_DECK_VIEW` | **PASS_SOURCE** | owner-relative action hints; fail-closed local deck; P2 Y inversion and X canonical; inverse pointer |
| `W11_NO_POWER_BAR` | **PASS_SOURCE** | no old `lastPower` or aftershot strip; A10 arrow-only `AimGuide.Trace` and `AimStroke` retained |
| `W11_CSHARP_TEST_WIRING` | **PASS_SOURCE** | `Tests/*.cs` included by csproj, new `RemoteBallSmootherTests` and `LocalDeckContentTests` called by runner |
| `W11_NEW_UNITY_META` | **PASS_SCOPED** | both new .cs.meta GUID formats & pairwise distinct (full project GUID uniqueness still A71) |
| `W11_WINDOWS_X64_BUILD` | **NOT_RUN** | A72 operator kit is **not** a Windows build or binary artifact |
| `W11_MANAGED_DOTNET9` | **NOT_RUN** | no C# compiler/SDK in A60 runtime; definitions are not executed tests |
| `W11_REAL_PC1_PC2` | **HOLD** | no matched physical host/client original logs, same candidate binary hashes, frames or visual proofs |

**Evidence warning:** NGO 1Hz sampled trace logs alone do not prove frame-by-frame authoritative position parity, lost-packet rates, or smooth client render. A60 W9 paired-trace tool also needs original on-device observations, not fabricated values. No current test proves correction of original PC2 teleports, network backlog or cross-PC turn/aim interaction.

## Conflict-selection status to A70

- **PR #189 is a conditional QA source candidate, not yet an A70-accepted integrated SHA.** Its GitHub base is A70 #181 and its code preserves exactly one network policy/smoother; `PR #189 COMPATIBILITY=PASS_SOURCE_SCOPED` only.
- **A41 adaptive policy selected inside #189; A30 fixed 20Hz is ALT_HOLD for this candidate.** A34 wired smoother selected inside #189; A50 PR #169 is previously closed unmerged / SUPERSEDED per its owner, and must not also be imported.
- A70 must explicitly admit/freeze exact final composite SHA before A72 launches the one-shot Windows builder; if SHA changes, discard any unbuilt old pin and regenerate source attestation/kit rather than reusing an unrelated EXE.
- **Only after a genuine A72 Windows Player exists:** verify original ZIP+full binary SHA, Unity editor exit/code, compile defines, actual managed regressions, and two physical PCs with matching executable+DLL hashes. Required P0 samples: one remote owner1 intent accepted once, both state/action/revision convergence, no excessive transport backlog, true P2 client ball motion smoothness including PORTAL snap; P1: local turn/deck, P2 own-bottom aim coordinates, arrow and strength UI.
- Preserve previously accepted RC1 managed361/codec13 and RC1 Windows evidence as **historical**, not proof of W11 W10-derived binaries.

**A60 formal decision:** `W11_PR189_SOURCE=PASS_SCOPED`, `W11_TOOL_V8=PASS_16_POSITIVE+9_NEGATIVE+6_SELFTEST`, `W11_PR189_INTEGRATED=HOLD_A70`, `W11_NATIVE_BUILD=NOT_RUN`, `W11_PHYSICAL_G3=HOLD`, `W11_G4=HOLD`, `RELEASE/MAIN=STOP`. No merge, no game/protected code changes, no CI or deployment by A60.
