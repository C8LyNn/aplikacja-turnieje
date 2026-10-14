# WEB-005 — FALA R19 — SOURCE CLOSEOUT / OWNER DECISIONS / FINAL HANDOFF GATE

**Wersja:** R19.1 · 2026-10-14 (Europe/Warsaw)  
**Koordynator:** A00 WEB-005 Implementation Lead (pod jedną Queen/HQ w oddzielnym projekcie).  
**Repozytorium:** C8LyNn/aplikacja-turnieje; **branch control:** chore/web-005/t000-wave1-control.  
**Źródła nadrzędne:** WEB-004 final HANDOFF R2; WEB-005 BACKLOG/DECISIONS; centralny \`WEB-005_WAVE_R18_AGENT_PROMPTS.md\`; [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), [A60 final handoff gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md), [A50 R18 receipt](./agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), [A10 R18 manifest](./agent-reports/A10/WEB-005_A10_R18_FINAL_ONLY_MANIFEST.json).  
**Status:** R18 agent wave completed; WEB-005 still IN_PROGRESS; **SWARM-006 HOLD / RELEASE NO-GO**. This is a single shared instruction document for all 13 agents.

## §0 — Shared safety and source-of-truth rules

1. Read §§0–2, identify Axx from the thread's established role, execute **only your AGENT Axx section**. A00 coordinates under global HQ. No agent substitutes their author's report for independent A60 acceptance. Verify current GitHub PR HEAD/base/blob before work; R18 SHA table in §1 is only a snapshot.
2. **R19 has only TWO bounded code lanes on existing draft PRs:** **A120/P21 PR54** two-boundary historical RR403/DE UI and **A100/P20 PR53** bounded legacy ownerless-cache rebind negative/fix after source verification. A70/PR42 and A90/PR41 are code-frozen source accepted conditional; no other code GO. Do not create new PRs or fourth lanes. If fix requires policy or additional unowned files outside assigned bounds, HOLD that portion and ask A00.
3. **A120 has explicit NEW FILE-OWNERSHIP GO** for \`artifacts/tournament-manager/src/components/stage-progress-view.tsx\` **and focused component test files on its own existing PR54 branch**, solely to prevent a manually selected denied historical RR stage from showing stale private \`detailQuery.data\` when error 401/403. It also owns PR54's \`src/pages/tournament-detail.tsx\` RR bridge narrow scope and test file. This grants exclusive R19 work-window **on PR54**, NOT permission to edit, cherry-pick or merge PR47 or other branches. Preserve PR47-owned conceptual changes as future SWARM-006 semantic collision. If a correct fix depends on yet-unmerged PR47 changes, document exact dependency and HOLD without cross-branch integration.
4. **A100 R19 limited GO** on existing PR53 branch for a focused negative test (legacy untagged cached \`['matches',matchId,'game-picks']\` → credential revoked/changed → canonical match list disappears/reappears → stale protected old picks must never render) and an equally bounded source correction **only after independently confirming the behavior**. Scope: existing \`tournament-query-invalidation.ts\`, \`deadlock-bans-picks.ts\`, \`tournament-auth-query-cache.test.tsx\`; maintain verified ownership, no global cache clear, no numeric ID guess or token policy redesign. If the test's safe remediation requires an unapproved migration/identity contract, HOLD and request owner/HQ signed disposition. No backend auth changes.
5. **All others source/test/policy only**. Product semantics are still HQ/owner decisions: Basket CAS 409/412/version/legacy and drafts, terminal Swiss deny/reopen, SE action pointer, Swiss rematch/BYE/NC, DE GF/reset rankings, Backup B2 result history/legacy revisions, direct Revert MP2B CAS+Host cutover, Steam 403/503, session TTL/hash/rotation. Agents supply signable alternatives but **do not choose defaults**. No claim of SIGNED unless a real named owner-approved decision exists.
6. A60 source acceptance = exact SHA independent verdict; real \`RUNTIME_VERIFIED\` = actually executed test command, per-PR exact checkout, environment, exit/TAP/sanitized logs. Authored tests/static assertions are NOT EXECUTED. A50 R18 recorded **zero** native application React/API/PG16 tests due to lack of full connected checkout, pnpm and isolated PG16. Absent executor, use \`ENV_BLOCKED\` and one specific owner action, not a repeated PLAN-only pseudo-test.
7. PostgreSQL integration destructive tests only on dedicated physically isolated owner-approved disposable PG16/test DB with \`TEST_DATABASE_URL\` (no production fallback), \`tm_test_*\` schema and explicit owner reset-scope approval. No SQL adoption/DDL on shared/prod. Frontend tests without PG still require full per-SHA repo checkout, Node22/pnpm10 and installed frozen dependencies. Do not run paid manual CI without owner consent.
8. Old release-source Pack19 CI expects \`readOnly:true\` while Drizzle implementation uses \`accessMode:"read only"\`; existing PR35 is the separate source correction. Isolated PR GH Actions may terminate upstream before target test. Do not duplicate PR35, waive Pack17/20–26 required gates or create a composite WEB-005 branch. SWARM-006 eventually owns merge, conflict resolution and final integrated CI.
9. **Final-only SWARM-006**: the earlier user directive stands. WEB-005 must independently close source blockers and reconcile complete accepted WEB-004 R2 backlog (38 historical test cases) with actual signed owner policy/exceptions, pin full 21-package dependency manifest and get independent A60 closing verdict. **Only then** may A00 request a separate owner/HQ final handoff GO. If native tests remain impossible, explicit \`HANDOFF_WITH_RUNTIME_TEST_DEBT\` may be requested *after source/policy/38-case closeout*, naming all missing tests and preserving SWARM-006 hard RELEASE STOP; it is not an automatic waiver or deployment authorization.
10. **HARD STOP**: merge/rebase/cherry-pick to release/main, intermediate SWARM-006 package sends, staging/live, Replit integrator, new SQL ledger adoption/migrations, real user backup/secret logging, unapproved shared DB reset, paid CI rerun, fabricated PASS or signoff, self-certification. WEB-004 receives no new audit request; SWARM-007 remains independently responsible for communication/Drive infrastructure.
11. **Each agent publishes an R19 artifact** under \`docs/web-005/agent-reports/Axx/WEB-005_Axx_R19_HANDOFF.md\` in central docs branch if safe, otherwise its own docs branch with direct GitHub link and blob/commit SHA. Include task, old/new PR HEAD, changed/reviewed paths, actual tests with command/exit or NOT_EXECUTED, A60 evidence, open policies, owner next action, file conflicts, integration STOP. No editing shared central prompt after dispatch.
12. **No automatic SWARM-006 activation after R19.** A00 performs explicit \`R19_FINAL_GATE\` audit; user/HQ decision required if ready. If not ready, next wave is narrowly assigned, not another generic churn of the same 21 PRs.

## §1 — Verified R18 source baseline and hard blockers

**Base** \`release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. **21 existing PR #34–54 OPEN DRAFT, unmerged.** Current exact R18 HEADs of changed/candidate PR:

| Packet / PR | Current R18 HEAD SHA | Independent A60 R18 source verdict | Status to satisfy |
|---|---|---|---|
| P08 / #41 | \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` | SOURCE_ACCEPTED_CONDITIONAL | PG16 valid/corrupt/rollback, owner Backup B2 policy |
| P09 / #42 | \`021bed269f9ea8ac8ce53caeea44263c098aa2dd\` | SOURCE_ACCEPTED_CONDITIONAL | PG16 roster stale X/newer Y 409 zero-write, 200 valid latest |
| P20 / #53 | \`8710f7fe5946d7f62e366303a97722d4201fc96b\` | SOURCE_ACCEPTED_SCOPED / FULL_PRIVACY_REVIEW_OPEN | Legacy untagged picks rebind, owner/privacy decision, RTL |
| P21 / #54 | \`9866e5d2e73c99e01c2934a38ca1c62455efd2ed\` | **SOURCE_BLOCKED** | two-boundary production correction (PR54 parent + manual-selected child), fresh A60 review and RTL |

Remaining unchanged 17 per-packet SHA and scoped/conditional/offline-only QA are pinned in [A60 R18 21-row matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json) and [A10 R18 final-only manifest](./agent-reports/A10/WEB-005_A10_R18_FINAL_ONLY_MANIFEST.json). Do not mark any of these 21 app-level QA ACCEPTED. PR32 release→main is separate; PR33 competing Steam patch HOLD.

**A60 formal final gate** \`HANDOFF_NOT_READY\`, for reasons independently falsifiable:
- PR54 source safety still broken; legacy PR53 privacy issue not fully disposed;
- **A50 0 native application tests**;
- WEB-004 historical matrix 38 rows (0 PASS / 3 external-CI FAIL / 33 BLOCKED / 2 NOT_RUN) has no complete **owner-signed per-finding disposition mapping**;
- T055, T050/T051, T060B2, T040MP2B, Steam/session policy choices unsigned;
- no final runtime debt exception and no final handoff permission.
**Don't infer 21 draft PRs = 21 fixed accepted findings or 38 historical rows closed.**

## §2 — R19 ownership and assignment map

| Agent | Work package | Mode |
|---|---|---|
| **A00** | Final-closure coordination, explicit child file GO, policy owner signatures, 38-row dispositions, execution route | COORD |
| **A10** | Exact 21-PR final-only buffer + WEB-004 38-case owner mapping + QA receipts | DOCS ONLY |
| **A20** | Dedicated test PG16 gate, migration-ledger REVIEW_ONLY | SOURCE/SAFE |
| **A30** | PR53 exact SHA privacy peer and legacy rebind provenance | READ-ONLY |
| **A40** | CI Pack19/17, targeted tests and TAP parser risk report | READ-ONLY |
| **A50** | Physical actual per-SHA test executor or one owner-action blocker | SAFE TEST ONLY |
| **A60** | Independent PR54 new source QA, PR53 legacy rebind QA and formal handoff verdict | STRICT READ-ONLY |
| **A70** | PR42 source frozen, PG16 race contract, MP2B owner signature packet | SOURCE ONLY |
| **A80** | Terminal Swiss, SE/Swiss/DE owner policy signoffs, PR45 fixture | SOURCE ONLY |
| **A90** | PR41 conditional Backup QA, B2 owner signoff, no code | SOURCE ONLY |
| **A100** | PR53 legacy untagged picks rebind negative and bounded fix/HOLD | **CODE L2 CONDITIONAL** |
| **A110** | T055 Basket CAS owner decisions + UX044 Host, unchanged UI QA | SOURCE ONLY |
| **A120** | PR54 RR selected-stage-local privacy + lawful DE/Overview | **CODE L1** |

---

## AGENT A00 — Implementation Lead / Source Closeout R19

**TASK:** WEB-005-T000-A00-R19; COORD ONLY.

1. **Authorize A120 exclusive PR54 file scope**: \`tournament-detail.tsx\`, PR54 RR-focused test, and explicitly \`stage-progress-view.tsx\` plus focused tests for manually selected historical stage denial. PR47 branch itself remains untouched; retain semantic collision and exact future SWARM-006 merge order.
2. **Authorize conditional A100 existing PR53 test-first lane** for legacy untagged standalone picks rebind; require authoritative ownership and narrow result, else HOLD plus named owner exception request. No third lane.
3. Ask A50 owner action: trusted connected full exact-SHA repo checkout/Node22/pnpm10 executor for React independent tests; separate isolated PG16 only with A20 identity/reset consent. If no access, report 0 real tests honestly.
4. Obtain signed owner/HQ choices instead of repeated unsigned templates. Consolidate A80, A90, A70 and A110 policy alternatives (Sport, Basket CAS, Backup B2, public Revert CAS/Host, Steam/session), and acquire written yes/no or formally approved defer/WONT_FIX per item.
5. Recover original WEB-004 HANDOFF R2 38 IDs and build owner-verifiable \`finding_id → task/PR/current SHA → A60 → native test → policy/disposition\`. Do not invent absent nine cases. Prepare and request signatures for all genuinely accepted findings; A10 21 PR matrix alone doesn't replace 38 cases.
6. Require A60 on exact new PR54/PR53 SHA and final readiness verdict. After R19, evaluate whether source/policy gates genuinely closed; do not dispatch SWARM-006 until explicit owner \`FINAL_HANDOFF_GO\` + if needed \`RUNTIME_DEBT_TO_SWARM006\`.
7. Final readout \`WEB-005_A00_R19_CLOSEOUT_GATE.md\`; same policy \`SWARM006_HOLD\` absent independent accepted evidence.

## AGENT A10 — Final-only registry / original WEB-004 lineage

**TASK:** WEB-005-T018-A10-R19; DOCS ONLY.

1. Recheck 21 actual PR #34–54 HEADs; update only changed PR53/54 SHA, file hashes, dependency DAG and accurate source/runtime A60/A50 receipts. PR41/42 R18 conditional source verdict kept on identical SHA.
2. Trace **38 source WEB-004 cases** with *actual available original identifiers*. If some IDs absent, label \`SOURCE_ID_NOT_AVAILABLE\` and enumerate count; **never fabricate a 38-row signed matrix**. Separate A60 21-package source reviews from 38-case owner dispositions.
3. Preserve status of 21 draft fixes / no integrated SHA / native app testing 0 unless A50 supplies actual exact-SHA tests. Capture future SWARM-006 collision DAG routes PR39/42/44/46/51, backup PR41/48, frontend PR43/50/54 + PR47 child, privacy PR53, CI PR35/36/40, migration PR38 review-only, alt Steam PR33 HOLD.
4. Add owner policy approval/waiver fields with exact signed source URLs; null if unsigned. Build final-only packet schema but DO NOT transmit.
5. Deliver \`WEB-005_A10_R19_FINAL_ONLY_PACKAGE_AND_38_CASES.md\` and machine registry. Mark \`FINAL_HANDOFF_GO=false\` until A00/HQ explicit.

## AGENT A20 — PG16 test isolation and migration gate

**TASK:** WEB-005-T021-A20-R19; SOURCE/SAFE ONLY.

Verify offline validator PR38 and remaining historic ledger 0030–0031 as REVIEW_ONLY / \`ready_for_sql:false\`. Provide non-mutating physical identity preflight + exact executable PG16 test prerequisites for PR41 Backup corruption, PR42 roster global LIFO, other API patches. Do not run reset or DDL on shared/production DB. Owner must supply a dedicated disposable DB, explicit \`TEST_DATABASE_URL\`, tm_test_* scope consent. Publish \`WEB-005_A20_R19_PG16_GATE.md\` and one concrete unblock request for A00/A50.

## AGENT A30 — Security peer / PR53 legacy orphan picks

**TASK:** WEB-005-T030-T031-A30-R19; STRICT SOURCE READ-ONLY.

Review PR53 changed exact SHA and A100 new R19 tests/fix. Validate cache match owner proof and legacy untagged stale rebind scenario, distinct A/B, token logout/401/403, no unrelated public cache wiping, late in-flight responses. Distinguish source-confirmed retention from user-visible leak unproven absent RTL/browser. Propose privacy-preserving fix or explicit bounded owner exception, not a global purge. Recheck unchanged auth PR44/46/49 security overlaps only as dependency. Deliver \`WEB-005_A30_R19_SECURITY_PEER.md\` and A60 fresh source evidence.

## AGENT A40 — CI acceptance and environment first

**TASK:** WEB-005-T010-T017-A40-R19; SOURCE ONLY.

Pin existing Pack19 matcher PR35, Pack20–26 PR36 and Pack17 fail-closed PR40; reproduce from actual source why isolated Actions stop at old Pack19 \`readOnly:true\` regex rather than new target test. Provide exact targeted frontend per-SHA commands for PR53/54 and backend PG16 commands for PR41/42. Note unresolved T017-QA-01 forged TAP counter source hardening separately and ask A60 classification, **not new code GO**. Full integrated tests belong to future SWARM-006 after final packet. Deliver \`WEB-005_A40_R19_CI_GATE.md\`.

## AGENT A50 — Actual runtime tests or physical blocker

**TASK:** WEB-005-T133-A50-R19; SAFE TEST ONLY.

1. Reuse [A50 R18 direct receipt](./agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), don't repeat environment PLAN-only harnesses. Check if owner-provided trusted full per-SHA repo checkout, installed pnpm10/Node22 frozen deps/shell available **now**. If yes, execute actual frontend RTL/typecheck on PR54 MIX401/403 + child selection and PR53 legacy cache + old fixture, then PR43/47/50/52. Exact SHA, command, exit/TAP, screenshot/browser only if actually captured.
2. For backend PR41/42 etc execute PG16 fixtures only after A20 checks physically isolated dedicated test DB and owner reset-scope consent. Record real 400/409/200, SQL snapshots and command exit, or NOT_EXECUTED.
3. If no authorized execution host: \`ENV_BLOCKED\` with exactly one owner-action to connect trusted PC/VM with full checkout and pnpm. No claimed app test PASS; no paid CI manual rerun or composite checkout.
4. Publish \`WEB-005_A50_R19_RUNTIME_OR_BLOCKER.md\` and direct machine receipts to A60/A10.

## AGENT A60 — Independent exact-SHA QA, signoff recommendation

**TASK:** WEB-005-T130-A60-R19; STRICT READ-ONLY.

1. Begin from [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) and [formal handoff NOT_READY](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md). Do not rereview unchanged packages without new independent evidence.
2. PR54: ensure legal Overview/DE still renders despite historical RR401/403, while manually selected denied RR stage cannot show stale cached participants, no unauthorized leakage, valid RR retry and N→N+1 refresh. Inspect both parent and child exact SHA; new tests source-only until A50 executed.
3. PR53: legacy untagged query cache rebind safety after credential change with/without list, unrelated B unaffected, query identity and revocation; record scoped accept vs full privacy blocked/owner waiver, not a self-declared pass.
4. Review A10 38-row WEB-004 original-case mapping, signed policies/waivers, A50 real tests or approved debt. Distinguish \`SOURCE_ACCEPTED\` from \`RUNTIME_VERIFIED\`. Issue **formal final handoff verdict**, not release verdict. If source/policy/backlog not closed: \`HANDOFF_NOT_READY\`, even if owner might later waive tests.
5. Deliver \`WEB-005_A60_R19_INDEPENDENT_QA.md\`, 21-package matrix and handoff gate. No source changes.

## AGENT A70 — PR42 frozen source; public Revert owner signoff

**TASK:** WEB-005-T040-A70-R19; SOURCE ONLY.

PR42 R18 head \`021bed269f9ea8ac8ce53caeea44263c098aa2dd\` independent A60 \`SOURCE_ACCEPTED_CONDITIONAL\`; no new code. Supply A50 PG16 test X/Y lock barrier, stale 409/no writes and lawful latest 200, plus generic/revert_match cross-regression. Prepare **owner-signable** public Direct Revert CAS + Host expected match revision, expected completion action ID, 422/409 and rollout alternatives. No selection without owner signature, no PR39/42/51 merge. Deliver \`WEB-005_A70_R19_REVERT_POLICY_QA.md\`.

## AGENT A80 — Sporting owner decision signoffs

**TASK:** WEB-005-T050-T051-A80-R19; SOURCE ONLY.

Consolidate binding owner alternatives for terminal Swiss TS-A deny409 vs TS-B atomic reopen, SE currentRound, Swiss rematch/BYE/NC and DE GF/ranks. PR45 RR roster source accepted conditional but PG16 negative/positive not executed. Present explicit signable decision slots and meaning, ask owner/HQ rather than choose. Do not implement sporting code. Deliver \`WEB-005_A80_R19_SIGNOFF.md\` with status SIGNED/UNSIGNED and exact link.

## AGENT A90 — Backup B1 QA / B2 signed policy

**TASK:** WEB-005-T060-A90-R19; SOURCE ONLY.

PR41 source parity QP/QPE/OP \`f03cf3d...\` A60 conditionally accepted, no new code; provide exact physical PG16 valid modern and legacy-null positive, invalid basket positions and receipt 400/no cloned rows and late rollback test matrix to A50. Backup B2 portable match revision/result_history/action_log/legacy constraints remain owner decisions; present short alternatives and await named signature, no strict reject by guess. Deliver \`WEB-005_A90_R19_BACKUP_OWNER_GATE.md\`.

## AGENT A100 — PR53 legacy query cache rebind test/fix (conditional L2)

**TASK:** WEB-005-T080-A100-S2B-R19; CONDITIONAL SOURCE-CODE ONLY ON OWN EXISTING PR53.

1. Freeze R18 exact head \`8710f7fe5946d7f62e366303a97722d4201fc96b\` as test baseline. Add **one explicit test-first negative**: old raw untagged \`["matches",mid,"game-picks"]\` cache has protected A data; credential downgraded, matching list removed; later canonical match ownership for A reappears under different identity; old picks must never display before authorized new GET. Include positive unrelated B cached behavior and async response case.
2. Inspect whether already existing auth-query identity/disabled placeholder protects this exact rebind; if source proves safe, \`SOURCE_RECONCILED/NO_CODE\` with independent proof. If not safe and a **bounded trusted metadata or query generation guard** can solve on owned \`tournament-query-invalidation.ts\`, \`deadlock-bans-picks.ts\` and existing test file, implement minimal fix on same existing PR53, no new PR and no global clear. If necessary source contract exceeds this scope: \`HOLD / OWNER_POLICY_REQUIRED\`.
3. Send new HEAD and focused test semantics to A30/A60; A50 actual RTL/typecheck only if authorized env exists. No source author signoff, no token TTL/backend auth changes. Publish \`WEB-005_A100_R19_LEGACY_CACHE_REBIND.md\`.

## AGENT A110 — Basket CAS owner acceptance

**TASK:** WEB-005-T055-T110-A110-R19; SOURCE ONLY.

Owner signable T055 CAS semantics: \`If-Match\`/version token, conflict 409 vs 412, missing legacy precondition policy, stage/roster version change, how stale full-graph PUT maintains draft and allows explicit retry. Keep UX044 Host dirty navigation owner behavior separate. No arbitrary implementation. PR43 CSV/50 backup preview/52 stale modal source accepted conditional and awaiting RTL; hand A50 exact tests, A60 current evidence. Do not revive withdrawn StageBasketsPanel A→B claims. Deliver \`WEB-005_A110_R19_BASKET_OWNER_SIGNOFF.md\`.

## AGENT A120 — PR54 two-boundary UI safety, new exclusive child GO (L1)

**TASK:** WEB-005-T100-A120-R19; GO NARROW SOURCE-CODE ONLY ON OWN EXISTING PR54.

1. R18 PR54 head \`9866e5d2e73c99e01c2934a38ca1c62455efd2ed\` contains fail-first MIX401/MIX403 test definitions, but no production fix. **Explicit new ownership:** \`src/components/stage-progress-view.tsx\` + focused child tests **on PR54 branch only**, and \`src/pages/tournament-detail.tsx\` RR bridge + PR54 readback tests. Do not edit PR47 branch or cherry-pick its changes. Document next-integration collision.
2. Test-first two boundaries: parent historical RR detail 401/403 must not blanket-hide lawful Overview or DE stage/tab; *manually selected denied RR stage* must hide stale cached participant rows even if React Query still carries \`data\` together with \`error\`. Ensure whole-tournament unauthorized auth still fail-closed and local denial stays on RR panel only. Success N→N+1 update, retry and non-RR polling remain valid.
3. Implement smallest parent guard + child selected-stage check. Do not change tournament read authorization API or accidentally expose private RR data; if PR47 child code dependencies make safe patch impossible from release-based PR54 branch, HOLD exact subcase and tell A00 rather than merge PR47.
4. Add tests, record new HEAD/blobs, no author-inferred actual RED/GREEN. A60 independent exact SHA and A50 actual RTL/browser when available. No new PR, merged code, staging/live or releases. Publish \`WEB-005_A120_R19_PR54_TWO_BOUNDARY_PATCH.md\`.

---

## §3 — End-of-wave gate, NOT an automatic dispatch

A00 collects 13 reports, verifies new PR54/53 heads, A60 exact source verdict, A10 21-packet and original 38-case mapping, owner/HQ signature of all policies (or owner-approved dispositions), and A50 actual test evidence or explicitly signed owner \`RUNTIME_TEST_DEBT\` exception. **If any source/privacy/38-case policy gate remains unapproved: WEB-005 IN_PROGRESS, SWARM-006 HOLD.** No intermediate SWARM-006 transfer. If all genuinely closed: prepare one **FINAL_CLOSEOUT_AND_HANDOFF_GO_REQUEST** for user/HQ; still do not activate SWARM-006 until approved. Later SWARM-006 composite PG16/RTL/CI release gates are mandatory even if test debt accepted.

## §4 — Jeden krótki prompt identyczny dla 13 wątków

WEB-005 — START FALI R19

Otwórz dokument centralny:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md

Przeczytaj §0–§2, rozpoznaj Axx na podstawie roli tego wątku, wykonaj wyłącznie sekcję AGENT Axx zgodnie z GO/STOP. Zweryfikuj aktualne PR i SHA oraz niezależne QA R18. Opublikuj R19 artefakty i końcowy raport z bezpośrednim linkiem GitHub. Nie uruchamiaj SWARM-006 i nie scalaj PR-ów. Priorytet: domknąć źródłowy PR54, rozstrzygnąć prywatność PR53, zdobyć owner policy/disposition i finalną niezależną A60 bramkę handoffu.
