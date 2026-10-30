# CC-001 R17-W11 / A81 — F1 TX/RX snapshot metadata verifier

**Role:** A81, isolated offline validation. **No changes to Unity, Protocol149, RC1, R16, V148, game physics or Windows build.**

The standalone Node.js tool compares A31 F1 opt-in PC1 host **CC_NET_TRACE_TX** with PC2 client **CC_NET_TRACE_RX** telemetry from A31 PR #184 (stacked on A41 PR #163). It pairs exact snapshot revision and checks authoritative action serial, turn, phase and chunk count. TX bytes are validated as nonzero, not compared to unavailable RX bytes.

Run on private, independently captured PC1 and PC2 original Player.log from the *same* match and build:

    node scripts/cc001/w11/a81/verify-snapshot-traces.cjs --host PC1_Player.log --client PC2_Player.log --out a81_trace_report.json
    node --test scripts/cc001/w11/a81/verify-snapshot-traces.test.cjs

**Exit 0** means CONSISTENT_SAMPLED_METADATA_ONLY for >=2 paired snapshots with no mismatches/missing records. **Exit 1** means supplied metadata anomaly; **exit 2** means insufficient samples/evidence; **exit 3** means input or output error, including refusal to overwrite an existing report. Every report states gameplayGate=NOT_ATTESTED and twoPcPhysicalQa=NOT_ATTESTED. No claim of independent A60 QA or G3 PASS is possible from this tool.

Inputs are capped at 32 MiB per log. Report includes SHA-256 + byte size of each raw log, not the raw logs or local file paths. The person handling the evidence must verify that captures belong to separate physical PCs and the same exact source SHA. This CLI does not authenticate origin or the build. Preserve raw logs privately and review report for privacy before posting.

**Limits:** F1 must actually have been enabled and A31 telemetry integrated; legacy RC1 logs alone are insufficient. Unpaired revisions or gaps can arise from F1 toggling or capture-window mismatch; they are NOT proof of packet loss. The reported local monotonic tms values must never be subtracted across machines to infer one-way latency. Metadata consistency does not prove equal serialized full GameState, ball poses, collision/physics, render interpolation, frame pacing or user-facing turn correctness. Those require A70's selected combined build plus A60's real two-PC QA.

**Ownership:** no merge/auto-merge by A81. A70 chooses integration, A72 builds Windows, A60 independently validates two-device output. Existing PR #161 provides a separate strict owner-token parser for legacy events and remains independent.
