# CC-001 R17 / A51 — R16 PARTIAL fixture and telemetry support

**Workstream:** A51 Simulation / Instrumentation, support to [A50 Issue #93](https://github.com/C8LyNn/aplikacja-turnieje/issues/93).  **Source:** V149 R16 (not certified V148).  **Execution date:** 2026-10-18.

## Authored scope / ownership

The R17 dispatch has **no A51-owned Issue or branch**. The nearest simulation-oriented task is A50 Issue #93 on branch `feat/cc001-r17-a50-partial-acceptance`. This is an **A51 supplement**, not a replacement for A50's acceptance verdict or A70's source import. No gameplay/source/build/public-site changes. Prior A51 V148 and T018 MC3 work remains intact.

## Verified intake

- Original R16 source ZIP SHA256 independently checked: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`; **639** archive entries.
- Source is the original Drive ZIP, not the compiled WebGL artifact.
- Ran `node Tools/verify-data.cjs` on a **disposable extracted copy**: **PASS** — 227 records / 224 specials / 12 archetypes / 36 canonical + 4 provisional decks; hashes/contracts verified.
- R16 `Evidence/R16/ability-support.json` confirms **19/19 PARTIAL**, not UNITY_READY.
- No dotnet/Unity toolchain available in execution environment; **managed, native-collider, network-replay, Android and WebGL acceptance NOT RUN by A51**. R16's reported 269/269 is historical evidence, not an R17 test.

## Coverage and fixture requirements

| Group | Balls | Source of truth | Acceptance focus |
|---|---|---|---|
| Construction | Wallmaker, Barricade, Repair Pulse, Engineer, Bastion | `ConstructionEffects.cs` | STOP/TURN, collision-safe placement, cap/atomicity, owned structure repair, shield selection |
| Reinforcements | Commander, Quartermaster, Armorer, Splitter | `ReinforcementEffects.cs` | generated token provenance, two-turn countdown, same-turn ordering, stock/graveyard and no synthetic DEATH |
| Evolution/lifecycle | Hatchery, Replicator, Mitosis, Swarm Core, Conscriptor | `EvolutionEffects.cs`, `LifecycleEffects.cs` | timer reset asymmetry, owner/global caps, CONTACT target classes, DEATH spawn and veteran choice |
| Elements | Firebrand, Chain Frost, Ash Core, Furnace, Frostguard | `ElementalEffects.cs` | statuses and source attribution, max four unique targets, shield cap, zone refresh and HIT gate |

**Designed fixture count:** 42 (two per ability + four targeted edges). All fixtures remain **NOT_RUN**; there are no fabricated runtime traces, no WIN/LOSS interpretation, and no promotions from PARTIAL. The JSON manifest names the existing R16 source/test file for each ability and separate POSITIVE / CATCH definitions.

## Particular quality gates

- **Mitosis:** Only tested ball–ball contact path is claimed in R16. Additional native collider classes are an open acceptance decision, not a failure assertion.
- **Quartermaster + Commander:** Same-turn generated Standard can receive a shield depending on event/ID ordering. Do not fix code to force a preconceived result.
- **Furnace:** Existing FIRE status machine applies zone effects at turn end; do not invent extra direct damage.
- **Frostguard:** R16 anchor mass/friction must be checked with Unity physics, not declared successful by source inspection.
- **Spawn cap/blocked placement:** Preserve no-spawn attempts as evidence; confirm token `generated` flags, serializable IDs, stock/graveyard invariants and host authority.
- **Event trace:** capture initial state, deterministic seed as interpreted by runtime, action/turn order, source/target/created IDs, state before/after, scene and network snapshot. No success merely for entering handler.

## Reproduction

From any clean working folder containing R16's extracted `CoreClash-V149-Unity` directory:

```sh
node Tools/verify-data.cjs
node /path/r17-a51-static-preflight.cjs --source=/path/CoreClash-V149-Unity --matrix=/path/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json
```

Both are **static checks only**. The next step after A70 imports the exact source is A50/A60's controlled failing-fixture-first execution. Preserve source, fixed seeds, telemetry and actual errors; do not write result rows for these unexecuted definitions.

## Status / HANDOFF

- **DESIGNED:** YES, 42 fixture specifications / 19 abilities.
- **IMPLEMENTED:** No R17 gameplay modifications. Existing R16 source inspected. Static-preflight helper authored.
- **TESTED:** R16 archive SHA and Node data validation PASS; static fixture schema/source presence PASS. Gameplay acceptance NOT RUN.
- **INTEGRATED:** NO. A70 import gating source branch still pending at preparation time.
- **RELEASED:** NO.

**HQ:** Retain A50 Issue #93 as owner. **A50:** use definitions for exact test-first acceptance matrix and retain PARTIAL until Unity-native validation. **A60:** independently review source / collision / serialization / device evidence. **A70:** deliver reproducible R16 Git source baseline.