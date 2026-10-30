# CC-001 R17-W11 — A72 guarded Windows 11 build kit

**No Windows/Unity or physical PC1–PC2 runtime was executed in this ChatGPT environment.**

Owner: A72 Build & CI. A70 selects/admits **one** exact integration SHA; A60 independently verifies original output. Never build an unselected source patch, and never merge into main or publish a release.

## Confirmed source state

- Frozen RC1: `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
- Earlier A70 draft PR #181: `3d377767e72473cebd90e49293a0cd5dada70464`. W11 source admission: **HOLD_SOURCE_BLOCKER** — unconnected client visual smoother and residual MatchView after-shot bar. This previous pinned W10 operator kit must be treated as **ALT_HOLD**.
- A30 draft PR #189 corrective addon: `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`. W11 source **shape-only** admission: **GO_SOURCE_SHAPE_ONLY** (5/5 real source checks). This is NOT the approved A70 integration ref and must NOT be built as-is. A70 must explicitly accept/port selected hunks into a new isolated integration SHA; A60 validates its QA contracts.

## How to run after A70 explicitly selects a new integrated commit

1. Use a trusted Windows 11 workstation with authenticated **Git for Windows** access to the private repository, **Node 22**, and **Unity Editor 6000.4.0f1** with Windows Build Support. Do not use Administrator permissions.
2. Extract this ZIP to a fresh folder. Verify the ZIP SHA-256 against the A72 handoff. All five scripts/files must be kept together.
3. Run `node .\w11-source-readiness.cjs --self-test` (18/18 expected), `node .\build-w10-rc1.cjs --self-test` (21/21 expected) and `node .\verify-w10-player.cjs --self-test` (12/12 expected).
4. Only after A70 publishes a **NEW** ref matching `integration/cc001-r17-w10-*` at an exact 40-character lower-case SHA, invoke in Windows PowerShell 5.1:

```powershell
.\Start-W10-WindowsBuild.ps1 -IntegrationRef 'integration/cc001-r17-w10-APPROVED' -CandidateSha 'EXACT40LOWERCASESHA'
```

5. The script clones into a new isolated folder; verifies A70 ref HEAD == exact SHA and frozen RC1 ancestry; validates protected source blobs, data and C# materialization; rejects historical EOL anomalies other than exact CRLF→LF; and runs `w11-source-readiness.cjs` **before invoking Unity**. It records `evidence/w11-source-readiness.json`. Only a `GO_SOURCE_SHAPE_ONLY` result permits the one-shot Unity build. A fail-closed result preserves local original evidence and does not imply a compiler test ran.
6. If it reaches Unity, it runs one native Windows standalone build and records original Unity logs, compiler response files, full source before/after ledger and unflattened Player file SHA-256 inventory. The output `CC001_W10_A72_WINDOWS_EVIDENCE.zip` and `EVIDENCE_SHA256.txt` must be delivered **unchanged and privately** to A60. Do not report build PASS on source-only checks. The output name retains W10 for backward-compatible artifact intake; manifest includes exact new SHA.
7. After A60 accepts the new binary chain, use `node .\verify-w10-player.cjs --manifest=... --player=... --sha=...` separately on both copied Windows Player folders. `PASS_BINARY_INTEGRITY_ONLY` only means the bytes match the provided manifest; it does not certify smoothness, host authority, local turn, P2 perspective, aiming, power UI or G3.

## Scope and limitations

The W11 test is a *source-readiness gate* for the currently selected A34 visual-pose architecture. It is not authoritative physical QA, not a performance measurement and not a protocol conformance test. An alternative valid design may require an A70-reviewed gate update before build; never bypass or alter the gate on an operator's machine. A60's earlier `cc001-w10-snapshot-revision-gate.cjs` checks an **alternative** `remoteBallPoseSmoother.AcceptSnapshot(revision)` interface. The A34 candidate uses `remoteBallSmoother.Observe` after `adapter.Apply`; do not conflate the two gate contracts or claim A60 revision-parity PASS. A60 must approve the accepted implementation's runtime observability.

No destructive worktree cleanup, CI trigger, release, port-forward, credential collection, or unauthorized merge. The old `URUCHOM_W10_A70_SELECTED.cmd` is disabled in the A72 source branch, because it targeted a known incomplete draft candidate. It is intentionally NOT in this W11 ZIP.
