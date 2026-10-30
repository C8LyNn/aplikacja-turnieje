# CC-001 R17-W11 — A72 EXACT-SHA Windows Player operator handoff

**Status:** selected A70 candidate [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207), **not yet native-built**.

**STOP if moving PR head:** the #207 HEAD was observed advancing from the frozen `173273...` to `8fce19...` during W11. The current W11 operator remains pinned to `173273...` and MUST fail closed on any moved remote ref. A70/HQ must explicitly re-freeze the target SHA and A72 update both Node and PowerShell guards before any native build. Do not bypass the check. This kit is SHA-locked; old W10 one-click kit remains **ALT_HOLD**. Build does not authorize merge, deployment, release or acceptance.

- Selected branch: `integration/cc001-r17-w11-multiplayer-qa-candidate-20261030`
- **Selected HEAD only:** `173273122c11cbf738e8b954e32506a6196fe8ec`
- Frozen RC1: `10f64e4d213f17a352ed8fa83bc75884a39549f0`
- A72 build tooling branch: `feat/cc001-r17-w10-a72-build-evidence`
- Unity: **6000.4.0f1**, Windows 11, Windows Build Support; Node **22**, Git for Windows with authorized private-repository access.

## Before build

The latest W11 six-gate source-readiness check was independently emulated against #207 C# blob readbacks at `8fce19b9fefb05fb8e781417af7455749979d93e` and satisfied **6/6 static checks** (NGO revision admission, selected A34 smoother, visual-vs-authoritative pose, no post-shot MatchView power strip, no Phoenix debug define). This is **source shape**, not Unity compilation or PC1/PC2 gameplay proof.

The builder and PowerShell launcher now both **reject every ref/SHA other than the exact A70 W11 selected values above**, and refuse to build on Linux or if Unity/Node prerequisites fail. They still verify RC1 ancestry, protected source blobs, before/after raw materialization, compiler defines, original Unity build report, source ledger and full Windows Player manifest.

## Windows operator procedure

1. Obtain the A72 branch scripts in `scripts/cc001/w10/a72/` from GitHub, preserving their relative layout. Do **not** run `URUCHOM_W10_A70_SELECTED.cmd`; it is disabled by design.
2. On a trusted, authenticated Windows 11 host, open Windows PowerShell 5.1 in the script directory. First run all offline self-tests:

```powershell
node .\w11-source-readiness.cjs --self-test
node .\build-w10-rc1.cjs --self-test
node .\verify-w10-player.cjs --self-test
```

3. Run one exact candidate build with the new W11 script (or the new `URUCHOM_W11_PR207.cmd` convenience launcher):

```powershell
.\Start-W10-WindowsBuild.ps1 -IntegrationRef 'integration/cc001-r17-w11-multiplayer-qa-candidate-20261030' -CandidateSha '173273122c11cbf738e8b954e32506a6196fe8ec'
```

4. Keep the untouched generated `CC001_W11_A72_WINDOWS_EVIDENCE.zip` and `EVIDENCE_SHA256.txt` **private**; do not post raw Player logs, machine paths or credentials publicly. If the script exits nonzero, preserve original HOLD evidence.
5. Independently run `verify-w10-player.cjs` against the complete original Windows Player inventory on both PC1 and PC2. A60 must independently hash the files, compile/run managed tests including P2/Phoenix and revision cases, execute a physical dual-device match and record authoritative same-revision parity, P2 aim, visual smoothing, PORTAL snap, action accepted-once, turn UI and no after-shot power strip.

## Interpretation

- `GO_SOURCE_SHAPE_ONLY`: source static precondition, **not** successful build.
- `PASS_BUILD_EVIDENCE_ONLY`: native compiler/build provenance, **not** successful network QA.
- `PASS_BINARY_INTEGRITY_ONLY`: local original files match manifest, **not** physics or visual evidence.
- **G3/G4 stay HOLD until independent A60 native physical two-PC evidence and HQ acceptance.** No W12 before formal W11 closure.

Backward-compatible internal report schemas intentionally remain `CC001-W10-A72-WINDOWS-1` and `CC001-W10-A72-RECEIPT-1` for existing A42 evidence-chain parsing; `candidateSHA` and the original Player SHA256 inventory carry exact new W11 identity. Never relabel W10 build bytes as W11.
