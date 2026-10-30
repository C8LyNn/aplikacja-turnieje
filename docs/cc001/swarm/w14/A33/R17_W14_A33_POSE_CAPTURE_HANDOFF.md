# CC-001 R17-W14 / A33 — Canonical vs Rendered Ball Pose QA Capture

**Role:** A33 Presentation / UI Implementation
**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**W14 branch:** `feat/cc001-r17-w14-a33-canonical-vs-render-qa-poses`
**W13 dependency:** A33 W12/W13 existing [draft #235](https://github.com/C8LyNn/aplikacja-turnieje/pull/235) at EXACT `f4adedeb6dac715f2340777ae3a6e09fca9645db`. W14 is stacked on that SHA and does not reimplement F1 copy.
**Authoritative W11 QA freeze:** `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` **NEVER MODIFIED**.
**Protected RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

## Delivered real feature

The existing F1 **COPY QA** clipboard action now additionally records a bounded, ordered **canonical-vs-rendered ball pose sample** from the current in-memory state, as an operator aid while diagnosing PC1/PC2 teleport/stutter. It is NOT continuous automatic telemetry or a parity signature.

- The helper `QaPoseEvidence.Capture(GameState state, RemoteBallSmoother smoother, float unscaledTime)` is Unity-engine independent and read-only. It reads only already available `GameState` balls and the existing presentation smoother; no physics, NGO transport, Protocol149, gameplay or mutation.
- Samples active balls only (`b!=null&&!b.dead&&!b.banished`), stable sorted by `id`, capped to **24** rows. Always prints `ACTIVE_BALL_COUNT`, `SAMPLED` and `TRUNCATED`; never pretends the truncated report is complete.
- Each sampled row records `BALL ID`, `OWNER`, `HP`, `STATE_X/Y`, `RENDER_X/Y`, and `RENDER_MODE=SMOOTHED|CANONICAL`. Positions use round-trip `float.ToString("R", InvariantCulture)` for locale-stable comparison across Polish/English Windows installations.
- The `RENDER` value uses `RemoteBallSmoother.TryGetPosition` **only** during `MatchPhase.Moving` and only when the existing BoardView path actually renders smoothed ball poses: a connected non-authority client. Host, disconnected client, local/hotseat, aiming and over phases report canonical positions instead.
- Calls the helper **only within the existing explicit COPY QA click**. Never sends data over the network or records in background. Existing W12/W13 `UTC`, `CAPTURE_SEQ`, counters, `SOURCE_SHA=UNVERIFIED`, `CLOCK_SYNC=UNVERIFIED`, `G3_STATUS=NOT_ATTESTED` remain; no `networkNotice`, private invitation/address free text.
- Appends `POSE_SAMPLE=CANONICAL_STATE_PLUS_LOCAL_RENDER / ADVISORY_ONLY` and `RENDER_POSE_PARITY_PROOF=NO / COMPARE ONLY SAME ACCEPTED REVISION`. **Client smoothed rendering at time T is not the authoritative snapshot at revision R**, and a text capture is not a physical two-PC proof.

## Added files / edits compared with #235 parent

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/QaPoseEvidence.cs` — new pure C# formatter (Git blob `41e071bc77dab07bbb13ce3f7a61ead978d2ae52`).
2. Same path `.cs.meta` — Unity GUID sibling (blob `08af11e5a6f8ccb695321101d07f65be15780c2c`).
3. `.../Assets/CoreClash/Presentation/DetailsView.cs` — ONE F1 clipboard assignment extended (blob `e59dac5bbbdb5ff13cfac787d38569b63c946137`).
4. `.../Tests/A33W14PoseEvidenceTests.cs` — EIGHT actual managed .NET9 test cases authored (blob `a718e888b9d6fee63d6e20d560777c25a16c9144`).
5. `.../Tests/PresentationTests.cs` — one test-runner call `A33W14PoseEvidenceTests();` (blob `bbbbb843e6ab78670253ebe0933f28f883721121`).
6. `.../Tests/CoreClash.Tests.csproj` — include new pure C# source in existing net9 project (blob `153f0dd28758865d735922a799e459539e7a41bd`).
7. `scripts/cc001/w14/a33/verify-pose-capture.cjs` — new source + 12 negative/positive contract checks (Git blob `27223092cebf711a5d0a860ca348f107577b9870`).
8. This handoff.

## What actually ran

- **14/14** direct, explicit authenticated GitHub source/structure/protection assertions PASS on 6 source/runner/meta files.
- Exact committed new W14 JS script executed in V8 with read-only Node-module shims supplying exact authenticated GitHub-fetched C# files: **13/13** scoped static/mutation assertions PASS, 0 exceptions. Positive source check and 12 negative mutations covering unbounded rows, unstable order, no client guard, omitted canonical/visual distinction, wrong float locale, false parity and absent F1 copy.
- Exact committed older W13 validator executed under V8 against the updated W14 `DetailsView.cs`: **19/19** scoped static/mutation assertions PASS; no regressions in W13 copy click, feedback and privacy source checks.
- Managed **8 C# tests are authored/registered, NOT RUN** (no dotnet SDK in available Linux session). Test coverage includes deterministic order, dead/banished/null filtering, 24-row truncation, read-only state invariants, true `RemoteBallSmoother.Observe` two-revision interpolation, phase guard and explicit non-proof labels.
- Native Node CLI on a full checkout, .NET9, Unity 6000.4.0f1 Editor/build, Windows Player, real PC1/PC2 gameplay and A60 independent QA: **NOT RUN**. No G3/G4 PASS.

## Integration and operator dependency

**A70** must keep the W11 QA freeze SHA intact. #235 W12/W13 and this W14 dependent PR are **DEV_ONLY** until formal W11 closure; do not bulk-merge historical A33 #176/#187/#195/#212. If A70 selects the W14 helper, recompile a new exact source candidate in Windows via A72 and run new C# test registrations first. Changing source SHA invalidates any previous Player evidence.

**A72 native blocker:** #188 owner has repaired the nested Player manifest relative-root issue and stale .NET9 result reuse at source level, but only a trusted Windows 11 operator with Unity **6000.4.0f1 Windows Standalone Build Support/license** and .NET9 can produce the original EXE/DLL/full Player SHA256 and logs. **A60/A31** must independently test actual same binary on PC1 & PC2; this extra F1 row is an optional operator observation, not a replacement.

**No changes to:** Mitosis exact V148, Furnace FIRE zone and periodic damage only, HP R16, protected gameplay/catalog, Protocol149, RC1, QA freeze, main or release.

**Status:** IMPLEMENTED=YES; JS_SOURCE_SCOPED=13/13; W13_COMPAT=19/19; CSHARP_TESTS_AUTHORED=8_NOT_RUN; NATIVE_WINDOWS=NOT_BUILT; TWO_PC=NOT_RUN; INTEGRATED=NO; RELEASED=NO; G3/G4=HOLD.
