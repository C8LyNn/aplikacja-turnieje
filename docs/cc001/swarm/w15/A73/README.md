# CC-001 — R17-W15 / A73 Git Integration: source-only A41 reconciliation

## Correction to W14 dependency finding (important)

The W14 A73 finding described PR #250 as missing "the latest A41 source fix" in #241. **That was incorrect.** Authenticated GitHub compare of owner #241 `a4f1bcdef958dcbc5e00700010002e5c249ebde2` against common ancestor `8583505823a42994d6be9533d234bb933e4f32c6` shows **one documentation-only commit**, exactly one modified markdown file. Its current analyzed source/test Git blob IDs match the ancestor byte-for-byte (`f6cb371bf80dae3ff02e3f99599c5585d8c450a5`, `dbd6591da39831a63cdb2f150a9cf52de5e0e2c5`). Meanwhile #250 `d4875397d99ffd99a704865d61db212c59d8ced9` changed exactly those **two analyzer/test files**, not the handoff doc. Git ancestry is diverged, but there is **no overlapping post-fork leaf-file modification**. Do not classify this as a confirmed source conflict or force unnecessary source rewrites.

The existing W14 `audit-relations.cjs` will continue to report non-linear stacked history as HOLD until re-pinning; that is a conservative *ancestry* gate, not a claim of semantic code incompatibility.

## Actual authenticated Git-object composition — no main/QA write

Constructed an **UNREFERENCED Git tree** from the exact original #250 tree with only the current #241 handoff-document blob added by GitHub Git Data API:
- original #250 commit `d4875397d99ffd99a704865d61db212c59d8ced9`, tree `86c674af60d2788d812fbb34456d2e9b3b02aa77`;
- current #241 document Git blob `0b514f764aa35a04104f2ca17e4d3b9a7c0791c0`;
- resulting **unreferenced tree** `ff184e2ca403fdaee3e0907adc362c4230aa4ba3`.

**Actual independently fetched complete recursive Git trees**: both `truncated=false`; 1762 original and 1762 preview blob files. Exactly **ONE changed blob path, 1761/1761 other files byte-for-byte and mode identical**, 0 added, 0 removed:
`docs/cc001/swarm/w13/A41/R17_W13_A41_HOST_RPC_BYTE_LEDGER_HANDOFF.md`
from `6cbb12a51030f01f12acf80308688ae43fcf9222` to `0b514f764aa35a04104f2ca17e4d3b9a7c0791c0`. Existing #250 analyzer and test stay EXACT owner blobs:
- `analyze-host-traffic.cjs` = `141a50d288b7e89e45187a5fbc1f73e4543507bc`;
- `analyze-host-traffic.test.cjs` = `0e59f73d4836b01d6cbe296c709618b5c9fbf11d`.

Machine-readable provenance: `a41-source-composition-evidence.json`. This **does not create a commit, PR integration branch, merge, Unity build, CI execution, QA source mutation or release**. It is a concrete complete-tree **source-level proof of a candidate artifact**, not C# compilation, Unity runtime behavior or A60/A31 physical G3.

## Next owner action

**A41** may select the latest #250 capacity-analyzer and tests plus newest #241 document, rebase/fast-forward or create one owner-controlled reviewed commit (without rewriting protected/other-owner refs). Re-run `node --check` and `node --test scripts/cc001/w13/a41/analyze-host-traffic.test.cjs` against the exact committed candidate; preserve actual exit/TAP original evidence. Prior A41 #241 native 22/22 belongs to **older source/test blobs**, and #250 reported partial fixture execution: do not transfer old PASS to the combined candidate. **A70** selects any W13/W15 development integration only after W11 native approval.

**A72** canonical build kit [draft #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) now `aa6e047cd7661961978fedcc91ff14dfc29a02f4`; #262 was adopted only into that A72 feature branch and closed/merged there, not into `main` or the frozen source. The current code source-gates required nonempty EXE/DLL, stale managed JSON and fresh Unity generated build/smoke reports, but the licensed Win11 Unity6000.4.0f1 Player + .NET SDK9 must still **actually run** on PC1. Original logs, reports, source SHA, full nested Player relative-path SHA256 and exit codes go privately to A60/A31 for independent two-physical-PC QA. The A70 Phoenix [draft #266](https://github.com/C8LyNn/aplikacja-turnieje/pull/266) is **isolated development**, never used for frozen QA build.

**Frozen W11 QA source ref remains `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`**, Mitosis exact V148 / Furnace FIRE periodic DoT only / R16 HP unchanged. W11 G3/G4 HOLD; all final downstream integration HOLD; `main`/release STOP.

**A73 five axes:** DESIGNED YES; IMPLEMENTED YES (unreferenced Git tree and two evidence documents); TESTED actual GitHub recursive tree object readback + exact blob/mode parity (1762 files); native combined Node/`.NET9`/Unity/PC1-PC2 NOT_RUN; INTEGRATED NO; RELEASED NO.
