# CC-001 R17-W12 — A44 frozen QA pair integrity intake

**A44 External Playtest Infrastructure** | HQ #97 | **source freeze:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` | immutable reference branch `integration/cc001-r17-w11-qa-freeze-20261030`.

This is **NOT** GitHub PR #207's moving HEAD. At authoring time the moving A70 PR #207 was `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c`. None of its post-freeze changes may be mixed into the frozen QA run. V148 Mitosis, FIRE-only Furnace, R16 HP, Protocol149 and RC1 are protected and unchanged by this package.

## What this code actually does

`verify-frozen-pair.cjs` is an offline operator-side coordinator. It requires a genuine **new A72 native Windows Player build** for the exact frozen SHA, and uses **the original independent A72 complete-folder Player verifier** on **two different local directories**. It **does not duplicate** A72 file-walker, Unity build, or A60 network QA.

1. Validate the original A72 `summary.json`: schema `CC001-W10-A72-WINDOWS-1`, `candidateSHA` exact frozen `3f972...`, `rc1Base` exact RC1, `PASS_BUILD_EVIDENCE_ONLY`, zero blockers, complete Player inventory (including EXE and Assembly-CSharp.dll) with safe unique names and original SHA256/bytes.
2. Require the operator-provided A72 verifier's SHA256 to match the separately supplied expected SHA256; **A60 must independently authenticate its source/provenance**. A matching *user-supplied* digest alone cannot authenticate arbitrary code.
3. Invoke that unchanged A72 executable verifier twice, on **two disjoint nonnested Player root directories**; insist on process exit code 0 and parse `PASS_BINARY_INTEGRITY_ONLY`, exact source SHA, correct 100% inventory counts and empty mismatch list. Preserve the stdout SHA256, but do not embed user paths or raw stdout.
4. Check A44 W10 existing session record: both EXE hashes must match A72 full Player inventory, expected RC1 baseline, PC1/PC2 log digests present, and immutable independent A60 QA HOLD. Produce a **single no-overwrite JSON receipt** linking the original A72 manifest and A44 session JSON SHA256.

**Critical limitation:** two folders accessible on one computer are **not proof of two physically separate Windows PCs**. This script cannot independently prove that A72 verifier or operator-supplied summary was authentic, that Windows build succeeded, that the game was played, that both PCs were on the same LAN, that physics/visuals are smooth, or G3/G4. This tool sets `physicalDeviceAttestation=NOT_ATTESTED_BY_A44`, `qaDisposition=PENDING_INDEPENDENT_A60_PHYSICAL_QA`, and `releaseApproval=NO` even after its own scoped PASS. Do not submit Player.log or IP/secrets publicly.

## Operator instructions (Windows PowerShell, Node 22)

**Prerequisite A70/A72:** A70 freezes QA ref at exact SHA. A72 actually compiles that exact source using Unity 6000.4.0f1 Windows target and supplies its original `summary.json` + full Player folder. The W10-only build launcher or an old RC1/other PR207 SHA is **not** valid. A72's own exact-SHA/ref admission must allow this frozen W11 ref without bypassing security gates.

**Prerequisite A44:** from prior own PRs #164 and #183, capture PC1/PC2 Unity Player.log privately using W9 A44 packer, check saved redacted output manually, then produce A44 `R17-W10` session record with the actual A72 EXE digest (`--host-exe --client-exe --expected-exe-sha`). It must not say QA PASS.

Use the **genuine A72-owned** verifier 
`scripts/cc001/w10/a72/verify-w10-player.cjs` supplied separately via A72 PR #188/authorized integration. Derive its expected SHA256 from A72's authenticated artifact manifest; do **not** guess or paste a synthetic test-double checksum.

```powershell
node scripts/cc001/w12/a44/verify-frozen-pair.cjs `
  --summary "C:\CC001\A72\summary.json" `
  --session "C:\CC001\A44\session.json" `
  --a72-verifier "C:\CC001\A72\verify-w10-player.cjs" `
  --verifier-sha256 "<EXACT_64_HEX_SHA256_FROM_A72>" `
  --pc1-player "D:\CC001\PC1\WindowsPlayer" `
  --pc2-player "E:\CC001\PC2\WindowsPlayer" `
  --out "C:\CC001\A44\freeze-3f-receipt.json"
```

Player folders can be copied from private physical PCs to an authorized offline workstation for checks, but that transfer **does not establish separate-PC provenance**. Independent A60 must examine original on-machine logs and device evidence, perform native same-build two-PC gameplay/turn/aim/camera/teleport/sync/FPS QA, and decide G3. This tool does not initiate or schedule that action.

## Source and dependency isolation

This W12 PR is stacked only on existing A44 evidence PR #216 → #183 → #164, **not** onto #207 or frozen QA branch. It adds files only under `scripts/cc001/w12/a44/`; no Unity, protocol, gameplay, build, CI, merge, main or release changes. Previous #216 remains bound to historical `173273...` and is **ALT_HOLD for the W12 frozen 3f campaign**; do not run #216 against the W12 freeze. W12 replaces the *use-case*, not the historical evidence or source. A70 may selectively import the A44 stack into tooling later without altering the frozen binary candidate.

## Test scope

```powershell
node --check scripts/cc001/w12/a44/verify-frozen-pair.cjs
node --test scripts/cc001/w12/a44/verify-frozen-pair.test.cjs
```

The test suite uses a **clearly labeled test-double for A72 verifier** and 54 synthetic player files per directory. Its PASS establishes only that A44 correctly invokes an A72-shaped CLI and rejects bad data. **The genuine A72 script/Windows Player were not run by A44 at authoring time.** Actual physical G3 = HOLD.
