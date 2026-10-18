# CC-001 / Core Clash Unity — R17-W2
## ONE-DOCUMENT PARALLEL DISPATCH — PRE-A70 / 2026-10-18

**PROJECT:** CC-001 — Core Clash  
**VERSION:** Unity V149 R16 → R17-W2  
**ORCHESTRATOR:** 00 / HQ  
**PRIORITY:** HIGH  
**MODE:** SIX CONCURRENT INDEPENDENT WORKSTREAMS  
**STATUS:** AUTHORIZED FOR DESIGN / FIXTURE PREPARATION / INDEPENDENT DOCUMENT QA ONLY  
**SOURCE IMPORT A70:** IN PROGRESS — DO NOT BLOCK ON IT FOR THIS WAVE

---

## 0. Single source of truth and one common start instruction

This Markdown file is the **only authoritative task instruction for R17-W2**. Each agent reads it, finds the subsection with its **existing role number**, and executes **only that subsection**. The six GitHub Issues are tracking surfaces; their bodies deliberately point back here rather than copying task contracts.

### Reusable prompt for every existing agent thread

> PROJECT CC-001 / R17-W2. You retain your existing agent role and earlier history. Open this canonical dispatch:
> https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md
> Find **your own agent number** under Section 3 and execute only that task, using its named Issue and Git branch. Review your R17-W1 HANDOFF and R16 source before work. Do not repeat W1, do not wait for A70, do not touch other agents' paths, and do not alter gameplay/Unity source in this wave. Publish the required artifact, exact commit SHA, evidence limitations and HANDOFF to 00/HQ in your Issue. Do not merge or deploy.

**Concurrency guarantee:** six tasks intentionally use different subjects, different file ownership, separate branches, and frozen existing first-wave evidence. There is **no required delivery between these six W2 tasks**. Any cross-task suggestion must be a non-blocking note for HQ; do not create new prerequisites between agents while this wave is running.

## 1. Canonical fixed input

**R16 source**: [CoreClash-V149-R16-Source-Candidate.zip](https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view)  
**R16 source SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**R16 supporting files:** [Google Drive folder](https://drive.google.com/drive/folders/1u5eBKs-9Ki_bQN_NfHaOWXUWimZtTCxz) — HANDOFF_R16_README.md, R16_REPORT_PL.md, R16_QA_PL.md, R16 manifests, Evidence/R16.  
**Prior master:** [R17 SWARM DISPATCH](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md).  
**Previous R16 intake:** [R16 audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-unity-swarm-20261018/docs/cc001/swarm/R16_AUDIT_20261018.md).

Protected reference:
`Reference/V148_reference_original.html` — preserve bytes; V148 baseline SHA256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.

Already completed / usable W1 work (do not redo):
- A10 / Issue #91 / [lifecycle + RETURN contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a10-lifecycle-return-contract/docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md) — design only, branch commit `bc6820b1f32b4b48d26c9359567433ff26ca7ef1`, PR #98.
- A20 / Issue #95 / [mobile readiness](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a20-mobile-ux/docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md) — source/layout review; no physical device test.
- A41 / Issue #94 / [network authority support](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a31-network-crossplay/docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md) — static 14-case crossplay evidence matrix; not A31 runtime sign-off.
- A50 / Issue #93 / [19 PARTIAL review](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a50-partial-acceptance/docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md) — 19/19 reviewed, 0 promotions; F01/F02 parity findings.
- A51 / Issue #93 / [fixture support](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a50-partial-acceptance/docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md) — 42 NOT_RUN fixture definitions.
- A60 / Issue #96 / [independent gate 001](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a60-independent-qa/docs/cc001/swarm/R17_A60_INDEPENDENT_QA_GATE_001.md) — HOLD; baseline verified, runtime R17 blocked on A70.

Current R16 registry:
`42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY / 0 NOT_PORTED`. Do not change these counts in W2.

**A70 / Issue #90** is importing exact editable R16 source to Git in parallel. **Do not reassign, interrupt or wait for A70** in any W2 task. A40 remains **HOLD** until the A70 code baseline and authorized semantic contract are integrated.

## 2. Common safety / execution rules

1. W2 is **parallel pre-import work**: permissible actions are inspect exact R16 Drive source, read prior Git reports, author isolated documentation, fixtures and standalone static validators. No Unity C# production edits, scene modifications, `.meta` changes, builds, merges, deployment or host networking changes.
2. Every agent commits **only** to its own new W2 branch and its designated W2 output path. No writing to another agent's branch or overwriting W1 reports.
3. No source changes to either HTML Core Clash version, no tournament website/backend changes, no V148 changes, no Unity build uploads, no public/production publish.
4. Prior W1 reports may be consumed concurrently; **do not wait for W2 colleagues' outputs**.
5. Evidence vocabulary is strict: SOURCE REVIEW / STATIC SCRIPT PASS / SPECIFIED TEST / RUNTIME TEST / PHYSICAL DEVICE / INTEGRATED are distinct. `TEST_DESIGNED` is not `TEST_EXECUTED`.
6. Never fabricate human/device results or extrapolate WebGL emulator screenshots to physical Android/tablet sign-off.
7. Escalate semantic conflicts to HQ in HANDOFF; do not silently reframe V148 as an implementation wish list.
8. Do not merge into `main`, the website branch, the source-import branch or the integration branch. HQ owns reconciliation after W2 and A70.
9. One task = one coherent, reviewable result. If unexpected risk grows, report it; do not expand scope.
10. Every final agent report must provide its Git Issue, branch, parent/base SHA if available, final commit SHA, changed paths, evidence actually run, outstanding uncertainties, and the five statuses:
`DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED`.

## 3. Parallel task assignments — START ALL SIX NOW

### W2-A10 — Lead Game Design: Mitosis / Furnace semantic decision

**ISSUE:** [#106](https://github.com/C8LyNn/aplikacja-turnieje/issues/106)  
**BRANCH:** `feat/cc001-r17-w2-a10-semantics`  
**PRIORITY:** HIGH / **RISK:** LOW / **SCOPE:** SMALL-MEDIUM  
**TYPE:** SOURCE-TRUTH SEMANTIC ARBITRATION ONLY  
**OWNER FILE:** `docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md`

**Mission:** Close the two still-open *semantic* questions from A50-W1 without repeating the already-frozen Phoenix/Revenant/Soul Anchor/Dirge/Den Mother lifecycle contract.

**Required decisions:**
- **Mitosis**: distinguish protected V148 actual runtime behavior versus card text, specifically physical contact with ball, wall, base and other collider kinds. State whether R17 should support each target, and which cases are `SPEC_TRUE`, `RUNTIME_TRUE`, `UNKNOWN`, or `EXPLICIT_CHANGE_REQUEST`. Never fabricate runtime support from descriptive prose.
- **Furnace**: reconcile the card's possible “+5 damage” presentation with actual V148 FIRE status/field mechanism; define whether the immediate fix belongs to tooltip/description rather than gameplay.
- Record exact testable acceptance conditions for both, owner/target, collision-vs-trigger boundaries, edge cases, expected feedback wording, backward compatibility, and implications for A50's 19-PARTIAL matrix.
- Briefly distinguish confirmed facts from decisions requiring the owner's approval. Preserve the earlier RETURN semantics contract.

**Do not:** implement code, rebalance, modify 19-entry registry, change the cards' data or make new V148 mechanics.

**Deliverable:** two-item decision table with V148 source anchors and explicit OPEN items, plus 6–12 concrete acceptance cases. Readiness for later coding should be stated but not asserted as done.

### W2-A20 — UX/UI: short-landscape Unity design contract

**ISSUE:** [#107](https://github.com/C8LyNn/aplikacja-turnieje/issues/107)  
**BRANCH:** `feat/cc001-r17-w2-a20-landscape-contract`  
**PRIORITY:** HIGH / **RISK:** LOW / **SCOPE:** MEDIUM  
**TYPE:** IMPLEMENTATION-READY UI SPEC ONLY  
**OWNER FILE:** `docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md`

**Mission:** Turn W1 risk UX-R17-A20-001 into one implementable design with no coding dependency on A70.

**Required contract:**
- Cover compact landscape (especially R16-W1 roughly `844×340` logical viewport) plus portrait phone, larger phones and tablets as comparison cases.
- Define exact hierarchy of arena, aiming interaction, ball/deck selection, HP/turn indicators, inspect/details access and match-critical feedback in constrained screens; include full-screen, soft keyboard/notch/safe area effects as applicable.
- Specify a clear responsive breakpoint *decision process* grounded in available board/UI source; where exact pixel values are speculative, label them as proposed thresholds for device QA, not measured facts.
- Provide wireframe-level state tables for setup, gameplay, inspection, result and lobby/reconnect; touch target guidance and overflow/scroll ownership; no controls hidden behind inaccessible scrolling.
- Define later before/after screenshot/click-path tests and physical device acceptance gates.
- Identify smallest code-surface candidate for future A20 implementation after A70.

**Do not:** modify runtime UI, Android manifests, screenshots or gameplay. Do not claim actual physical device testing.

**Deliverable:** implementable layout contract, prioritized adjustment set, at least 3 viewport cases and QA checklist.

### W2-A41 — Backend / Multiplayer: identity-bound reconnect decision

**ISSUE:** [#108](https://github.com/C8LyNn/aplikacja-turnieje/issues/108)  
**BRANCH:** `feat/cc001-r17-w2-a41-reconnect-design`  
**PRIORITY:** HIGH / **RISK:** MEDIUM / **SCOPE:** MEDIUM  
**TYPE:** SECURITY/NETWORK DESIGN, NO EXECUTION  
**OWNER FILE:** `docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md`

**Mission:** Resolve how to distinguish *seat available for a new player* from *authenticated recovery of the same player* under R16 `LanSeat`, NGO and optional UGS/MPS/Relay modes. Extend W1 A41 authority research; do not repeat its 14-case checklist.

**Required design:**
- Two or three options (e.g., no automatic same-player resume with explicit seat refill; identity-bound ephemeral resume credential; Relay/session identity-assisted continuity), with threat/failure trade-offs and dependencies.
- Map LAN direct join, Relay/MPS/WSS, host process restart, Android app suspend/resume, browser refresh, simultaneous legitimate/duplicate joins and stale transport IDs.
- Preserve host authoritative simulation and command ownership; examine credential scope, replay, invalidation, timeout, leakage and recovery UX; no persistence claims unsupported by R16.
- Propose one minimal safe R17 implementation candidate and a separate future alternative, clearly labeled **PROPOSAL — NOT IMPLEMENTED**.
- Contract 12+ success/negative scenario expectations for later A31/A60, including spoof/duplicate/seat hijack prevention.
- Explicit protocol-149 compatibility assessment. If a protocol change appears necessary, declare change-request, **do not perform**.

**Do not:** create custom backend, wire protocol changes, edit `LanSeat`, execute network sessions, or claim a security bug without a reproduction.

**Deliverable:** decision record, threat/mitigation matrix, minimal migration plan and non-executed acceptance scenarios.

### W2-A50 — Simulation / Acceptance: F01/F02 golden parity oracles

**ISSUE:** [#109](https://github.com/C8LyNn/aplikacja-turnieje/issues/109)  
**BRANCH:** `feat/cc001-r17-w2-a50-parity-oracles`  
**PRIORITY:** HIGH / **RISK:** MEDIUM / **SCOPE:** MEDIUM  
**TYPE:** TEST-ORACLE PREPARATION ONLY  
**OWNER FILE:** `docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md`

**Mission:** Turn the two **already observed** R17-W1 findings into deterministic, source-grounded acceptance traces for a later test-first Unity repair **without writing a gameplay fix now**.

**Required oracles:**
- **F01:** Wallmaker / Barricade / Engineer construction durability mismatch (protected V148 two-hit life stages versus R16 hp=5 structure implementation). Include hit ordering, incremental state, invulnerability/cleanup boundaries where actually grounded, effects on RepairPulse, and expected first failing fixture.
- **F02:** Frostguard V148 plain anchored physics (0.30 force scale and 2.0× mass without Earth stacks) versus R16 artificial `anchorStacks=3` (different force/mass/friction). Show measurable invariants and source-based expected differences; do not present heuristic forces as measured physics results.
- For both, provide minimal initial state, action seed/sequence, event/source/target, expected V148 output, expected *current R16* output, false-pass traps, test-layer recommendation (pure C# vs Unity physics), rollback/negative controls, and priority of fixes.
- Reuse A51 W1 42 fixtures as design input but avoid editing them.
- Keep Mitosis and Furnace out of scope here, except referencing the separate A10 W2 decision task.

**Do not:** write C# implementation, change stats, promote statuses or claim unexecuted fixtures PASS.

**Deliverable:** two complete golden-oracle case families and future failing-fixture-first execution plan.

### W2-A51 — Simulation / Instrumentation: invalid-snapshot corpus

**ISSUE:** [#110](https://github.com/C8LyNn/aplikacja-turnieje/issues/110)  
**BRANCH:** `feat/cc001-r17-w2-a51-snapshot-fixtures`  
**PRIORITY:** MEDIUM-HIGH / **RISK:** LOW-MEDIUM / **SCOPE:** MEDIUM  
**TYPE:** OFFLINE FIXTURE DATA + OPTIONAL PURE NODE STATIC VALIDATOR  
**OWNER PATHS:**
- `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS.json`
- `docs/cc001/swarm/w2/A51/R17_W2_A51_SNAPSHOT_CORPUS_README.md`
- optionally `scripts/cc001/r17-w2-a51-snapshot-preflight.cjs`

**Mission:** Prepare the next independent negative-case oracle for **R16 snapshot admission**, distinct from W1's 19-ability fixtures and from A41 reconnect identity work.

**Required corpus:**
- Read R16 `NetworkGameSession.cs`, codec/protocol handling and W1 A60 snapshot claims.
- Specify ≥16 cases including valid baseline, stale revision, malformed nested status/event, null nested objects, duplicate ball/zone IDs, non-finite coordinate/velocity, invalid nextId, decompression/chunk limits where the actual R16 decoder supports such rejection, and rejection followed by valid packet of same revision.
- Each case must have a legal input setup, mutation, expected acceptance/rejection, last-good-state immutability, revision monotonicity and source anchor; don't invent wire fields.
- Label independently source-supported versus future harness-required cases. Separate raw JSON representability of NaN/Infinity from runtime floating point payloads.
- Optionally create and **run** a standalone Node metadata-validator for this static corpus; that validates corpus completeness **not** actual NGO/C# runtime.
- Include deterministic seed/packet order and output telemetry schema for future A31/A60 runtime work.

**Do not:** modify C# networking, claim transport or snapshot codec runtime execution, duplicate A51 W1 42 gameplay fixtures, run physical networking.

**Deliverable:** traceable JSON corpus + README + optional static validator output, with all runtime cases marked `NOT_RUN`.

### W2-A60 — Independent QA: first-wave deliverable reconciliation

**ISSUE:** [#111](https://github.com/C8LyNn/aplikacja-turnieje/issues/111)  
**BRANCH:** `feat/cc001-r17-w2-a60-wave1-qa`  
**PRIORITY:** HIGH / **RISK:** LOW / **SCOPE:** MEDIUM  
**TYPE:** INDEPENDENT READ-ONLY AUDIT — AUDYT != NAPRAWA  
**OWNER FILE:** `docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md`

**Mission:** Independently reconcile **already-existing W1 handoffs only**, without waiting for any W2 output. This scope is frozen as of this dispatch.

**Frozen evidence inputs:** A10 Issue #91 semantic contract/PR #98; A20 Issue #95 mobile intake; A41 support Issue #94; A50+ A51 artifacts under Issue #93; A60 prior gate Issue #96; HQ/A70 status as observed at audit time.

**Required checks:**
- Verify GitHub document URLs and exact source commit/blob provenance where possible; no falsely claimed merge or release.
- Inspect conflicts across prior A10 event semantics, A50 expected physics/collision tests, A51 fixture vocabulary, A41 authority/serialization and A20 mobile input without inventing already-implemented cross-agent integration.
- Provide status truth matrix and specific blockers/overlaps/uncertainties. Distinguish first-wave **design readiness** from source-import/build readiness.
- Highlight whether the new W2 responsibilities overlap anything delivered by W1; suggest follow-up issue if so, without editing the W2 dispatch.
- Output a post-A70 QA queue ordered by risk, without falsely closing current A60 HOLD.
- Since W2 colleagues are running **concurrently**, do not require their W2 outputs or audit them in this task.

**Do not:** repair, alter gameplay, close #90/#96, merge, rerun fabricated tests, or certify absent physical-device evidence.

**Deliverable:** independent W1 reconciliation, exact evidence ledger, risk-ranked readiness/hold gates.

## 4. Work isolation matrix

| Role | New issue | Exclusive branch | Owned output area | Depends on A70? | Concurrent? |
|---|---|---|---|---|---|
| A10 | [#106](https://github.com/C8LyNn/aplikacja-turnieje/issues/106) | `feat/cc001-r17-w2-a10-semantics` | `docs/cc001/swarm/w2/A10/` | **No** | Yes |
| A20 | [#107](https://github.com/C8LyNn/aplikacja-turnieje/issues/107) | `feat/cc001-r17-w2-a20-landscape-contract` | `docs/cc001/swarm/w2/A20/` | **No** | Yes |
| A41 | [#108](https://github.com/C8LyNn/aplikacja-turnieje/issues/108) | `feat/cc001-r17-w2-a41-reconnect-design` | `docs/cc001/swarm/w2/A41/` | **No** | Yes |
| A50 | [#109](https://github.com/C8LyNn/aplikacja-turnieje/issues/109) | `feat/cc001-r17-w2-a50-parity-oracles` | `docs/cc001/swarm/w2/A50/` | **No** | Yes |
| A51 | [#110](https://github.com/C8LyNn/aplikacja-turnieje/issues/110) | `feat/cc001-r17-w2-a51-snapshot-fixtures` | `docs/cc001/swarm/w2/A51/` (+ optional owned static script) | **No** | Yes |
| A60 | [#111](https://github.com/C8LyNn/aplikacja-turnieje/issues/111) | `feat/cc001-r17-w2-a60-wave1-qa` | `docs/cc001/swarm/w2/A60/` | **No** | Yes |

**NOT included in this wave:** A70 (continuing Issue #90), A40 (implementation gate), A31 (if no separate R17 A31 thread), HQ integration. **No silent role substitution** beyond A41 as the existing networking specialist. HQ tracks all Issues; A31 remains prior primary owner of Issue #94.

## 5. Required one-message HANDOFF format

```text
PROJECT: CC-001
WAVE: R17-W2
AGENT: Axx — existing role
ISSUE: #1xx
BRANCH: feat/cc001-r17-w2-...
BASE COMMIT: <exact SHA, if verified>
FINAL COMMIT: <exact SHA>
FILES: <all changed paths>
INPUT R16 SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
DELIVERED: <specific artifacts>
ACTUAL TESTS: <command + result or NONE>
NOT RUN: <explicit runtime/device/Unity scope>
DESIGNED:
IMPLEMENTED:
TESTED:
INTEGRATED:
RELEASED:
OPEN QUESTIONS:
HANDOFF TO: 00/HQ (+ any relevant future agent)
```

Post this HANDOFF as a comment on your assigned Issue after committing the owned artifact. Do not claim Git upload succeeded unless GitHub readback confirms the new path and SHA.

## 6. HQ exit / sequencing policy

**R17-W2 is a pre-import preparation wave**, not an R17 release candidate. After W2 submissions, 00/HQ reconciles them alongside **A70's completed exact-source Git import**. Only then issue the next integrated **R17-W3 implementation & execution wave**, where A40/A20/A31/A50 can safely edit source and A60 independently gates it.

Release status: **NO LIVE DEPLOY / NO MERGE / NO GAMEPLAY CHANGES FROM THIS DISPATCH**.
