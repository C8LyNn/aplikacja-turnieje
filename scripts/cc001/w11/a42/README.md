# CC-001 R17-W11 FINALIZATION — A42 source/build handoff gates

**Role:** A42 CI/CD. A70 owns integration, A72 Windows build, A60/A31 independent QA. No merge/release by A42.

## Official selected W11 candidate (2026-10-30)

- A70 draft PR #207: https://github.com/C8LyNn/aplikacja-turnieje/pull/207
- Official ref: integration/cc001-r17-w11-multiplayer-qa-candidate-20261030
- **Only authorized final source SHA:** 173273122c11cbf738e8b954e32506a6196fe8ec
- Frozen RC1: 10f64e4d213f17a352ed8fa83bc75884a39549f0.
- Verified GitHub comparison: ahead15/behind0 vs exact RC1 ancestor, 22 changed paths, zero removed. Two new paired .cs.meta. No change to core game mechanics or catalog HP. Preserve V148 Mitosis behavior, FIRE-zone/tick-only Furnace, R16 HP; no broad source patch is allowed by this A42 tool.
- Old W10 PR #181 is ALT_HOLD. A30 #189 is selected ancestor of official PR207, not its release/build SHA. Old W10 Windows kit is obsolete for PR207 and must not be relabeled.

## Executable code

1. w11-source-gate.cjs: read-only Git remote A70 ref check; hard-pins PR207 exact SHA; RC1 ancestry, clean worktree, strict changed-file ownership and .meta pairing. Source-semantic checks for A41 adaptive 20/12/8/4Hz + ACK; A34 visual-only P2 smoothing with PORTAL snap; local turn/deck/aim; no residual post-shot strength bar; NGO-to-App-to-smoother exact revision forwarding; stale/duplicate revision refusal, reset, and authored A70/A40 P2/Phoenix regression definitions and registration. Protects R16 evidence, V148 behavior inputs, catalog HP, Protocol149, core/scene/package/project settings. Source gate is NOT a build or G3 pass.
2. w11-build-chain.cjs: reads A42 source JSON, original A72 summary.json + receipt.json, original per-PC A72 full Player verifier JSON on PC1/PC2, independently reads actual W11 A70 remote SHA, requires same SHA and unbroken provenance, build exit/result/gates, complete EXE/DLL manifest and valid distinct path/size/SHA256 entries, both devices' file counts. Outputs SHA256/size of original evidence inputs. It never says physical gameplay PASS.
3. w11-source-gate.test.cjs and w11-build-chain.test.cjs: 38+37 deterministic tests. Both source files were read back at their committed Git blob SHA.

## Operator commands (Node22, clean authenticated full Git checkout; output OUTSIDE checkout)

node --test scripts/cc001/w11/a42/w11-source-gate.test.cjs
node --test scripts/cc001/w11/a42/w11-build-chain.test.cjs
node scripts/cc001/w11/a42/w11-source-gate.cjs --repo=C:\repo\aplikacja-turnieje --sha=173273122c11cbf738e8b954e32506a6196fe8ec --out=C:\evidence\a42-w11-source.json

After A72 ACTUAL W11 Unity6000.4.0f1 Win64 build (not yet created) and original A72 binary verifier on BOTH devices:

node scripts/cc001/w11/a42/w11-build-chain.cjs --repo=C:\repo\aplikacja-turnieje --selected-sha=173273122c11cbf738e8b954e32506a6196fe8ec --source-gate=C:\evidence\a42-w11-source.json --build=C:\evidence\summary.json --receipt=C:\evidence\receipt.json --pc1=C:\evidence\pc1-binary.json --pc2=C:\evidence\pc2-binary.json --out=C:\evidence\a42-handoff.json

Exit 0 = scoped source/evidence readiness ONLY; 2=HOLD; 3=operational error. No merge, Unity execution, deploy or release.

## Exact test evidence and exclusions

- A42 exact committed GitHub code and test callbacks executed in isolated V8 with mocked Node built-ins: 38/38 source + 37/37 build-chain = **75/75 PASS**, not native Node22 CLI.
- Fetched 11 exact actual W11 C# files/tests from PR207 SHA, checked source semantics with committed A42 engine: **zero source-contract failures**, when clean local checkout and diff --check are simulated as true. Actual Git remote exact PR207 head and RC1 ancestry independently verified via connected GitHub, but full local Git diff --check/working-tree admission NOT RUN.
- Native dotnet9 C# tests, Unity Windows Player build and EXE/DLL, real PC1/PC2 logs/screenshots, A60 independent G3/G4 QA: **NOT RUN**.
- Owner handoffs: A72 #113 repin/run new W11 Windows kit; A60 #139 verify same original binary on both physical PCs then test P2 command accepted-once, host/client revision/state parity, ball smoothness/portal and network backlog, local UI/aim/HP/Furnace/Mitosis; A70 #137 final integration/release authority.
- Protected RC1/R16/V148/Protocol149/main unchanged. No W12 before W11 formal closure. **G3/G4=HOLD / RELEASE=STOP**.
