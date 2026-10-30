# CC-001 — R17-W10 / A51: paired snapshot forensic consistency hardening

**Agent:** A51 — Simulation / Instrumentation / Test Support.  
**HQ:** #97; **A51 workstream:** #125; **own existing draft PR:** #172.  
**Base:** frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`.  
**Scope:** existing A51-owned offline Node trace CLI and test file only. No Unity source, NGO runtime, physics, authoritative simulation, V148, R16 or Protocol149 modification.

## Executable change — one real defect fixed in diagnostic code

W9 A51 analyzer used `Map.set(revision,event)` to assemble host `SNAPSHOT_SENT` and client `SNAPSHOT_APPLIED` evidence. Two records with the same revision could silently replace each other, including a contradictory earlier SHA-256. That is unsafe when assessing a competing W9 multiplayer repair. W10 now preserves the *earliest* row, emits `DUPLICATE_SNAPSHOT_REVISION` ERROR and reports `snapshotParity=INVALID_DUPLICATE_REVISION`. It also:

- detects non-monotonic PC1 snapshot-sent revisions, independent of PC2 snapshot-applied monotonicity;
- allows optional `runId` (safe ASCII length 8–96); refuses same-revision hashes from explicitly different runs, labeling `CROSS_RUN_REVISION_COLLISION` rather than claiming state parity;
- records `snapshotParityScope=SAME_RUN_ID|RUN_ID_MISSING|NOT_PROVEN`, explicitly warning that unbound same-revision pairs do not establish cross-session identity;
- reports unmatched host/client revisions without mislabeling missing observation as actual packet loss;
- rejects a PC2 `LOCAL_TURN_DISPLAYED.localOwner=0` or PC1 `localOwner=1` against the RC1 two-endpoint host P1/client P2 execution contract;
- retains `G3=NOT_CERTIFIED_BY_ANALYZER`, output input hashes, no raw log publication, no automatic defect judgment from legitimate teleport positions.

**Note:** `runId` is a *future external JSONL capture field*, NOT a new Protocol149 field, NOT an existing Unity event and NOT a network-facing change. `SNAPSHOT_SENT` and `SNAPSHOT_APPLIED` with the same `runId`, transport revision and exact payload SHA allow a scoped *payload comparison*, not independent host/client render agreement. A51 tool is not a substitute for A60's actual two-device QA.

## Competing W9 source-owner integration constraints (fetched on 2026-10-30)

All PRs below are draft and individually forked from RC1. There is no validated single combined Windows binary.

| Competing PRs | Shared paths | Owner action required |
| --- | --- | --- |
| A41 #163 / A30 #175 | `Networking/NetworkGameSession.cs`, `Networking/NgoGameSession.cs`, `Tests/NetworkSeatTests.cs` | A70/A31 select one safe version or manual scoped reconciliation; don't combine incompatible cadence/admission patches blindly |
| A20 #168 / A21 #170 / A34 #174 / A30 #175 | `Presentation/MatchView.cs` | A70+UI owners preserve localOwner, deck, turn, aim and smoothing semantics in one version |
| A20 #168 / A34 #174 / A30 #175 | `Presentation/BoardView.cs` | Single camera/aim board transform; don't double-transform pointer or ball visuals |
| A34 #174 / A30 #175 | `Presentation/CoreClashApp.cs`, `BallView.cs` | One non-authoritative smoothing pipeline, no unexamined interpolation plus extra snapshot cadence |
| A50 #169 / A34 #174 | distinct smoother types & implementations | Prefer one proven rendered path, not duplicate unused smoothers |

**Source-truth correction:** frozen RC1 `NgoGameSession.LateUpdate` literally uses `Moving ? .2f : 1f`, so moving = **0.2 s / nominal 5 Hz**, *not* 2.0 s. A30 #175 report claimed 2.0 s for RC1, which disagrees with the directly inspected source. Its proposed 20 Hz cadence, A41 adaptive rate and A34 visual interpolation are competing changes; this report makes **no selection or performance PASS** without a combined-build experiment.

## Actually executed in A51 Linux sandbox

Commands (Node v22.16.0):

```bash
node --check scripts/cc001/w9/a51/pc-pair-trace.cjs
node --check scripts/cc001/w9/a51/pc-pair-trace.test.cjs
node scripts/cc001/w9/a51/pc-pair-trace.test.cjs
```

**PASS:** both syntax checks exit 0; **26/26 deterministic CLI/data-format tests exit 0** (17 existing + 9 newly implemented). Invalid run IDs and deliberate cross-session hash collisions are rejected/flagged. No raw logs have been received from actual PC1/PC2 here.

**NOT_RUN:** C# compilation, Unity 6000.4.0f1 build, two-PC network gameplay, A60 independent QA, physical devices, latency/jitter measurement, rendering smoothness of candidate fixes. No source/runtime PASS claimed. Windows one-shot build is A72-only; integration is A70-only.

## Handoff

- **A70 / #97:** compare each exact live PR SHA before integration. Resolve overlapping network and UI paths deliberately; use the no-duplicate/no-cross-run trace gate on an *actual* combined candidate before G3 qualification. No merge by A51.
- **A31 / #94:** provide opt-in source-owned same-run paired snapshot state hash instrumentation **if** HQ authorizes it. Preserve host authority and Protocol149; avoid treating legitimate Blink/TimeShift relocation as network divergence.
- **A20/A10:** decide one local-P2 turn/view/aim implementation and approved power-meter behavior.
- **A60 / #139:** run new managed/network tests and independently compare paired logs/visual frames for the exact A70 SHA; do not equate synthetic 26/26 Node with physical G3.
- **A72 / #113:** produce Windows binary for the combined candidate only after A70/HQ authorization and dependency gates.

**DESIGNED:** yes (paired forensic contract). **IMPLEMENTED:** yes (own Node analyzer and test fixes). **TESTED:** 26/26 Node + syntax, real G3 NOT_RUN. **INTEGRATED:** no (own draft PR only). **RELEASED:** no. **DISPOSITION:** A51 tool hardened; candidate multiplayer fix still needs independent physical QA.
