# WEB-005 — WAVE R21 — OWNER SIGNOFF & SINGLE FINAL HANDOFF READINESS

**Version:** R21.1 · 2026-10-14 · Europe/Warsaw
**Project:** WEB-005 / C8LyNn/aplikacja-turnieje
**Coordinator:** A00 Implementation Lead under a single external Queen/HQ.
**Central control branch:** chore/web-005/t000-wave1-control
**Binding sources:** WEB-004 final HANDOFF R2, WEB-005 WAVE R20 master, R20 direct reports A10/A30/A50/A60/A70/A80/A90/A110/A100/A120, BACKLOG, DECISIONS.
**Owner decision document:** [WEB-005_R21_OWNER_DECISION_PACKET.md](./WEB-005_R21_OWNER_DECISION_PACKET.md). This is **DRAFT FOR OWNER DECISION**, not a signed policy.
**Opening status:** R20 agents reported complete; 21 OPEN DRAFT PRs (#34–54), 0 merged, 0 integrated SHA. A60 R20 independently source-accepted new PR53 *scoped* and new PR54 *conditional*, and still issued HANDOFF_NOT_READY. A50 R20 recorded 0 native application tests. A10 R20 identified 29 secondary historical IDs, 9 unavailable original IDs and no 38-row signed disposition. Owner policies unsigned. **WEB-005 IN_PROGRESS / SWARM-006 HOLD / RELEASE NO-GO.**

## §0 — Shared execution contract / hard boundaries

1. Read §0–§2, identify your Axx from the assigned thread role, execute only AGENT Axx. Local A00 is not an independent Queen. Report changed/no-change using exact SHA and a direct GitHub link. Do not treat the end of a wave as automatic acceptance.
2. **R21 is a one-time OWNER DECISION INTAKE + FINAL GATE REVIEW, not another source-patch production wave. ZERO new code GO.** There is no GO to edit existing application PRs, create new PR, cherry-pick, merge, rebase, create WEB-005 composite branch, stage/deploy/live, or call SWARM-006. If owner/HQ approves a policy requiring code, A00 writes a separate future exact-file/source-code GO only after verifying the decision and QA boundary. No ghost implementation.
3. **A60 R20 was recovered and is now authoritative for exact R19 revisions** at time of readback, located at [R20 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md). Do NOT describe PR53/PR54 as lacking all independent QA anymore:
   - P20 PR53 at d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34: SOURCE_ACCEPTED_SCOPED (legacy rebind isolation; old ownerless raw cache retention POLICY_OPEN).
   - P21 PR54 at bfa9d075b431185aa8bbf87bf021d64dde8ae22f: SOURCE_ACCEPTED_CONDITIONAL (RR parent/selected-child guard; PR47 merge-dependent DE presentation).
   - P08 PR41 at f03cf3d09988a04ba9c2856e205d21f994ff67f1 and P09 PR42 at 021bed269f9ea8ac8ce53caeea44263c098aa2dd: unchanged SOURCE_ACCEPTED_CONDITIONAL, native PG16 needed.
   - 17 other source candidates carry their verified unchanged-source verdicts from R18/R20 matrix, not full application QA. Recheck HEAD before using.
4. **No APP runtime PASS:** A50 R20 [receipt](./agent-reports/A50/WEB-005_A50_R20_RECEIPT.md) confirms no trustworthy connected full monorepo checkout with pnpm10/frozen deps and no owner-approved isolated PG16. Only actual per-SHA executable commands with exit/TAP qualify. GitHub CI stopped at old Pack19 release matcher already corrected in draft PR35; no automatic Pack17 full pass.
5. **Original 38-case provenance:** authentic WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv (38 rows, 16 columns, BOM) was not available to A10 R20 despite searches. Secondary R9 mapping identifies 29 named historical case IDs, remaining 9 are SOURCE_ID_NOT_AVAILABLE. 38 historical aggregate = 0 PASS, 3 external-CI FAIL, 33 BLOCKED, 2 NOT_RUN. Missing original IDs cannot be invented or silently marked WONT_FIX. Do not ask WEB-004 for a new audit: retrieve the already existing artifact if user supplies it, or record explicit owner-approved provenance exception without fictional row content.
6. **Owner decisions are blocking, not administrative decoration:** T055 Basket CAS D1–D6, Swiss/SE/DE 6 sport decisions, Backup B2 D1–D6, public Direct Revert MP2B A/B/C, Steam 403/503, session TTL/digest/rotation, legacy raw cache retention, 38-source recovery/exceptions and physical executor vs runtime-debt transfer. All choices and tradeoffs are in the **single R21 owner decision packet**. Silence, past agent recommendation or a blank checkbox is **UNSIGNED**. If owner explicitly defers, record accepted residual risk, named accountable owner, impact on release, review trigger/date and independent QA; a blanket waiver that conceals confirmed critical source defects is not allowed.
7. **Test safety:** React source-runtime only with actual authorized full clean per-SHA Git checkout, Node22/pnpm10 and frozen dependencies. PostgreSQL16 only separately physically isolated dedicated disposable test-only database, strict TEST_DATABASE_URL (never production fallback), tm_test_* schema and written reset-scope approval from owner and A20. No destructive SQL on shared/prod, no real user backups, secrets or unapproved paid CI.
8. **Final-only mandate:** WEB-005 must finish the approved WEB-004 handoff remediation (source fixed or specific accepted owner disposition) and obtain A60 independent readiness plus 21-packet A10 manifest before **ONE** owner/HQ-authorized final SWARM-006 dispatch. There is no need to merge all 21 PRs in WEB-005: SWARM-006 later handles integration, conflict resolution, composite regression, staging/live gates. If application runtime remains unavailable, separate explicit HANDOFF_WITH_RUNTIME_TEST_DEBT may only be granted **after** source/case/policy closure and enforces a hard SWARM-006 release STOP until genuine tests pass. No implicit waiver.
9. **Important process change:** R21 must NOT regenerate the same unsigned agent policy packets as if new progress were made. A00 collects actual owner-signed choices or marks exact fields WAIT_OWNER. Agents update only on new evidence, can report NO_NEW_EVIDENCE without creating long duplicate documents. If no owner answers, A00 reports WAIT_OWNER and suspends further speculative waves; user/HQ action is prerequisite.
10. Each assigned agent writes a concise WEB-005_Axx_R21_HANDOFF.md under docs/web-005/agent-reports/Axx on docs branch or own docs-only branch, linking source PR HEAD, R20 report, signed owner decision URL (or null), runtime command+exit (or NOT_EXECUTED), exact next unblocker. If publication inaccessible, PUBLICATION_BLOCKED plus full report in thread. No edits of another agent's app source, no claiming A60 independent QA by an author.

## §1 — R20 base, handoff prerequisites and owner action

**Repo release baseline:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7. PR #34–54 all open draft and unmerged. No merged candidate SHA. Key pins after R20 (recheck):
- P08 PR41 = f03cf3d09988a04ba9c2856e205d21f994ff67f1, A60 SOURCE_ACCEPTED_CONDITIONAL, PG16 blocked.
- P09 PR42 = 021bed269f9ea8ac8ce53caeea44263c098aa2dd, A60 SOURCE_ACCEPTED_CONDITIONAL, PG16 lock/race blocked.
- P20 PR53 = d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34, A60 SOURCE_ACCEPTED_SCOPED, old raw orphan policy open and RTL blocked.
- P21 PR54 = bfa9d075b431185aa8bbf87bf021d64dde8ae22f, A60 SOURCE_ACCEPTED_CONDITIONAL, PR47 child semantic integration and RTL blocked.
- [A10 R20 original 38-case/21-PR registry](./agent-reports/A10/WEB-005_A10_R20_38_CASES_FINAL_ONLY.md): 29 secondary IDs; 9 original IDs missing; signed case dispositions null.
- [A50 R20 native executor receipt](./agent-reports/A50/WEB-005_A50_R20_RECEIPT.md): 0 app tests; need connected full checkout + pnpm; separately dedicated PG16/reset signature.
- [A60 R20 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md): HANDOFF_NOT_READY.

**Single owner decision packet:** [WEB-005_R21_OWNER_DECISION_PACKET.md](./WEB-005_R21_OWNER_DECISION_PACKET.md). User/HQ may respond directly with explicit option selections or upload/locate original CSV. No agent may fill missing choices.

## §2 — R21 agents / no application-code slots

| Agent | One-time R21 job | Authorization |
|---|---|---|
| A00 | Collect owner/HQ answers + A60 gate and publish hold/GO request | COORD |
| A10 | Check original WEB-004 CSV if provided; manifest+signed cases, no fabricated nine | DOCS |
| A20 | Execute only nonmutating physical DB preflight if owner-provided test host exists | SOURCE/SAFE |
| A30 | New owner policy for legacy raw cache + Steam/session, no repeated source audit | READ ONLY |
| A40 | Exact test gate/runbook frozen; revise only if real new CI evidence | READ ONLY |
| A50 | Execute native exact-SHA tests only after owner grants real environment, else one blocker | SAFE TEST |
| A60 | Apply R20 existing source verdict, validate signed policies/cases and issue final gate | STRICT QA |
| A70 | Receive MP2B owner choice; convert signed choice into scoped next-code request, no code | SOURCE |
| A80 | Receive six sport decisions; map to tests/future fixes, no code | SOURCE |
| A90 | Receive six Backup B2 decisions; compatibility/future fix plan, no code | SOURCE |
| A100 | Receive old raw cache erasure/retention owner choice; no code | SOURCE |
| A110 | Receive six Basket CAS decisions and UX044; map to future patch scope, no code | SOURCE |
| A120 | Document PR47+PR54 test/integration handoff; no code | SOURCE |

---

## AGENT A00 — R21 OWNER DECISION INTAKE / LOCAL COORDINATOR

1. Verify A60 R20 source acceptance and final HANDOFF_NOT_READY at direct GitHub URL; cease repeated requests for PR53/54 R19 QA.
2. Send the **single owner decision packet** to actual project owner/HQ. Obtain written option/signature or precise signed defer for Basket D1–D6, Sport S1–S6, Backup B1–B6, Revert RA/RB/RC, Steam/session, raw cache, original 38 source and executor route. No invented owner preferences.
3. If authentic WEB-004 A60 R2 CSV becomes accessible, A10 maps true 38 IDs to signed finding dispositions; if missing record exact owner request or signed narrowly bounded provenance exception, never 38 fictional cases.
4. If owner provides test shell and PG16 approvals, ask A50 for actual test receipts. If not, document EXEC-B as a possible *future* separate explicit owner authorization after source/policy closure. Do not waive native runtime yourself.
5. Once decisions are signed, identify necessary missing code work (T055, sport, Backup B2, MP2B) and seek separate narrow future GO on own branch; do not claim those policy-dependent features were already implemented.
6. Publish FINAL_HANDOFF_NOT_READY_WITH_OWNER_ACTIONS, or if truly all source/owner/case gates pass, produce **FINAL_HANDOFF_GO_REQUEST only**; do not activate SWARM-006.

**Deliver:** WEB-005_A00_R21_OWNER_DECISION_GATE.md and updated real DECISIONS ledger only for authenticated owner directives.

## AGENT A10 — R21 registry and authentic history gate

1. Freeze 21-packet exact-SHA manifest unless actual drift. Keep 96 file digest records and collision DAG (PR39/42/44/46/51; PR41/48; PR43/50/54; PR47/54; CI PR35/36/40; PR38 ledger REVIEW_ONLY; PR33 competing Steam HOLD).
2. If owner supplies canonical WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv, verify authentic 38 rows and map original IDs, severity, historic status → task/PR/QA/owner decision with one signed disposition per accepted finding.
3. If owner does not supply it, preserve 29 secondary names + 9 unknown and list source missing; do not search identical sources repeatedly, do not fabricate decisions.
4. Refresh machine registry URLs for A60 R20 verdict and real owner policy/case signatures only. No final SWARM-006 package transmission yet.

**Deliver:** WEB-005_A10_R21_FINAL_ONLY_MANIFEST_GATE.md / updated JSON only if new evidence.

## AGENT A20 — PG16 only if owner-provided physical test host

1. Confirm PR38 remains offline REVIEW_ONLY. No migration adoption/DDL.
2. With explicit owner-provided dedicated disposable test-only PG16, perform only safe nonmutating identity/isolation preflight, document separate required written DROP/RESET consent; without access report ENV_BLOCKED in one paragraph.
3. Send A50 bounded PG16 commands for PR41/42/39/44/45/46/48/49/51 and STOP on wrong host/schema.

**Deliver:** WEB-005_A20_R21_PG16_OWNER_GATE.md.

## AGENT A30 — security policy receipt only

1. Retain prior exact-SHA PR53 scoped source peer and A60 R20 acceptance; don't invent observed production disclosure.
2. Obtain owner choice raw ownerless cache retention vs full owner-safe erasure, and Steam absent-secret 403/503; session TTL/hash/rotation requires actual signed contract or deferral.
3. Only if new owner requirement materially changes risk, write a concise security impact / future scoped patch acceptance; no source edits.

**Deliver:** WEB-005_A30_R21_SECURITY_OWNER_DECISIONS.md.

## AGENT A40 — CI hard gate preserved

1. Freeze source Pack19 PR35, Pack20–26 PR36, Pack17 PR40 evidence; no duplicate code.
2. Provide A50 one executable per-SHA React/PG command list linked to actual scripts if owner attaches executor; no rerun paid CI or composite branch now.
3. Classify T017-QA-01 possible TAP parser risk only via existing independent A60 evidence and owner action; if no new evidence, mark unchanged.

**Deliver:** WEB-005_A40_R21_CI_GATE_CONFIRMATION.md.

## AGENT A50 — single real execution path

1. Check whether owner supplied a connected trusted machine/VM with full per-PR Git checkouts, Node22/pnpm10 frozen deps. If available with written test GO, run actual PR53/54 targeted RTL/typecheck first, then frontend PR43/47/50/52; command/exit/TAP per exact SHA.
2. Only after A20 and owner independently approve dedicated physically isolated PG16 and exact reset scope, run targeted PR41/42 and remaining backend positives/negatives/zero-write. Never use production fallback.
3. If inaccessible, report 0 actual tests and **one** concrete missing user action; no more PLAN-only harness runs counted as tests.

**Deliver:** WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md.

## AGENT A60 — final independent owner decision gate

1. Use your own R20 source verdict exactly: PR53 SOURCE_ACCEPTED_SCOPED and PR54 SOURCE_ACCEPTED_CONDITIONAL, unchanged PR41/42 scoped conditional. Do not repeat 21 unchanged full source reviews.
2. Inspect any genuine signed owner policy options/approved deferrals, authentic 38 historical case lineage, A10 mapping and A50 actual receipts. If decisions/code/case provenance still absent, record exactly which gate remains open.
3. Do not promote source-scoped verdict to QA_ACCEPTED_FULL, and do not call zero app runtime PASS. A signed deferral may carry risk but cannot certify unimplemented source fixes as correct.
4. Issue exact FINAL_HANDOFF readiness: NOT_READY, or conditional debt request only after accepted source+policy+case closure, or READY only if all evidence actually exists. No self-authorized SWARM-006 activation.

**Deliver:** WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md and compact 21-package gate update.

## AGENT A70 — receive Direct Revert policy

Consume the actual owner RA/RB/RC choice and wire/Host tokens, error 422/409, authorized match-specific completion ID; record future separate API/OpenAPI/React/Host patch if policy A/B or signed risk deferral C. Keep PR42 and PR39/51 frozen. No code, merge or Host rollout.

**Deliver:** WEB-005_A70_R21_MP2B_OWNER_RECEIPT.md.

## AGENT A80 — receive six sport policies

Consume owner S1–S6 explicit choices for terminal Swiss, SE pointer, Swiss rematch/BYE, DE GF/reset rankings. Record per-choice minimal future code/tests or signed deferral; do not assume option via model-checked fixture. Keep PR45 frozen and PG16 pending. No code.

**Deliver:** WEB-005_A80_R21_SPORT_OWNER_RECEIPTS.md.

## AGENT A90 — receive Backup B2 policies

Consume owner B1–B6 explicit decisions and compatibility matrix for old legal V3, revisions, action provenance and nested Undo IDs; record minimal future scoped implementation/test gate or signed deferral. Keep PR41/48 frozen, PG16 still required. No code.

**Deliver:** WEB-005_A90_R21_BACKUP_B2_RECEIPT.md.

## AGENT A100 — receive owner privacy residual choice

Retain PR53 unchanged source accepted scoped. If owner accepts old raw orphan retention until session end, record the exact residual risk and runtime tests required. If owner requires full erasure, define safe tenant-bound ownership/migration contract and ask future code GO — **no global cache purge without proof**. No code.

**Deliver:** WEB-005_A100_R21_LEGACY_CACHE_POLICY.md.

## AGENT A110 — receive Basket CAS D1–D6

Consume six actual owner choices or explicit named dispositions for revision token, wire, 409/412, legacy, stage/roster invalidation, draft reconciliation; separate Host UX044 decision. Translate to future test-first backend+frontend change request with exact code ownership only if owner signed; no implementation now.

**Deliver:** WEB-005_A110_R21_T055_OWNER_RECEIPT.md.

## AGENT A120 — integration acceptance handoff (no code)

Freeze PR54 bfa9d075b431185aa8bbf87bf021d64dde8ae22f and PR47 f09a13623faca8d7ab29b09a2c5b43907c2acd0b. Produce one future SWARM-006 read-only merge acceptance oracle for conflicting stage-progress-view.tsx RR denial vs DE graph, parent tournament-detail.tsx collision PR43/50/54, legal DE/Overview/RR401/403 and N→N+1 regression. No integration attempts or code.

**Deliver:** WEB-005_A120_R21_PRESENTATION_INTEGRATION_ORACLE.md.

---

## §3 — R21 end gate / no infinite reporting loop

A00 records actual owner decisions with accountable signatures and original artifact availability. If any required decision remains unsigned, state **WAIT_OWNER** with link to the single owner packet; do not launch another full swarm wave merely to rewrite unchanged unsigned alternatives. If signed policy requires source work, open only the minimal policy-approved next-code tasks. If all source/owner/38-case conditions satisfied, submit FINAL_HANDOFF_GO_REQUEST to owner/HQ, including separate explicit runtime-debt request when applicable. Only owner/HQ can authorize one actual SWARM-006 dispatch. SWARM-006 later integrates and executes complete composite QA and release gates, never merges via WEB-005.

## §4 — Common short prompt for all agents

WEB-005 — START FALI R21 (OWNER DECISION GATE)

Otwórz:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R21_AGENT_PROMPTS.md

Przeczytaj §§0–2, zidentyfikuj swoje Axx na podstawie roli wątku i wykonaj tylko sekcję AGENT Axx. Zastosuj niezależne QA A60 R20 i nie powtarzaj audytu 21 niezmienionych PR. Sprawdź, czy rzeczywisty owner/HQ podpisał decyzje z WEB-005_R21_OWNER_DECISION_PACKET.md; jeśli nie, zgłoś WAIT_OWNER. Opublikuj krótki końcowy raport R21 z linkiem do GitHub albo PUBLICATION_BLOCKED. Nie twórz kodu, nie wykonuj merge/release i nie uruchamiaj SWARM-006.
