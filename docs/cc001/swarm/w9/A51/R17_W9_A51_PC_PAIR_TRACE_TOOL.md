# CC-001 R17-W9 / A51 — PC1–PC2 snapshot/turn evidence tool

**AGENT:** A51 Simulation / Instrumentation  
**HQ:** #97; **existing A51 test support:** #125; **primary networking owner:** A31 #94  
**SCOPE:** isolated Node 22 offline tooling and executable negative-control tests; NO gameplay/NGO/presentation edits.  
**BASE:** exact frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, Unity 6000.4.0f1, Protocol149.  
**STATUS:** implementation of A51 diagnostic tooling complete; PC1–PC2 real trace acceptance **NOT_RUN**.

## Source-grounded mechanism candidates — not proven root causes

- `Assets/CoreClash/Networking/NgoGameSession.cs`, RC1 Git blob `5538f6d2a930aa1a358af420e4be1f339477830c`: `LateUpdate` selects `nextSnapshot=Time.unscaledTime+(phase==Moving?.2f:1f)`. It sends whole compressed snapshots via `SnapshotChunkRpc`; `ReceiveChunk` updates client adapter and calls `app.ReceiveNetworkState`. `CC_NET_STATE_APPLIED revision=...` is emitted **ONLY on the first snapshot**. `CC_NET_INTENT_ACCEPT owner=1 seq=... action=...` is emitted on host accepted P2 commands.
- `Assets/CoreClash/Presentation/CoreClashApp.cs`, RC1 blob `33be4b892d85bd3b68d08a1a79d5aab39d256600`: client `Update` only steps local simulation if authority (`NetworkLink==null||IsAuthority`). Thus a no-prediction client displays discrete host state updates. This is a high-confidence **source explanation for apparent 5 Hz position updates**, not proof that observed stutter is caused exclusively by this cadence.
- `Assets/CoreClash/Presentation/BallView.cs`, blob `2d0d4e088b840c35f36df491b4ee790529d5afc3`: rendering uses `ball.x/ball.y` directly, without frame-based interpolation. A31/A20 own future fix; A51 does not alter rendering.
- `Assets/CoreClash/Presentation/MatchView.cs`, blob `27ea11641dd0caf59fee80599f973e693856c0c5`: `TurnText()` emits `YOUR SHOT` after checking only phase/moving/bonus, not `NetworkLink.LocalOwner` — **source-confirmed incorrect local-turn wording** on PC2, separate from authoritative turn ownership. A20/UI ownership; A51 adds detection, NOT a UI edit.
- P2 top position/aim-arrow/strength redesign are A10/A20 decisions; test support does not change perspective or gameplay rules.

## Delivered executable utility

- `scripts/cc001/w9/a51/pc-pair-trace.cjs`: Node22 CLI; reads native `Player.log` from PC1/PC2, optional richer JSONL stream, outputs a privacy-minimized JSON report.
- `scripts/cc001/w9/a51/pc-pair-trace.test.cjs`: real self-contained Node negative/positive-control tests, no npm dependency.

CLI (offline; never makes network requests):

```sh
node scripts/cc001/w9/a51/pc-pair-trace.test.cjs
node scripts/cc001/w9/a51/pc-pair-trace.cjs --pc1 /private/PC1/Player.log --pc2 /private/PC2/Player.log --out /private/cc001_w9_pair_result.json
# When an A31-approved, separately instrumented client/host JSONL exists:
node scripts/cc001/w9/a51/pc-pair-trace.cjs --pc1 /private/PC1/Player.log --pc2 /private/PC2/Player.log --events /private/snapshot_trace.jsonl --out /private/cc001_w9_enriched_result.json
```

`--out` is exclusive-create; existing reports are never overwritten. Reports record SHA256/byte count of inputs, never raw IP, peer transport IDs, join codes, raw Player.log lines or credentials. Local raw logs must remain private; review redacted reports only.

### OPTIONAL enriched capture schema: `CC001_R17_W9_A51_TRACE_V1`

One JSON object per line, per-peer increasing `sequence`:

```json
{"schema":"CC001_R17_W9_A51_TRACE_V1","peer":"PC1","sequence":1,"kind":"SNAPSHOT_SENT","revision":12,"stateHash":"<64 lowercase hex SHA256>"}
{"schema":"CC001_R17_W9_A51_TRACE_V1","peer":"PC2","sequence":1,"kind":"SNAPSHOT_APPLIED","revision":12,"stateHash":"<same 64 lowercase hex SHA256>"}
{"schema":"CC001_R17_W9_A51_TRACE_V1","peer":"PC2","sequence":2,"kind":"FRAME_PRESENTED","balls":[{"id":1,"x":123.4,"y":550.6}]}
{"schema":"CC001_R17_W9_A51_TRACE_V1","peer":"PC2","sequence":3,"kind":"LOCAL_TURN_DISPLAYED","localOwner":1,"turnOwner":0,"isAiming":true,"label":"TURN 1 / 50 PLAYER 1 / YOUR SHOT","cameraBottomOwner":0}
```

**Important:** these are proposed *external forensic telemetry fields*, NOT existing Protocol149 wire fields, NOT proof that RC1 writes this JSONL. The stateHash MUST represent the SHA256 of the **same exact `SessionSnapshot.stateJson` bytes**, captured prior to the transport and from the received payload before model reserialization; never compare hashes of independently serialized object graphs. No source/game/transport instrumentation is committed in A51's PR.

`SNAPSHOT_SENT` + `SNAPSHOT_APPLIED` with exact same revision and hash can indicate raw payload parity for that revision, but not an independently proven simulation/visual convergence; if hashes absent, parity is `NOT_PROVEN`. `FRAME_PRESENTED` position jump is an **OBSERVATION**: Blink / Time Shift / physics interactions can legitimately relocate an entity. A `LOCAL_TURN_DISPLAYED` row with incorrect localOwner state is a UI invariant failure. UTC timestamps alone do not justify one-way network latency: clock-offset calibration required. Nothing in this tool declares G3 PASS or verifies real PC2 runtime without operator evidence.

### Actual tests and boundaries

- `node --check scripts/cc001/w9/a51/pc-pair-trace.cjs` — **exit 0**.
- `node scripts/cc001/w9/a51/pc-pair-trace.test.cjs` — **exit 0, 17/17 PASS**. Exercises real CLI child process success/failure, malformed JSON, false owner display, out-of-order revision, duplicate sequence and ID, deliberate state mismatch, large displacement classified only observationally, source hash, output non-overwrite and deterministic repeat.
- `dotnet --version`: **NOT AVAILABLE** (`command not found`) in A51 environment; tests here are Node only.
- RC1 Windows build / two actual Player.log raw files / actual synchronized host-client revision series / native NGO transport / physical replay: **NOT_RUN** by A51. Existing user/operator two-Windows connection is historical operator evidence, not an independent A51 execution.

### Next engineering ownership (source code repair is NOT this PR)

1. **A31**: implement host-to-client snapshot cadence/presentation buffering strategy in separately owned networking code after HQ file-scope allocation, including stale revisions, late arrival and no false client authority. Instrument real `SNAPSHOT_SENT`/`SNAPSHOT_APPLIED` for at least one P2 shot; preserve Protocol149.
2. **A20**: implement local-turn UI using `NetworkLink.LocalOwner` and safe P2 view/aim transformation on its own branch; A10 validates perspective/shot-strength UX.
3. **A60**: independent QA with two physical machines and actual raw timestamped logs; check that interpolation does not alter authoritative state, and verify perspective/aim/path in both clients.
4. **A70/HQ**: cherry-pick/review only accepted isolated source patches into disposable next candidate; do not mutate RC1, R16 or protected V148.

**DESIGNED:** YES, forensic trace schema. **IMPLEMENTED:** YES, runnable offline tool + tests. **TESTED:** 17/17 actual Node; real G3 NOT_RUN. **INTEGRATED:** NO. **RELEASED:** NO. **STATUS:** A51 TOOL DELIVERED — RUNTIME REPAIR STILL OPEN.
