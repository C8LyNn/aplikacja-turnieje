# CC-001 R17-W10 / A33 — Local ball-inspection ownership cues

**Role:** A33 — Presentation / UI Implementation  
**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97  
**Scope:** connected-client-relative local owner text in ball-inspection modal only  
**Dependency:** W9 A33 [PR #176](https://github.com/C8LyNn/aplikacja-turnieje/pull/176)  
**Frozen RC1 source:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (unchanged)  
**W10 source base:** W9 A33 `162e9a4b091702d4164dbb40c19c933154b2f599`  
**W10 branch:** `feat/cc001-r17-w10-a33-local-ball-owner-cues`

## Real change

- When **connected**, a runtime ball's canonical `P1`/`P2` owner mark adds **(YOU)** iff the ball owner equals `NetworkLink.LocalOwner`; otherwise **(OPPONENT)**. This prevents PC2 player from confusing a P1 inspected ball with a local ball.
- When local/hotseat, disconnected, or local seat is invalid, preserve canonical `P1`/`P2` without a relative ownership claim.
- Only `DetailsView.RenderInfo` presentation text and a private pure formatter are modified. The ball preview owner color and exact current/max HP remain intact.
- No reliance on `Simulation.State.turn` to label who owns a ball; no turn or owner mutation.

## Included paths compared with W9 A33 parent

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs`.
2. `scripts/cc001/w10/a33/ball-owner-cues.test.cjs` — 12 named source-contract and synthetic reference cases.
3. This W10 A33 handoff.

**Execute on a full checkout:** `node --test scripts/cc001/w10/a33/ball-owner-cues.test.cjs`.

## What actually ran

The exact GitHub-committed test text was executed under a V8 in-memory harness against the exact GitHub-fetched W10 `DetailsView.cs` and unchanged `CoreClashApp.cs` contents: **12/12 PASS**. Cases include connected P1/P2 positive/negative marks, local hotseat, invalid seat, no turn-derived ownership, preserved HP, no network/state mutation, and unmodified canonical `CanChoose` gate. These are **synthetic/reference and static checks**, not execution of Unity UI or actual .NET tests.

**NOT RUN:** Node test executable in a full checkout, managed C#, Unity compilation/PlayMode, new native Windows build, real PC1–PC2 operator test, A60 independent QA. No G3 PASS or performance claim.

## W10 integration facts relevant to A70

- A10 previously **design-approved** removal of redundant secondary aim strength/percentage overlay ([HQ approval](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6529281715)).
- During this W10 pass, A20 W9 source branch was updated to HEAD `8c0df685f63577a2ac08665b346e343f7d6727aa` and already contains removal of the `BoardView.RenderAim` percentage and rectangle; it preserves `AimGuide.Trace`, A20 `AimStroke`, and 18-unit readiness. A20's own managed tests were also added. **A33 must not offer a duplicate competing power-meter patch.**
- An earlier exploratory A33 branch `feat/cc001-r17-w10-a33-aim-meter-simplification` forked from an *older* A20 SHA `2726389e6dcfc280ea482acf1769e747b8a01237` before the A20 update. **SUPERSEDED / DO NOT INTEGRATE / NO PR**. No A20 branch was overwritten.
- A70 must select/compose **one** compatible solution for overlapping `BoardView.cs`, `MatchView.cs`, `NgoGameSession.cs`, and `CoreClashApp.cs`: W9 A30 #175 vs A20 #168 vs A21 #170 vs A32 #173 vs A34 #174 vs A41 #163. W10 A33 avoids these conflict hotspots and does not merge any of them.
- W9 A33 F1 diagnostic PR #176 and this dependent W10 PR are limited to `DetailsView.cs`; any merging into A70 candidate should be done by A70 after A60 gates.

## Outcome/status axes

| Axis | Value |
|---|---|
| DESIGNED | YES |
| IMPLEMENTED | YES — isolated W10 branch |
| TESTED | 12/12 V8 synthetic/static PASS; native/Unity/PC tests NOT RUN |
| INTEGRATED | NO — dependent PR only |
| RELEASED | NO |

**Protected:** RC1/R16/V148/Protocol149/main/release untouched. **No Windows build or independent two-PC QA claimed.**  
**Next:** A70 integrates approved source; A72 builds exact new Windows candidate; A60 independently QA tests on PC1 and PC2.
