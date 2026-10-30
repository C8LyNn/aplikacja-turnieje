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
