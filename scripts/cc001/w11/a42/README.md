# CC-001 / R17-W11 / A42 — source + Windows evidence gates

**Owner:** A42 CI/CD. **Decisions/merges:** A70. **Build:** A72. **Independent QA:** A60. **No release.**

## Actual target state (2026-10-30)

Frozen RC1: `10f64e4d213f17a352ed8fa83bc75884a39549f0`. A70 integration branch is `integration/cc001-r17-w10-multiplayer-dev-candidate-20261030`; its **currently selected head** is `3d377767e72473cebd90e49293a0cd5dada70464` (draft PR #181). It has source-confirmed P0 visual smoothing and P1 power-HUD gaps recorded by A60 #139.

The more complete competing addon A30 **draft PR #189** SHA `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`, based on A70 #181, is **ALT_HOLD / NOT ADMITTED BY A70**. It includes A41 size-budgeted cadence + stale ACK, one A34 wired smoother with PORTAL snap, local-owner hints/deck, P2 view and removal of last residual strength bar. This package does NOT select or integrate #189: until A70 explicitly publishes a reviewed integration ref at its SHA, all candidate build/QA gates must HOLD.

The old A42 W10 PR #182 pins A30 W9 `e6470...`, 9 paths, and is **SUPERSEDED as a W11 candidate admission tool**. Keep its history for audit; do not apply it to a later composite candidate.

## Files

- `w11-source-gate.cjs`: read-only Git + exact source contract check. Performs remote Git `ls-remote` against the real A70 branch and refuses a moved/unadmitted SHA, non-descendant of RC1, unexpected edits to protected Package/Settings/Protocol149/R16-sensitive paths, dirty worktree, invalid .meta pairing or malformed input. Requires A41 adaptive 20/12/8/4Hz, matched P2 intent ACK, A34 presentation-only smoothing/PORTAL one-shot snap/reset, local-owner turn/action/deck, bounded `AimStroke`, and absence of residual `lastPower/releasedAt`. This is **source evidence only**, never a network fix or build.
- `w11-source-gate.test.cjs`: 28 positive/negative assertions.
- `w11-build-chain.cjs`: independent SHA handoff check. Reads A72 original `summary.json` and `receipt.json`, A72 `verify-w10-player.cjs` result JSON from **each physical PC**, and A42 source-gate JSON. Resolves the CURRENT A70 remote ref from Git (not a typed trust assertion); requires same exact SHA, all A72 provenance gates, Unity exit0/BuildPipeline success, complete Player manifest incl EXE/DLL, and both file-integrity reports. Records SHA256 + byte sizes of all input evidence. **Never passes actual G3**.
- `w11-build-chain.test.cjs`: 25 positive/negative assertions.

## Commands — only after A70 authorizes the exact SHA

Use an authenticated **clean full private Git checkout** with both frozen RC1 and selected candidate objects locally present; Node 22. Place evidence files and `--out` outside that clone so its working tree remains clean.

```powershell
node --test scripts/cc001/w11/a42/w11-source-gate.test.cjs
node --test scripts/cc001/w11/a42/w11-build-chain.test.cjs
node scripts/cc001/w11/a42/w11-source-gate.cjs --repo=C:\Path\To\aplikacja-turnieje --sha=EXACT_A70_APPROVED_40_HEX_SHA --out=C:\Temp\source-gate.json
```

Only **after A72 real Windows build** and `verify-w10-player.cjs` on BOTH PC1 and PC2:

```powershell
node scripts/cc001/w11/a42/w11-build-chain.cjs --repo=C:\Path\To\aplikacja-turnieje --selected-sha=EXACT_A70_APPROVED_40_HEX_SHA --source-gate=C:\Temp\source-gate.json --build=C:\Temp\evidence\summary.json --receipt=C:\Temp\evidence\receipt.json --pc1=C:\Temp\pc1-binary-check.json --pc2=C:\Temp\pc2-binary-check.json --out=C:\Temp\handoff-result.json
```

Source gate outputs `SOURCE_CONTRACT_READY_FOR_A70_A72_REVIEW` or `HOLD`, exit 0 or 2; operational Git/CLI failure exit 3. This **does not authorize deployment or claim A70 approved #189** merely from a branch ref. Build-chain outputs `READY_FOR_A60_INDEPENDENT_QA_REVIEW_ONLY` or `HOLD`, exit 0 or 2, operational errors exit 3. Gate success means only evidence consistency, NOT physical test success, complete input-file authenticity, or authority to merge. A60 must independently obtain/rehash original raw WindowsPlayer, logs and recorded session evidence.

## Actual source verification and limits

- Fetched A42 committed JS code and test bodies back from GitHub; executed **28/28 source assertions** and **25/25 evidence-chain assertions** in an isolated V8 test harness. **53/53 PASS (mocked Node built-ins)**; NOT a native Node CLI or full Git checkout test.
- Compared live RC1→#189 GitHub: exact RC1 merge-base, **21 changed source/test paths**; fetched 8 genuine C# files at exact #189 SHA and ran source contracts: **zero source-contract failures under simulated clean Git preflight**. Live A70 head remained old `3d377...`, so correct result for addon was **HOLD / A70_REF_NOT_AT_EXACT_SHA**. If A70 selects addon ref, source-contract evaluation gives source-ready only, contingent on actual clean local Git/remote proof.
- Frozen official #181 fails W11 source contract for unintegrated smoother, local action/deck cues and after-shot meter.
- **Not run:** genuine Node22 checkout test, dotnet9 managed suite, Unity 6000.4.0f1 Windows build, native PowerShell, fresh Player, PC1↔PC2 physical gameplay/latency, A60 independent QA. A72 #188 already owns actual build; this code does not duplicate/rebuild or publish any binaries.
- No main/RC1/R16/V148/Protocol149 modification, merge, GitHub Actions activation, staging deployment or public release.

**Routing:** A70 #137 must first accept/reject #189 or another candidate and issue exact new integration SHA; A72 #113 must regenerate its pinned kit if the current #181 SHA moves; A60 #139 independently verifies new build and real two-PC playtest with screenshot/video/Player.logs for P2 physics, movement, turns, view, aim, power HUD. Until then `G3/G4=HOLD`.
