# CC-001 R17-W14 / A42 — original A72 nested Player verifier acceptance (independent, not a competing builder)

**Frozen W11 QA SHA**: `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` on `integration/cc001-r17-w11-qa-freeze-20261030`. Moving #207 and W13 remain outside frozen QA. **Immutable RC1** `10f64e4d213f17a352ed8fa83bc75884a39549f0`. No V148 Mitosis, Furnace FIRE/ticks, R16 HP, Protocol149, Unity or other protected files modified by A42.

## Original owner bug reproduced in a native Node process

A72 [draft PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188), HEAD `3f25dcf6b79b1032442b034a569019212af82a20`, has `scripts/cc001/w10/a72/verify-w10-player.cjs` Git blob `7b704b969c40abe84aaefdbf62cc82c81860ae72`. The original `files(root)` recurses with `files(f)` and recalculates `path.relative(root,f)` relative to the nested directory, so canonical manifest path `CoreClash_Data/Managed/Assembly-CSharp.dll` becomes only `Assembly-CSharp.dll`. Its own `--self-test` uses the same broken `files()` to generate both the manifest and actual inventory, so its original 12/12 self-tests produce false confidence.

A42 `a72-recursive-acceptance.cjs` is an **external acceptance harness** that runs the *unmodified, exact Git-blob-pinned A72 CLI as a child process* against a separately generated manifest with 55 correctly rooted paths. It also tamps a nested DLL, removes a nested DLL, adds a DLL, and checks wrong SHA rejection. Missing or moved Git blob -> STOP, and output is write-once. This is executable testing of A72's code, not a replacement `verify-w10-player.cjs`. The A42 test-only fixture `a72-source/verify-w10-player.cjs` is an exact byte copy of the old A72 Git blob, for reproducibility and regression detection **only**, never for production use.

### Actual result on existing A72 code

- Pinned old A72 CLI `--self-test`: 12/12 PASS, but this hides the issue.
- Independent correct 55-file manifest against unmodified A72: **exit2 / HOLD**; 55 actual/55 expected, 108 false missing+extra path reports.
- `NESTED_CANONICAL_55FILES`: **FAIL**, while four negative tests still produce the expected HOLD/STOP. `A72_VERIFIER_CONTRACT_HOLD` is the correct overall result.
- In a temporary **test-only copy** of A72 source, changing `files(dir, playerRoot=dir)`, `files(child,playerRoot)` and `path.relative(playerRoot,file)` makes all five probe cases succeed. This test copy is not committed as a production fix and is not merged into A72.
- Native Node **v22.16.0**: syntax of source/test PASS; `node --test` **12/12 PASS, 0 FAIL, exit0**. These 12 checks confirm the rejection of the known old bug and acceptance of a safe fixture fix. They are not Unity/PC gameplay tests.
- Git blobs of the exact locally executed test files match GitHub: harness `08b7155aa215a8913324f0d48422a6624344012f`, tests `a0b4d19533c23d05379f67b3bc053fbbc473fd58` [verify authoritative exact hash in GitHub readback below], A72 pinned fixture `7b704b969c40abe84aaefdbf62cc82c81860ae72`.

## A72 owner action (not A42 code ownership)

Apply minimal fix in **existing A72 #188** to preserve constant Player root in the recursive traversal, add at least one independently constructed 55-file nested-positive test, and require a nested tampered-DLL negative case. Update kit's `FILE_SHA256.json` if verifier ships in kit. Do not copy the temporary patched test fixture as an unreviewed production alternative.

**Separate unresolved P0:** A72 builder also inherits tracked `Evidence/unity-tests.json` from R16 (Oct 16, passed180/failed0). It still reads that file after `dotnet run` without guaranteed regeneration. A70 #221 has a reference archive/remove/fresh-test helper. A42 W13 #243 independently checks original .NET9 evidence/log timestamp. A72 must implement the one-builder archive+remove-before-run and validate new per-case results/timestamp, then execute Unity 6000.4.0f1 Windows and .NET9 on an authorized Windows host.

### Operator commands

```powershell
node --check scripts/cc001/w14/a42/a72-recursive-acceptance.cjs
node --test scripts/cc001/w14/a42/a72-recursive-acceptance.test.cjs
node scripts/cc001/w14/a42/a72-recursive-acceptance.cjs --verifier=C:\operator\a72\verify-w10-player.cjs --sha=<ACTUAL_VERIFIED_A72_GIT_BLOB_SHA> --out=C:\evidence\a42-a72-nested-acceptance.json
```

Exit0 means only the original A72 verifier passes the **synthetic** acceptance fixtures, not real Player integrity. Exit2 = contract HOLD; exit3 = wrong SHA/path or operational failure. Supply exact current A72 verifier Git blob, not its commit SHA. For end-to-end evidence after a real build, use existing A42 W12 #227 full original PC Player-byte intake + W13 #243 original .NET9 evidence intake; both are separate from A60 physical G3 QA.

**Current project gate:** W11/W12 G3/G4 HOLD; Windows Unity Player at frozen SHA NOT_BUILT; .NET9 actual test execution NOT_ATTESTED; PC1–PC2 physical playtest NOT_RUN; W14 source/test work isolated, no main/RC1/freeze/release merge.