# CC-001 — A43 / R17-W15 — A33 F1 COPY QA read-only pose importer

**Scope:** A43 Telemetry / Web Analytics. This is an **additive**, offline Node.js 22 utility using the **literal** F1 `COPY QA` clipboard text format implemented in A33 development Draft PR #263, source `DetailsView.cs` / `QaPoseEvidence.cs` at `69ad4e278a8c3f61bc3fe79b61f38b3130a5ddb7`. No Unity source modified.

**Crucial source separation:** The official protected W11 QA freeze remains `integration/cc001-r17-w11-qa-freeze-20261030` @ `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. **That frozen Player does not include the later A33 F1 pose-copy functionality.** This CLI is for separately built **post-freeze dev candidates only** after A70 selects/admits A33; it MUST NOT be used to label W11 frozen PC1/PC2 physical QA as PASS. Moving PR #207 and Phoenix #266 remain independent.

## Why this instead of another renderer or packet analyzer

A33 `COPY QA` can provide operator-clicked canonical `STATE_X/Y` and smoother `RENDER_X/Y` alongside `RENDER_MODE`, `FRAME`, `REVISION`, `ACTION_SERIAL`, `PHASE`, local P2 client role and UTC. A43's existing W13 `frame-evidence.cjs` requires **continuous native engine-frame samples**, which sporadic F1 clicks categorically cannot provide. This new CLI accepts A33's real textual format **directly** and labels output `LOCAL_POSE_SAMPLES_ONLY`—never synthesized NDJSON frame streams, transport latency, FPS/p99 or authoritative PC1↔PC2 parity.

## Operator workflow (post-freeze A33 development build only)

1. A70 separately selects and integrates A33 #263 in a **new** source SHA. A72 performs new genuine Windows Unity 6000.4.0f1 + .NET9 build for that admitted candidate with complete original Player EXE/DLL/full-path hashes.
2. In that Player, on **PC2 connected as CLIENT/P2**, open F1 and click `COPY QA` while inspecting a ball, save clipboard bytes as `pc2-f1-copy.txt`. Repeat capture blocks in a text file if useful; each is an independent click, **not a continuous Unity-frame sequence**. The clipboard itself prints `SOURCE_SHA=UNVERIFIED`; never replace it with a guessed SHA.
3. Analyze a copy using Node 22:

```sh
node tools/cc001-w15/a43/qa-f1-pose.cjs pc2-f1-copy.txt pc2-f1-report.json
node --test tools/cc001-w15/a43/qa-f1-pose.test.cjs
node --test tools/cc001-w13/a43/frame-evidence.test.cjs
```

Exit codes: `0` = observational local pose samples only; `1` = contradictions in capture (e.g., non-Moving `SMOOTHED`, contradictory `CANONICAL` position); `2` = no readable pose rows; `3` = malformed file/format, symlink, invalid UTF-8, overwrite attempt. All categories remain **G3=NOT_ATTESTED**.

The parser checks the exact A33 SOURCE/CLOCK/G3 disclaimers, connected P2 seat, per-sample identity, count/cap/truncation, focus-ball inclusion, numeric world positions, owner and `RENDER_MODE`. Output contains **only derived numeric safe fields** plus the original input SHA256/byte count. No raw clipboard network text, addresses, secrets or file paths are emitted. It has no game-side hooks and cannot authenticate either Player binary or two physical machines.

**A33 F1 prerequisite:** `QaPoseEvidence.Capture` returns canonical render in non-Moving phases and may display SMOOTHED in Moving. The importer flags incompatible mode/pose observations as **capture contradictions**, not verified gameplay defects. Focus target is preserved if the inspected ball is outside the first 24 IDs, per A33 #263. `SAMPLED` ≤24 and `TRUNCATED` remains visible; no false complete-board claim.

**W15 executed verification:** Node v22.16.0 `--check` for both own W15 CJS files; actual `node --test` new **25/25 PASS** (includes child-process CLI exit codes, byte hash, over-write protection, source disclaimers, invalid UTF-8, symlink and output redaction); existing W14 A43 frame parser **27/27 PASS** on exact old Git blobs (`204c900390c8cbd02824d2f09f1e33581743891f` / `e083671e39403f4eafcd5e28e55431981d2a70d5`). **52/52 local Node checks**; all fixture inputs synthetic. No actual A33 F1 clipboard, Windows Player, .NET9 execution, or physical PC1/PC2 was available to A43.

**Integration:** A43 Draft #171 stays isolated and add-only. Do not merge into protected RC1, R16, V148, Protocol149, frozen QA, or main; do not release. Mitosis exact V148, Furnace FIRE-zone periodic ticks only, HP R16 unchanged. A70 selects source, A72 runs real Windows + .NET, A60/A31 independently attest physical PC1/PC2 and original evidence.
