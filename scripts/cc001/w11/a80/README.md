# CC-001 R17-W11 — A80 multi-frame PC1/PC2 view contract

This **offline** tool extends A80 W9/W10 `verify-player-view.cjs` from a one-frame paired observation to chronological frames. It detects seat/ownership churn, stale UI turns, input enabled for an inactive seat, reverse revisions/action serials, state changes within the same transport revision, changed binary SHA declarations, and A10-unapproved power HUD. It **does not** inspect screenshots, parse actual network packets or compute original binary hashes, and **never certifies G3/Unity/physical Windows QA**. A31 owns transport, A72 owns build provenance, A60 owns independent two-PC QA, A70 owns integration.

Requires Node.js 18+ and the W9 A80 helper on the parent branch. No third-party packages.

```sh
node --test scripts/cc001/w11/a80/verify-view-timeline.test.cjs
node scripts/cc001/w11/a80/verify-view-timeline.cjs --input PRIVATE/session.json --out PRIVATE/view-report.json
```

CLI exit code: `0=observations logically consistent`, `1=observed contradiction`, `2=invocation error`, `3=insufficient evidence`, `4=invalid JSON/read error`. Exit **0 never means a successful two-PC test**. Logs, originals and screenshots must stay private; published evidence should omit IPs, join codes, account IDs and paths.

Session JSON shape (illustrative schema, **NOT captured evidence**):

```json
{
  "schema":"cc001-r17-w11-player-view-timeline-v1",
  "policy": {
    "perspective":"local-player-bottom",
    "powerIndicator":"arrow-only",
    "targetSourceSha":"40-hex-source-commit-of-accepted-candidate"
  },
  "frames":[
    {"index":1,"observations":["PC1 record using A80 W9 schema","PC2 record using A80 W9 schema"]},
    {"index":2,"observations":["PC1 next record","PC2 next record"]}
  ]
}
```

For each actual PC record, provide known `localOwner`, `networkConnected`, `authoritative.revision`, `.turn`, `.phase`, `.actionSerial`, `.stateDigest`, `ui.turnBannerOwner`, `.yourTurnShown`, `.inputEnabled`, `.deckOwner`, `.powerBarVisible`, `.powerPercentVisible`, `.aim`, and evidence `screenshotPath`, `logPath`, `captureUtc`, `sourceSha`, `playerAssemblySha256`. Use **the same source SHA and assembly digest on both PCs**; verify these with A72 independently. A screenshot filename alone is not proof it exists. Source-bound same-revision full-state digests must be obtained from actual snapshots, not generated from labels or dummy strings.

`targetSourceSha` must be the **actual A70-admitted W11 SHA**, not the old PR #181 SHA if A70 accepts #189 (draft addon, not yet integrated). `policy.perspective=local-player-bottom` is only an A10-conditional view contract; if A70 intentionally defers camera changes, use `unconstrained` (do not fabricate a failed camera test). The tool does not measure frame latency, stutter, physics correctness, aim gesture world coordinates or a true teleport; those remain for A31/A60 physical QA. Differs from A42/A72/A60 network log gates by checking chronological user-visible UI annotations only.