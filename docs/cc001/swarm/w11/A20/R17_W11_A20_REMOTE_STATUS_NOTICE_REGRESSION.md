# CC-001 / R17-W11 / A20 — seat-aware notice and disconnect correction

**Owner:** A20 UX/UI · [Issue #95](https://github.com/C8LyNn/aplikacja-turnieje/issues/95) · [HQ #97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).  
**User authorization:** R17-W11 role-scoped integration/QA followup, not a main/release authorization.  
**Selected composite source this patch is stacked on:** A30 [Draft PR #189](https://github.com/C8LyNn/aplikacja-turnieje/pull/189), exact `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`.  
**A70 first-stage candidate:** [Draft PR #181](https://github.com/C8LyNn/aplikacja-turnieje/pull/181), `3d377767e72473cebd90e49293a0cd5dada70464`. A30 #189 and this A20 patch are **NOT YET integrated by A70**.  
**Original immutable RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (unchanged).
**A20 W11 branch:** `feat/cc001-r17-w11-a20-context-aware-ui`.  
**Exact final SHA:** see author issue #95 handoff after this documentation-only commit.

## Production source changes — small independent A20 patch

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BallSelection.cs`
   - `LocalTurnPresentation.Status`, `CompactStatus` and `ActionHint`: disconnected state **takes precedence** over stale `Moving`/shot-resolving state, except final `Over`. Network P2 no longer sees an ordinary healthy resolving-status while disconnected.
   - Adds `LocalTurnPresentation.ActionMessage` as pure presentation code: stale intent-rejection notice can be displayed **only** on a currently active, valid, connected local Aiming seat (offline local hotseat allowed); remote P2, disconnected, Moving and Over instead show correct turn/connection/result cue.
   - Does **not** change `CanChoose`, turn ownership, `GameSimulation`, stock, LaunchGesture, NetworkLink or network protocol.
2. `.../Assets/CoreClash/Presentation/MatchView.cs`
   - Compact and feedback rows now use `ActionMessage` instead of unconditional `notice.Length>0 ? notice :...` override.
   - Desktop's secondary error-notice row gated by existing `CanChoose`, preserving authoritative local input permissions.
   - Board inspection remains available: `TAP BALL TO INSPECT` applies when inspection mode is intentionally selected.
3. `.../Tests/PresentationTests.cs`
   - Six new managed test cases, `NET-UX-15…20`, for disconnected Moving, remote P2 stale notice, disconnected own P2 stale notice, connected own P2 valid notice, Moving/Over stale notice, and invalid network seat. Existing `NET-UX-01…14` preserved unchanged.
4. This own report. **No other paths**.

## Actual verification

- GitHub pinned direct ancestor and 3/3 production/test file allowlist PASS before report; 13/13 source-structure/flow assertions PASS, including unique NET-UX-01..20 identifiers, all 3 display locations, ordering of disconnect guards and absence of protocol/game changes.
- Tool probes on the A20 execution environment: `dotnet`, `csc`, `mcs`, `msbuild`, `Unity` all **not installed** (shell `command -v` exit 1); Node22/Git2.47 available, but no C# compiler.
- **Managed C# compile, 20 tests, Unity Windows build, native Player and two physical PCs: NOT_RUN**. No process exit code exists for those unexecuted jobs. Do not transfer older 361/361 baseline results or A60 approval onto this new SHA.
- **A70 Draft PR #181 + A30 Draft PR #189** remain the integration gates. This patch neither merges them nor asserts network sync or actual ball smoothness fixed.

## W11 integration guidance

- A70 may cherry-pick or selectively merge this three-file A20 presentation/test delta **only after explicitly accepting A30 #189** (or manually adapting these small pure UI helpers to its alternative selected candidate). Do not blanket merge A20's old #168 into #189, which already carries its selected W10 semantics and tests.
- A70 owns the networking/smoothing source selection, not A20. Physical P2 orientation remains provisional vertical-own-bottom mirroring; no additional camera transformation in this patch.
- A72 must retarget any exact-SHA build kit to the **final A70 combined commit**, not stale `3d377...` / `3a6...` if an extra A20 commit is admitted. A60 independently runs C# NET-UX-01..20 plus actual Windows Player with P1/P2 turn/disconnect/resume cases and synchronized host/client logs.
- **Do not report** net latency solved, G3/G4 PASS, release, native screenshots or Windows build without new evidence. RC1/R16/V148/Protocol149/main remain immutable.

**Five axes:** DESIGNED=YES / IMPLEMENTED=YES on isolated A20 branch / TESTED=STATIC_SOURCE_ONLY (13/13), C#/Unity/2-PC NOT_RUN / INTEGRATED=NO / RELEASED=NO.
**Current decision:** READY_FOR_A70_SELECTION, A60 QA HOLD, RELEASE STOP.
