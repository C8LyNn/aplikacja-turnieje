# CC-001 / CORE CLASH UNITY — R17-W3
## ONE-DOCUMENT PARALLEL DEVELOPMENT DISPATCH — 2026-10-18

**PROJECT:** CC-001 — Core Clash  
**VERSION:** Unity V149 R16 → R17  
**OWNER:** 00 / HQ  
**PRIORITY:** HIGH  
**MODE:** PARALLEL, ROLE-SCOPED, ISOLATED DEVELOPMENT + VERIFICATION  
**STATUS:** AUTHORIZED — START THE SEVEN ASSIGNED AGENTS IN PARALLEL

**THIS DOCUMENT IS THE SOLE W3 TASK SOURCE OF TRUTH.** Each existing agent thread reads the common rules and executes **only its own numbered section**. Each agent has its own Issue, branch and exclusive changed-file scope.

## 0. Shared prompt for all seven existing threads

> PROJECT: CC-001 — CORE CLASH UNITY. WAVE: R17-W3 — PARALLEL SOURCE DEVELOPMENT. STATUS: AUTHORIZED — START NOW. Preserve your existing agent role/history. Open this shared document:
> https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w3-parallel-source-development-20261018/docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md
> Read common rules, then find your own role number (10, 20, 41, 50, 51, 60, 73). Open the matching Issue and previous W1/W2 HANDOFF. Work **only** on your assigned branch and file paths, against the exact imported Unity R16 source. No waiting for other W3 agents, no overlap, no merge, no live deployment. Implement or verify only your scoped task, run available tests honestly, publish exact SHA, changed paths, evidence and HANDOFF to HQ.

## 1. Verified base and previous findings

**Repository:** `C8LyNn/aplikacja-turnieje`  
**Frozen baseline branch:** `feat/cc001-r17-a70-source-import`  
**Frozen baseline commit:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**Source import commit:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`  
**Unity project root:** `unity/cc001-r16/CoreClash-V149-Unity/`  
**R16 ZIP SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**Exact raw source subtree Git SHA1:** `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`  
**Unity editor:** `6000.4.0f1`  
**R16 registry:** `42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY` — do not inflate.

A70 completed exact 639-file source import, independently checked by A71 PASS 639/639 and 88/88 Unity `.meta` files. [A70 handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a70-source-import/docs/cc001/swarm/R17_A70_SOURCE_IMPORT_HANDOFF_20261018.md), [A71 independent audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a71-source-integrity/docs/cc001/swarm/a70-support/A71/R17_A71_INDEPENDENT_SOURCE_AUDIT.md).

**Scope truth:** source-integrity PASS **is not Unity compilation PASS**. A72 / Issue #113 build & CI preflight has not reported a final HANDOFF at dispatch time and stays on its existing assignment; do not duplicate A72's work. Agent A40 / Issue #92 lifecycle implementation is not activated by this wave.

Read applicable first-wave and second-wave output before acting:
- [A10 W1 lifecycle/RETURN contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a10-lifecycle-return-contract/docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md) and [A10 W2 Mitosis/Furnace](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a10-semantics/docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md).
- [A20 W2 landscape contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a20-landscape-contract/docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md).
- [A41 W2 reconnect decision](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a41-reconnect-design/docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md).
- [A50 W2 corrected F01/F02 oracles](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a50-parity-oracles/docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md).
- [A51 W2 snapshot corpus](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a51-snapshot-fixtures/docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS_README.md).
- [A60 W2 independent W1 review](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w2-a60-wave1-qa/docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md).
- [A73 original integration map](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a73-merge-map/docs/cc001/swarm/a70-support/A73/R17_A73_INTEGRATION_MERGE_MAP.md).

**CRITICAL correction to early W1:** A50 W2 found V148 **actually initializes Wallmaker/Barricade/Engineer structures at HP 5**, despite apparent `hits:2` caller intent. **Do not 'fix' structures to HP 2.** The actual possible F01 discrepancy concerns collision-gating thresholds (V148 >32 impact & >0.28s cooldown vs R16 speed >=90/fresh episode). F02 Frostguard artificial 3 Earth anchor stacks remains a source-grounded parity discrepancy. Both require runtime tests before claiming closure.

## 2. Non-negotiable concurrency, test and safety rules

1. Every agent works on its own W3 branch created **from the same frozen A70 source baseline** plus this dispatch. No merging another W3 agent's branch before HQ integration.
2. The imported baseline at `feat/cc001-r17-a70-source-import` is immutable. Agents may change **only their permitted paths on their own feature branches**; do not rewrite canonical R16 source blobs/history.
3. V148 reference `Reference/V148_reference_original.html` is immutable. Three public Core Clash builds (original HTML, V149.5 HTML, Unity WebGL) must remain untouched.
4. No live publish, no merge into `main` or website branch, no force-push/history rewrite, no deletion of R16 evidence, no automatic UNITY_READY promotion, no balancing/ability catalog changes, no protocol-149 change.
5. Source edits require targeted tests, source diff and explicit before/after behavior. If runtime toolchain is missing, do **not** claim tested; publish code as IMPLEMENTED/NOT COMPILED and keep readiness HOLD.
6. When multiple agents own different source paths, their work is still **not integrated** until HQ applies accepted changes and A60 independently verifies. A separate feature branch is not an integrated release.
7. Do not touch `Tests/Program.cs` in this wave. Existing test groups are already called from Program.Main; extend the owned existing test suite method only. This prevents seven parallel edits of the same registry file.
8. For new Unity `Assets` files, include a valid `.meta` and verify GUID uniqueness; avoid new C# source files if an existing owned file suffices.
9. Reuse protected source anchors; if W2 semantics conflict with actual V148 executable logic, write a conflict/decision request instead of silently inventing mechanics.
10. Agents 60 and 73 **must not modify Unity or gameplay files**. A41 must not modify presentation/UI; A20 must not modify networking; A50 must not modify snapshot/networking.
11. No agent's W3 task depends on another agent's W3 result. **Start all seven at once.** Report any cross-agent dependency as a future HQ integration note, not as an excuse to edit a colleague's branch.
12. Report exact `DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED` statuses.

## 3. Seven independently executable assignments

### A10 — Game Design — Wall-first Mitosis control-flow oracle

**ISSUE:** [#121](https://github.com/C8LyNn/aplikacja-turnieje/issues/121)  
**BRANCH:** `feat/cc001-r17-w3-a10-mitosis-oracle`  
**EXCLUSIVE OUTPUT:** `docs/cc001/swarm/w3/A10/R17_W3_A10_MITOSIS_WALL_FIRST_ORACLE.md`  
**MODE:** V148 EXECUTABLE SOURCE/BEHAVIOR RECONCILIATION. NO GAMEPLAY CODE EDITS.

**Why:** A10 W2 supplemental HANDOFF found a subtle edge: a wall/surface TOUCH may increment `motionTouchCount` and consume the first-touch gate before later ball–ball contact. A separate strong-hit kinetic path may still trigger a split; this must not be flattened into 'first ball contact always splits'.

**Required:** independently inspect actual protected V148 dispatch/firstTouch/split source, identify real firstTouch/kinetic damage paths, specify a reproducible matrix with wall-first → weak ball pair, wall-first → strong ball pair, direct weak pair, direct strong pair, ally pair, and blocked spawn. Where feasible execute a deterministic, isolated V148 browser/Node playback probe (without modifying V148 bytes); where not feasible label cases `NOT_RUN` and state exact missing harness. Document observed vs inferred vs unknown behavior and exact target/source/ownership gates. Distinguish first TOUCH from first **eligible** ability TOUCH. State whether A50/A40 future parity tests should add new fixtures.

**Do not:** implement Mitosis, decide new wall-trigger behavior without owner approval, revise earlier W1 RETURN batch, edit files outside owned report, or change catalog descriptions.

**Success:** decision-quality oracle, reproducible fixtures and explicit evidence provenance; no claims of test execution without a genuine run.

### A20 — Unity Presentation — Implement compact landscape layout

**ISSUE:** [#122](https://github.com/C8LyNn/aplikacja-turnieje/issues/122)  
**BRANCH:** `feat/cc001-r17-w3-a20-compact-layout`  
**EXCLUSIVE SOURCE PATHS:**
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/MatchLayout.cs`
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/MatchView.cs`
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/PresentationTests.cs`

**EXCLUSIVE REPORT:** `docs/cc001/swarm/w3/A20/R17_W3_A20_COMPACT_LAYOUT_IMPLEMENTATION.md`

Implement the smallest R16-compatible phone-landscape presentation change based on A20 W2 contract (small viewport around 844×340 plus portrait/tablet comparison). Preserve view semantics/board aspect 0.6, both base HPs, phase and turn visibility, nine-ball selection, aiming controls, inspect/details path and accessibility of result/lobby transition. Never allow touch or UI elements to overlap the live arena. If full desired responsive behavior requires `UiViewport.cs`, `CoreClashApp.cs`, `BoardView.cs` or lobby network code outside ownership, stop that portion and describe exact needed W4 follow-up — do not change unrelated files.

**Test-first:** add/adjust targeted tests inside the existing `PresentationTests()` suite to validate compact layout bounds/visibility/non-overlap and desktop/tablet regressions. Actual Unity screenshots/physical touch only if tested; do not claim success from geometry alone.

**Do not:** modify `Networking/**`, `Tests/Program.cs`, source R16 baseline branch, any other presentation file, abilities, roster or networking.

**Success:** small reviewable code diff, geometry regression tests, real outcomes or honest NOT_RUN, before/after expected layout and no gaming behavior changes.

### A41 — Networking — LAN seat identity/sequence regression tests

**ISSUE:** [#123](https://github.com/C8LyNn/aplikacja-turnieje/issues/123)  
**BRANCH:** `feat/cc001-r17-w3-a41-lan-seat-tests`  
**EXCLUSIVE SOURCE PATHS:**
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/LanSeat.cs`
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs`

**EXCLUSIVE REPORT:** `docs/cc001/swarm/w3/A41/R17_W3_A41_LAN_SEAT_REGRESSIONS.md`

From the A41 W1 source/trust-boundary review and W2 reconnect decision, implement **test-first security/sequence regression coverage for the current policy**, including P2 pending seat timeout, connection commit, stale callback after replacement, duplicate owner command, released seat + old client, unauthorized P1 spoof, and resource/negative checks. Owner/HQ has **not approved** active-match host-authorized P2 replacement semantics or durable token-based same-user resume; therefore this task **MUST NOT** implement a new reconnection feature or declare identity-authenticated recovery. Existing explicit seat release/fill behavior is the baseline; test that behavior faithfully.

If a test proves a defect within existing policy and `LanSeat.cs` can be narrowly corrected **without changing the wire protocol or match rules**, implement the minimal fix. Otherwise report the deficiency and recommend a scoped next task.

**Do not:** touch `NetworkGameSession.cs`, `NgoGameSession.cs`, `NgoInternetSession.cs`, snapshot codec, UI, `Tests/Program.cs`, custom backend or production website.

**Success:** executable targeted LAN seat/command-authority regressions when supported; no false claim of physical online multiplayer or authenticated resume.

### A50 — Simulation — Frostguard F02 test-first parity

**ISSUE:** [#124](https://github.com/C8LyNn/aplikacja-turnieje/issues/124)  
**BRANCH:** `feat/cc001-r17-w3-a50-frostguard-parity`  
**EXCLUSIVE SOURCE PATHS:**
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/ElementalEffects.cs`
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs`

**EXCLUSIVE REPORT:** `docs/cc001/swarm/w3/A50/R17_W3_A50_FROSTGUARD_F02_IMPLEMENTATION.md`

Apply A50 W2 golden oracles to **F02 only**: V148 plain anchored state for Frostguard (no synthetic Earth stacks) versus R16 `anchorStacks=3` force/mass/friction. Write a regression in existing `ElementalTests()` proving before/after the mismatch. Then implement the smallest faithful correction in `ElementalEffects.cs`, checking STOP, replay, FIRE/ICE shields and serialization ramifications. If the change cannot meet V148 semantics without editing a shared physics file, STOP and request HQ separate scope instead of broad edits.

**CRITICAL F01 CORRECTION:** protected V148 structures are actually initialized with HP 5. **Do not change them to HP 2.** F01 collision-gating differences remain a separate unexecuted candidate; no changes to `ConstructionEffects.cs` in this wave.

No balance or status-registry promotion. Do not change `Program.cs`, `Assets/Resources/Data`, unrelated ball mechanics or V148 reference.

**Success:** failing-fixture-first evidence, minimal Frostguard parity diff, actual managed/runtime results or NOT_RUN, no false native-physics certification.

### A51 — Network instrumentation — Runtime snapshot admission regressions

**ISSUE:** [#125](https://github.com/C8LyNn/aplikacja-turnieje/issues/125)  
**BRANCH:** `feat/cc001-r17-w3-a51-snapshot-tests`  
**EXCLUSIVE SOURCE PATHS:**
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/StabilityR16Tests.cs`
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NetworkGameSession.cs` (**only if reproducible defect in pure state adapter requires minimal repair**)

**EXCLUSIVE REPORT:** `docs/cc001/swarm/w3/A51/R17_W3_A51_SNAPSHOT_ADMISSION_TESTS.md`

Turn an initial **manageable subset** of A51 W2 41-variant fixture corpus into actual `StabilityR16Tests()` cases. Priority: null nested structures/statuses/events, malformed floats and IDs, stale/duplicate revisions, bad packet without state replacement, valid retry of same revision, and host session intent monotonicity where pure C# supports it. Include negative controls and last-good-state immutability. The tests must be *real*, not only JSON fixture lint.

`NgoWireProtocol` and `NgoSnapshotAssembler` are excluded from the managed project and belong to future Unity/transport tests; do not casually rewrite them or claim native NGO coverage. If a codec decompression exception hypothesis cannot be reproduced in the available layer, report it as UNVERIFIED.

**Do not:** touch `LanSeat.cs`, `NetworkSeatTests.cs`, `Tests/Program.cs`, Unity NGO files or player UI. Protocol 149 frozen.

**Success:** C# positive/negative admission tests added to existing suite; only source-proven fixes; do not claim all 41 corpus cases executed if only subset ported.

### A60 — QA — Independent baseline admission and W2 status check

**ISSUE:** [#126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126)  
**BRANCH:** `feat/cc001-r17-w3-a60-baseline-qa`  
**EXCLUSIVE OUTPUT:** `docs/cc001/swarm/w3/A60/R17_W3_A60_SOURCE_BASELINE_QA_GATE.md`  
**MODE:** INDEPENDENT AUDIT ONLY — AUDYT != NAPRAWA

Independently review the completed A70 import and A71 exact-source audit, confirm verified 639/639 Git integrity, V148 protection, Unity source-root and package/reference paths, and GitHub Actions scope. Reconcile latest W2 A10/A20/A41/A50/A51 source/document outcomes against W1 A60 gate and the **F01 correction**. Clearly distinguish design + source-code-ready evidence from actually rerun managed/Unity/native/device evidence. Independently check whether there is enough proof to **admit the A70 source branch as a valid future development base**, without treating that as release candidate readiness. A72 Build & CI is still separately in progress: record exact absence/presence of a final A72 result at inspection time.

**Freeze inputs at task start. Do not wait for A10/A20/A41/A50/A51 W3 output**; that is a separate downstream QA wave. The current task certifies source/readiness only.

**Do not:** implement fixes, revise R16, promote ability READY, merge, close prior issue #96, certify physical devices, publish site, or re-run privileged infrastructure tools.

**Success:** independent PASS/HOLD gates for source baseline and CI/build/runtime separately, plus precise downstream W3 QA checklist.

### A73 — Git Integration — Safe R16/W1/W2 source integration plan

**ISSUE:** [#127](https://github.com/C8LyNn/aplikacja-turnieje/issues/127)  
**BRANCH:** `feat/cc001-r17-w3-a73-integration-gates`  
**EXCLUSIVE OUTPUT:** `docs/cc001/swarm/w3/A73/R17_W3_A73_SOURCE_INTEGRATION_GATE.md`  
**MODE:** READ-ONLY INTEGRATION PREPARATION

Build an exact **updated** ancestry/path conflict graph covering:
- A70 imported baseline and A71 integrity;
- A10 PR #98 lifecycle/RETURN design;
- W1 A20/A41/A50/A51/A60 reports;
- W2 branches A10/A20/A41/A50/A51/A60;
- A72 still open;
- W3 coding branches as future inputs **without waiting for their results**.

Show a safe HQ-owned **disposable candidate** integration ordering from the A70 source baseline, including disjoint docs, shared A50/A51 W1 history, and decision gates for A10 contracts, A60 source admission and A72 toolchain readiness. Give shell/API commands for later HQ execution; inspect potential conflicts via read-only Git compare or merge-tree if tool permits. Do not carry out a merge or rebase in this task, retarget PRs, touch other branches or publish builds. Disambiguate a successful conceptual conflict plan from an executed merge.

**Success:** concrete integration sequence and block/unblock table with exact currently read SHA/refs.

## 4. Non-overlap / ownership matrix

| Agent | Issue | Branch | Unique editable paths | Can start now? |
|---|---|---|---|---|
| A10 | [#121](https://github.com/C8LyNn/aplikacja-turnieje/issues/121) | `feat/cc001-r17-w3-a10-mitosis-oracle` | `docs/cc001/swarm/w3/A10/**` | YES |
| A20 | [#122](https://github.com/C8LyNn/aplikacja-turnieje/issues/122) | `feat/cc001-r17-w3-a20-compact-layout` | MatchLayout, MatchView, PresentationTests, owned report | YES |
| A41 | [#123](https://github.com/C8LyNn/aplikacja-turnieje/issues/123) | `feat/cc001-r17-w3-a41-lan-seat-tests` | LanSeat, NetworkSeatTests, owned report | YES |
| A50 | [#124](https://github.com/C8LyNn/aplikacja-turnieje/issues/124) | `feat/cc001-r17-w3-a50-frostguard-parity` | ElementalEffects, ElementalTests, owned report | YES |
| A51 | [#125](https://github.com/C8LyNn/aplikacja-turnieje/issues/125) | `feat/cc001-r17-w3-a51-snapshot-tests` | NetworkGameSession, StabilityR16Tests, owned report | YES |
| A60 | [#126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126) | `feat/cc001-r17-w3-a60-baseline-qa` | `docs/cc001/swarm/w3/A60/**` | YES |
| A73 | [#127](https://github.com/C8LyNn/aplikacja-turnieje/issues/127) | `feat/cc001-r17-w3-a73-integration-gates` | `docs/cc001/swarm/w3/A73/**` | YES |

**Not dispatched in this W3:** A70 (import complete), A72 (still working on #113), A71 (finished independent integrity), A74 (finished repository hygiene), A40 (lifecycle implementation awaits its separate approved integration/code task). A31 remains separate networking owner; A41 performs scoped tests only.

## 5. Required final HANDOFF in GitHub Issue

```text
PROJECT: CC-001
WAVE: R17-W3 — PARALLEL SOURCE DEVELOPMENT
AGENT: Axx — unchanged role
ISSUE: #12x
OWN BRANCH: feat/cc001-r17-w3-...
BASE SHA: <verified exact parent>
FINAL COMMIT SHA: <verified exact SHA>
CHANGED PATHS: <complete list>
R16 SOURCE SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
RESULT: <concrete delta>
TESTS ACTUALLY RUN: <command + exit/result>
NOT RUN: <explicit Unity/managed/physical caveat>
DESIGNED:
IMPLEMENTED:
TESTED:
INTEGRATED:
RELEASED:
KNOWN LIMITATIONS:
HANDOFF: 00/HQ, A60 (+ relevant owner)
```

Provide a clickable link to the GitHub artifact and commit and read it back after push. Do not close an issue merely because a document was written; use the actual task acceptance criteria.

## 6. HQ sequencing

W3 is the **first role-isolated implementation wave after byte-exact A70 import**. When all W3 results have landed and A72/QA source gates are understood, HQ should launch a controlled integration candidate on a **new isolated branch** and ask A60 for independent compiled regression validation.

**W3 does not authorize merge or public deployment.**
