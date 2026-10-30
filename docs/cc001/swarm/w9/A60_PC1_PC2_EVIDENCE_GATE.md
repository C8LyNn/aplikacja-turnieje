# CC-001 / R17-W9 — A60 independent PC1–PC2 regression gate

**Identity:** A60, Independent QA. **Source base:** RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`. **Scope:** offline, test-only, isolated branch. No implementation, network connection, Unity launch, build, protected source modifications, or release.

## Executable verification

```sh
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w9-two-pc-gate.cjs --self-test
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w9-two-pc-gate.cjs /private/path/PC1.json /private/path/PC2.json 173273122c11cbf738e8b954e32506a6196fe8ec
```

Node 22 (built-in modules only). Exit: **0 PASS**, **1 FAIL** for a proven regression, **2 HOLD** for incomplete evidence, **64 invalid usage/input**. The self-test has 12 deterministic assertions including intentional negative cases. A passing self-test proves the gate implementation, **not a real PC1–PC2 game fix**. Always pair the actual live trace with both original Windows Player logs and real gameplay screenshots/video when evaluating visual smoothness.

## Real two-machine trace contract (JSON schema `CC001-W9-PC-EVIDENCE-v1`)

Each capture is produced on its **own physical machine**. Never fabricate samples or copy the same trace across both endpoints. Example structure (values below are **SCHEMA EXAMPLE, NOT TEST EVIDENCE**):

```json
{
  "schema":"CC001-W9-PC-EVIDENCE-v1",
  "peer":"PC2",
  "localOwner":1,
  "sourceSha":"10f64e4d213f17a352ed8fa83bc75884a39549f0",
  "session":"REDACTED_SHARED_NON_SECRET_ID",
  "frames":[{
    "atMs":1000, "revision":1, "turn":0, "phase":"Aiming",
    "yourTurn":false, "actionSerial":1,
    "balls":[{"id":7,"owner":1,"x":100,"y":200,"hp":20}],
    "aim":{"board":{"x":0,"y":0,"width":540,"height":900},
      "from":{"x":270,"y":850},"to":{"x":260,"y":810}}
  }],
  "sentIntents":[{"owner":1,"sequence":1}],
  "renderSamples":[
    {"id":7,"atMs":1000,"x":100,"y":200,"speed":50},
    {"id":7,"atMs":1016,"x":100.8,"y":200,"speed":50},
    {"id":7,"atMs":1032,"x":101.6,"y":200,"speed":50}
  ]
}
```

PC1 uses `peer="PC1"`, `localOwner=0`, same source SHA and run/session ID. PC1 supplies authoritative `frames` sampled at each transmitted revision and `acceptedIntents` e.g. `[{ "owner":1, "sequence":1, "actionSerial":2, "accepted":true }]`. PC2 must capture `yourTurn` **from visible UI** (not a recomputed value) and `balls` from the exact decoded authoritative revision. To test smoothness, record `renderSamples` from the **displayed client position every frame** (in world units), include speed and times, and correlate any large jump with event/collision logs and 60 FPS footage. Do not count screenshots of PowerShell or terminal output as real game visuals.

## A60 gates

- **P0 peer/turn identity:** P1 = host owner0; P2 = remote owner1. `YOUR SHOT` is true only for the local owner during `Aiming`. Other turns should display a waiting/opponent state.
- **P0 snapshot state consistency:** monotonic revisions on each endpoint; exact identical host/client state at the same revision, including ball IDs, positions, HP, current owner and `actionSerial`. Old revision or divergent state = FAIL. In-flight final revision lag = HOLD, not automatically a gameplay failure.
- **P0 accepted P2 action:** match sequence/owner between sent client intent and accepted host result; one accepted action per P2 sequence. Missing action evidence = HOLD.
- **P0 smoothness:** velocity-envelope spikes on successive **render** samples cause HOLD for correlation against collision, replay and 60 FPS footage — **do not mistake every collision for teleport**. No samples = HOLD; no unexplained spikes supports a scoped PASS.
- **P1 aiming:** measured viewport board rect and actual arrow endpoints must be finite and remain within board bounds.
- **W10 P2 perspective:** record `frames[].perspective={board:{x,y,width,height},localLauncher:{x,y}}` **measured from P2 GUI screenshot in the same frame**. The local launcher must be in the bottom 40% of the actual rendered board. Missing measurements = HOLD; local launcher at top/invalid = FAIL.
- **W10 approved arrow-only power UI:** when `frames[].aim` is active, record `frames[].powerUi={barVisible:false,arrowVisible:true}` from P2 screenshots/video. Actual visible strength meter or missing aiming arrow = FAIL; missing observation = HOLD. Do not fabricate input values from intended source code.

**Existing RC1 finding:** NGO host sends full state snapshots at around 5 Hz during `Moving`, `CoreClashApp.ReceiveNetworkState` directly assigns `Simulation.State=state` on client, and `MatchView.TurnText` renders `YOUR SHOT` without comparing `NetworkLink.LocalOwner`. These source facts help implementation owners reproduce defects; they are **not** proof of the network RTT, actual interpolator performance or a fixed build. Rendering perspective still awaits a design decision.

**Evidence security:** keep machine names/local IPs, join codes, account directories and LAN topology out of public issue attachments; save raw originals privately and publish redacted summaries. Never expose inbound LAN port to public WAN.

**Handoff:** A31 #94 + code owners for diagnostic trace/repair; A60 #139 only independent verifier; A70 integration after actual P0 regression PASS; HQ #97. No main merge/release, no new gameplay source edits by A60.

## W10 independent verifier hardening / current evidence limits

- Validator updated in A60 isolated PR #162: **20/20 executed Node22 self-test assertions PASS** (local process exit 0); `node --check` PASS; SHA256 of exact local script `f1a5f6cfe621eb4e4ff423602cec2762314bbeed7056a1de9bdd57ada3d2be60`. **Git blob `c98fd0267d6f21bf3e8f5044623d6f30d3950fcf`** matches tested local file.
- Added fail-closed cases: missing `balls` arrays on both peers no longer count as identical; non-finite ball telemetry is HOLD; accepted P2 commands cannot reuse a host `actionSerial`; P2 launcher position and removal of redundant power meter are testable from real captured UI samples.
- **Candidate under source review only:** preintegration exact snapshot `d5c26acd2403b0d0264849b40f2d2aa98c750f62`; this is not a native Windows build nor A70 merged release candidate. Verify ref again before actual PC1/PC2 test.
- Automated offline gate accepts only **trusted original device-sourced measurements** and cannot independently prove screenshot/Player.log identity from JSON fields alone. Preserve original logs and screenshots privately with SHA receipts; interpret a PASS solely within verified provenance and measured scope. Current physical PC1/PC2 post-fix original traces **NOT PROVIDED** to A60; G3 and full G4 HOLD.
- No dotnet/Unity compiler present on A60 host; **do not claim C# tests, Unity compilation or physical Windows execution** from Node-only self-tests.

## W11 finalization — hard binary and selected-SHA gate (2026-10-30)

**Official A70 PR #207:** `173273122c11cbf738e8b954e32506a6196fe8ec`. Each original physical PC1/PC2 JSON must include the exact `sourceSha` (40 hex characters) **and** these *on-device* raw-byte-verified 64-hex SHA256 values:

```json
{
  "sourceSha":"173273122c11cbf738e8b954e32506a6196fe8ec",
  "playerExeSha256":"<64-hex obtained from original PC EXE bytes>",
  "assemblyCSharpSha256":"<64-hex obtained from original PC DLL bytes>",
  "playerManifestSha256":"<64-hex obtained from verified canonical original full-Player file manifest>"
}
```

- **CLI now requires the expected 40-char commit as positional argument 3.** Equal PC1/PC2 source hashes that differ from the frozen selected A70 SHA => `TARGET_SHA_PIN=FAIL` / exit1.
- Both machines must match EXE, `Assembly-CSharp.dll` and full canonical Player-manifest SHA256. Missing all/partial fingerprints => `BINARY_IDENTITY=HOLD` / exit2 even if gameplay snapshots appear equal. Invalid or mismatched complete SHA256 => `FAIL` / exit1.
- This verifies **claims in device-produced JSON**; A60 still must independently hash **the original raw Windows files** from BOTH PCs and their actual manifest before accepting `BINARY_IDENTITY` as independent evidence. JSON self-assertions are not independently corroborated binaries. Do not use RC1/W10 binary manifests for #207.
- Targeted 26/26 Node22 self-test assertions run on exact committed original 15,766-byte script, local SHA256 `4133568e2b9e4990d3dce018c593e3573d1cdb7dc41f79a1b4675143cc6f6408`, Git blob `849a7474f8fe860045686b5b601e3bec41e29cdf`. Additional native CLI synthetic controls: selected #207 with missing binary fingerprints => HOLD; deliberately wrong source pin => FAIL; partial binary fingerprints => HOLD. **No physical PC1-PC2 game run, Windows compiler or Unity launch from A60.**
