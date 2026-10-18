# CC-001 — R17 SWARM DISPATCH — 2026-10-18

Base intake: Core Clash V149 Unity R16
R16 source SHA256:
b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4

Canonical Drive folder:
https://drive.google.com/drive/folders/1u5eBKs-9Ki_bQN_NfHaOWXUWimZtTCxz

Canonical source file:
https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view

Read first:
- HANDOFF_R16_README.md
- R16_REPORT_PL.md
- R16_QA_PL.md
- Evidence/R16/ability-support.json
- this dispatch
- R16_AUDIT_20261018.md

## R17 objective

Continue the real Unity port from R16 using parallel, narrow workstreams.
Do not restart the migration and do not redesign certified V148 gameplay globally.

Priority order:
1. put the exact R16 source tree under Git control;
2. close real cross-device networking gaps;
3. certify/repair the 19 PARTIAL R10–R13 abilities;
4. improve physical phone/tablet usability;
5. implement one narrow V148-faithful lifecycle/RETURN batch test-first;
6. independently verify and integrate.

## Workstreams

### A70 — Git source import / reproducible build baseline — P0 BLOCKER
Outcome:
- import exact R16 source into Git, preserving paths and .meta files;
- exclude Library/Temp/obj/Logs/generated Builds;
- preserve R16 Drive SHA and add source manifest;
- establish a reproducible branch baseline usable by all coding agents;
- no gameplay changes.

Gate:
coding branches that require compilation should rebase from this source-import baseline.

### A10 — Lead Game Design / lifecycle-RETURN semantic contract — P1
Can start immediately from the Drive source/catalog.
Candidate narrow family:
Phoenix, Revenant, Soul Anchor, Dirge, Den Mother
(and only add/substitute a candidate when V148 semantics justify it).

Deliver:
- exact trigger/source/target/state semantics;
- edge cases;
- compatibility with existing lifecycle/event systems;
- acceptance tests;
- no balance tuning and no code implementation.

### A40 — Unity gameplay implementation — P1
Blocked on A70 + A10.
Implement the approved narrow lifecycle/RETURN batch only.
Test-first.
Do not expand all 134 DATA_ONLY.

### A50 — Simulation / PARTIAL acceptance matrix — P1
Build an exact acceptance matrix for the 19 R10–R13 PARTIAL entries called out by R16:
wallmaker, barricade, repairpulse, engineer, bastion, commander,
quartermaster, armorer, splitter, hatchery, replicator, mitosis,
swarmcore, conscriptor, firebrand, chainfrost, ashcore, furnace, frostguard.

Separate:
IMPLEMENTED != ACCEPTANCE TESTED != UNITY_READY.
Produce failing fixtures before changing mechanics when defects exist.

### A31 — Networking / physical crossplay reliability — P1
Focus:
Windows↔Android and Windows↔WebGL on real separate devices/networks,
latency/jitter/reconnect, long match, seat recovery, Relay/MPS/WSS,
authority and duplicate/spoof rejection.

Do not claim WAN/cross-NAT from same-PC smoke.
Protocol 149 remains frozen unless an explicit compatibility change is approved.

### A20 — Mobile UX / game feel — P1
Physical-device readiness for Android/phone/tablet:
safe areas, portrait/landscape, touch targets, deck selection, inspection,
match controls, scrolling and readability.

No gameplay/balance edits.
Browser emulation from R16 is evidence, not physical-device certification.

### A60 — Independent QA / verification — P1
Independent gates for all R17 code.
Must audit:
- R16 protected baseline
- build reproducibility
- exact ability status promotions
- network evidence provenance
- physical vs emulated claims
- Windows/WebGL/Android regressions.

AUDIT != REPAIR.

### A00 — HQ / integration
Own dependencies, merge map, status vocabulary and final candidate assembly.
No public deploy without owner instruction.

## Required status vocabulary

Every workstream reports separately:
DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED.

Do not use UNITY_READY unless its acceptance evidence satisfies the R16/R17 readiness meaning.

## Protection rules

- V148 reference: immutable.
- R16 input: preserve exact source provenance.
- no unrelated tournament website/backend edits.
- no public deployment from this task.
- no broad rebalancing.
- no silent catalog/deck-stat changes.
- no human/device test claims without real evidence.

## Completion target

R17 is complete only when:
- exact R16 source is under Git,
- selected lifecycle/RETURN batch has a closed semantic/test/implementation chain,
- 19 PARTIAL acceptance matrix is resolved or truthfully remains partial,
- physical-device networking/UX evidence is clearly separated from emulation,
- independent QA publishes an integration verdict.
