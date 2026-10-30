# CC-001 — R17-W10 / A40 P2 snapshot + Phoenix gameplay integration readiness

**ROLE:** A40 — Gameplay / Lifecycle + RETURN (original assignment to this thread), existing [Issue #92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92).  
**HQ:** [Issue #97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).  
**IMMUTABLE RC1 BASE:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.  
**OWN BRANCH:** `feat/cc001-r17-w9-a40-p2-turn-contract`, [existing DRAFT PR #154](https://github.com/C8LyNn/aplikacja-turnieje/pull/154).  
**W10 START HEAD:** `e9403efe8b28e4c432527e140c950b51d38d0c25`.  
**W10 TEST-CODE COMMIT:** `311e4ab91d7580fb9ac803b243a8102e51286103`; blob `Tests/AbilityTests.cs` = `93202589e0a80f43935b7cfed96c5a7666980e67`.  
**W10 FINAL HEAD:** see final GitHub ref readback and Issue/PR handoff because report cannot embed its own commit SHA.  
**PROTECTED:** RC1/R16/V148/Protocol149 remain untouched; no merge to main or RC1, no release.

## 1. Actual new implementation — two managed C# gameplay acceptance tests

In **A40-owned** `unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs`, commit `311e4ab...` adds two compiled-by-project *test registrations* to the previous three W9 cases. These are test code only, not simulated PASS values.

**W10 A40 P2 authoritative snapshot preserves moving ball owner position and action:**
- Launch P1 and settle to P2; submit a genuine P2 `fire` intent through **NetworkGameSession.Submit(1,...)`**, requiring authoritative `MatchPhase.Moving`.
- Encode host state via `SessionSnapshot` and `System.Text.Json` with `IncludeFields=true` and apply to `NetworkGameStateAdapter` using existing Protocol149 validity rules.
- Assert `specVersion==149`, owner/turn/turnNumber/actionSerial/eventSerial equality, ball ID/owner/type/x/y/vx/vy equality on replica.
- Advance host simulation exactly one step, apply a newer capture, and re-assert position/velocity parity.
- Reject stale/duplicate older/current snapshot revisions **without rollback of client state**.
- This is logical state/snapshot parity. It does **not** establish actual NGO transport, PC2 visual interpolation, physical stutter, or wall-clock timing.

**W10 A40 P2 ready Phoenix hand is consumed exactly once by authoritative remote intent:**
- Create real Phoenix death for P2 and its `REPLAY_RETURN` hand; confirm absent finite stock and unready initial hand.
- Advance by **real P1 settled launch** to P2 owner turn; verify hand becomes ready and regenerates HP5→10.
- Try spoofed connectionOwner=0 sending owner1 intent: reject, no action/event/hand mutation.
- Submit `NetworkGameSession.Submit(1,...) ` with legitimate P2 Phoenix: accept, owner1 spawned Phoenix has HP10, finite stock remains0, hand 1→0.
- Assert one normal **SPAWN** event for new ball, zero extra **RETURN** after the action, actionSerial increases once, duplicate sequence rejected.
- Capture and apply host game state to replica, verify consumed hand, P2 ball owner/HP/Shield and authoritative action/event serial parity.
- This protects A40's Phoenix lifecycle semantics against multiplayer changes without touching network/physics/source ownership.

Combined **five executable test definitions** in Draft PR #154: three W9 P2 seat/bonus/Replay regressions and two W10 snapshot/Phoenix regressions. They are part of the existing `Tests/CoreClash.Tests.csproj`, with `net9.0`, existing `Tests/*.cs`, `Core/**/*.cs` and `Networking/*.cs` (excluding NGO-only Unity files). The test source uses only existing project APIs and serializer.

## 2. Source/ownership integration gate

GitHub compared pinned RC1 → A40 branch after test-code commit: **ahead3/behind0**, changed paths **exactly TWO**:
1. `unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs` (+134 lines to RC1 including previous W9 + two W10 tests; no removals).
2. `docs/cc001/swarm/w9/A40/R17_W9_A40_P2_GAMEPLAY_TURN_REGRESSION_HANDOFF.md` (+50 previous W9 report).

This W10 report is a **third A40-owned documentation path** added in a separate commit. No runtime `GameSimulation`, `TurnSystem`, `NetworkGameSession`, NGO, UI, Physics, `Program.cs`, `Protocol149`, Unity scene, package, or catalog modification.

**Direct merge-file overlap with concurrently open implementation PRs:** **ZERO** between A40 PR #154 `AbilityTests.cs`/A40 docs and A20 PR #168, A30 PR #175, A34 PR #174, A50 PR #169, A32 PR #173, A33 PR #176, A72 PR #158, A60 PR #162. A70 still must evaluate candidate semantic compatibility and independent tests; a disjoint diff is NOT candidate approval.

**Competing source candidates — do NOT blend by default:**
- A30 PR #175 edits `NgoGameSession`, `NetworkGameSession`, `BoardView`, `CoreClashApp`, `MatchView`, presentation tests and layout for 20Hz snapshot plus player-relative UI and P2 view. In its handoff A30 says old Moving cadence **2.0 seconds**, whereas exact RC1 `NgoGameSession.LateUpdate` source is **`.2f` seconds = ~5Hz**. Correct the factual premise before interpreting improvement and performance risk; the actual 20Hz proposal is a 4× rise from 5Hz, NOT a 40× rise.
- A20 PR #168 modifies `BoardView`, `MatchView`, `PresentationTests` and `BallSelection`; overlaps presentation files touched by A30 and A34.
- A34 PR #174 modifies `BallView`, `BoardView`, `CoreClashApp`, `MatchView` and adds `RemoteBallSmoother`; overlaps A30 and adds an independently owned smoothing path.
- A50 PR #169 adds **different** `RemoteBallPoseSmoother` physics-side pure helper and tests, intentionally not yet wired to client rendering. Picking both A34 and A50 without explicit adapter design risks duplicate/conflicting interpolation; it is not a runtime result.
- These overlaps belong to A70 source-selection and A60 quality gates. **A40 does not merge them or touch the other agent paths.**

## 3. Actual executed validations vs unavailable runtime

1. GitHub readback of new `AbilityTests.cs`, expected Git blob `93202589e0a80f43935b7cfed96c5a7666980e67`: PASS source identity.
2. 13/13 in-memory static checks true for five distinct registrations, snapshot capture+network adapter, specification version, moving and P2 owner parity, no stale rollback, Phoenix hand single consumption, no fabricated RETURN, A40 path allowlist, balanced braces, `net9.0` project, and Draft PR not merged.
3. Local shell `command -v dotnet`, `command -v csc`, `command -v mono`: no paths (SDK/compiler absent). `git --version` = Git 2.47.3; Node 22 installed. **No managed tests run** and no process exit code is reported for these test registrations. **Do not call 13/13 static checks a compiled test PASS**.
4. Fresh Windows Unity Player, independent PC1/PC2 screenshots/logs, synchronization/physics/smoothness metrics and A60 candidate QA: **NOT_RUN by A40**. W8 RC1 local/native accepted results apply to **older source SHA**, not this new W10 test delta; no Unity build or PC2 performance claims.

**Gates:** `A40_TEST_SOURCE_IMPLEMENTED`, `A40_STATIC_CHECKS_13/13_TRUE`, `A40_NET9_TESTS_NOT_RUN`, `A40_NO_SOURCE_CONFLICT`, `G3_PHYSICAL_TWO_PC_HOLD`, `G4_HOLD`, `RELEASE_STOP`.

## 4. Next action

- **A70 #137:** consider cherry-pick of **test-only PR #154** when constructing a **new non-RC1 isolated** W10 integration candidate; this requires A70/HQ explicit candidate authority. Choose one compatible network snapshot and one rendering smoothing approach, reconcile A20/A30/A34 overlaps; never auto-merge W9 branches into RC1 or main.
- **A72 #113:** build/test the eventual **exact combined candidate SHA** and full Windows Player only after integration/candidate approval, not stale RC1 binary.
- **A60 #139:** run new managed A40 W9/W10 cases on exact combined SHA; physically test host P1↔client P2 with accepted P2 intent, increasing snapshots, no fake `YOUR SHOT`, actual ball smoothness and aim arrows. Collect both native logs/videos/screenshots and hashes.
- **A31 #94, A20 #95, A50 #138:** preserve host-only action authority, actual P2 shot owner and deferred lifecycle hand states. No A40 production fix justified until a gameplay-core regression is reproduced.

**STATUS:** Designed YES / Implemented YES (five regression tests, two newly committed in W10) / Tested STATIC only; managed & native NOT_RUN / Integrated NO / Released NO.
