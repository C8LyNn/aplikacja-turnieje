# CC-001 R17-W15 A42 — A72 #262 generated Unity report admission compatibility

**Scope:** A42 independent *original evidence* intake, not an alternative A72 builder. W15 branch stacks on A42 W14 #261 → W13 #243 → W12 #227; all remain DRAFT and unmerged. A70 W11 source freeze stays `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` at `integration/cc001-r17-w11-qa-freeze-20261030`. Moving #207 and #266 Phoenix DEV are NOT selected for this run.

## Confirmed P0 flaw actually repaired

A42 old W12 #227 `freeze-player-intake.cjs` returned `A72_SOURCE_OR_BLOCKER_LEDGER_INVALID` whenever `build.sourceChanges.length > 0`, even if the *only* post-Unity changes were the two expected BuildTools-generated report JSON files. That behavior is incompatible with A72's **selected** #262 change in canonical [A72 PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188), currently at exact kit commit `aa6e047cd7661961978fedcc91ff14dfc29a02f4`. A72 legitimately archives/removes historical tracked Unity reports and regenerates them within a new Unity invocation, then records exactly these differences.

**Patch inside SAME existing A42 intake:** replaces blanket `sourceChanges.length` failure with `validateLedger(build)` from new `scripts/cc001/w15/a42/generated-unity-ledger.cjs`. All existing exact QA SHA/ref/RC1/real Player EXE and DLL byte hashing, nested paths, duplicate/symlink/extra checks, build status and blocker refusal remain. Requires A72's `freshUnityReports=true`, both new smoke/build SHA256 values, Windows build target and 0 errors, `sourceAfterMaterialized=true`, `sourceNotMutated=true`, matching source/generated/denied ledgers. Permits *only* `unity/cc001-r16/CoreClash-V149-Unity/Evidence/R16/Unity/{unity-smoke.json,build-StandaloneWindows64.json}`. Any other C#, scene, ProjectSettings, unknown JSON or path-traversal modification = HOLD. Does not allow source to mutate just because A72 emits a successful summary.

**Important integration dependency:** W12 standalone #227 HEAD `b35e77f238db60e462bb52a4d0f7e140586b43aa` is **known incompatible with #262**. Use only the selected full A42 W15 changes, including W12 intake patch AND new W15 helper; do not cherry-pick the original W12 file alone or delete the helper. No merge to frozen QA/main/release.

## Actually executed checks — scoped only

- Native Node **v22.16.0**, `node --check` on `generated-unity-ledger.cjs` and its test PASS; `node --test` **21/21 PASS exit0, 0 FAIL** on synthetic A72 summary ledger fixtures.
- Actual local `git hash-object` equal authenticated GitHub blob readback: helper **`3d52508e14516f5f7eb22d3fba38809b6abaa5fc`**, 21-test file **`9aa3431643bf8e657b54383d058e7ed6208f9f39`**. Raw Node TAP SHA256 **`79540d88cc383360c16149f3aaaf38962101c855949a59352e16a685835bacae`**.
- Existing A42 W12 byte-intake source/test were actually committed and read back exactly, Git blobs **`5e43b5b492300db1a20975a9130996a1091ad939`** / **`cfe1a3d57eb2285ff32f9685cf076e1c21077e27`**; V8 parses both, 9/9 bounded integration structural assertions PASS. W12 native `node --test` **27 authored cases NOT RERUN NATIVELY on this updated W15 HEAD**. Do not misreport the earlier original W12 native 23/23 as verification of new W12 27-test file.
- **Not performed:** true .NET SDK9 C# compilation, licensed Unity 6000.4.0f1 Windows Player build from freeze, actual generated Unity outputs, running A42 intake against original built binaries, A60/A31 physical PC1–PC2. No native game/physical QA evidence. G3/G4 HOLD, W11/W12 closure HOLD.

## Exact external Windows PC1 operator handoff (only native route)

Use **one canonical A72 kit** from #188 HEAD `aa6e047cd7661961978fedcc91ff14dfc29a02f4`; verify that `scripts/cc001/w10/a72/FILE_SHA256.json` contains six expected files and builder SHA256 `331970F9FDB23D247FB8818452063D9CBEE2AE9A7D44B2D2FD2197ADE0330B74`. Do **not** source the Windows Player from A42 W15 or moving #207/#266. On trusted Windows 11 PC1 with licensed Unity **6000.4.0f1**, installed Windows Standalone x64 Build Support, Node22, .NET SDK9, Git with authenticated private repo, execute from directory `scripts/cc001/w10/a72`:

```powershell
node .\w11-source-readiness.cjs --self-test
node .\verify-w10-player.cjs --self-test
node .\verify-kit-source.cjs --self-test
node .\verify-kit-source.cjs --check
node .\build-w10-rc1.cjs --self-test
.\URUCHOM_W11_PR207.cmd
```

The historical CMD name refers **only to the frozen QA source**, not PR207. Any required missing .NET9/Unity license/module/auth, failed self-test, source SHA drift, stale managed/Unity JSON, nonzero Editor exit or bad full EXE/DLL/Player SHA => HOLD and preserve original logs. If actual native build succeeds, retain original raw `summary.json`, `receipt.json`, fresh `managed-test-results.json`, `managed-dotnet9.log`, `gate-events.txt`, `unity-run-window.json`, old/new Unity report SHA and files, raw editor logs, full `WindowsPlayer` tree with path/size/SHA256 per file, EVIDENCE zip/hash receipt. Run A42 #243 independent .NET result coherence check and W15-corrected A42 W12 #227 real copies byte-intake; **then** A60/A31 independently perform real host/client PC1–PC2 sync, turn, P2 aim, teleports, PORTAL, ball smoothness, authoritative revision/state and file SHA parity. No inherited PASS from synthetic Node testing.

Owner decisions untouched: Mitosis V148 EXACT, Furnace FIRE-zone with periodic damage only, all R16 HP. W15 isolated until W11 closure. No main/release integration/deployment.
