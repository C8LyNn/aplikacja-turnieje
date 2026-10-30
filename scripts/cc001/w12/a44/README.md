# CC-001 R17-W12 — A44 frozen QA pair integrity intake

**A44 External Playtest Infrastructure** | HQ #97 | **source freeze:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` | immutable reference branch `integration/cc001-r17-w11-qa-freeze-20261030`.

This is **NOT** GitHub PR #207's moving HEAD. At authoring time the moving A70 PR #207 was `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c`. None of its post-freeze changes may be mixed into the frozen QA run. V148 Mitosis, FIRE-only Furnace, R16 HP, Protocol149 and RC1 are protected and unchanged by this package.

## What this code actually does

`verify-frozen-pair.cjs` is an offline operator-side coordinator. It requires a genuine **new A72 native Windows Player build** for the exact frozen SHA, and uses **the original independent A72 complete-folder Player verifier** on **two different local directories**. It **does not duplicate** A72 file-walker, Unity build, or A60 network QA.

1. Validate the original A72 `summary.json`: schema `CC001-W10-A72-WINDOWS-1`, `candidateSHA` exact frozen `3f972...`, `rc1Base` exact RC1, `PASS_BUILD_EVIDENCE_ONLY`, zero blockers, complete Player inventory (including EXE and Assembly-CSharp.dll) with safe unique names and original SHA256/bytes.
2. Require the operator-provided A72 verifier's SHA256 to match the separately supplied expected SHA256 **AND** its byte-exact immutable Git blob SHA-1 to match A72-owned #188's authenticated source blob `7b704b969c40abe84aaefdbf62cc82c81860ae72`. A matching *user-supplied* SHA256 alone cannot authenticate arbitrary code. A60 must still independently authenticate the provenance of operator artifacts and physical devices.
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

The updated suite includes the byte-exact **genuine A72 verifier code** in a test-only regression fixture and 54 synthetic Player files per directory. It actually executes genuine A72 Node CLI, reproducing its current nested-path false HOLD; the clearly labeled test double is now used **only** as an adversarial replacement that the authenticated source pin must reject. These are synthetic test files, **not a compiled Windows Player**. Actual physical G3 = HOLD.

## A44 owner follow-up: authenticated A72 verifier intake

The initial W12 implementation verified only the caller-provided `--verifier-sha256`. This allowed an arbitrary substituted JavaScript script accompanied by its own matching digest to manufacture a synthetic `PASS_BINARY_INTEGRITY_ONLY` report. The repaired gate now also checks the genuine A72 #188 `verify-w10-player.cjs` Git blob `7b704b969c40abe84aaefdbf62cc82c81860ae72` **as a constant that the operator cannot override**. A72's current owner PR #188 was rechecked for the same blob, and the fixture inside A44's test file embeds that byte-exact authenticated source as an inert test string. No clone of A72's verifier is shipped as a separate operational script.

The source also rejects a summary/session path that is a symlink **before** calling `realpathSync`, fixing the previous original-path lstat bypass. Synthetic tests invoke the genuine A72 CLI on a test directory, assert its current false HOLD, verify A44 does not write a fake receipt, and cover counterfeit-script and symlink negative cases. These tests are not evidence that Unity Windows or physical PC1–PC2 ran.

The A72 source Git blob SHA-1 is a Git object integrity pin, not an assertion that SHA-1 itself provides modern collision-resistant authentication. SHA-256 of the full verifier bytes is also checked. If A72 intentionally changes its verifier source, A44 must review the new A72 owner commit and update this pin in a separate tested PR; never bypass it with a new operator-supplied digest.

## P0 dependency: original A72 verifier nested-path bug, confirmed with real Node

At the verified authentic A72 blob `7b704b969c40abe84aaefdbf62cc82c81860ae72`, the recursive `files(root)` resets the relative-path base on every directory entry. A manifest listing 54 correct files (including `CoreClash_Data/Managed/Assembly-CSharp.dll`) produces actual 54, expected 54, but 53 false `MISSING` file errors. The A72 `--self-test` (12/12) fails to see it because it derives the expected manifest with the *same broken walker*. A44 has reported this owner-only defect in issue #113.

**Do not interpret the A44 test suite's expected HOLD as Windows build failure.** The frozen QA cannot get a trustworthy full-folder positive result with the current pinned authentic verifier. A72 must fix the source and add an independently constructed full-path manifest regression; A44 must then re-review and explicitly repin the updated A72 Git blob in its own source before use. Do not bypass the pin, use a test double in the real operator workflow, or claim physical G3.

## R17-W14: corrected A72 Player verifier source pin

A72 owner PR #188 corrected the genuine nested Player inventory path bug. The old A72 Git blob `7b704b969c40abe84aaefdbf62cc82c81860ae72` must now be rejected. A44 W12 expects the independently source-verified new A72 Git blob `b8181229bcf8a6fdb51a0d89be1c4f547fd9407f` (fixed recursive-root handling and 17 native Node self-tests). Its Node regression now runs the **exact genuine corrected A72 script**, checks 54 valid nested manifest paths on two folders, accepts only `PASS_BINARY_INTEGRITY_ONLY`, and rejects wrong SHA, wrong code, modified DLL, missing paths, symlinks and false physical QA claims.

This is an **offline synthetic fixture** test, not Unity or physical PC1–PC2 QA. The verifier now permits valid *future* receipts; A72 must still run an actual frozen-SHA Unity 6000.4.0f1 Windows Player build and fresh .NET9 managed suite on an authorized Windows11 PC. A60/A31 must then independently validate original evidence and physically test PC1+PC2. G3/G4 remain HOLD. Older A44 operator ZIPs pinned to the defective A72 source are **SUPERSEDED**.

### Native Node W15 scoped execution

On locally executed Node22.16.0 byte-exact A72 original Git blob `b8181229bcf8a6fdb51a0d89be1c4f547fd9407f`: **19/19 original A72 self-test PASS**. On actual four A44 source/test scripts from W9/W10/W11/W12: **74/74 Node test cases PASS**, including **27/27 W12** (new W15 previous 677100 verifier rejection and zero-size EXE/DLL inventory checks). These use synthetic Player directories and an original A72 CLI subprocess, NOT a compiled Windows Unity build, new dotnet9 C# run, or physical PC1–PC2 game session. A72 owns canonical draft #188. A44 owner commit must not be merged until dependency stack reviewed.
