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

## R17-W11 FINALIZATION — selected A70 candidate #207

**Selected A70 candidate:** [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207), exact source commit `173273122c11cbf738e8b954e32506a6196fe8ec`.

**IMPORTANT COMPATIBILITY:** #207 includes `CC_W10_NET_HOST`/`CC_W10_NET_CLIENT` **1-Hz sampled** log records, NOT the `CC_NET_TRACE_TX/RX` per-snapshot F1 markers used by the original A81 script above. Thus for #207 use the **NEW** executable:

    node scripts/cc001/w11/a81/verify-candidate207-telemetry.cjs --host PC1_Player.log --client PC2_Player.log --out candidate207-telemetry.json
    node --test scripts/cc001/w11/a81/verify-candidate207-telemetry.test.cjs

The new parser is source-linked to #207's actual `NgoGameSession.cs` marker fields and its `NetworkSnapshotRate.Interval` schedule. It checks byte-size bands 20/12/8/4 Hz (reported `periodMs` 50/83/125/250), remote accepted revisions/actions, client reception counters and only coincidentally matching sampled revisions. It does **not** demand all sampled host/client revisions align: independently timed 1-Hz logs may have no shared snapshot revision even on a healthy connection. It cannot infer packet loss from unmatched samples. It does **not** produce a PC1/PC2 gameplay PASS; all reports carry `gameplayGate=NOT_ATTESTED` and `physicalPc1Pc2Qa=NOT_ATTESTED`.

New CLI exits: `0` = sampled diagnostic completed with no detected metadata inconsistency (NOT a G3 PASS); `1` = anomaly in supplied log metadata; `2` = selected markers missing on one/both sides; `3` = invalid inputs or IO error. Output contains SHA256 receipts and no raw logs, but requires manual privacy review. Operator must independently verify **both original logs came from two distinct machines running the same exact #207 full-player build**; the tool's `schemaAnchorSha` is the original dispatched source schema reference, while `runtimeBinarySourceSha=NOT_VERIFIED` makes clear that captured binary provenance is not established. The A70 #207 branch advanced beyond the original dispatched `173273...` SHA; A70/A72 must agree on and freeze the final exact source SHA before physical QA.

**Original** `verify-snapshot-traces.cjs` is **ALT_HOLD for #207**: it remains usable only if A70 explicitly selects A31's separate PR #184 F1 per-snapshot telemetry in a future isolated candidate. Never substitute its expected marker schema for the selected #207 source.

Both tools are non-authoritative and do not alter Unity, physics, catalog, HP, Mitosis, Furnace, V148, R16, RC1, or Protocol149. Windows build and actual two-PC QA remain A72/A60/A31 responsibilities. Do not start W12 until HQ formally closes W11.
