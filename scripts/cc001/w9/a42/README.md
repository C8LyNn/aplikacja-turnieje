# CC-001 R17-W9 — A42 PC1/PC2 regression evidence gate

**Scope:** additive offline Node 22 diagnostic test harness. Depends on A31 `scripts/cc001/w9/a31/analyze-network-logs.cjs` (base branch `feat/cc001-r17-w9-a31-network-trace-20261030`, SHA `654cd8535bb52a05416667651298c050d7112de7`). Neither existing A31 analyzer nor RC1 gameplay is edited.

## Run

```sh
node --test scripts/cc001/w9/a42/verify-pc-pair.test.cjs
node scripts/cc001/w9/a42/verify-pc-pair.cjs --host PC1_Player.log --client PC2_Player.log --out pc-pair-result.json
```

Exit codes: `0=TRACE_CONSISTENT`, `1=FAIL`, `2=INCOMPLETE_EVIDENCE`, `3=INPUT_OR_OUTPUT_ERROR`. Exit 0 **does not mean G3 PASS**. Evidence belongs to A31 and independent QA A60.

What is machine-checked: P2 host seat binding; P2 local launch owner; accepted host remote intent sequence/action; at least two host TX and client RX samples; strict nondecreasing snapshot turn/action and increasing revisions; same-revision host/client `(actionSerial, turn)` agreement; accepted P2 action visible in an overlapping newer client snapshot; no fatal network markers. Output includes SHA-256 and byte counts of the original logs; `--out` refuses to overwrite prior evidence.

**Fail-closed:** missing logs, markers or overlap yield `INCOMPLETE_EVIDENCE` instead of invented success. Contradictory traces yield `FAIL`. Local `tms` clocks are **not** subtracted across devices. Matching only `actionSerial/turn` is **not a complete snapshot data/state checksum** and cannot prove eliminated teleporting, measured lag, or PC1–PC2 gameplay parity.

**Not tested or changed:** physical network, actual PC1/PC2 runs, Unity build, release, production, Protocol149 format, RC1, R16, V148 or gameplay/UI logic. A31 trace instrumentation must exist in the tested actual builds before the gate can pass with real logs; original RC1 may only produce `INCOMPLETE_EVIDENCE` because it lacks per-snapshot TX/RX markers. Preserve raw Player.logs privately and remove IPs, usernames, join codes and tokens from shared evidence.

Integration: PR targets the isolated A31 W9 trace branch rather than `main` or protected RC1; A70 chooses later integration. No CI workflow registration/activation, no merge.

## Synthetic test matrix

1. matching TX/RX with accepted owner=1 intent;
2. mismatched action serial;
3. mismatched turn;
4. out-of-order revisions;
5. duplicate accepted P2 sequence;
6. accepted action not observed on PC2;
7. missing local P2 identity marker;
8. empty logs;
9. regressing snapshot action serial;
10. CLI SHA/size receipt with non-overwrite semantics.

Local test at Node v22.16.0: **10/10 PASS** using A31 analyzer content copied from the exact connected GitHub source at SHA `654cd8535bb52a05416667651298c050d7112de7`; this is a synthetic/unit test only, not Unity build nor A60 QA.
