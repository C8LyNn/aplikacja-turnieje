# CC-001 R17-W13 A42 — independent .NET9 managed evidence freshness intake

Owner A42 CI/CD. A72 builds and owns exact Win11 Unity/.NET runner. A70 selects and freezes source. A60/A31 independently evaluate PC1–PC2. This is a **separate isolated W13 add-on**, stacked on A42 W12 draft #227; it does not alter A72's existing builder or the QA freeze.

## Hard source pins

A70 frozen source ref: integration/cc001-r17-w11-qa-freeze-20261030
SHA: 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3
RC1: 10f64e4d213f17a352ed8fa83bc75884a39549f0

Never treat moving #207 or newer W12/W13 optional C# changes as part of the W11 freeze. Mitosis V148 exact, Furnace FIRE-only periodic ticks, and R16 HP remain unchanged.

## Actual source defect this prevents

Frozen source tracks Evidence/unity-tests.json generated on **October 16, 2026, 180/0**; A72 PR #188 currently reads this file in a detached managed worktree after dotnet run and checks the aggregate counts. If dotnet exits zero but does not regenerate JSON, the historical report could be misattributed to this run. This is a potential fail-open condition, **not evidence of an actual misreported A72 build**. A70 independently implemented a builder-side helper in draft #221; A72 must still own integration of its one builder, not cherry-pick duplicate build logic.

## A42 additive, independent evidence gate

fresh-managed-intake.cjs consumes **the original A72 Windows evidence** in five separate files:
- summary.json (build SHA/ref, dotnet9 SDK/process and gates, managed count),
- receipt.json (source SHA + final timestamp),
- managed-test-results.json (actual per-case list and testedAt),
- logs/gate-events.txt (original START source ref/SHA with UTC),
- logs/managed-dotnet9.log (original PASS names and terminal RESULT from dotnet).

It requires the exact QA freeze source/receipt; .NET9 SDK, managed exit0, managedDotnet9 gate true; exactly one correctly pinned START event; timestamp within the actual start-to-receipt window; every per-case result pass=true, valid count/spec; exact complete correspondence of individual PASS names and terminal count to the JSON. Rejects missing output or historical October16 timestamps, even if aggregate 180/0 would otherwise look green. SHA256 receipts of all five raw input evidence files are recorded.

Outputs RAW_MANAGED_EVIDENCE_COHERENT_ONLY or HOLD. Exit 0 means only the raw evidence files are internally coherent; does NOT prove operator identity or independent process provenance. Exit 2 HOLD, exit 3 operational error/output collision. No overwriting old reports. Its successful exit **cannot** certify C# executed, Unity Windows Player built or PC1-PC2 G3/G4. A60 must examine original evidence itself.

**Command after A72's genuine frozen-source Windows execution:**

    node scripts/cc001/w13/a42/fresh-managed-intake.cjs --summary=C:\evidence\summary.json --receipt=C:\evidence\receipt.json --managed=C:\evidence\managed-test-results.json --events=C:\evidence\logs\gate-events.txt --log=C:\evidence\logs\managed-dotnet9.log --out=C:\evidence\A42-managed-freshness.json

**Native tests:**

    node --check scripts/cc001/w13/a42/fresh-managed-intake.cjs
    node --check scripts/cc001/w13/a42/fresh-managed-intake.test.cjs
    node --test scripts/cc001/w13/a42/fresh-managed-intake.test.cjs

Actually executed on Node v22.16.0: 24/24 PASS, zero failures, native CLI positive and negative exit 0/2/3 scenarios with synthetic data. Two script syntax checks pass. Exact local Git blob SHA1 equals GitHub:
- source: e676b1320e568ed310f3a2c88d64ddaee67b03de
- tests: 0cb38b60b93fdac2fa501beffa071f8ccb96a050

No native dotnet9, Unity6000.4.0f1 Windows build, original frozen EXE/DLL, physical PC1-PC2 QA or release performed by A42. W11/W12 G3/G4 HOLD. W13 only isolated development; merge/release/main STOP.

## Dependencies

A72 #113 must apply single-owner fresh-report archive/delete + new JSON validation in its **existing builder** (not a second competing implementation), run on actual Win11 Unity+dotnet9 host and preserve the five original inputs plus full Player SHA256 tree. A42 W12 #227 then verifies actual two copies of the Player's bytes. A60 #139 and A31 #94 verify independent original two-PC session/host origin, accepted-once P2 actions, state/revision/ball parity, temporal smoothness and PORTAL behaviors present on frozen source. A70 #137 decides any future integration only after W11 formal closure.
