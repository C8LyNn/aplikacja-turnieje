# CC-001 / CORE CLASH UNITY — R17-W4 MASTER DISPATCH
## Controlled integration, executable verification and scoped repairs — 2026-10-18

**STATUS: HQ AUTHORIZED — START READY-NOW TASKS. GATED TASKS REMAIN WAITING.**
**OWNER: A00 / HQ ORCHESTRATION**
**SOLE W4 TASK SOURCE OF TRUTH:** this document; per-agent GitHub Issue supplements it only within its assigned scope.
**REPOSITORY:** https://github.com/C8LyNn/aplikacja-turnieje
**HQ TRACKER:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**W3 PREDECESSOR:** https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w3-parallel-source-development-20261018/docs/cc001/swarm/R17_W3_PARALLEL_SOURCE_DEVELOPMENT_20261018.md

## 0. Baseline, frozen evidence, current state

- Certified frozen source branch: feat/cc001-r17-a70-source-import, HEAD de1fe4b88fce3bd08ef383165dc2cd622af2536b. DO NOT CHANGE IT.
- Canonical Unity source: unity/cc001-r16/CoreClash-V149-Unity/.
- R16 canonical ZIP SHA-256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4.
- Original R16 subtree Git SHA-1: 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6.
- A71 previous integrity: 639/639 imported files and 88/88 .meta PASS. Protected original V148 SHA-256 bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e.
- Unity Editor 6000.4.0f1; managed execution requires .NET 9; protocol 149 frozen; ability registry historically 42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY.
- A72 Issue #113 has delivered final static handoff commit c49ef5855eed7eb5aef5534f5cc8334fe1585463: 32/32 STATIC preflight PASS; managed 269 cases, codec 13 cases, native Unity, devices: NOT rerun for R17.
- R17-W3 agent-delivered heads: A10 05eb15293dad4d61271e7c200ce661f1080f5288; A20 1f87595a9d73de30179e5158a5848eae3b965885; A41 8eb0b2517c049c95fc2257d73f0139d7bc17fd2c; A50 4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5; A51 92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5; A73 7d57f92aea3660aa1b2183e937e357b409e8c19d. All NOT integrated. A60 W3 #126 gate not delivered at W4 dispatch inspection.
- A10 W3 executed 8/8 isolated V148 browser-source probes, not Unity. W3 A20 committed layout plus static geometry tests, not compiled; A41 authored 17 new test definitions not executed; A51 authored 23 new C# test registrations not executed. A50 authored deliberately failing F02 expectations, NOT production repair. No W3 compile/run PASS was established.
- W2 corrected F01 misconception: protected V148 constructions initialize at HP 5, NOT 2. Do not "fix" HP to 2. F01 collision thresholds are separate investigation, out of W4 repair authorization.
- Open draft/older web-showcase PRs and WEB-005 tournament changes MUST NOT be mixed into this Unity source candidate.

## 1. Safety, authorization and branch conventions

1. This authorization covers isolated dispatch planning, new scoped issues, new isolated branches, approved role-scoped development and non-destructive verification. It does NOT authorize merge into main or another protected/deployed branch, public build/deploy, force push, history rewrite, destructive cleanup, V148 reference change, canonical R16 ZIP/manifest/tree rewriting, protocol 149 change or automatic UNITY_READY promotions.
2. Shared W4 dispatch branch: feat/cc001-r17-w4-master-dispatch-20261018, rooted at exact A70 frozen commit. Each NEW W4 agent branch is initialized from the exact shared-dispatch commit, never from an arbitrary moving branch. The disposable integration branch may be initialized the same way but may receive selectively accepted changes ONLY after gate G0 and A73 branch/conflict checks. Initial empty coordination branch IS NOT an integrated candidate.
3. Every agent edits ONLY exclusive paths enumerated below. Existing .meta GUIDs preserved. Any required file outside ownership: STOP, file decision request for HQ, do not silently broaden scope. In particular: A50 owns CollisionResolver.cs exclusively during this wave; A40 MUST NOT edit it. A50 cannot edit lifecycle sources; A40 cannot edit ElementalEffects/ElementalTests.
4. Do not edit Tests/Program.cs; suites already registered. No testing on frozen source worktree if runner may write logs/artifacts. Legacy r16-qa / SetupAndSmoke and related scripts may write output and must execute only in disposable checkout.
5. All tests must have exact command, runner environment, exit code, captured logs/evidence, commit SHA, and positive/negative control. If toolchain or physical devices absent, mark NOT_RUN. Historical R16 269/269, codec 13/13 are NOT post-W4 PASS.
6. Status is always five distinct axes: DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED. GitHub commit or documentation is never proof of successful build. Every Issue HANDOFF identifies observed vs inferred vs unknown.
7. A60 and A71 remain independent from authors under review. No agent may self-promote readiness or merge its own W4 feature.

## 2. Waves, task ownership and no-duplicate Issue map

| Workstream | Agent / Issue | Branch | Exclusive work area | Start gate |
| --- | --- | --- | --- | --- |
| W4-01 — A70 source baseline G0 | A60 existing #126 | existing feat/cc001-r17-w3-a60-baseline-qa | W3 A60 report only (prior dispatch); no new duplicate | READY NOW: finish #126 independently |
| W4-02 — real .NET/CI runner | A72 existing #113 | NEW feat/cc001-r17-w4-a72-managed-ci | scripts/cc001/w4/a72/**; .github/workflows/cc001-r17-managed.yml; docs/cc001/swarm/w4/A72/** | READY NOW; actual execution may WAIT TOOLCHAIN |
| W4-03A — changed-head/conflict check | A73 NEW #136 | feat/cc001-r17-w4-a73-merge-preview | docs/cc001/swarm/w4/A73/** | READY NOW, read-only |
| W4-03B — disposable integration candidate | A70 NEW #137 | integration/cc001-r17-w4-disposable-candidate-20261018 | docs/cc001/swarm/w4/A70/** and, only after gate, selectively accepted isolated code/document deltas on candidate | WAIT G0 + A73 W4 map |
| W4-04 — F02 physics parity | A50 NEW #138 | feat/cc001-r17-w4-a50-f02-physics | ElementalEffects.cs, Physics/CollisionResolver.cs, Tests/ElementalTests.cs, docs/cc001/swarm/w4/A50/** | READY NOW; merge/test gate HOLD |
| W4-05 — lifecycle/RETURN five abilities | A40 existing #92 | NEW feat/cc001-r17-w4-a40-lifecycle-return | Core/LifecycleEffects.cs, Core/GameState.cs, Core/AbilityResolver.cs, Core/TurnSystem.cs, Tests/AbilityTests.cs, docs/cc001/swarm/w4/A40/** | READY NOW test-first; extra paths require HQ approval |
| W4-06 — physical/compact UX | A20 existing #95 | W3 source feat/cc001-r17-w3-a20-compact-layout; future isolated validation branch on G2 | Device QA report under docs/cc001/swarm/w4/A20/**; no W4 new UI source path authorization | WAIT G2 Unity/build |
| W4-07 — physical crossplay/NGO | A31 existing #94; A41/A51 assistance | previous network branch for reference; reserve future isolated validation branch on G2 | Device and network QA only in docs/cc001/swarm/w4/A31/**; fixes require separate HQ source ownership | WAIT G2 and device/network access |
| W4-08A — candidate source integrity | A71 NEW #140 | feat/cc001-r17-w4-a71-candidate-integrity | docs/cc001/swarm/w4/A71/** | WAIT G0 + candidate SHA |
| W4-08B — candidate hygiene/ledger | A74 NEW #141 | feat/cc001-r17-w4-a74-candidate-hygiene | docs/cc001/swarm/w4/A74/** | WAIT G0 + candidate SHA |
| W4-09 — integrated independent regression | A60 NEW #139 | feat/cc001-r17-w4-a60-candidate-qa | docs/cc001/swarm/w4/A60/** only | WAIT G1/G2; distinct from #126 |

ISSUE LINKS:
- W4-01 existing #126: https://github.com/C8LyNn/aplikacja-turnieje/issues/126
- W4-02 existing #113: https://github.com/C8LyNn/aplikacja-turnieje/issues/113
- W4-03A new #136: https://github.com/C8LyNn/aplikacja-turnieje/issues/136
- W4-03B new #137: https://github.com/C8LyNn/aplikacja-turnieje/issues/137
- W4-04 new #138: https://github.com/C8LyNn/aplikacja-turnieje/issues/138
- W4-05 existing #92: https://github.com/C8LyNn/aplikacja-turnieje/issues/92
- W4-06 existing #95: https://github.com/C8LyNn/aplikacja-turnieje/issues/95
- W4-07 existing #94: https://github.com/C8LyNn/aplikacja-turnieje/issues/94
- W4-08A new #140: https://github.com/C8LyNn/aplikacja-turnieje/issues/140
- W4-08B new #141: https://github.com/C8LyNn/aplikacja-turnieje/issues/141
- W4-09 new #139: https://github.com/C8LyNn/aplikacja-turnieje/issues/139

## 3. Role-specific acceptance rules

### A60 / W4-01, inherited #126
Independently verify A70/A71 639/639+88/88 and W2 semantic corrections and current A72 static status; provide PASS/HOLD **SOURCE-ONLY** G0. Do not confuse source admission with W3 post-integration QA. Source baseline pass is prerequisite for candidate assembly. Existing assigned branch/report remains authority; no duplicate issue.

### A72 / W4-02, inherited #113
Reuse A72 preflight and runbook rather than repeat its static discovery. On the NEW W4 isolated branch, author a precisely scoped opt-in managed CI runner and reproducible commands using .NET 9 and frozen source. Run actual managed 269 baseline tests + new W3 cases and codec 13 when tooling can be provided. Do NOT change Unity/gameplay files or rewrite historical CI. Prevent accidental inherited tournament CI triggers by path/branch filters. If CI cannot run, publish planned runner and NOT_RUN state without claiming PASS. Report W3 A20/A41/A50/A51 results individually; F02 W3 red expectations are intentionally expected to fail pending W4 repair. Scope: .github/workflows/cc001-r17-managed.yml, scripts/cc001/w4/a72/**, docs/cc001/swarm/w4/A72/** ONLY.

### A73 / W4-03A, new #136
Fetch all actual W3 final HEADs and compare exact changed paths with A70. Reconcile diverged W1/W2 ancestry (A50/A51 W1 shared history, HQ/W2 shared history), W3 A50 intentionally-red fixtures, open PR #98 and candidate sequence. Execute non-destructive Git conflict preview if tooling supports it, clearly say NOT_RUN otherwise. Publish branch-by-branch admissibility table with SHA and gates. No merge operations.

### A70 / W4-03B, new #137
Initial isolated integration branch is only dispatch-descended coordination baseline. After G0 is explicitly PASS and A73 W4 map verifies exact refs/conflicts, selectively assemble a candidate in disposable branch only; document source selection, each SHA, decisions and test status. W3 A50 intentionally red tests must not be described as repaired; either hold corresponding delta or explicitly label known-failing candidate only for diagnostic runner, never certify. No merge to main, protected website, release branch, or live deployment.

### A50 / W4-04, new #138
Explicitly authorize A50 alone to edit Physics/CollisionResolver.cs in addition to ElementalEffects.cs and ElementalTests.cs. Preserve actual V148 Frostguard STOP plain anchor semantics: zero synthetic Earth stacks, force scaling 0.30, mass factor 2.0, correct replay release, legitimate preexisting Earth stacks, snapshot and FIRE/ICE shields. Review W3 #124 red fixture before code; use test-first, negative controls; prove actual RED→GREEN only if real .NET/Unity tests run. No F01 changes, no HP2 structure misconception, no arbitrary source/serialization/protocol changes. If implementation requires BallPhysics/GameState/another file, STOP and request scope.

### A40 / W4-05, existing #92
HQ accepts A10 W1 contract for a NARROW implementation of exactly Phoenix, Revenant, Soul Anchor, Dirge and Den Mother, subject to source-truth conflict handling. RETURN distinct from SPAWN; Dirge repeats DEATH effect not full death event; serialize lifecycle state and host RNG; prevent stock duplication, safe generation, replay exploits; status DATA_ONLY remains until independent QA. Exclusive owned source paths in matrix. Test-first; if required shared core outside matrix, STOP and request scope; A40 is NOT authorized to touch CollisionResolver, ElementalEffects, Tests/Program.cs, snapshot/networking, data/catalog or V148. Actual V148 source truth governs; Dirge SHORT metadata must not invent unapproved range change.

### A20 / W4-06, existing #95 — WAIT
Use exact W3 #122 compact-layout candidate. Once a compiled/served suitable build exists, run viewport/safe-area/portrait/tablet/phone physical QA, actual scroll/aim/touch/lobby/results and repeatable screenshots; classify any new UI source fixes as separate next authorization. No premature physical PASS.

### A31 with A41/A51 / W4-07, existing #94 — WAIT
After G2, run real separate-device Windows↔Android and Windows↔WebGL, LAN/WAN where practical, latency/jitter/long-match, stale command/snapshot and owner spoof tests; do not equate managed seat ID with authenticated same-user resume. Protocol149 frozen; no new backend. If transport/NGO code needs fixes, escalate and secure exclusive paths.

### A71 / W4-08A, new #140 — WAIT
Independent after-candidate provenance: original 639/639, meta 88/88, V148 SHA, source-change allowlist, meta GUID, actual commit tree and test manifest. Never claim runtime PASS from source hash. Read-only report.

### A74 / W4-08B, new #141 — WAIT
Non-destructive after-candidate hygiene: accidental generated files and logs, source/commit scope, .gitignore correctness, dependency/stale ref, evidence log integrity. Do not delete generated output or rewrite history. Read-only report, distinct from A71 provenance.

### A60 / W4-09, new #139 — WAIT
Only after candidate SHA and actual tooling. Independently run/review W3 added test suites, W4 repairs, managed+codec, Unity build, device QA, negative controls, ability-registry truth; issue distinct G1/G2/G3/G4 PASS/HOLD with evidence. Not duplicate W3 #126 G0. Do not self-merge.

## 4. Dependency/decision graph

READY NOW in parallel:
- A60 #126 -> independent source baseline admission G0.
- A72 #113 W4 CI/managed runner preparation -> G1 executable runner.
- A73 #136 -> actual W3 path, ancestry and conflict map.
- A50 #138 -> isolated F02 physics parity development.
- A40 #92 -> isolated lifecycle/RETURN five-ability development.

After G0=PASS AND A73 conflict map accepted:
- A70 #137 may assemble selective disposable integration candidate. Branch existence alone does not satisfy these gates.

After candidate+runner available:
- G1: .NET managed + codec actual runs (accept or HOLD; intentionally red tests must be resolved).
- G2: Unity Editor 6000.4.0f1 compile + Windows/WebGL/Android builds where tooling available.
- A71 #140 and A74 #141 audit candidate exact SHA without modifying it.
- A20 #95 and A31 #94 run physical evidence only after usable builds/phones/network exist.
- A60 #139 issues independent G1/G2/G3/G4 decisions. Release remains HOLD until future owner instruction, even if gates pass.

Do NOT block independent A50/A40 development merely because G0 is pending; only integration is gated.

## 5. Mandatory final HANDOFF template

PROJECT: CC-001
WAVE: R17-W4
AGENT: Axx / original role
ISSUE: #...
OWN BRANCH: ...
FROZEN R16 BASE SHA: de1fe4b88fce3bd08ef383165dc2cd622af2536b
W4 DISPATCH COMMIT SHA: <exact commit after dispatch publication>
OWN START SHA: <exact>
FINAL HEAD SHA: <exact>
CHANGED PATHS: <full list>
DATA / V148 / PROTOCOL 149 MODIFIED: NO (or explicit HQ exception request)
TESTS ACTUALLY RUN: <commands, environment, exits, logs, count>
NOT RUN: <specific test layers>
DESIGNED: ...
IMPLEMENTED: ...
TESTED: ...
INTEGRATED: ...
RELEASED: NO
GATE: READY / PASS / HOLD / BLOCKED
KNOWN LIMITATIONS: ...
ISSUE COMMENT + GITHUB REPORT: <links>
HANDOFF: 00/HQ, A60 and relevant peer

Every agent must link SHA and read back published artifact/branch HEAD after push; do not close Issue before acceptance. Exact false-positive prevention: an authored C# assertion is not an executed C# test, a static source PASS is not Unity compile PASS, and any merged document is not an integrated gameplay feature.

## 6. HQ execution checklist

- [x] Verify W4 task duplication and source baseline before creating new issues.
- [x] Assign fresh work to six new Issues #136-#141; reuse #126, #113, #92, #95, #94.
- [x] Authorize isolated W4 branch creation rooted at immutable A70 source via this dispatch.
- [ ] A60 G0 source gate PASS.
- [ ] A73 verified W3 delta/conflict preview.
- [ ] A70 actual candidate assembled.
- [ ] A72 actual post-W3 .NET run.
- [ ] A50 F02 RED→GREEN runtime parity accepted.
- [ ] A40 lifecycle/RETURN accepted.
- [ ] A71/A74 candidate independent evidence.
- [ ] A20/A31 physical QA.
- [ ] A60 independent final candidate PASS.
- [ ] Public release — NOT AUTHORIZED in W4.

This W4 document delegates work; it does NOT report that any remote ChatGPT thread was automatically invoked. Branches and Issues are assignments; actual agent execution requires connected runtime or invocation of those threads.
