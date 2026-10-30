# CC-001 R17-W9 / A80 — paired-player view regression contract

**Research-grade executable observation validator** for player-facing P1/P2 contradictions. This is NOT a multiplayer game fix, A31 trace-parser replacement, screenshot OCR, source-of-truth extractor, native Unity build, physical-device test or G3 admission.

## Run (Node.js 18+; no extra dependencies)

```sh
node --test scripts/cc001/w9/a80/verify-player-view.test.cjs
node scripts/cc001/w9/a80/verify-player-view.cjs --input private/observations.json --out private/report.json
```

Exit: 0 = contract annotations consistent; 1 = observed contradiction; 2 = wrong invocation; 3 = insufficient evidence; 4 = malformed input. Exit 0 **NEVER equals G3 PASS**. Keep screenshots, logs, private addresses, usernames and join codes outside the public repository.

## Observation JSON schema example (illustrative, NOT evidence)

```json
{
  "schema": "cc001-r17-w9-player-view-v1",
  "policy": {"perspective":"local-player-bottom"},
  "observations": [
    {
      "device":"PC1", "localOwner":0,
      "evidence":{"screenshotPath":"private/pc1.png","logPath":"private/pc1.log","captureUtc":"2026-10-30T17:00:00Z"},
      "authoritative":{"turn":0,"phase":"Aiming","revision":12,"stateDigest":"sha256:ACTUAL_IDENTICAL_CANONICAL_FULL_STATE"},
      "ui":{"turnBannerOwner":0,"yourTurnShown":true,"deckOwner":0,"localPlayerAtBottom":true,
        "aim":{"dragActive":true,"arrowVisible":true,"arrowAlignedWithDrag":true}}
    },
    {
      "device":"PC2", "localOwner":1,
      "evidence":{"screenshotPath":"private/pc2.png","logPath":"private/pc2.log","captureUtc":"2026-10-30T17:00:01Z"},
      "authoritative":{"turn":0,"phase":"Aiming","revision":12,"stateDigest":"sha256:ACTUAL_IDENTICAL_CANONICAL_FULL_STATE"},
      "ui":{"turnBannerOwner":0,"yourTurnShown":false,"deckOwner":1,"localPlayerAtBottom":true,
        "aim":{"dragActive":false,"arrowVisible":false,"arrowAlignedWithDrag":false}}
    }
  ]
}
```

Owner indexes are zero based. `turnBannerOwner` is the *global turn owner*, whereas `localOwner` is the PC's player/seat. `yourTurnShown` must mean local actor may act now (localOwner==turn and phase==Aiming). `deckOwner` must denote the actual deck exposed to that client. `local-player-bottom` is a proposed UX observation requirement, not yet A10/A20 production authorization; use `unconstrained` if HQ intentionally retains fixed camera orientation.

**The operator must derive authoritative snapshots, revision and full-state digest from actual source data; equal placeholder strings are NOT real evidence.** The checker compares supplied observations; it cannot inspect screenshots, logs or binaries automatically. Same revision mismatches and same-revision state-hash differences are leads for A31/A60, not proven teleportation causes. Different revisions are marked insufficient for parity rather than treated as desync. Shot-power appearance is omitted pending A10 approval.

## Ownership and gates

- A31 owns `scripts/cc001/w9/a31/analyze-network-logs.cjs`, network causality and transport; this A80 work does not overlap or import that tool.
- A20/A40 own presentation and game-source corrections; this adds no Unity gameplay changes.
- A60 owns independent native and PC1–PC2 QA; synthetic fixtures validate **only this validator**.
- A70 owns integration. Base is pinned W8 RC1 SHA `10f64e4d213f17a352ed8fa83bc75884a39549f0`; protected RC1/R16/V148/Protocol149 and main remain unchanged.


## R17-W10 / A10 approved UX gate (optional strict profile)

HQ A10 issue #97 comment 6529281715 explicitly approved removal of the **separate floating aiming power bar and numeric `NN%` label**. Keep launch power, aim physics, Protocol149 and the visible directional arrow unchanged.

For the W10 integration candidate, supply **real operator observations** and enable the optional strict `policy` flags in JSON:

```json
{
  "perspective":"local-player-bottom",
  "powerIndicator":"arrow-only",
  "requireConnectionState":true,
  "requireInputParity":true,
  "requireSameBuild":true,
  "targetSourceSha":"EXACT_40_HEX_GIT_COMMIT_OF_TESTED_W10_CANDIDATE"
}
```

For **each** device, add:
- `networkConnected: true/false` from the actual client state;
- `evidence.sourceSha`: verified candidate commit SHA, and `evidence.playerAssemblySha256`: actual same-source Windows Player `Assembly-CSharp.dll` SHA-256;
- `ui.inputEnabled`: whether the client is actually allowed to aim (not inferred just from the label);
- `ui.powerBarVisible: false` and `ui.powerPercentVisible: false`: visual verification at a real active aiming frame.

The validator rejects mismatched source/binary identifiers and contradictions in labels versus available controls; missing required annotations yield `INSUFFICIENT_EVIDENCE`. **It validates SHA strings supplied by operators but does not rehash EXEs, ZIPs, screenshots or logs.** Separate A72 binary provenance and A60 original media inspection are mandatory. A positive annotated contract remains **NOT a physical two-PC PASS**.

### W10 competing W9 implementations (integration note, not merge authorization)

- Local-facing turn/aim: #168 (A20) covers both turn labels and GUI-matrix-free arrows; #170/#160 are alternative turn text implementations. Select **one**, never concatenate competing `MatchView` rewrites. #173 (A32) keeps locally owned deck visible and shares `MatchView` / `BallSelection`; A70 must resolve that specific overlap.
- Cadence: #163 (A41) adaptive 12/8/4 Hz based on payload size + stale ACK guard; #175 (A30) proposes fixed 20 Hz and broad source changes. These are **alternative network schedules**, not cumulative edits.
- Display smoothing: #174 (A34) is already presentation-wired; #169 (A50) supplies an unwired helper; #175 contains a third implementation. Select **one** interpolation implementation. Do not smooth true teleports or modify GameState physics.
- P2 local-bottom camera is conditionally approved by A10; the inverse input/world transform and aim arrows must be verified together. Do not transplant only a visual rotation.
- Source choices are **integration suggestions based on per-file PR diffs**, not measured frame-rate, native compile, or player QA results. A70 owns cherry-picks/conflict resolutions; A60 owns physical acceptance; A72 builds exact final SHA.
