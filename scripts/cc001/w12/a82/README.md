# CC-001 — W13 / A82: Exact-SHA Mechanic Displacement Trace Gate

## W15 correction — production smoother resets outside Moving

**Supersedes the W14 interpretation of post-STOP visualization.** The source enum still allows `MatchPhase { Aiming, Moving, Over }`, but both the frozen W11 source and separate newer #207 implementation of `RemoteBallSmoother.Observe()` explicitly execute `Reset(); return;` when `state.phase != MatchPhase.Moving`. `TryGetPosition` then cannot supply an active smoother pose for an accepted `Aiming` or `Over` snapshot. The existing production `RemoteBallSmootherTests.cs` explicitly checks that transition/reset.

**Result semantics:**
- `Moving` + recognized new `PORTAL`/`TELEPORT`/`SWAP`: compare actual host pose to P2 post-Observe visual pose as before; invalid pose = `FAIL`, complete synthetic sample = `PASS_SCOPED` only.
- `Aiming` or `Over`: source-valid state but *smoother inactive*; the tool returns `HOLD` / `NON_MOVING_SMOOTHER_INACTIVE` (exit2), **not PASS nor gameplay FAIL**, even if post-STOP event remains in the event list or fabricated matching coordinates are supplied. Missing rendered pose is expected here.
- Malformed phase, source SHA/profile mismatch, invalid game event IDs/cursor or missing SWAP participant remain `FAIL` regardless of inactive phase.
- Frozen W11 `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` remains `PORTAL`-only; separate DEV `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c` allows `PORTAL`, `TELEPORT`, and both SWAP IDs **when Moving**. Other source SHAs are unreviewed/HOLD.

```sh
node --check scripts/cc001/w12/a82/check-displacement-trace.cjs
node --check scripts/cc001/w12/a82/check-displacement-trace.test.cjs
node --test scripts/cc001/w12/a82/check-displacement-trace.test.cjs
# This fixture records an Aiming snapshot and no smoother pose. Expected HOLD/exit2:
node scripts/cc001/w12/a82/check-displacement-trace.cjs --expected-sha 87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c scripts/cc001/w12/a82/example.inactive-aiming.synthetic.json
```

**Actual W15 evidence:** native Node22.16.0 test suite **77/77 PASS / exit0** (63 revised previous tests + 14 new); original W14 binary on exactly the same synthetic empty-pose Aiming fixture returned **FAIL/exit1** whereas W15 returns **HOLD/exit2**. Git SHA1 checked on locally executed byte-exact code/test files: CLI `0091f1ba0b1e81c40b9ba34107e165440cbe2730`, tests `b67ecd6585d5b72fb6ce253b81bf0154b2a592f7`; native TAP log SHA256 `369bd00b5bb5fb6bc6311a65101e00a1948e22a2ed4dd5fb017b627f1bd5b74f`.

**Important:** The CLI does NOT have a PC1/PC2 capture adapter. It never certifies actual paired play, ball physics, QA G3/G4, or Windows build. W11 freeze source not changed. A72 #188 / #262 must use licensed Windows11+Unity6000.4.0f1 Windows Build Support+.NET SDK9 for a real build; A60/A31 independently test physical PC1–PC2. Owner rules Mitosis V148, Furnace FIRE zone/periodic only, HP R16 and Protocol149 unchanged.

**Status:** isolated **POST-W11 test-tool** update stacked on A82 [W12 PR #234](https://github.com/C8LyNn/aplikacja-turnieje/pull/234). No source/gameplay/network/physics/Unity changes, no QA-freeze mutation, no Windows build or physical two-PC evidence.

## W13 correction of a proven false scoped green

W12-v1 tested a fabricated `PORTAL` + `TELEPORT` + `SWAP` sequence using **frozen W11 SHA `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`** and returned `PASS_SCOPED`, even though the exact frozen `RemoteSnapshotEvents.InstantBallIds` only explicitly snaps `PORTAL`. This was reproduced using the original W12 CLI. **It did not prove W11 was passing all three mechanics.** W13 replaces the semantic schema with v2 and makes source-version capability part of the assertion.

### Reviewed source profiles (no dynamic inference)

| Exact source SHA | Source profile | Assertable instant visual snap | Known missing source capability |
|---|---|---|---|
| `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` | `W11_QA_FREEZE_PORTAL_ONLY` | `PORTAL` actor | `TELEPORT`, both `SWAP` participants |
| `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c` | `POSTFREEZE_PR207_RELOCATIONS` | `PORTAL` / `TELEPORT` actor; `SWAP` actor + `otherId` | None among those three |

The W11 QA-freeze ref `integration/cc001-r17-w11-qa-freeze-20261030` remains exactly `3f972c...`. The later moving PR #207 **is not** part of that freeze. Unknown SHA is `HOLD`, not automatically assigned a preferred source profile. New source profiles require their own verified source review and code change. Both supplied fixtures are **synthetic**.

## Run with Node.js 22 (no dependencies)

```sh
node --check scripts/cc001/w12/a82/check-displacement-trace.cjs
node --check scripts/cc001/w12/a82/check-displacement-trace.test.cjs
node --test scripts/cc001/w12/a82/check-displacement-trace.test.cjs

# Frozen QA: verifies only PORTAL, explicitly reports incomplete displacement capability
node scripts/cc001/w12/a82/check-displacement-trace.cjs --expected-sha 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3 scripts/cc001/w12/a82/example.synthetic.json

# Newer dev source: three event types, same SHA-specific contract
node scripts/cc001/w12/a82/check-displacement-trace.cjs --expected-sha 87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c scripts/cc001/w12/a82/example.postfreeze.synthetic.json
```

**Results:** `0 PASS_SCOPED` (only that source profile and supplied records), `1 FAIL` (source/profile mismatch, malformed/out-of-order event, illegal participant, wrong paired pose, duplicate/stale revision), `2 HOLD` (missing input, unreviewed SHA, unsupported event at that SHA, incomplete needed coverage, discontinuous cursor), `64 USAGE`. Every result has `physicalG3Status:NOT_ASSESSED`. For frozen SHA `fullDisplacementCapability:false` and `excludedKinds:["TELEPORT","SWAP"]` even when synthetic PORTAL passes.

## Evidence interpretation

Each v2 JSON record declares `schema`, `sourceSha`, `sourceProfile`, `evidence.captureType` (`operator` or `synthetic`), and ordered `samples`. Sample fields: `device:"PC2"`, `observation:"POST_APPLY_POST_OBSERVE"`, `phase:"Moving"`, positive monotonically admitted `revision`, nondecreasing `actionSerial`, `cursorBefore`, `cursorAfter`, ordered deduplicated `events[]` (`id,kind,ballId,otherId`), `hostBalls[]`, `renderedBalls[]` (`id,x,y`). All positions must be world coordinates *before* the PC2 viewport transform, and host/render data must refer to the same accepted snapshot. Supported displacement events must identify actual participants: `SWAP` needs two distinct positive IDs. Visual pose is checked at observation time within 0.5 world units. Ordinary kinetic motion remains interpolated rather than forcing all poses to snap.

This tool **does not capture data or authenticate evidence**. A PASS from generated/synthetic or operator-labelled JSON **does not establish any real PC1–PC2 result**. `hostBalls`, event cursor and actual P2 `RemoteBallSmoother.TryGetPosition` output need a separate **authorized** trusted collector. If the collector misses accepted revisions/cursors, the checker cannot infer continuity and returns HOLD. For full W11 native G3, A72 must build original Windows Player from frozen SHA and A60/A31 must independently run/verify original PC1+PC2 Player binaries and logs/videos. A70 alone selects future integration; W13 PR cannot be used to change QA-freeze or approve main/release.

**Owner decisions untouched:** Mitosis exactly V148; Furnace only FIRE zone and periodic damage; HP as R16; preserve RC1, Protocol149, all source and artwork. This update changes only the existing W12 A82 isolated Node CLI, tests, README, synthetic fixture, plus one new synthetic fixture.

## W14 correction — valid phase after STOP, not fake teleport errors

A82 reproduced a real **validator false FAIL** on the byte-identical W13 CLI: a DEV source `SWAP` sample captured at `phase:"Aiming"` was rejected solely because the analyzer required `phase:"Moving"`. The **frozen authoritative** `GameState.cs` explicitly declares `MatchPhase { Aiming, Moving, Over }`; `GameSimulation.Step` executes OnStop while moving, and `TurnSystem.ResolveAction` may later set `phase=MatchPhase.Aiming` before an accepted PC2 snapshot arrives. Victory may instead yield `Over`.

W14 permits **exactly** the three source-defined phase strings `Moving`, `Aiming`, `Over`; malformed, mixed-case or missing values remain hard FAIL. Phase acceptance does not change the per-SHA capability: frozen W11 **still explicitly snaps only PORTAL**; newer unmerged #207 additionally snaps TELEPORT and both SWAP participants. W15 clarification: a valid Aiming/Over state remains admissible data, but the production smoother has already reset. Its visual position is **NOT OBSERVABLE**; W15 returns HOLD, not the W14 inferred PASS/FAIL on a nonexistent pose.

```sh
node --test scripts/cc001/w12/a82/check-displacement-trace.test.cjs
node scripts/cc001/w12/a82/check-displacement-trace.cjs --expected-sha 87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c scripts/cc001/w12/a82/example.poststop-aiming.synthetic.json
```

**W14 native Node22 test result:** 63/63 PASS exit0 (47 prior + 16 new), code+test exact tested local Git blobs `e5a1985d1231e6260c008e30bd901d0b1b5d8616` and `024bad7034440a4fffba1a88fae03cfa05ceb765`. This is **historical W14-only** evidence, **superseded by the W15 77/77 fixture suite**. All fixtures are synthetic, not recordings from PC2; `physicalG3Status=NOT_ASSESSED`. No Unity Windows build or physical two-PC run was performed by A82.

