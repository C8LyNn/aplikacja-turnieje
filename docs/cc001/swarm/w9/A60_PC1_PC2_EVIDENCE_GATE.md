# CC-001 / R17-W9 — A60 independent PC1–PC2 regression gate

**Identity:** A60, Independent QA. **Source base:** RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`. **Scope:** offline, test-only, isolated branch. No implementation, network connection, Unity launch, build, protected source modifications, or release.

## Executable verification

```sh
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w9-two-pc-gate.cjs --self-test
node unity/cc001-r16/CoreClash-V149-Unity/Tools/qa/cc001-w9-two-pc-gate.cjs /private/path/PC1.json /private/path/PC2.json
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
- **P1 aiming:** measured viewport board rect and actual arrow endpoints must be finite and remain within board bounds. Perspective inversion awaits explicit A10 contract.
- **P2 strength bar:** no enforced redesign until A10 approves.

**Existing RC1 finding:** NGO host sends full state snapshots at around 5 Hz during `Moving`, `CoreClashApp.ReceiveNetworkState` directly assigns `Simulation.State=state` on client, and `MatchView.TurnText` renders `YOUR SHOT` without comparing `NetworkLink.LocalOwner`. These source facts help implementation owners reproduce defects; they are **not** proof of the network RTT, actual interpolator performance or a fixed build. Rendering perspective still awaits a design decision.

**Evidence security:** keep machine names/local IPs, join codes, account directories and LAN topology out of public issue attachments; save raw originals privately and publish redacted summaries. Never expose inbound LAN port to public WAN.

**Handoff:** A31 #94 + code owners for diagnostic trace/repair; A60 #139 only independent verifier; A70 integration after actual P0 regression PASS; HQ #97. No main merge/release, no new gameplay source edits by A60.
