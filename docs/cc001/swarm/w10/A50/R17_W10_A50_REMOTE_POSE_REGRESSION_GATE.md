# CC-001 R17-W10 — A50 remote ball pose regression gate / select one implementation

**AGENT:** A50 — Simulation / Physics / Balance. **ISSUES:** #138 (owner) and #97 (HQ).
**P0 focus:** PC2 visual ball teleport/stutter; protect host authoritative physics and Protocol149.
**PINNED FROZEN RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
**SELECTED VISUAL BASE (conditional):** A34 draft PR #174, exact source commit `d237612a3148319210eb870123659e2e9bc4f27b`, branch `feat/cc001-r17-w9-a34-client-visual-smoothing`.
**OWN W10 BRANCH:** `feat/cc001-r17-w10-a50-remote-identity-regressions`, a child of the **exact A34 commit**, not a modification of A34's branch.
**TEST SOURCE COMMIT:** `46c2c142a5d7e64a79eb2125f995c75f5222efee`.

## 1. Exclusive selection recommendation; preserve independent responsibilities

Choose **A34 PR #174 as the single visual interpolation implementation**, subject to actual managed tests, the two failing identity oracles below and A60 physical verification. Unlike A50's previous draft PR #169, A34 already wires visual-only interpolation into `CoreClashApp.cs`, `BoardView.cs` and `BallView.cs`. **Do not integrate both A34 and A50 smoothers**; two interpolation caches with different bounds and revision semantics add latency and unclear draw authority.

A50 prior `RemoteBallPoseSmoother` PR #169 was a separate **unwired fallback**. It is superseded for production selection by A34 and must not be imported into the combined candidate together with A34. This is not a claim that #174 passes acceptance yet.

Network cadence fixes also compete: A30 PR #175 and A41 PR #163 both modify `NgoGameSession.cs` and `NetworkGameSession.cs`, so the corresponding changes require **A31/A70 selection of exactly one compatible network policy**; never pick both. A20/A30/A32/A34 presentation edits overlap in `MatchView/CoreClashApp/BoardView/BallView`, requiring *hunk-level* reconciliation. A50 must not overwrite those files. A70 owns actual integration and RC1 remains immutable.

**Critical source correction:** Frozen RC1 `NgoGameSession.LateUpdate` schedules snapshots every **0.2 seconds while Moving (~5Hz)**, not 2 seconds. A30 PR #175 text describing a pre-fix 2s cadence appears incorrect. Verify the committed source, not a PR summary, when comparing 20Hz fixed vs A41's payload-dependent rate.

## 2. Concrete source-level risk requiring RED→GREEN

In A34 PR #174 `RemoteBallSmoother.cs`, its private `Pose` contains only `fromX/fromY/toX/toY/start/duration`, and `poses` indexes solely by ball ID. Existing code reuses a pose if the same ID exists, even if the later authoritative snapshot changes `owner` or `type`. At 1.2s, `id=42` owner0 x100→owner1 x170 produces a displayed x100 instead of authoritative x170, then interpolates through intermediate ownership-invalid positions.

This is **source-derived and regression-encoded**, not a new physical-PC observation or a compiled test failure. The missing identity check should be repaired **by A34 in its own owned `RemoteBallSmoother.cs`**, before A70 accepts the single selected implementation. A suggested narrow fix:

```cs
sealed class Pose
{
    public int owner; public string type;
    public float fromX,fromY,toX,toY,start,duration;
}
// On Observe(), if id is new OR owner/type mismatch, reinitialize the
// corresponding Pose directly at the new authoritative ball.x/y.
// Otherwise continue normal interpolation. Do not mutate GameState.
```

The actual A34 implementation is otherwise already useful: presentation-only state; bounded 0.2s duration; no extrapolation; snaps after action change, >0.6s gap, frame rewind or >220-unit jump; cleaning dead/banished IDs; own test coverage. The new tests keep its valid smoothing behavior and exclusively guard previously untested owner/type identity discontinuities.

**Further source-level acceptance risk, not a confirmed bug:** short-range genuine in-action teleport below 220 units may be visually interpolated. A34 should establish whether relevant teleport effects always advance actionSerial/trigger a state-reset; if not, A31/A34 need a bounded teleport-event invalidation signal before final G3 acceptance. A50's previous helper exposed an optional `instantBallIds` but should not be imported alongside A34 solely for that feature.

## 3. Actual W10 test code implemented

Changed source **only**:

`unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs`

Appended three managed tests in the already invoked `ElementalTests()` suite, referencing existing A34 `CoreClash.Presentation.RemoteBallSmoother` from the precise A34 commit:

| Fixture | Expected behavior | Exact A34 source prediction | Executed? |
|---|---|---|---|
| W10 A50 remote pose owner change must snap immediately | Same ball ID, owner0→owner1, position100→170: render x170 at receive instant, not an interpolated stale pose | RED, because Pose stores no owner | **NOT_RUN** |
| W10 A50 remote pose type change must snap immediately | Same ball ID, normal→frostguard, position40→100: render x100 immediately | RED, because Pose stores no type | **NOT_RUN** |
| W10 A50 remote pose stable identity still interpolates without state mutation | Same owner/type, position50→150 in .2s; midpoint at .1s =100 and authoritative x/vx/hp unchanged | Expected GREEN | **NOT_RUN** |

All cases use `GameState.phase=MatchPhase.Moving`, monotonic `frame`, unchanged `actionSerial`, distinct snapshot times and deterministic IDs. They are not device or compilation evidence.

## 4. Executed checks / gaps

- GitHub authenticated exact A34 and A50 code readback, checked frozen RC1 source for current NGO cadence, examined PR #163, #169, #174, #175 change sets.
- GitHub source-level assertion checks and diff allowlist will be reported with exact result after final readback.
- The local environment has **no .NET SDK / C# compiler / Unity Player**. `dotnet --info` => exit 127; `command -v Unity` => exit 1. The new managed tests **NOT_RUN**; no Windows binary produced, no PC1↔PC2 runtime executed, no independent A60 QA performed.
- Existing RC1 Windows/managed/codec evidence is historical to this candidate; it cannot certify newly modified W9/W10 source. Do not report selected A34 green until its own C# fixtures and these RED-to-GREEN identity regressions are run on the exact combined SHA.

## 5. Ownership and implementation handoff

- **A34:** amend `RemoteBallSmoother.cs` in its own branch with owner/type-aware cache invalidation; run all 8 original A34 + 3 A50 tests on SDK9. Confirm true teleports are not rendered as false motion.
- **A31/A41/A30:** choose one coherent NGO snapshot cadence/ACK change based on exact payload and two-PC transport evidence, not the incorrect claimed pre-fix 2-second interval.
- **A20/A30/A32/A34:** reconcile `CoreClashApp`, `BoardView`, `BallView`, `MatchView` by source hunks, preserving local-seat P2 labels, turn text, aim and pointer transforms, and UI-only smoothing.
- **A10:** accepts redundant power-meter removal; A50 does not change player UI.
- **A70:** only agent to assemble a new authorized disposable integration candidate. Integrate A34 *or* A50 interpolation, **not both**. Do not merge into immutable RC1/main or release.
- **A72:** create exact-SHA Windows binary after code acceptance; managed Unity and codec test logs must belong to that SHA.
- **A60:** independent QA on two physical PCs: host actionSerial, exactly once P2 intent, revision convergence, continuity of real ball motion, teleport, replay, P2 view/turn/aim, no input hitbox drift. G3/G4 remain HOLD pending actual evidence.

**DESIGNED:** COMPLETE acceptance logic. **IMPLEMENTED:** 3 executable test definitions, no production gameplay modification. **TESTED:** source review only; managed/Unity two-PC **NOT_RUN**. **INTEGRATED:** NO. **RELEASED:** NO. **GATE:** TEST-ONLY RED ORACLES / HOLD until A34 repair and A60 independent runtime.

**Do not replace this with a balance or physics tuning change without an actual failing trace.**

---

## 6. LIVE W10 RESOLUTION — A34 UPSTREAM CLOSED THE IDENTITY SOURCE GAP

**Important: section 2 documents the source truth at the original A34 SHA `d237612...`. It is historical, no longer an open source defect at the latest A34 HEAD.**

While A50 created its dependent regression branch, **A34 independently updated the same selected visual implementation**. Latest exact A34 `feat/cc001-r17-w9-a34-client-visual-smoothing` and PR #174 HEAD:

```
d6053901edce86eb705919aab819c213b53c5143
```

A34 now stores `owner` and `type` in `RemoteBallSmoother.Pose` and checks both before interpolating. On owner/type change it directly resets `fromX/toX/fromY/toY` to the *new authoritative coordinates*, sets duration0 and continues without tween. A34 also added its own C# tests for owner/type conversion, 20Hz pacing, malformed/null balls and duplicate IDs. **Thirteen total A34 named managed tests** now exist; A50's 3 dependent test definitions are overlapping and not needed for the final integration path.

**Current Git blob IDs on selected A34 HEAD:**
- `Presentation/RemoteBallSmoother.cs` — `bbf1dc828158af7a2bf6e1c110f9cacdd6228e5a`
- `Tests/RemoteBallSmootherTests.cs` — `bf81e6b192b6cdd55f4d0788aae00a508d4bc235`
- `Presentation/CoreClashApp.cs` — `508e64a536d147eb95f75e14dec6eaf811ccefd5`
- `Presentation/BoardView.cs` — `0bcc925426878772628b2749c89eb5ba0d2be86e`
- `Presentation/BallView.cs` — `ad4cb6acbd8f49e7d11a934ed48b6e755c51c343`

**A50 performed 21/21 new STATIC source and ancestry/ownership checks PASS**, including exact latest branch SHA, owner/type invalidation, identity snap, duplicate/null guards, absence of source authority writes, app→board→ball display integration, original A34 tests, and both old A50 PRs closed unmerged. This does not substitute for managed C# compilation or native LAN two-device tests.

**Competing PRs explicitly disposed:**
- Original A50 draft **PR #169** (unwired Physics/RemoteBallPoseSmoother) — **CLOSED UNMERGED**; superseded by selected A34 implementation. No deletion, branch SHA `38cc4c851011da2e81c94f1a73910aee95852d2c` preserved.
- A50 dependent **PR #185** with three early W10 tests — **CLOSED UNMERGED**; duplicated by later A34 tests. Branch source/test commit `46c2c142a5d7e64a79eb2125f995c75f5222efee` preserved; report commit before this note `e5dcffe1ca3b1a2ec3a7e6ae7d48a271840c4713` preserved.
- **A34 PR #174** — sole selected visual smoother candidate, still a **DRAFT with unexecuted C# and independent Windows PC1–PC2 QA**. Selection is not A70 integration authority or release approval.

**Only A70** may assemble a disposable W10 gameplay candidate from the accepted, source-verified owner patches. Any A30/A41 snapshot-rate policy selection belongs to A31/A70, as these PRs conflict in Ngo networking files. The A34 display changes must be reconciled with A20/A30/A32 overlapping presentation files, preserving both world-to-screen and inverse pointer transforms.

**FINAL A50 W10 HANDOFF:**
- DESIGN: resolved selection and regression contract.
- IMPLEMENTATION: original A50 test-only branch exists for traceability, **NOT SELECTED**; upstream A34 has source-fixed the identified identity issue.
- TESTS A50 ACTUALLY EXECUTED: source/branch/blob/ownership **21/21 STATIC PASS**; `dotnet --info` exit127, Unity lookup exit1. **A34 C# 13/13: NOT_RUN by A50** (not a PASS).
- INTEGRATED: **NO**.
- RELEASED: **NO**.
- GATE: `A50_VISUAL_SOURCE_SELECTION=COMPLETE`, `A34_SOURCE_IDENTITY=FIXED_STATIC`, `C_SHARP_UNITY_PC1_PC2=HOLD`, `A60_INDEPENDENT_QA=PENDING`, `RC1_MAIN_RELEASE=UNCHANGED`.

No protected RC1/R16/V148, Protocol149, production networking, or foreign-owned source paths were edited by A50.
