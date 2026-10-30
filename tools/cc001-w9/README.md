# CC-001 R17-W9 — A43 PC1/PC2 network trace analyzer

**Scope:** non-invasive diagnostics for the existing Unity Windows Player `Player.log` pair. No change to game/RC1/Protocol149, no transport modification, no gameplay interpolation or turn ownership logic, no deployment.

## Run

```bash
node tools/cc001-w9/pc-pair-trace.cjs --host PC1_Player.log --client PC2_Player.log --out pc-pair-report.json
node --test tools/cc001-w9/pc-pair-trace.test.cjs
```

The report contains **counts and derived fields only**. It excludes raw log lines, peer IDs, IP addresses, join codes and free-text error messages. Do not commit original logs, screenshots with names/IP addresses or secret invitations. Collect player logs with owner consent; redact before sharing evidence to HQ #97. Maximum file size per input: 16 MiB. This tool makes no network requests.

## Existing RC1 log coverage

`CC_NET_HOST_READY`, `CC_NET_PEER_CONNECTED`, `CC_NET_INTENT_ACCEPT owner=1`, `CC_NET_INTENT_REJECT`, `CC_NET_STATE_APPLIED`, `CC_NET_SNAPSHOT_ERROR`, `CC_LAN_CONNECTION_FAILED`. In RC1, `CC_NET_STATE_APPLIED` is printed only for the **first** applied snapshot; do not interpret this as continuous revision progression or infer packet loss from it. Legacy logs cannot establish real-world visual teleportation, round-trip latency, correct player-relative UI, or frame-level smoothness by themselves. A real two-PC run remains necessary.

## Optional future producer event contract — no game-byte injection in this PR

An A31/A40-approved, newly certified game build may emit one `CC_W9_TRACE ` JSON object per log line. The analyzer currently admits six safe event types:

| Event | Fields required for meaningful analysis | Observed on |
| --- | --- | --- |
| `snapshot_sent` | `revision`, optional `actionSerial` | host |
| `snapshot_applied` | `revision`, optional `monotonicMs` since local session startup | client |
| `intent_accepted` | `owner` (0/1), optional `sequence` and `actionSerial` | host |
| `turn_state` | `revision`, `turn` (0/1), `localOwner` (0/1), `phase` (`aiming`, `moving`, `over`), `banner` (`your_turn`, `opponent_turn`, `inactive`) | both |
| `ball_state` | `revision`, `actionSerial`, `ballId`, `layer` (`simulation`/`render`), finite `x`, `y` in game-world coordinates | both |
| `client_error` | safe enumerated error code, not raw messages | both |

Example synthetic event (not proof of actual runtime logging):

```text
CC_W9_TRACE {"type":"turn_state","revision":4,"turn":0,"localOwner":1,"phase":"aiming","banner":"opponent_turn"}
```

Host/client samples are compared **only** with identical `(revision,actionSerial,layer,ballId)` keys. Distances are in game-world units. The optional `--drift-threshold 0.25` generates an *observed distance-above-threshold* flag; `0.25` is illustrative, NOT a certified pass/fail criterion. Missing, sparse or mismatched samples give unknown/coverage results. Snapshot gaps may reflect sampling, not packet loss.

`turn_state` is deliberately scoped to display semantics; if `phase=moving` or `over`, the `banner` must be `inactive`. This contract does not claim that the underlying engine's ability to accept a new action is fully represented by the phase alone. Host is always local owner 0; PC2 client is owner 1 in Protocol149. Structured producer hooks would require a separate A31/A20 integration and A70/A60 recertification. No producer hooks are part of this PR.

## Report interpretation

- `OBSERVED_CONTRADICTION` — evidence contains a revision regression, locally inconsistent banner/owner, or optional paired-ball distance over supplied threshold; not automatically a gameplay root cause.
- `INSUFFICIENT_EVIDENCE` — vital fields absent; **never PASS by default**.
- `OBSERVATIONS_AVAILABLE_NOT_QA_PASS` — observations exist without detected contradictions. Independent A60 real-device QA is still mandatory.

**Never subtract wall-clock timestamps across PC1 and PC2 for transport latency.** Only per-device monotonic intervals are computed. For end-to-end latency, an independently verified clock-sync method or round-trip echoed nonce with monotonic timestamps is required (future separate authorization). Real rendered-frame teleportation evidence requires render-layer samples or video; simulation-layer agreement is not enough.

## Integration boundaries

A43 owns this offline diagnostics and schema. A31 owns authoritative network updates/interpolation; A20 owns P2 perspective, aim UI, header semantics; A10 owns design approval for strength meter; A60 owns independent QA and A70 candidate integration. Frozen `integration/cc001-r17-w8-phoenix-rc1`/RC1, R16, V148, Protocol149 and main remain unchanged; **PR review only, no merge/release**.
