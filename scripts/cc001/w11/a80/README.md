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

## W11 FINALIZATION — #207 original evidence byte-binding tool (A80)

New independent A80-only files:
- `verify-view-evidence.cjs`
- `verify-view-evidence.test.cjs`

The tool binds operator-annotated screenshots and logs to **real bytes on the local PC**, while reusing the existing A80 `verify-view-timeline.cjs`. This closes a concrete evidence gap in #201: earlier observations could name a screenshot/log and declare hashes, but did **not** re-read those files.

**Candidate pin:** A70 [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207), exact source SHA `173273122c11cbf738e8b954e32506a6196fe8ec`. Any other candidate SHA fails. This is not the obsolete W10 #181 build source.

Run with Node.js 22+ from repo root after A72 provides a verified Windows build **and** an operator captures original private evidence from PC1/PC2:

```bash
node --test scripts/cc001/w11/a80/verify-view-evidence.test.cjs
node scripts/cc001/w11/a80/verify-view-evidence.cjs \
  --input PRIVATE/session-observations.json \
  --root PRIVATE/CAPTURE_DIRECTORY \
  --out PRIVATE/a80-byte-verification-report.json
```

Add `evidence.screenshotSha256` and `evidence.logSha256` to **every observation** in the existing W11 timeline JSON, as 64-hex SHA-256 strings. Existing `evidence.screenshotPath` and `evidence.logPath` must be relative to `--root`, not absolute; the referenced files must exist and remain inside the real capture root (symlink escape rejected). The screenshot can be PNG/JPEG/WebP (header checked, full image decode **not** performed). The tool rehashes file bytes incrementally, verifies content hashes, rejects zero-size/oversize evidence, retains only file byte sizes + digests in report, does **not** leak paths or raw log lines, and refuses to overwrite prior reports. The root folder and any original footage/logs remain outside the GitHub repository.

**Exit code:** `0` = all **local bytes AND operator annotations** consistent on supplied files, not an in-game QA PASS; `1` = detected contradiction/tamper; `2` = CLI usage; `3` = missing proof; `4` = filesystem/JSON error or output exists.

**IMPORTANT:** A malicious/incorrect observer can still provide matching bytes and false semantic labels. Actual OS build source and assembly integrity belong to A72, network causality to A31/A41, and independent physical PC1/PC2 gameplay/visual evidence review to A60. This tool's `physicalG3Status` is always `NOT_ASSESSED`; it never certifies V148 mechanics, Furnace FIRE-only rules, R16 HP, native Windows build, visual FPS or G3/G4.

No changes to Unity, RC1, R16, V148, Protocol149, game state or networking. No W12 transition.
