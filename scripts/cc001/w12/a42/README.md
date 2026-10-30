# CC-001 R17-W12 A42 — QA freeze Player byte intake

Owners: A42 CI/CD; A70 exclusive integration; A72 native Windows build; A60/A31 independent two-PC gameplay QA.

## One immutable W11 source identity

A70 QA source ref: integration/cc001-r17-w11-qa-freeze-20261030
Exact allowed SHA: 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3
Frozen RC1: 10f64e4d213f17a352ed8fa83bc75884a39549f0

The moving draft PR #207 is NOT the QA build source. A72 PR #188 old source kit must be changed by A72, both Node and Windows launcher, to the exact freeze ref/SHA. Its previous W10/W11 pins are ALT_HOLD. A42 never modifies the A70 freeze, RC1, V148, Protocol149, R16 HP, Mitosis or Furnace.

## Delivered executable

freeze-player-intake.cjs validates the source and opens REAL original files, not just JSON claims:

1. Read-only Git ls-remote checks the live A70 QA freeze ref, local checkout HEAD, RC1 ancestry, clean working tree and diff --check. Wrong/moved/missing refs STOP.
2. Reads the ORIGINAL A72 Windows build summary.json and receipt.json, requires the exact freeze ref/SHA and RC1; true reported Unity exit 0, BuildPipeline Succeeded/errors=0, all ten mandatory A72 provenance gates true, no blockers or changed-source ledger.
3. Requires a complete 50+-file canonical Windows Player manifest with unique paths ignoring Windows filename case, valid byte counts and SHA256, CoreClash.exe and Assembly-CSharp.dll.
4. Walks BOTH operator-supplied PC1 and PC2 full Player directories, rejects symlinks/special files, actually streams SHA-256 of every file and compares counts/names/bytes to A72 manifest. Detects missing, extra or altered bytes, and the same exact directory being reused.
5. Reports READY_FOR_A60_INDEPENDENT_QA_ONLY or HOLD, includes SHA256/byte sizes of original A72 JSON receipts, and never overwrites an earlier report.

These supplied directories may be copied/mounted; tool does NOT prove two physical machines, game boot, gameplay, visual/physics correctness, snapshot parity, G3/G4 or release. A60 must still independently verify original devices and run the game on both.

## Commands after A72 actually builds freeze SHA

From the A42 script location under Node22 and Git2, provide an authenticated full clean source checkout at EXACT freeze HEAD and accessible PC Player folders. Place output outside the source checkout.

    node --check scripts/cc001/w12/a42/freeze-player-intake.cjs
    node --test scripts/cc001/w12/a42/freeze-player-intake.test.cjs
    node scripts/cc001/w12/a42/freeze-player-intake.cjs --repo=C:\repo\aplikacja-turnieje --summary=C:\evidence\summary.json --receipt=C:\evidence\receipt.json --pc1=C:\qa\pc1\Player --pc2=C:\qa\pc2\Player --out=C:\evidence\a42-w12-freeze-report.json

Quote an entire argument when its path contains spaces.
Exit0: source and two supplied Player copies match original build receipts, QA REVIEW ONLY.
Exit2: HOLD, mismatched source/build/Player bytes.
Exit3: operational, inaccessible/moved freeze ref, bad args or write failure; STOP.

## Actual tests and evidence truth (October 30, 2026)

Executed on native Node v22.16.0: node --check for both scripts PASS, node --test 23/23 PASS exit0. The fixtures generate two separate synthetic 52-file Player trees, deliberately tamper DLL/EXE and test symlinks, extra/missing files, wrong SHA/ref/receipt, bad build flags and negative Git checkout. These are genuine native Node tests but NOT tests of an actual Windows Player.

Source exact local Git blob SHA1 = GitHub readback:
3330446b7b5edb7f511f8d8fe2ffb9540ff14c8c
Test exact local Git blob SHA1 = GitHub readback:
95dc5f3f9e427edfade3b9e2ce2359cdb1de2ef7
Node TAP test evidence SHA256:
b5d366c67a84023be3fc289aeac81828d5009e043aa7441b384a712f3ea29f69

Actual Windows Unity6000.4.0f1 Player from freeze: NOT AVAILABLE/NOT RUN by A42.
.NET9 C# managed tests: NOT RUN.
Actual two physical PC1–PC2 gameplay evidence and independent A60/A31 QA: NOT RUN.
G3/G4 HOLD. W11 not formally closed. W12 code isolated only; no W12 production integration/main merge/release.

## Dependencies

A70 #137 preserves freeze pin; A72 #113 repins and runs real Windows build with original Player manifest, compiler/editor logs and receipts; A60 #139 plus A31 #94 independently test native PC1-PC2 host/client accepted-once P2 turn, authoritative same-revision positions, visual smoothness and portal/teleport, local UI and no extra strength strip. No manual bypass of fail-closed checks.
