# CC-001 — R17-W6 A50 / Frostguard F02 Player Coverage & Determinism Review

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W6 — Independent QA, Runtime & Platform Validation  
**AGENT:** A50 — Simulation / Physics / Balance  
**ISSUE:** [#138](https://github.com/C8LyNn/aplikacja-turnieje/issues/138) — existing, reused  
**BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**STATUS:** **PLAYER F02 SCENARIOS DESIGNED / STAGE 2 SOURCE VERIFIED / PLAYER TESTS NOT_RUN**  
**SCOPE:** review and scenario specification only, no production changes, no new simulation runs, no QA certification.

## 1. Exact live scope and evidence admission

**Immutable Stage 2 candidate Git SHA:** `a67a37a0e4105dd680f52ae6728e93face61f4ce` (verified current HEAD of `integration/cc001-r17-w5-stage2-diagnostic-20261019`).
**Stage 2 source assembly:** `e58ba23a9f20e7a0865668655bd1e819845474bc`.
**Frozen R16 source:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.
**A72 runner HEAD:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`.
**A50 own branch at start of W6:** `9b84a730b39d4033fcd283e2f555774138312ea2`.
**Input evidence archive announced by HQ:** `handoff-20261020-030137.zip`, reported SHA-256 `20a16c90f4997c40959081d45f6a451834e8983e590a3ec38247da8747815c31`.

This exact ZIP was **not available** in A50's conversation/local sandbox, so A50 did **not** rehash or independently certify its Windows G1/G2 logs, EXE or six PNG screenshots. **Archive byte-level acceptance belongs to A60 #139.**

**Latest HQ-reported execution (NOT independently repeated by A50):**
- 351/351 managed C# tests PASS on Windows/.NET SDK 9.0.313, including F02 G09B/C/D/E;
- 13/13 codec PASS, 7/7 runner stages PASS, exit0;
- Unity 6000.4.0f1 StandaloneWindows64 build success; 0 errors, 1 warning;
- Windows native smoke 50 turns / 51 launches, successful rendering and output;
- Stage 2 WebGL/Android and independent physical/crossplay tests NOT_RUN.

**Scope conclusion:** G09B/C/D/E should be treated as **executed managed tests per HQ evidence**, not as untested. They are **not** yet independently admitted by A60 nor validated in the dedicated real-player physical/Replay scenarios specified below.

## 2. Verified source identities and key gameplay observables

A50 fetched the actual files at the exact Stage 2 SHA:

| File under `unity/cc001-r16/CoreClash-V149-Unity/` | Git blob SHA-1 |
|---|---|
| `Assets/CoreClash/Core/ElementalEffects.cs` | `4e0ce8287e71778dc7bf647e785680ddf03a8e18` |
| `Assets/CoreClash/Physics/CollisionResolver.cs` | `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e` |
| `Assets/CoreClash/Physics/BallPhysics.cs` | `04663f123e715a3e8b0daa9da1f338a05b9105e6` |
| `Assets/CoreClash/Core/GameSimulation.cs` | `25f5a18de4df3942626f0245c9b1be77eee73106` |
| `Assets/CoreClash/Presentation/CoreClashApp.cs` | `5b70a4631829c8355472d9d3aa83e4107428717f` |
| `Assets/CoreClash/Testing/PresentationSmokeDriver.cs` | `b4bb3ededd3ac97d7199651990a2b048a975cb3b` |
| `Tests/ElementalTests.cs` | `f846df155ef95128bc04d58a04f6852f58f3b2be` |
| `Assets/CoreClash/Core/GameState.cs` | `f14e1f8080a4f630ebcb226407585b45a7f152ef` |
| `Assets/Resources/Data/featured-decks.json` | `005da4feb4e3aebe910be2e2d52f8f5a61073e44` |

Code observations:
- Frostguard STOP sets `frostguardAnchored=true`, zeroes velocity and grants shield +10 capped 15; **does not** inject Earth `anchorStacks`.
- `CollisionResolver.ForceScale`: plain Frostguard defensive anchor **0.30**; `Mass`: **2.0×** with zero Earth stacks; real Earth stacks combine according to the existing Earth formulas.
- Successful `GameSimulation.TryCommand` launch decrements genuine `anchorStacks` **only** for Earth archetype, then clears `frostguardAnchored`; `CanReplay` checks ownership, proximity, root/frozen and once-per-turn constraints.
- `CollisionResolver.Resolve` computes contact normal, normal closing speed, mass-based separation and impulse. `HIT` threshold is **closing >=90**, but collision physics depends on pre/post velocities, geometry, restitution and ordering, which are not established by an isolated `Mass()` assertion.
- `BallPhysics` applies damping per `dt`; extra stack damping only when genuine `anchorStacks>=3`. `UpdateMotion` emits STOP after hold `>=.12` at low speed.
- `CoreClashApp.Update` advances authority-owned `GameSimulation.Step(1/120)` via a time accumulator clamped to .1 per render-frame. Native deterministic comparison must control **simulation ticks**, not just screen FPS/wall-clock seconds.

**Specific uncovered native F02 gap found by A50:** `PresentationSmokeDriver` hard-codes `featured_gravity_trap` and `featured_status_reactor`. The exact catalog confirms **neither deck includes `frostguard`**. Thus the 50-turn Windows presentation smoke can validate rendering/match flow, but **not** F02 STOP, Frostguard physical contact or Frostguard Replay. Do not misstate the smoke as an F02 gameplay regression.

## 3. Deliverable — machine-readable 10-scenario Unity Player matrix

**Artifact:** [`R17_W6_A50_F02_PLAYER_SCENARIO_MATRIX_001.json`](./R17_W6_A50_F02_PLAYER_SCENARIO_MATRIX_001.json)

**JSON blob SHA-1:** `bbc92a71c5a5e26c3888f7bfbec82191be799046` at first commit.

| Scenario | Priority | Target | Current execution |
|---|---|---|---|
| F02-P01 | P0 | Real STOP path, 0 Earth stacks, shield +10→15, true 0.30/2.00× defensive response | **NOT_RUN** |
| F02-P02 | P0 | Hostile strong-contact mass/impulse, HIT and counter-ICE through real physics step | **NOT_RUN** |
| F02-P03 | P0 | Weak enemy TOUCH and strong allied HIT negatives | **NOT_RUN** |
| F02-P04 | P0 | Real player Replay gesture, anchor release, no turn/stock or replay duplication | **NOT_RUN** |
| F02-P05 | P0 | Four opt-in diagnostic G09B/C/D/E state/owner controls on Player | **NOT_RUN** |
| F02-P06 | P0 | Rendered anchored → shield/ICE → Replay status in dedicated Frostguard Player screenshots | **NOT_RUN** |
| F02-P07 | P1 | Same exact tick/input trajectory repeated twice; event order/state digest | **NOT_RUN** |
| F02-P08 | P1 | 30/60/120 FPS influence on 120Hz tick-driven outcome; accumulator behavior | **NOT_RUN** |
| F02-P09 | P1 | Snapshot capture/recovery during contact, detect extra HIT/counter effect | **NOT_RUN** |
| F02-P10 | P1 | A40 lifecycle/RETURN interaction with Frostguard anchor, owner and turn | **NOT_RUN** |

The JSON includes concrete setup, stimulus, expected behavior and required recorded fields for each scenario. No numbers for observed Unity hit velocities, duration or damage have been fabricated. The fixed sample positions are **fixture setup suggestions**, not records of executed collisions.

**Fixture classes matter:** P01–P04/P06–P08 are intended to exercise real Player routes; P05 contains **artificially injected genuine Earth stacks on a non-Earth ball**, which is a diagnostic invariant, **not proof this state is reachable through ordinary player actions**. P09 is a plausible source-derived risk assessment, not a confirmed snapshot bug.

## 4. Determinism and scope of assertions

**Suitable for exact replay comparison at a pinned Stage 2 SHA:**
- initial `GameState.randomState=149` (or logged exact seed), same catalog/decks, same created IDs;
- one authoritative source of `GameSimulation.Step(1/120)` per tick;
- the **same commands issued at the same simulation tick indices** and identical state injection;
- `actionSerial`, `turnNumber`, `frame`, `eventSerial`, ordered event IDs/kinds and host physics fields recorded at matched ticks;
- stable per-tick state digest of relevant fields. Exclude wall-clock times and PNG hashes from a gameplay state digest.

**Potential differences to investigate, not presume failures:**
- variable render framerate can change how quickly accumulated *wall time* becomes ticks because of `.1f` accumulator cap; compare at matched simulation tick counts;
- finite float precision/graphics platform can change collision trajectories; do not demand byte-for-byte identical PNG screenshots or cross-platform float values;
- `CollisionResolver.contacts` is a private transient dictionary, absent from `GameState`. A restored world may have different contact-history behavior on the first continuation tick; test P09 for duplicate events/ICE rather than declaring this a confirmed exploit;
- existing `PresentationSmokeDriver` itself can accelerate `Simulation.Step`; a dedicated test driver must ensure it does not unintentionally double-step with `CoreClashApp.Update`.

**Investigative risk not established as an actual bug:** `Resolve()` places mass-based collision impulse/event logic and kinetic damage in related but not identical branches; in repeated-penetration situations, check repeated event and damage counts under fixed conditions. No production fix is proposed without a reproducible failing trace.

## 5. A40 ownership and dependency boundary

A40 alone owns `GameSimulation.cs`, including command validation and Earth stack clearing, plus lifecycle/RETURN code. A50 owns its previously assigned F02 oracle and `ElementalEffects.cs`, `CollisionResolver.cs`, `ElementalTests.cs`; W6 has **no authorization for speculative new gameplay edits**.

If P04/P05 fail in command acceptance, owner/turn handling, replayed IDs or stock, **handoff A40** with exact input and trace. If P02/P03 fail in `CollisionResolver` mass/impulse or Elemental STOP/HIT, **handoff A50** for source inspection and request HQ approval before modifying gameplay. If P09 fails in snapshot/authority, involve A51/A31 after QA triage. A60 retains independent gate authority.

The latest Stage 2 positive managed evidence should not trigger an arbitrary new balance-tuning pass or downgrade existing G09 cases to unexecuted managed status.

## 6. Actual W6 checks and receipts — evidence truth

**Executed by A50 during this turn:**
1. GitHub exact HEAD and C# / catalog / player smoke source readbacks on `a67a37a0e4105dd680f52ae6728e93face61f4ce`, verified file blob SHA-1.
2. Source-and-scenario assertion audit **16/16 PASS** (STAGE2 stop/force/mass/replay, G09B/C/D/E fixture presence, 120Hz app step, accumulator cap, HIT threshold, STOP hold, transient collision cache, featured-deck exclusions, and ten distinct NOT_RUN JSON scenarios).
3. Authored ten deterministic acceptance specifications under A50-owned docs path and verified the committed JSON blob.
4. Local toolchain probes on A50's Linux container:

```text
dotnet --info       EXIT 127 — bash: dotnet: command not found
node --version      EXIT 0   — v22.16.0
command -v Unity    EXIT 1   — Unity executable not found
```

Local log SHA-256:
- `dotnet --info` output: `9cd0debefd267abf71610dae54a6c7ef42823f042f9b8ad886fc8c53bfc7c9fb`;
- Node version output: `256a8e08ee35cb8ad36ae16385257192c3dbe7d80cfdeff9eaa886531b2f83bc`.

**NOT executed by A50:** Windows .NET9 351 managed + codec 13 (already reported by HQ, not rerun); Windows Unity build; Windows Player 50-turn smoke; dedicated F02 Player test; WebGL/Android; device/network; independent QA receipt of ZIP. **No invented process exit codes or Unity player traces.**

## 7. Requirements for a genuine F02 Unity Player acceptance run

The existing R6 Windows player smoke is not sufficient because it contains no Frostguard. A future targeted test harness must:

1. Be tied to exact source candidate `a67a37a0e4105dd680f52ae6728e93face61f4ce`, matching actual build EXE SHA, scene, runner version, Unity version, renderer and `--cc-output` evidence path.
2. Run only when explicitly opted in, avoid changing ordinary gameplay; ideally create a separate disposable player-test harness or already-authorized testing workflow. **No such harness was implemented here.**
3. Execute P01–P06 P0 scenarios, emit full before/after state and contact traces, valid exit0 only if all assertions pass; on failure emit explicit fixture ID, first failing predicate and nonzero exit.
4. Attach screenshots with SHA-256 from a real rendered Player for P06; report mismatch between visual status and authoritative host.
5. Verify tick-level determinism and snapshot risks P07–P09 separately. Distinguish exploratory findings from confirmed failures.
6. Preserve exact executable artifact and log hashes; route raw bytes to A60 for independent review, not only a textual summary.

No new Stage 2 implementation, test runner, build or merge is authorized by this A50 handoff. HQ can delegate a narrow testing-driver task if required.

## 8. Five-axis HANDOFF → 00/HQ, A60 QA, A40 gameplay, A72 runner

**IDENTITY:** A50 / existing Issue #138 / existing `feat/cc001-r17-w4-a50-f02-physics` branch.
**CANDIDATE SHA:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`.
**DESIGNED:** **COMPLETE** — ten executable-spec F02 Player fixtures with priority, input and expected trace contract.
**IMPLEMENTED:** **DOCUMENTATION + JSON MATRIX ONLY** — existing Stage 2 F02 gameplay remains unchanged; no Unity testing driver added.
**TESTED:** **SOURCE/SCHEMA 16/16 PASS**. Reported external managed G1 and Windows G2 are acknowledged, not independently executed/accepted here. Dedicated Unity Player F02 **NOT_RUN**.
**INTEGRATED:** **NO NEW INTEGRATION** by A50; Stage 2 source remains exactly pinned and was not modified.
**RELEASED:** **NO**.
**OVERALL:** **A50 W6 DELIVERABLE COMPLETE / NATIVE F02 ACCEPTANCE HOLD / A60 EVIDENCE REVIEW PENDING**.

**NEXT REQUIRED:** A60 accepts raw G1/Windows G2 ZIP byte-level evidence; HQ/A70/A72 select a permitted exact-SHA Player fixture runner for F02-P01..P06, then run it and independently review its logs. A40 participates only for actual command/lifecycle failures. Do not promote all-platform readiness from Windows-only evidence.

**NO MERGE TO MAIN / NO FORCE-PUSH / NO PROTECTED R16/V148 OR PROTOCOL149 MODIFICATION / NO PUBLIC DEPLOY.**
