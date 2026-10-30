# CC-001 / R17-W15 / A33 — Keep inspected ball in bounded F1 QA pose evidence

**Role:** A33 — Presentation / Instrumentation
**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**Existing PR:** #263 (W14 code, extended with W15 fix; no parallel copy feature)
**Own branch:** `feat/cc001-r17-w14-a33-canonical-vs-render-qa-poses`
**PR #263 parent/dependency:** W12/W13 A33 draft #235 `f4adedeb6dac715f2340777ae3a6e09fca9645db`.
**Frozen W11 QA ref:** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` — must remain unchanged.

## Confirmed W14 design gap and implemented W15 fix

The original W14 F1 `COPY QA` canonical/render comparison always took the first 24 active balls ordered by ascending ID. When a match contains more than 24 active balls, **the runtime ball being inspected may have a high ID and be omitted**, exactly when its teleport/smoothing defect is being investigated. This is a **source-level correctness/usability gap**, not a claim that it was reproduced during a physical match.

Existing `QaPoseEvidence.Capture(GameState, RemoteBallSmoother, unscaledTime)` now accepts an optional fourth parameter `focusBallId=0` and the existing `DetailsView` passes the actual inspected `inspectBallId`, already set/cleared by `ShowRuntimeBallDetails`/`CloseBallDetails`.

- The sample remains limited to **24** live/non-banished balls; over-budget focus replaces the last lowest-ID row, not a 25th row. The resulting rows are sorted by ID for easy PC1/PC2 diffing.
- Focus already present among first 24 is never duplicated; no focus means original first-24 ordering and scope.
- Requested dead, banished or nonexistent focus is never silently substituted; meta says `FOCUS_ID=n / FOCUS_STATUS=NOT_ACTIVE`. No inspected-ball focus says `FOCUS_ID=0 / FOCUS_STATUS=NONE`.
- The existing `SAMPLED` and `TRUNCATED` counts remain truthful. The sample is **not exhaustive** and continues to declare `ADVISORY_ONLY` / `RENDER_POSE_PARITY_PROOF=NO`.
- No new `NetworkLink`, `GameSimulation`, physics, NGO, snapshot revision, Protocol149, or roster changes. The existing F1 operator-click-only clipboard gating, local `CAPTURE_SEQ`, privacy restrictions and connected non-authority render-vs-canonical guard remain untouched.

## Current source manifest

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/QaPoseEvidence.cs`: Git blob `772ac3fced6c50d2d1b018a4bf08404eed2ca05c`.
2. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs`: Git blob `3619e4370a818f3de234d4959186a74be4b632e1`.
3. `unity/cc001-r16/CoreClash-V149-Unity/Tests/A33W14PoseEvidenceTests.cs`: Git blob `a12b60df0e9aa690c5dc94b2ce41a33513ce4743`, five **additional** W15 C# cases, for **13** total W14+W15 managed test definitions.
4. `scripts/cc001/w14/a33/verify-pose-capture.cjs`: Git blob `81ac4cc2f2bae0c795def936ef8886008ad9d9c8`, source gate extended for focus semantics and extra negative mutations.
5. W14 handoff annotated to mark historical source/test SHA; this W15 handoff new.

Inherited W14 new source `.meta`, managed project inclusion, runner registration and original W14 cases unchanged. In a full checkout, intended commands:
```sh
node scripts/cc001/w14/a33/verify-pose-capture.cjs
node scripts/cc001/w12/a33/check-f1-clipboard.cjs --self-test
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/CoreClash.Tests.csproj
```
The .NET command needs a real SDK9 operator; Node commands are source-contract assertions and **not** proof that C# compiled.

## Actually executed checks

- Re-fetched exact GitHub-committed C# source/runner and exact W15 Node validator. Executed the **committed validator JS in V8 with read-only mocked Node fs** returning those source bytes: **21/21 PASS, 0 exceptions**. This is positive/negative static source-contract checking and not native Unity.
- Re-ran the prior exact W13 validator JS against current W15 `DetailsView.cs`: **19/19 PASS under V8**, privacy, click gating and copy feedback preserved.
- **5 new managed C# regression cases AUTHORED, NOT RUN**: out-of-cap focus retained without exceeding 24, in-cap focus not duplicated, missing focus truthfully reported, banished/dead focus rejected, and no-focus original order retained. Existing **8 W14 C# cases also still NOT RUN**. A source test definition is not evidence of .NET9 PASS.
- GitHub commit ancestry and file-scope/QA freeze check required at PR handoff. No Windows Player, .NET9, Unity 6000.4.0f1, actual clipboard UI or PC1/PC2 QA executed here.

## Integration / P0 hold

**A70:** #263 depends on #235. Continue frozen physical W11 QA at exact `3f972...`, not this dev SHA. Before later admission, choose compatible `DetailsView.cs` hunks with A33 #212 and A70 #207; do not re-merge W9/W10 historical A33 branches wholesale. This is one bounded UI fix, not a new authoritative network solution.

**A72:** #188/#262 owner builder source contains repairs for nested Player inventories, stale .NET9 results and generated Unity JSON, pending owner selection and native evidence. Only Windows11 operator with Unity 6000.4.0f1 Win64 Build Support/license plus .NET SDK9, Git and Node22 can run a genuine source-pinned Player build, preserving original EXE, DLLs, full SHA256 manifest, logs and fresh .NET9 result.

**A60/A31:** independent same-binary physical PC1–PC2 QA still required; F1 focused sample does not prove P2 turn/aim, snapshot consistency or teleport correction. G3/G4 remain HOLD.

**Owner decisions protected:** Mitosis exact V148, Furnace only FIRE zone and periodic damage, HP R16. RC1, R16, Protocol149, main, release and frozen QA ref untouched.

**Status:** IMPLEMENTED=YES / SOURCE_CONTRACT_V8=21/21 PASS / W13_COMPAT_V8=19/19 PASS / CSHARP_NEW_TESTS=5 AUTHORED_NOT_RUN / TOTAL_CSHARP=13 AUTHORED_NOT_RUN / NATIVE_WINDOWS=NOT_RUN / TWO_PC=NOT_RUN / INTEGRATED=NO / RELEASED=NO.
