# CC-001 R17-W15 — A51 lost W12 patch recovery / PC1↔PC2 offline metadata

**HQ** #97 | **Role** A51 Simulation & Instrumentation | **Source parent** A51 W14 PR #255 SHA `32ff66e177bdcdd075ce63e877a0201d656d881c` | **Delivery** independent stacked DRAFT W15.

## Exact confirmed defect, not a game runtime defect

The W12 A51 correction was genuinely implemented in PR #172 exact commit `cb09b0b3d36c33add8c36b1ac984ff4a31045c48`, but W12 PR #223 was created from the older PR #172 commit `785e9360b54dd0ae5ffb1a292f77de7aa5d7b59c`. As a result, the PR #223→#248→#255 stacked HEAD did **not** contain the later W12 A51 `sharedFieldMismatches` correction, helper nor three test cases. W15 fixes this **lost source integration**, not a newly discovered network bug and not a competing implementation.

The A41 W10 HOST marker contains `chunks`; A41 W10 CLIENT marker does not. Old W14 A51 parser always compares `chunks` and emits a false `SAME_REVISION_FIELD_MISMATCH` for healthy A41 pairs (G3 remains HOLD). V8 execution of byte-authentic GitHub old parser showed 1 fabricated chunks mismatch and `HOLD_ERRORS`. Actual already-proven PR #172 corrected parser reports 0 findings and `MATCHED_METADATA_ONLY`. For A31 TX/RX with both chunks fields, a true count divergence remains detected.

## Code / provenance (original W12 blobs restored byte-for-byte)

1. MOD `scripts/cc001/w11/a51/native-snapshot-trace.cjs` — Git blob `f12224b95d174f06203a1e8ff9ef628d867afbb2`.
2. MOD `scripts/cc001/w11/a51/native-snapshot-trace.test.cjs` — Git blob `afc1494be56f774708faab28011ae3a4be0211c2`, total **48 existing authored** tests including the original three W12 coverage cases.
3. ADD `scripts/cc001/w12/a51/native-metadata-shared-fields.cjs` — Git blob `9baf6a2c8e3faa93fde317e0d033f1b8882e7d97`.
4. ADD `scripts/cc001/w12/a51/native-metadata-shared-fields.test.cjs` — Git blob `0242e3cd6bd109740aae59279d478608b3a20540`, 14 cases.

All 4 files obtained from **the original author commit**, not rewritten, and uploaded/fetched GitHub blobs each **4/4 identity PASS**. W15 also adds `scripts/cc001/w15/a51/native-trace-stack-regression.test.cjs` (9 new end-to-end unit/CLI regression definitions) and this report plus package JSON. A51 W14 severity gate from #255 remains intact.

## Actual test evidence (separate scopes, no status inflation)

- Native Node **v22.16.0**, original restored helper/tests reconstructed **byte-identical** to GitHub/Git blob; both `node --check` exit0; original `node --test scripts/cc001/w12/a51/native-metadata-shared-fields.test.cjs`: **14/14 PASS**, 0 FAIL, process exit0. Local exact source Git blob `9baf6...`, test blob `0242...`.
- V8 execution of authentic GitHub parser before/after: valid A41 sample **before** one false chunks mismatch / `HOLD_ERRORS`; **after** zero mismatch / `MATCHED_METADATA_ONLY`. A31 mismatched chunks still flagged. The actual final W15 GitHub parser + helper + W12 freeze gate + W13 accounting source evaluated through V8 with stubs for Node built-ins: **8/8 focused semantics PASS** (not native CLI).
- W15 new 9 native `node:test` test cases **AUTHORED, NOT_RUN in OS Node**. Full existing W11 48, W12 freeze 24, W13 18 and W14 12 cases **NOT_RERUN NATIVELY** in W15: no complete local private checkout. Do not copy prior 54/54 claim as W15 new execution.
- No original Unity Windows Player, .NET9 compiler, or physical PC1/PC2 source logs were available; those native gates are NOT_RUN. No G3/G4 PASS.

**Run in full authorized Git checkout** (all W15 stacked dependencies present):

```sh
node scripts/cc001/w11/a51/native-snapshot-trace.test.cjs
node --test scripts/cc001/w12/a51/native-metadata-shared-fields.test.cjs scripts/cc001/w12/a51/freeze-trace-gate.test.cjs scripts/cc001/w13/a51/trace-accounting.test.cjs scripts/cc001/w14/a51/freeze-trace-severity.test.cjs scripts/cc001/w15/a51/native-trace-stack-regression.test.cjs
```

The first suite uses its own simple Node assertion runner; do not conflate its printout with TAP test counts.

## Native P0 blocker / operator PC1 handoff

A72 [Draft #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) has already adopted generated-Unity-report #262 **within A72's feature branch only**. A51 neither edits nor reimplements it. The operator on authorized **Windows 11 PC1** with **Unity 6000.4.0f1 Windows x64 Build Support and valid license, Node 22, .NET SDK 9, private Git credentials** must check out A72's current feature branch, verify runner files/hashes and execute the existing `scripts/cc001/w10/a72/URUCHOM_W11_PR207.cmd` (legacy filename, frozen SHA pinned in its contents). Keep intact original fresh `.NET9` run/test JSON, Unity Editor/Build log, newly regenerated smoke/build JSON, complete Win64 Player directory EXE/DLL + every nested file SHA256, archive/reconciliation ledger and exact source/QA SHA. Any exit or source/provenance mismatch = **HOLD**.

A60/A31 then must run exactly the same attested binary on **two distinct PCs**, capture both original Player.log/frames, test seat/turn/aim/power, P2 single action, ball smoothness/teleport and authoritative state parity, attach SHA receipts privately, and independently decide G3/G4. Offline A51 metadata can supplement but never replace their QA. Newer A70 #207 and Phoenix DEV #266 must NOT be built or mixed into W11 freeze.

**Immutable source:** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`; untouched. Mitosis exact V148, Furnace only FIRE area+periodic damage, HP R16, Protocol149, RC1/main/release untouched. **No merge or release.**

**Five-axis:** DESIGNED YES / IMPLEMENTED YES / TESTED native Node14 PASS + scoped V8 8 PASS; W15 native full/Windows/.NET9/PC1+PC2 NOT_RUN / INTEGRATED NO (stacked Draft) / RELEASED NO.
