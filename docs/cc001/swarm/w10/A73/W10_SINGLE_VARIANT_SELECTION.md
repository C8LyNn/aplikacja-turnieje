# CC-001 — R17-W10 / A73 — ONE-VARIANT INTEGRATION INPUT (NO MERGE)

**Authority:** W10 HQ user dispatch, role A73 Git Integration. **Baseline:** frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`. **Status:** provisional A70/HQ decision support; not an HQ merge approval, not QA.

## Provisional candidate for first isolated compile / device build
**PR #175 / A30** `fix/cc001-r17-w9-a30-multiplayer-repair`, pinned HEAD `e6470dce9ff02fc294c4df15bde82952350b42b2` as independently read via GitHub. RC1→HEAD ahead=9, behind=0, merge-base=RC1. Nine exact paths (two networking; five presentation; two changed managed test suites), all file Git blob SHA-1 independently fetched and pinned in `w10-a30-pinned-selection.json`. This is the **one selected implementation for initial verification**, not a declaration that code is correct. Actual clone-based gate on this private ref: NOT_RUN here (container DNS to GitHub exit 128). GitHub exact-source path/blob comparison: PASS 9/9.

A30 source proposes 20Hz moving authoritative snapshots, local-seat turn labeling, vertical P2 board/input coordinate round-trip, clipped aim. Important risk: full-state 20Hz network cost/backpressure and actual P2 input/render correctness are **UNTESTED**. A60/A72 must compile and test on ONE exact assembled SHA and PC1/PC2 before accepting, then A70 controls isolated integration. **G3 and G4 HOLD**.

## Explicitly excluded competing implementations / overlap ownership
All refs were independently compared to frozen RC1; recent PRs may keep moving, so only pinned SHA is valid.

- **PR #163 / A41**: overlaps A30 on `NetworkGameSession.cs`, `NgoGameSession.cs`, `NetworkSeatTests.cs`. Its adaptive cadence (12/8/4Hz) and stale intent ACK protections are an **alternative/network improvement**, not compatible with blindly taking A30's 20Hz implementation. A70 should ask A30/A41 to reconcile ACK semantics on their own authorized source before extending candidate.
- **PR #168 / A20**: overlaps A30 on `BoardView.cs`, `MatchView.cs`, `PresentationTests.cs`; matrix-free aim option competes with A30 board transform/clipping.
- **PR #174 / A34**: overlaps A30 on `BallView.cs`, `BoardView.cs`, `CoreClashApp.cs`, `MatchView.cs`; introduces a different display interpolation path with test registration and Unity .meta. Cannot import its whole PR unchanged; not tested with A30 P2 180° viewpoint.
- **PR #170 / A21**, **#173 / A32**, **#160 / A83**: all touch `MatchView.cs` and/or related test wiring, competing P2 local-turn/deck copy. Do not merge whole branches.
- **PR #169 / A50**: three disjoint files, but the new smoother helper is *not wired to presentation*. Including it without a single selected renderer integration adds unused complexity and cannot repair visual stutter alone.
- **P1 strength/power bar**: A10 acceptance not confirmed in current HQ evidence; do not remove UI in A73.

Other tooling/test PRs can be admitted later by separate owners and only if scope, source hashes and independent test gates allow it. **RC1, original R16/V148, Protocol149, main untouched.**

## Executable W10 A73 gate
```sh
node docs/cc001/swarm/w9/A73/guard-short.test.cjs
node docs/cc001/swarm/w9/A73/guard-short.cjs --manifest docs/cc001/swarm/w10/A73/w10-a30-pinned-selection.json
```
The manifest is a **provisional exact-SHA candidate selector**, NOT proof of HQ source ownership approval. The second command requires a disposable FULL Git clone containing RC1 and the A30 author ref. On approved matching Git objects, the gate compares SHA, ancestry, changed test sources, **every changed Git blob**, forbidden/protected paths and conflicts. Exit0 means `PASS_SOURCE_SCOPE_ONLY` (not compilation/gameplay); exit1 `HOLD`; exit2 `HOLD` invalid manifest/tool. Pairwise merge-tree writes only unreachable objects into the disposable clone, never protected refs.

**Actual synthetic checks:** Node v22.16.0 / Git v2.47.3, 11/11 PASS exit0; includes wrong/missing/extra blob SHA pins, duplicate owners, modified protected file and unchanged refs. **NOT_RUN:** C#/.NET9, Unity Windows rebuild, paired physical PC1/PC2 run, network packet jitter, A60 independent QA, A70 integration and release.
