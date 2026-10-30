# CC-001 R17-W14 / A51 — original log-byte binding for frozen trace gate

**Owner:** A51 Simulation & Instrumentation. **HQ:** #97. **W14 branch** is stacked on A51 own Draft [PR #248](https://github.com/C8LyNn/aplikacja-turnieje/pull/248) at `f5ecf0c3e6e3ba4aa50b84139ec5c722b3d91314` (which depends on W12 #223 and A51 #172). Not merged or released.

## Immutable input

**Frozen W11 A70 QA source:** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Do not substitute the later moving #207 head, A41 W13 network ledger or later TELEPORT/SWAP/digest producer. The old parser policy SHA `173273...` in A51 V2 reports is **not** executable provenance.

## Specific A51 diagnostic improvement

Earlier A51 [W12 #223](https://github.com/C8LyNn/aplikacja-turnieje/pull/223) + [W13 #248](https://github.com/C8LyNn/aplikacja-turnieje/pull/248) `freeze-trace-gate.cjs` can validate **operator-supplied A51 JSON only**. Such metadata can contain two plausible 64-hex fingerprints without the original PC1/PC2 files being present. This was a **provenance limitation**, not evidence of a real gameplay/network bug.

New **`scripts/cc001/w14/a51/bind-original-player-logs.cjs`** composes the existing A51 W12/W13 gate, never reimplements packet parsing or A41/A81 traffic/parity instrumentation. It reads both original Player.log files, checks their canonical paths are distinct, both non-empty regular files (reject symlinked files), maximum 128MiB per file, streams independent SHA256 + byte sizes, checks fstat pre/post read stability and verifies the **original file hashes and bytes** match A51's reported `sources.pc1/pc2`. Distinct original logs with identical bytes or a mismatched SHA/size => `FAIL_LOG_BYTE_PROVENANCE`. Missing inputs/IO errors => exit 2 with **redacted generic error**. No raw log, paths, private IPs or session tokens in output. Exclusive creation protects `--out` from overwrite.

This is intentionally **NOT** a source-proven same-run or binary-build attestation: a matching original-file SHA does **not** prove counters were derived from the files, that PC1/PC2 were in the same session, that Players were the same Windows EXE/DLL, or that frame smoothness, state parity, P2 exact-once, G3/G4 passed. These remain explicitly `NOT_ATTESTED`, `NOT_PROVEN` or `HOLD`. A60/A31 independently own full native two-PC acceptance. A81 original-evidence guard remains separately owned; A51 only binds *its own W12 summary* to bytes.

## Windows / Node 22 operator command

From a complete checkout containing this W14 stack and the A51 W12/W13 parent:

```powershell
node scripts/cc001/w14/a51/bind-original-player-logs.cjs --analysis C:\QA\a51-report.json --source-sha 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3 --pc1 C:\QA\PC1\Player.log --pc2 C:\QA\PC2\Player.log --out C:\QA\a51-original-byte-binding.json
node --test scripts/cc001/w14/a51/bind-original-player-logs.test.cjs
```

**Verdicts:** exit0=`LOG_FINGERPRINT_MATCHED_METADATA_ONLY`, exit1=`FAIL_LOG_BYTE_PROVENANCE` or original source-profile failure, exit2=`HOLD_INCOMPLETE_TRACE` or invalid input. **Exit0 is NOT native QA PASS**.

## Actual test evidence / dependencies

- Linux local Node `v22.16.0`, `node --check` two W14 JS files exit0, actual `node --test` **22/22 PASS, 0 failures, exit0**. Tests used **real created/modified on-disk synthetic PC1 and PC2 log files and spawned the actual Node CLI** for success, tampered byte, wrong SHA, missing file, output overwrite and negative QA cases.
- Exact locally tested tool: Git blob `9f3fd97e52cea9bb321def67b860f366dc8af5e3`, SHA256 `b9d2f8cf5eda23b10dd084483a00a3da550f1aa260d99281d30ff291a9b84f0c`, 4,851 bytes.
- Exact locally tested tests: Git blob `c617b214b4baa179d8a8a7bca22f354c9836020a`, SHA256 `95de6f296b60e28385d794ab947016156c4e93719807e409cf5af465f460bdcc`, 8,218 bytes.
- GitHub readback of both files **matches their exact locally tested Git blobs**.
- Native test transcript saved on local operator at `/mnt/data/cc001_a51_w14/native-node-test.log` SHA256 `cfffc636082883b151987fcc9d96fcc1921ee1ac21123fab333095f2c3ca82ae`. This is *not* a Unity Player or QA artifact.

**NOT_RUN:** Windows Unity 6000.4.0f1 Win64 build, .NET9 managed C# tests, actual PC1/PC2 game Player logs, binary rehash on two physical machines, host/client authoritative state, turns, aim, TELEPORT/PORTAL and visual smoothness. A72 #188 must fix nested relative-path manifest verifier (A44 evidence #113) and freshness of tracked historical managed test JSON (A70 #221 reference), then use an authorized Windows operator with licensed Unity 6000.4.0f1 Windows support, .NET9 and Node22. A60/A31 must independently run the physically built same frozen SHA Player. **W11/W12 G3/G4 HOLD, final W14 integration HOLD**.

**Protected gameplay:** Mitosis exactly V148; Furnace only FIRE zone and periodic DoT; HP values R16. No Unity gameplay/physics/catalog/Protocol149, protected RC1, QA-freeze/main/release edits. **Five axes:** DESIGNED YES / IMPLEMENTED YES / TESTED Node22/22 tool-scoped / INTEGRATED NO / RELEASED NO.
