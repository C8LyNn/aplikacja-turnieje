# CC-001 R17 — A60 Independent QA Gate 001

**Project:** CC-001 / Core Clash  
**Role:** A60 — Independent QA / Verification  
**Issue:** #96  
**Branch:** `feat/cc001-r17-a60-independent-qa`  
**Date:** 2026-10-18  
**Mode:** AUDIT != REPAIR

## Executive verdict

**R17 INTEGRATION VERDICT: HOLD — NOT READY FOR CANDIDATE ASSEMBLY**

Reason: the protected R16 intake can be independently verified, but the R17 source-import gate and downstream workstream evidence do not yet exist on their assigned branches. No R17 implementation, status promotion, physical-device claim, build rerun, or integration claim is currently supportable.

This report does not close Issue #96. It establishes the first independent gate and the evidence required for later A60 reruns.

## 1. Exact R16 provenance

Canonical Drive source:

`CoreClash-V149-R16-Source-Candidate.zip`

Independent A60 checks on the downloaded raw ZIP:

| Check | Result |
|---|---|
| bytes | **17,690,458** |
| SHA-256 | **b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4** |
| ZIP entries | **639** |
| R16 candidate manifest entries checked | **637 / 637** |
| manifest size/hash mismatches | **0** |
| Unity editor version | **6000.4.0f1** |
| ProjectSettings/ProjectVersion.txt | present |
| Packages/manifest.json | present |
| Assets/CoreClash source | present |
| Assets/Resources/Data | present |
| Tests | present |
| generated Library/Temp/obj/Logs/Builds in source ZIP | **0 files** |

The source ZIP therefore matches the canonical R16 Drive identity supplied by HQ.

### Protected V148 reference

`Reference/V148_reference_original.html`

- bytes: **1,465,149**
- SHA-256: **bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e**

The R16 manifest independently records the same path, size, and hash. No V148 file was modified by A60.

## 2. Independent non-Unity source/data check

Executed from the exact extracted R16 ZIP:

`node Tools/verify-data.cjs`

Observed:

`PASS: 227 records / 224 specials / 12 archetypes / 36 canonical + 4 provisional decks; runtime HP/size/contracts and source hash verified.`

Node available in the audit environment:

`v22.16.0`

.NET SDK is **not installed** in the current audit environment (`dotnet: command not found`).

Therefore A60 did **not** rerun the managed C# suite and does not claim an independent 269/269 result.

## 3. R16 readiness registry — independent status check

Exact `Evidence/R16/ability-support.json`:

- bytes: **33,091**
- SHA-256: **46afd6351a66e30fae87e13dfeb75777d1f2eab13ff0a4425d698af8132879ce**
- records: **227**
- status counts:
  - **42 UNITY_READY**
  - **51 PARTIAL**
  - **134 DATA_ONLY**

R16 promoted-ready list is exactly:

- embertrap
- frosttrap
- sporetrap
- venom
- shatterer

The R17 target set of 19 is still exactly **PARTIAL** in the canonical R16 registry:

- wallmaker
- barricade
- repairpulse
- engineer
- bastion
- commander
- quartermaster
- armorer
- splitter
- hatchery
- replicator
- mitosis
- swarmcore
- conscriptor
- firebrand
- chainfrost
- ashcore
- furnace
- frostguard

**A60 promotion gate:** no one of these 19 may be promoted from PARTIAL on the basis of code presence, compile success, or the existing R16 registry. Per-item R17 acceptance evidence is required.

## 4. R16 network evidence provenance

A60 inspected the delivered R16 evidence rather than inflating its scope.

### Windows ↔ WebGL

`Evidence/R16/Network/network.json` states:

- native NGO/UTP WebSocket host + WebGL client;
- **one PC over loopback**;
- trap snapshot state present;
- owner spoof rejected;
- duplicate intent rejected;
- no cross-NAT or physical-device claim.

This is valid same-PC evidence only.

### Relay / MPS / WSS

`Evidence/r16-internet-smoke.json` states:

- real Unity Cloud Authentication + MPS Sessions + Relay WSS;
- Windows native host + WebGL client;
- **one computer**;
- `physicalCrossDeviceTested=false`.

Therefore:

- Relay/MPS/WSS smoke: evidence exists;
- physical separate-device crossplay: **NOT TESTED**;
- separate-network/cross-NAT reliability: **NOT TESTED**;
- reconnect/jitter/long-match R17 target: **NOT TESTED**.

No R17 networking promotion is allowed yet.

## 5. Physical mobile vs emulation provenance

R16 `qa-summary.json` records:

- Web PC/phone/tablet emulation: 82 checks / 94 screenshots;
- `physicalDevicesTested=false`;
- `crossNATTested=false`.

`Evidence/R16/android-package.json` records:

- APK package/static inspection PASS;
- cryptographic signature verification PASS;
- ARM64 IL2CPP package present;
- `deviceRuntimeTested=false`.

Therefore:

- browser mobile emulation evidence: present;
- Android package evidence: present;
- physical phone/tablet runtime certification: **NOT TESTED**;
- physical UX certification: **NOT TESTED**.

A20 R17 may not label emulation evidence as physical-device PASS.

## 6. R16 build evidence vs R17 reproducibility

R16 delivered build reports:

| Target | R16 reported result | errors | warnings |
|---|---|---:|---:|
| StandaloneWindows64 | Succeeded | 0 | 1 |
| WebGL | Succeeded | 0 | 1 |
| Android | Succeeded | 0 | 1 |

These are valid R16 delivery artifacts.

They are **not an A60 R17 build rerun**.

R17 build reproducibility is currently:

**BLOCKED ON A70 SOURCE IMPORT**

Reason:

- A70 Issue #90 is still open;
- branch `feat/cc001-r17-a70-source-import` has no R17 source-import commit yet;
- coding branches requiring compilation must use the A70 baseline;
- A60 will not treat the Drive ZIP or an old compiled WebGL artifact as the Git source baseline.

## 7. Current R17 branch state

At the time of this audit, these branches all resolve to the same pre-workstream commit:

`d1caeb49faaf9a4f2a892e205190705859b367b4`

- A70 source import
- A10 lifecycle/RETURN contract
- A40 lifecycle/RETURN implementation
- A50 PARTIAL acceptance
- A31 network crossplay
- A20 mobile UX
- A60 independent QA
- A00 integration

Issues #90–#96 have no workstream handoff comments yet, and no R17 PR matching these workstreams was found.

Consequences:

- A70 import: **not delivered**
- A10 lifecycle/RETURN contract: **not delivered**
- A40 lifecycle/RETURN implementation: **blocked / not delivered**
- A50 19-PARTIAL acceptance matrix: **not delivered**
- A31 physical crossplay evidence: **not delivered**
- A20 physical-device UX evidence: **not delivered**
- A60 downstream regression matrix: **cannot run yet**

## 8. Serialization / snapshot safety

R16 source contains explicit authoritative snapshot validation in `NetworkGameSession.cs`, including rejection paths for:

- null/missing nested collections;
- invalid protocol/spec state;
- invalid random state;
- non-finite ball/structure/zone/event geometry;
- duplicate IDs;
- invalid next-ID cursor;
- invalid owners/status stamps.

R16 `StabilityR16Tests.cs` contains negative cases for:

- null nested status/event/list content;
- NaN/Infinity geometry;
- duplicate IDs;
- invalid nextId;
- malformed snapshot followed by a later valid snapshot.

R16 delivery reports 13 network codec tests and managed tests passing.

A60 did not rerun these C# tests because the current audit environment has no .NET SDK and the Git source baseline is still blocked on A70.

Current A60 classification:

- source-level safety controls: **PRESENT / INSPECTED**
- R16 execution evidence: **PRESENT**
- independent R17 execution: **NOT RUN**
- R17 regression certification: **HOLD**

## 9. Lifecycle / RETURN gate

Required by R17:

- exact A10 semantic contract;
- accepted tests;
- A40 implementation;
- source-import baseline;
- managed/native evidence;
- serialization/snapshot behavior where new lifecycle state is added.

Current state:

**HOLD — NO R17 EVIDENCE YET**

No Phoenix / Revenant / Soul Anchor / Dirge / Den Mother implementation or readiness promotion is certified by this report.

## 10. 19 PARTIAL status-promotion gate

For every one of the 19 R16 PARTIAL entries, A60 requires before promotion:

1. exact intended/runtime semantics;
2. explicit acceptance fixture(s);
3. managed execution evidence;
4. relevant native Unity collision/runtime evidence;
5. serialization/snapshot impact checked;
6. network/authority impact checked where state is synchronized;
7. no catalog/deck-stat drift;
8. exact artifact/commit SHA;
9. regression impact recorded;
10. readiness meaning satisfied, not merely compile success.

Current state for all 19:

**PARTIAL retained. 0 promoted by A60.**

## 11. Windows / WebGL / Android regression gate

R16 build evidence exists for all three targets.

R17 regression result:

**NOT RUN / BLOCKED ON A70 + DOWNSTREAM DELTAS**

A60 will not claim Windows/WebGL/Android regression PASS until there is a concrete R17 candidate commit to build/test.

## 12. Status vocabulary

| Dimension | A60 R17 state |
|---|---|
| DESIGNED | audit gates and promotion criteria defined |
| IMPLEMENTED | no gameplay implementation by A60; AUDIT != REPAIR |
| TESTED | **PARTIAL** — R16 intake/hash/manifest/data/evidence provenance checks executed; R17 compile/device/regression suite not yet runnable |
| INTEGRATED | NO |
| RELEASED | NO |

No `UNITY_READY` promotion is issued by this report.

## 13. Blocking findings

### R17-A60-B01 — A70 source-import baseline missing — P0 BLOCKER

All coding/build-reproduction gates remain blocked until exact R16 source is imported into Git and its provenance is published.

### R17-A60-B02 — no downstream R17 workstream evidence

A10/A40/A50/A31/A20 branches do not yet contain R17 deliverables. Final integration QA is therefore not executable.

### R17-A60-B03 — physical crossplay not proven

R16 network evidence is same-PC/loopback or same-PC Relay/MPS/WSS. Physical separate-device/separate-network claims remain unsupported.

### R17-A60-B04 — physical mobile UX not proven

R16 mobile evidence is browser emulation plus static APK inspection. No physical device runtime/UX certification exists.

## 14. Non-blocking R16 observations

- exact R16 source provenance is strong: ZIP hash matches, manifest 637/637, zero manifest mismatch;
- protected V148 reference is present and hash-stable;
- no generated Unity caches/builds are inside the source ZIP;
- R16 support registry is internally consistent;
- network evidence explicitly labels same-PC scope rather than claiming WAN;
- Android evidence explicitly labels static inspection rather than device runtime;
- R16 snapshot hardening has concrete source and test artifacts.

These observations do not close any R17 implementation gate.

## 15. Required A60 follow-up sequence

After A70 publishes the source import:

1. verify imported file manifest against exact R16 package;
2. verify V148 reference hash remains unchanged;
3. verify ProjectVersion/Packages/.meta preservation and generated-cache exclusions;
4. rerun source/data check;
5. rerun available managed tests/build smoke in the accepted environment;
6. audit A10→A40 lifecycle/RETURN chain;
7. audit A50 evidence before any of the 19 PARTIAL promotions;
8. audit A31 evidence provenance: real devices/networks vs same-PC;
9. audit A20 physical-device evidence vs emulation;
10. run Windows/WebGL/Android regression on the assembled R17 candidate;
11. verify snapshot/serialization compatibility after all accepted gameplay deltas;
12. publish final A60 integration verdict.

## HANDOFF TO HQ / A00

**Current integration recommendation: HOLD.**

HQ should:

- prioritize A70 Issue #90 as the source-tree gate;
- prohibit code branches from claiming compiled R17 status before rebasing on the accepted A70 source baseline;
- retain all 19 target abilities as PARTIAL;
- retain physical crossplay and physical mobile status as NOT TESTED;
- require exact commit/evidence handoffs from A10/A40/A50/A31/A20;
- route the resulting candidate back to A60 for independent rerun;
- do not publish or deploy.

**V148 modified by A60:** NO  
**Public deployment:** NO  
**Issue #96 closure recommended now:** NO
