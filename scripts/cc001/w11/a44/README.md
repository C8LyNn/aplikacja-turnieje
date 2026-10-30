# CC-001 / R17-W11 / A44 — #207 PC1↔PC2 evidence binding

**Only candidate:** A70 draft PR #207 SHA `173273122c11cbf738e8b954e32506a6196fe8ec`. Frozen ancestor RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0` remains unchanged.

This tool closes a **specific evidence identity gap**: older A44 W9/W10 log/session files refer to the protected RC1 baseline and record at most matching PC1/PC2 EXE hashes. That is *not* proof those binaries came from W11 #207. The W11 binder requires the **original A72 build summary** for exact #207, both original *successful* A72 complete-folder Player verification reports, and the A44 W10 session record bound to the identical EXE hash. It never executes Unity, verifies live devices, substitutes for A72's full Player verifier, or accepts `QA PASS` on operator attestations.

## How to run — **only after actual A72 Windows build and PC1/PC2 collection**

1. A72: build exactly `173273122c11cbf738e8b954e32506a6196fe8ec` on Windows Unity 6000.4.0f1, preserve the **original** `summary.json`, full `playerInventory`, source provenance and compiler response evidence. `status` must be `PASS_BUILD_EVIDENCE_ONLY` (no blockers). Do NOT use historical W10 #181 or RC1 player files.
2. On **each separate physical PC**, independently run A72's original `verify-w10-player.cjs` on the entire WindowsPlayer directory against that original summary and exact SHA. Save its **JSON stdout output** as `pc1-verification.json` and `pc2-verification.json`. **Both statuses must be `PASS_BINARY_INTEGRITY_ONLY`**; this is source/file integrity only.
3. Run A44 W9 `pack-multiplayer-evidence.cjs` with `--host-exe`, `--client-exe` and `--expected-exe-sha` from *that A72 inventory*, then W10 `assemble-session.cjs` to create the session JSON (see PR #164 and #183). Original logs and private IPs must remain on an authorized private computer; inspect redacted output manually before sharing.
4. From repository root, using Node 22:

```powershell
node scripts/cc001/w11/a44/bind-207-session.cjs --summary C:\Evidence\a72-summary.json --session C:\Evidence\session.json --pc1-receipt C:\Evidence\pc1-verification.json --pc2-receipt C:\Evidence\pc2-verification.json --out C:\Evidence\W11-207-session-link.json
```

The output is `PASS_STATIC_RECEIPT_LINK_ONLY` or the process fails with exit code 2. Output reports the SHA256 of **each input JSON**, the exact candidate, Player EXE/DLL digests, PC1/PC2 redacted log digests, and *permanent* `qaDisposition=PENDING_INDEPENDENT_A60_PHYSICAL_QA`. This tool does **not** certify the authenticity of self-supplied receipt files; A60 checks originals and real PC1/PC2 behavior independently. Never paste private logs or network addresses into GitHub. No release/main merge.

## Synthetic automated tests

```bash
node --check scripts/cc001/w11/a44/bind-207-session.cjs
node --test scripts/cc001/w11/a44/bind-207-session.test.cjs
```

These tests construct fake inventory, build receipts and sessions **for negative and positive validation only**. They do not run a build or physical PC session. Do not mark any W11 native test PASS based on them.

## Dependency / routing

- **A70** owns #207 candidate admission and merge selection; do not silently rebase onto a changed SHA.
- **A72** owns real Windows build and full original Player binary/source integrity proof.
- **A60/A31** independently run actual two-PC network, turn, ball visual smoothness and state parity, with measured evidence.
- **A44** owns this *static* evidence linkage, session packaging and manual privacy review. A10 V148 Mitosis, FIRE-only Furnace, and R16 HP are not touched.