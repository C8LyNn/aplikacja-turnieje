# WEB-005 — FALA R13 — CENTRALNY DOKUMENT PROMPTÓW

**Wersja:** R13.1 — 2026-10-14 (Europe/Warsaw)  
**Projekt:** WEB-005 / aplikacja-turnieje  
**Koordynator lokalny:** A00 Implementation Lead, podporządkowany jednej globalnej Queen/HQ (Queen działa w osobnym projekcie)  
**Repozytorium:** \`C8LyNn/aplikacja-turnieje\`  
**Gałąź centralnych instrukcji:** \`chore/web-005/t000-wave1-control\`  
**Źródła wiążące:** \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`; \`docs/web-005/WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md\`, \`BACKLOG.md\`, \`DECISIONS.md\`, \`WEB-005_WAVE_R12_AGENT_PROMPTS.md\`, indywidualne R12 raporty, faktyczne GitHub PR i logs.  
**Stan wejściowy:** R12 zakończona przez wątki; WEB-005 nadal \`IN_PROGRESS\`; \`RELEASE_NO_GO\`; \`SWARM006_FINAL_HANDOFF_DEFERRED\`.

> **Jeden dokument dla całego roju, 13 sekcji agentów (A00–A120).** Każdy wątek odczytuje §0–§2, rozpoznaje tożsamość Axx z utrwalonej roli i wykonuje **wyłącznie sekcję AGENT Axx**. Nigdy nie przejmuj innego zadania ani slotu kodowego bez zgody A00.

## §0 — Wiążące zasady bezpieczeństwa, uprawnienia i evidence

1. **Przed pracą odczytaj aktualne dane GitHub**: base i HEAD SHA PR, zmienione pliki, CI, poprzednie raporty i swoje bieżące zadania. Tabela w §1 to punkt kontrolny, nie obietnica, że SHA pozostanie niezmienione. Nie implementuj ponownie PR #34–51.
2. **Evidence taxonomy**: \`SOURCE_CONFIRMED\` = fakt w kodzie; \`STATIC_INFERRED\` = konsekwencja wnioskowana; \`HYPOTHESIS\` = brak dowodu; \`PATCH_PROPOSED\` = draft patch istnieje; \`SOURCE_ACCEPTED\` = niezależny review na exact SHA; \`RUNTIME_VERIFIED\` = rzeczywiste wykonanie na exact SHA z command/env/exit; \`FAIL\`, \`BLOCKED\`, \`NOT_EXECUTED\`, \`POLICY_OPEN\`. Ukończenie fali agenta ≠ zakończenie zadania z runtime QA. Autorowe fixture ≠ PASS. Brak GitHub review event ≠ dowód, że nie ma osobnego podpisanego raportu, lecz bez raportu nie przypisuj akceptacji.
3. **Bez dodatkowych audytów WEB-004.** Pracuj na finalnym HANDOFF R2 i już zebranych źródłach. Nie dopisuj nowych findingów bez dowodu, nie zamieniaj wycofanych zgłoszeń w taski. Nie przepisuj historycznej A60 38-row matrix jako nowych PASS.
4. **Final-only SWARM-006:** WEB-005 kończy cały przyjęty backlog (naprawione lub jawnie rozstrzygnięte przez owner/HQ \`POLICY_OPEN/BLOCKED/WONT_FIX\`), następnie A00 uzyskuje zgodę na **JEDNO** finalne przekazanie do SWARM-006. A10 prowadzi wewnętrzny bufor P01–P18+; żadnego interim dispatch, integration branch, merge czy staging. SWARM-007 ma osobną odpowiedzialność za procesy/strukturę Google Drive, nie zakładaj automatycznego transferu plików.
5. **Twardy STOP:** brak merge/cherry-pick/rebase do release/main, wdrożenia, produkcyjnej SQL/DDL/migracji, Replit, staging/live, płatnych manual CI reruns bez owner GO, testów mutujących shared DB, tokenów/sekretów w logach i rzeczywistych backupów użytkowników. Każdy code lane dotyczy tylko izolowanej gałęzi z zatwierdzonego release source base i nowego DRAFT PR.
6. **R13 jest QA-FIRST.** A50 (test evidence) i A60 (independent QA) mają P0. Nie zwiększaj produkcji draft PR-ów bez walidacji. Maksymalnie 3 wąskie nowe code-only lanes: A100/T080-S2A — prywatny cache po wylogowaniu/odwołaniu sesji; A110/T110-UX046 — stale stage lifecycle modal; A120/T100-PR-B — świeżość prezentacji Round Robin. Wszystkie **CONDITIONAL GO**: naprawiaj wyłącznie source-confirmed gap, bez niezatwierdzonych zmian semantyki; gdy brak luki lub konflikt, \`NO PATCH / SOURCE_RECONCILED\` i raport. Nie wymyślaj PR.
7. **File ownership**: A100 izolowane auth/query-cache helpers (\`src/context/auth-context.tsx\`, \`src/hooks/use-tournament-auth.ts\`, \`src/lib/tournament-query-invalidation.ts\`) tylko jeśli potwierdzony zakres; A110 \`src/components/tournament-stages-panel.tsx\` i testy lifecycle; A120 \`src/pages/tournament-detail.tsx\` RR readback UI i testy. A120 nie dotyka PR43/50 (CSV/backup), A110 nie dotyka panelu A120, A100 nie wprowadza session TTL policy. Jeśli inne dotychczasowe PR-y zmieniają ten sam plik (np. PR43/#50 \`tournament-detail.tsx\`) — niezależna gałąź i zarejestrowany conflict; NIE integruj. Przy konflikcie między R13 code lanes, HOLD i powiadom A00.
8. **Owner/HQ POLICY OPEN:** terminal Swiss deny vs atomic reopen; SE actionable/max-generated pointer; Swiss/BYE/repeat policy; DE GF runner-up/3–N; Basket CAS status 409/412 and version token/legacy fallback; Backup V3 portable revisions/history/legacy; direct Revert public CAS strict rollout + completion-action ID read path; Steam 403 vs 503 absent secret; session TTL/token storage/rotation. **Nie wybieraj** żadnego wariantu milcząco. Minimalne bezpieczeństwo prywatnego cache jest dozwolone w ramach istniejącej semantyki logout/revocation, bez narzucania nowej polityki autoryzacji.
9. **Testy z prawdziwymi dowodami**: A50 uruchamia frontend-only testy na exact checkout + frozen deps tam, gdzie możliwe bez DB. PostgreSQL16 tylko przy potwierdzonej fizycznej izolacji disposable dedicated DB, jawny \`TEST_DATABASE_URL\` i \`TEST_DATABASE_SCHEMA=tm_test_*\`, pełne ograniczenie DROP/RESET, brak fallback do produkcji, explicit zgoda. Brak środowiska = \`BLOCKED/NOT_EXECUTED\`. Istniejące GitHub Actions z PG16 nie stanowią PASS patcha, którego test nie uruchomił się przez wcześniejszy Pack19 gate.
10. **Pack19 CI blocker**: osobne PR #46–51 bazują na release, gdzie \`qa/pack19/source-contract.test.mjs\` oczekuje starego \`readOnly:true\`; faktyczny Drizzle używa \`accessMode:"read only"\`. Poprawka kontraktu jest już w **PR #35**; NIE duplikować. Fail starego Pack19 w automatycznym CI nie jest dowodem target-feature FAIL, lecz uniemożliwia pełny native release PASS. Bez tworzenia composite SHA w WEB-005; przyszłą integrację wykonuje SWARM-006 po finalnym handoffie.
11. **Raport**: w swoim wątku przygotuj artefakt \`WEB-005_Axx_R13_HANDOFF.md\` (GitHub, jeśli masz uprawnienia, inaczej załącz dokładną treść), z \`TASK/GO/STOP, PR/BASE/HEAD_SHA, actual files, real tests+exit lub NOT_EXECUTED, A60 evidence, policy dependencies, file conflicts, next action, release no-go\`. Dokument wspólny nie jest polem do dopisywania wyników 13 agentów na bieżąco. Nie deklaruj pracy w tle.

## §1 — R12 closeout / wszystkie istniejące paczki do odświeżenia

**Source baseline:** \`release/tournament-ops-20261013-01\` HEAD \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**15 istniejących paczek R11:** 
P01 PR35 Pack19 \`7cb283aa82273a1e22daf9051a82311eef53760c\`;
P02 PR36 Pack20–26 \`85ad0b86136fc3491c9ef18663d9b01396179349\`;
P03 PR34 Steam \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\`;
P04 PR37 Proxy \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\`;
P05 PR38 migration ledger \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\`;
P06 PR39 MP1 Cancel/Restore \`16053ee132756ca05b6f2cd1f0cabae823905387\`;
P07 PR40 Pack17 \`9a8287271299a59fc9291b8d253299a8d109a35d\`;
P08 PR41 Backup B1 \`e847cb705296a48ab5c68ece96776cd0e0bbb417\`;
P09 PR42 Global Undo LIFO \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\`;
P10 PR43 CSV \`96a6068f69027574ac76e18d4d5a2c444b5a914a\`;
P11 PR44 Auth S1A \`2f0187b7242681c394c09058b5ef647667206bd6\`;
P12 PR45 RR reopen \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\`;
PR46 DELETE \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\`;
PR47 Presentation PR-A \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\`;
PR48 Backup B3A \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\`.

**NOWE R12 source patches (existing, DO NOT DUPLICATE):**

| PR | Author/Task | HEAD SHA | Source files | Evidence |
|---|---|---|---|---|
| **#49** | A100/T080-S1B-P | \`99298b81501c3e7764d653604923522a19b9f05c\` | \`routes/auth.ts\`, 17 authored PG tests | PATCH_PROPOSED, PG16 NOT_EXECUTED, A30/A60 QA pending |
| **#50** | A110/T110-UX045 | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | Scoped backup preview hook, dialog, \`tournament-detail.tsx\`, 10 authored RTL | PATCH_PROPOSED, RTL NOT_EXECUTED, A60 QA pending; conflicts PR43 same file |
| **#51** | A70/T040-HIST-PARSE | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | \`routes/tournaments.ts\`, revert integration tests | PATCH_PROPOSED, 17 authored PG tests NOT_EXECUTED, A60 QA pending; overlaps PR39/42/44/46 routes |

**State:** PR #34–51 = **18 internal draft candidates** currently open/unmerged. PR #32 release→main remains open; PR #33 competing Steam patch HOLD. **No integrated/composite SHA; no final QA acceptance.**

**Required final per-packet mapping:** A10 must reconcile P13–P18 against its latest R11/R12 rolling manifest and pin all exact blob checksums; don't invent package assignments if current registry differs.

## §2 — 13 agents, only assigned tasks, test-first plan

| Agent | R13 assignment | Mode |
|---|---|---|
| **A00** | R12 closeout, status matrix, QA bottleneck, owner policies, next closure gate | COORD |
| **A10** | Rolling internal P01–P18, dependencies/conflicts/checksums | DOCS READ ONLY |
| **A20** | T020/T021 ledger readiness/PG safe preflight | READ ONLY |
| **A30** | Steam/proxy, post-lock auth PR44/46/49 security peer | READ ONLY |
| **A40** | Pack19 old matcher vs PR35, Pack17 full-gate readiness | READ ONLY |
| **A50** | **P0** true per-SHA frontend + disposable PG16 test evidence | SAFE TEST EXECUTION |
| **A60** | **P0** independent exact-SHA QA P01–P18, priority #41–51 | STRICT READ ONLY |
| **A70** | QA handoff #51, design MP2B Direct Revert CAS | SOURCE ONLY |
| **A80** | terminal Swiss/SE/Swiss/DE owner policy; PR45 acceptance | SOURCE ONLY |
| **A90** | Backup B1/B3A QA, B2 history and portability owner decision | SOURCE ONLY |
| **A100** | S2A private cache invalidation on logout/revocation | **CONDITIONAL CODE GO L1** |
| **A110** | UX046 stale stage-lifecycle modal guard | **CONDITIONAL CODE GO L2** |
| **A120** | F058 Round Robin standings freshness/refetch | **CONDITIONAL CODE GO L3** |

**No new Backend SQL migrations, Undo/API CAS or sport rules code in R13 before independent QA and relevant policy.** The conditional 3 frontend lanes are aimed at low-overlap source-confirmed read/UI safety only; if any proves unsupported or conflicts, stop the patch and focus on test evidence. A00 may issue a later separately documented plan only after QA evidence, not by automatically reallocating slots.

---

## AGENT A00 — WEB-005 Implementation Lead R13

**TASK:** \`WEB-005-T000-A00-R13\` | **MODE:** COORDINATION / NO CODE MERGE.

1. Check R12 exact new PR49/50/51 heads and summarize them as PATCH_PROPOSED, not tests passed; collect all available R12 agent reports and reconcile \`BACKLOG.md\` and \`DECISIONS.md\`.
2. Confirm 18 open draft candidates; assign priority and identify independent reviewer/real-test deficits rather than simply counting commits.
3. Give conditional limited GO for A100 S2A, A110 UX046, A120 F058 only as defined here; if no source bug, owner policy or file collisions, those agents report \`HOLD/NO_PATCH\`. Max 3 lanes.
4. Prioritize independent A60 reviews and A50 actual command/exit verification. If real PG16 cannot be reached, publish one executable physical environment dependency and stop asserting runtime readiness; protect against destructive shared DB use.
5. Present **owner/HQ policy decision packet** with exact alternatives: terminal Swiss TS-A vs TS-B, Basket CAS D1–D6 409/412/version, Backup B2 portable revision/legacy, Direct Revert expected match revision + completion action ID/Host rollout, sport SE/Swiss/DE; ask for decisions when needed, no choosing silently.
6. Build closure ledger for every WEB-004 R2 finding: code patch, exact SHA, independent source/runtime evidence, unresolved policy and documented disposition. Separate \`DONE_PATCH\` from \`DONE_TASK\`.
7. Keep all packages internal; no SWARM-006 transmission until WEB-005 formally completed and owner/HQ authorizes single final handoff. The future integration/merge/conflict resolution belongs to SWARM-006.
8. End R13 with a decision whether more implementation is truly warranted or a concentrated test/acceptance gate is now optimal.

**DELIVERABLE:** \`WEB-005_A00_R13_COORDINATION.md\`, updated ledger, owner policy queue and next wave decision.  
**STOP:** no merge, composite SHA, DDL, production, SWARM-006.

## AGENT A10 — Internal P01–P18 manifests and dependencies

**TASK:** \`WEB-005-T018-A10-R8\` | **MODE:** READ-ONLY/ARTIFACT DOCS.

1. Reuse R11/R12 internal package manifest, not regenerate from memory. Pin actual PR49/50/51 HEAD, blob SHA256, changed files, ancestry, test evidence, rollback and (only if verified) P16/P17/P18 mapping.
2. Recheck PR34–48 relevant HEAD and package provenance. Track overlaps: PR39/42/44/46/51 \`routes/tournaments.ts\`; PR43/50 \`tournament-detail.tsx\`; PR41/48 \`backup-v3.ts\`; PR47/new F058; auth helper dependencies PR44/46/49.
3. Compute dependency graph and future SWARM-006 safe merge ordering as **non-executed plan only**, not a composite branch or pre-merge.
4. Keep \`SOURCE_READY\`, \`SOURCE_ACCEPTED\`, \`QA_ACCEPTED\`, \`RUNTIME_VERIFIED\` flags separate; do not convert author's 17/10 test definitions into pass.
5. Add future R13 code lanes to manifest only when real PR+exact SHA exists. No fictitious P19+.
6. Document SWARM-007 provenance fields/Google Drive attachment protocol as requirements, not claimed actions. Do not send packages to SWARM-006.
7. A00 receives one consolidated internal status matrix, remaining signoffs list, exact expected receipts and rollback.

**DELIVERABLE:** \`WEB-005_A10_R13_INTERNAL_MANIFEST.md\` + structured P01–P18+ evidence.

## AGENT A20 — Historical migrations / database readiness

**TASK:** \`WEB-005-T020-T021-A20-R8\` | **MODE:** SOURCE-ONLY / QA SUPPORT.

1. Verify PR #38 HEAD, migration ledger 0030/0031 collisions, checksum graph, REVIEW_ONLY / ready_for_sql:false. No adoption/migration GO.
2. Correlate A50 isolation prerequisite with actual reset behavior in test DB; propose safe preflight of dedicated PostgreSQL16 and expected current release schema including 0027–0031 without writing SQL to production.
3. A90 B1/B3A and A70 MP2A/Hist need schema/test fixture; identify missing relations/history but do not edit their code.
4. Prepare negative tests for missing ledger, orphan checksum, wrong branch historic application and incompatible schema; running them only if A50 has safe physical instance.
5. Deliver to A50 commands and A60 source evidence/explicit not-run status; do not transform synthetic 37/37 into PG16 verification.

**DELIVERABLE:** \`WEB-005_A20_R13_PG_LEDGER_GATE.md\`. **STOP:** any SQL migration/DDL, shared DB.

## AGENT A30 — Security peer review and session/privacy acceptance

**TASK:** \`WEB-005-T030-T031-A30-R11\` | **MODE:** READ-ONLY SECURITY.

1. Recheck PR #34 Steam 3 writes, PR #37 proxy CIDRs/XFF, and PR44/#46/#49 post-lock organizer/support revocation across routes. Confirm authors' scope vs missing other endpoints, exact HEAD and no secret logging.
2. For PR #49, review four auth routes, post-lock organizer proof and 17 authored PG tests; enforce 403/zero-write, valid authorized positives, no races or changed token wire semantics. No source patch by A30.
3. For new A100 S2A, review privacy cache on logout/token invalidation, late in-flight authorized responses, 401/403 handling; ensure no cross-tournament private result persists and no browser storage leaks.
4. Propose A50 executable test cases, A60 independent threat matrix. Separate real exploit reproduction from static inference; do not invent security PASS.
5. Support owner policy queue (TTL/digest/status codes/Steam 403 vs503) without selecting a new behavior.

**DELIVERABLE:** \`WEB-005_A30_R13_SECURITY_REVIEW.md\`. **STOP:** no code, no prod.

## AGENT A40 — Pack19/17 CI gate evidence and recovery contract

**TASK:** \`WEB-005-T010-T017-A40-R13\` | **MODE:** SOURCE-ONLY/TEST CONTRACT.

1. Verify PR35 existing Pack19 corrected matcher, actual release old matcher and CI failure logs on PR46–51: \`/isolationLevel:"repeatable read",readOnly:true/\` vs code \`accessMode:"read only"\`. Do not create duplicate Pack19 fix; inspect source semantics to avoid weakening checks.
2. Verify PR40 Pack17 fail-closed gates/author's synthetic suite; \`--full\` not automatically passed without physical isolated PG16 and all Pack19–26/frontend/codegen checks.
3. Present safe **per-SHA** targeted test invocation plan: frontend isolated RTL PR43/47/50 and backend PG16 PR41/42/44/45/46/48/49/51; do not claim independent composed/release gate or silently skip required final gates.
4. If actual independent PR CI now differs, cite job logs and exit, not an old remembered state. Distinguish baseline CI obstruction from new code compile/behavior failures.
5. Deliver A50/A60 executable commands, TAP strict positive/negative expectations, and blocker list. No billable manual reruns, no extra CI source patch without A00 specific GO.

**DELIVERABLE:** \`WEB-005_A40_R13_CI_GATE.md\`.

## AGENT A50 — P0 runtime QA infrastructure / executed test evidence

**TASK:** \`WEB-005-T133-A50-R8\` | **MODE:** TEST-ONLY, SAFE EXECUTION.

1. **First concrete action:** establish which exact complete repo/Node22/pnpm10 checkout, locked workspace, and disposable dedicated PG16 are physically accessible to this agent. If none, do not spend wave inventing another abstract harness; give owner a minimal executable test setup packet with explicit blockers.
2. **Frontend first** where feasible without DB: exact SHA PR43 CSV RTL, PR47 DE/overlay/format, PR50 backup preview hook/dialog; test typecheck/build, complete frontend regression when time permits. Capture real command, SHA, exit code, skipped counts and artifacts.
3. **PG16** only after verified dedicated test-only DB, schema tm_test_* and explicit reset consent: exact SHA targeted integration for PR39 Cancel/Restore, PR41 B1 clone, PR42 LIFO race, PR44 bans/picks, PR45 RR roster, PR46 DELETE, PR48 MVCC exporter, PR49 password/visibility, PR51 malformed Undo history. Include valid positives and no-write negatives. No production data or shared DB.
4. Test PR35 Pack19 matcher correction and PR40 full Pack17; distinguish old CI fail on standalone branches from new feature source, never label fail as app runtime PASS.
5. If new R13 A100/A110/A120 PRs exist, run their targeted frontend suites on exact heads and sanity check privacy/semantic behavior.
6. A60 receives independently rerunnable commands/exits and sanitized logs. A10 gets immutable manifest. Any not-executed tests marked BLOCKED with precise missing infrastructure.
7. Avoid adding custom CI that weakens baseline required gates; do not run manual paid GitHub Actions or integrate multiple PRs into a composite checkout under WEB-005.

**DELIVERABLE:** \`WEB-005_A50_R13_EXECUTION_RESULTS.md\` + matrix with exact SHA/env/command/exit. **STOP:** unsafe DB, fake PASS.

## AGENT A60 — P0 independent QA on existing and new code

**TASK:** \`WEB-005-T130-A60-R13\` | **MODE:** STRICT READ-ONLY / INDEPENDENT.

1. Pin all P01–P18 exact current HEAD and document any missing source/evidence as PENDING, not PASS.
2. Prioritize newly created R12 PR #49 post-lock auth, #50 scoped Backup FileReader+passwords, #51 malformed Undo typed 409/zero writes. Read actual diff and test definitions, author reports; A30 peer for security, A50 runtime needed.
3. Confirm #41 B1 QP/QPE/OP parity, #42 global Undo LIFO, #43 CSV, #44 auth, #45 RR, #46 DELETE, #47 presentation, #48 B3A single MVCC tx at exact SHA with source acceptance separately from runtime; don't pretend all are fully verified.
4. Treat 3 external Pack19 CI failures in original WEB-004 QA separately from new PR negative evidence, preserve 38 original rows (0 PASS, 3 external FAIL, 33 BLOCKED, 2 NOT_RUN), never import earlier 29-row draft as final.
5. For new frontend PRs R13 review source, guarded late responses, actual allowed UI functionality, cache isolation, stage modal stale data, RR view freshness, independent React tests if executed. Check no invented policy.
6. Deliver prioritized blockers: critical security/integrity, policy signature needed, physical test unavailability, source-only regression, QA acceptance conditions; \`SOURCE_ACCEPTED\` only on signed exact SHA.
7. No code writes, no self-certification, merge or production gate.

**DELIVERABLE:** \`WEB-005_A60_R13_INDEPENDENT_QA.md\`, P01–P18(+new) verdict matrix.

## AGENT A70 — Undo history PR #51 QA + direct Revert CAS design

**TASK:** \`WEB-005-T040-A70-R13\` | **MODE:** SOURCE ONLY.

1. Frozen PR51 exact HEAD recheck, give A50/A60 full negative 17 case targets: malformed JSON/array/foreign ID, controlled 409/zero writes, positive history. No rerun source patch.
2. Recheck PR39 MP1 and PR42 MP2A dependencies and overlapping \`routes/tournaments.ts\`, preserve external merge ownership.
3. Update MP2B direct public Revert CAS source contract **without code**: expectedMatchRevision plus active completion action ID, 422 malformed/missing, 409 stale/ABA + no writes; Host generated OpenAPI/Zod/React client parity; old Host tabs rollout and missing completion ID discovery >50 action log entries require explicit owner policy.
4. Separate malformed result_history match provenance/Backup V3 B2 from Undo route; coordinate with A90 to avoid duplicate work.
5. Prioritize A60 exact-SHA review and owner decision before future MP2B code-lane. Do not autonomously change API wire semantics.
6. Report readiness and next one small authorized patch once owner signs.

**DELIVERABLE:** \`WEB-005_A70_R13_MP2B_SOURCE_GATE.md\`. **STOP:** no Undo source edits.

## AGENT A80 — Terminal Swiss / sport policy and PR45 acceptance

**TASK:** \`WEB-005-T050-T051-A80-R6\` | **MODE:** SOURCE ONLY.

1. Recheck PR45 RR roster changes/PG fixture and A60/A50 pending status; do not duplicate the source fix.
2. Submit concise **POLICY-TERMINAL-SWISS** alternatives for owner signature: TS-A 409 no writes vs TS-B atomic reopen stage+tournament+winner+players with exact rollback. Don't choose.
3. Submit SE currentRound actionable vs generated; Swiss5/6 unavoidable rematches / BYE/NC priority; DE GF runner-up and 3–N placement decisions. Keep historical source bug/withdrawn/corrected distinctions.
4. Provide A50 deterministic PG fixture and expected outputs for signed choices; model-check is not app PASS.
5. Identify next single source patch that does not conflict with PR45 and PR42 after an approval and a free lane. No code in R13.

**DELIVERABLE:** \`WEB-005_A80_R13_POLICY_SIGNOFF_QUEUE.md\`.

## AGENT A90 — Backup B2 data integrity policy + B1/B3A QA

**TASK:** \`WEB-005-T060-A90-R6\` | **MODE:** SOURCE ONLY.

1. Recheck PR41 B1 and PR48 B3A current SHA, CI Pack19 cause, and exact A50/A60 real test evidence (if any).
2. B1: positive legacy approved+route import, invalid 12 fixture rejections, late rollback all clone tables; B3A: single read-only REPEATABLE READ tx and two-connection barrier. New source patches remain separate until SWARM-006 integration.
3. For B2 propose minimal invariants: completed match tuple ↔ latest result_history, action_log valid referents, remapped undoPayload IDs, revision semantics (history revision vs match state revision), active completion provenance; distinguish safe static checks from legacy-compatibility decisions requiring owner signoff.
4. Give A00 owner-facing brief for Backup portability/legacy revisions and missing history compatibility; do NOT select strict rejection for older backups silently.
5. Prepare test-first B2 future one-patch design after policy, no code in R13. A20 ledger and A70 Undo dependencies explicit.

**DELIVERABLE:** \`WEB-005_A90_R13_B2_OWNER_POLICY_AND_QA.md\`. **STOP:** no V3 code, SQL or merge.

## AGENT A100 — T080-S2A private cache isolation after auth invalidation (CONDITIONAL CODE L1)

**TASK:** \`WEB-005-T080-A100-S2A-R13\` | **PRIORITY:** P1 privacy/security | **MODE:** **GO NARROW SOURCE-CODE ONLY IF SOURCE GAP CONFIRMED.**

1. Inspect the existing auth context and React Query cache linkage (\`src/context/auth-context.tsx\`, \`src/hooks/use-tournament-auth.ts\`, \`src/lib/tournament-query-invalidation.ts\`) and R12 SEC-022 = UX-030 common root. Validate whether explicit logout/removed per-tournament credential, 401/403 after previously authorized read, and A→B token change currently leave private data visible from a stale cached authorized result.
2. Construct test-first deterministic React Query scenarios: private tournament A loaded under token A, logout/revoke/403/route to B occurs, stale in-flight A read resolves, assert **no private A data visible from its previous auth context**, no reuse of privileged A query result under B, legal public/authorized B view still works. Do not claim prior runtime exploit without reproduction.
3. Implement minimal auth-identity-bound query invalidation/cancel/remove with keyed tournament caches and generation guard, preserving existing legal sessions, public GET, correct token storage, and no global cache purge of unrelated public tournaments. Ensure late in-flight response cannot refill private visible cache after revocation.
4. No changes to session TTL, support token hashing/rotation model, backend auth policies, new errors or broad router rewrite. When exact cache invalidation policy is ambiguous, retain fail-closed no-display on explicit revocation and escalate any additional behavior to A00, not guess.
5. Exclusive R13 own helper/auth files; no overlap with A110 stage panel or A120 tournament-detail. If safe solution requires \`tournament-detail.tsx\` hunk also owned A120, HOLD portion and propose owner-window; do not edit concurrently.
6. If no bug exists or source already clear, return \`SOURCE_RECONCILED/NO_PR\`; otherwise isolated release branch and small draft PR only. Real RTL/typecheck if environment available else NOT_EXECUTED. A30 peer, A50 runtime, A60 independent exact-SHA QA.
7. Prior PR44/46/49 remain frozen and unmerged; this is S2 frontend only, not post-lock mutation patch.

**DELIVERABLE:** \`WEB-005_A100_R13_T080_S2A_PATCH_OR_HOLD.md\`, PR if actual source gap and safe. **STOP:** unauthorized session policy/backend/edit overlap.

## AGENT A110 — T110 UX046 stale stage lifecycle modal (CONDITIONAL CODE L2)

**TASK:** \`WEB-005-T110-A110-UX046-R13\` | **PRIORITY:** P1 | **MODE:** **GO NARROW SOURCE-CODE ONLY IF SOURCE GAP CONFIRMED.**

1. Inspect current stage lifecycle start/complete dialogs in \`src/components/tournament-stages-panel.tsx\`, relevant stage detail read query and R12 UX046 finding. When opened for planned/active stage V0, changes in parent stage/tournament or its status must invalidate dialog confirmation without allowing a stale local snapshot to drive UX.
2. Test-first: dialog opened on stage A, another change updates A status or stage list/tournament route, stale old dialog confirmation attempted -> UI **does not submit stale action without refreshing eligibility**; shows controlled feedback, user can reopen on current stage. Valid unchanged stage action still submits and backend remains ultimate authority.
3. Minimal modal identity/status/version invalidation or refetch-on-confirm; do not fabricate a new backend CAS or error status, no restart of existing stage lifecycle operation. Use already available stage identity/status/versions; if stage.version not exposed, avoid invented field and require fresh read before presenting confirmation.
4. **File owner:** stage panel + focused RTL. Do not touch \`tournament-detail.tsx\` (A120 R13), \`revert-match.ts\`, or PR45. Source-only gap must be confirmed; if already protected, \`NO_PR\`.
5. Separate release-based branch, small test-first draft PR if viable. Real RTL/typecheck only when available; otherwise NOT_EXECUTED. A50 and A60 review exact SHA, A80 checks lifecycle semantics.
6. Keep Basket CAS T055, Host dirty navigation UX044 and Backup UX045 PR50 separate; no new product policy.

**DELIVERABLE:** \`WEB-005_A110_R13_T110_UX046_PATCH_OR_HOLD.md\`. **STOP:** no backend rule change or shared file edit.

## AGENT A120 — T100 PR-B Round Robin presentation freshness (CONDITIONAL CODE L3)

**TASK:** \`WEB-005-T100-A120-PR-B-R13\` | **PRIORITY:** P2/P1 stale UI | **MODE:** **GO NARROW SOURCE-CODE ONLY IF SOURCE GAP CONFIRMED.**

1. Freeze PR47 PR-A DE Details/labels/completed overlay. Inspect R12 F058: after external RR stage result/reopen change, organizer/public RR details/standings can remain stale despite canonical server state.
2. Reuse existing React Query canonical GET standings/matches/stages, invalidate or refetch on RR stage/tournament lifecycle change; no client-side synthetic RR ranking. Ensure active page updates when another browser/host changes results, including late stale response ordering.
3. Test-first: A RR standings shown at version/snapshot N, external match updates to N+1 or terminal RR reopened, later page refetch reflects server N+1, no older N re-overwrite. Unauthorized 401/403 must not leave private cached standings visible. Keep SE/DE unaffected.
4. **File owner:** \`src/pages/tournament-detail.tsx\` RR UI readback only + minimal tests; backend not touched. PR43 CSV and PR50 Backup both modify that file on separate draft branches; record collision but do not merge/cherry-pick/rewrite them. Do not edit A100 auth helpers or A110 stage panel.
5. If existing refetchInterval/query keys already guarantee required UI freshness and deterministic tests pass, report \`SOURCE_RECONCILED/NO_NEW_PR\` instead of an unnecessary patch. Source bug verified + safe correction => isolated draft PR.
6. Coordinate private-cache safety with A100; if fixing F058 needs auth-context changes, HOLD and ask A00 for file sequencing. Real RTL/browser tests if available otherwise NOT_EXECUTED. A60 independent exact HEAD QA.
7. Champion F054 fixed on release remains retest only; do not reimplement PR47 or broaden to sport rules.

**DELIVERABLE:** \`WEB-005_A120_R13_T100_PR_B_PATCH_OR_HOLD.md\`. **STOP:** no wide UI redesign or release/merge.

---

## §3 — Koniec fali i kryteria decyzji o następnej

Po R13 A00 otrzymuje 13 agent-specific reports. **DoD fali** = wykonanie przydzielonego zakresu z uczciwym evidence, a nie automatyczne QA_ACCEPTED każdej paczki. W raporcie A00 powinny widnieć odrębne liczniki:

- \`PATCH_PROPOSED\` na niezintegrowanym SHA,
- \`SOURCE_ACCEPTED\` przez A60 na exact SHA,
- \`RUNTIME_VERIFIED\` przez rzeczywiste komendy A50 / bezpieczne środowisko,
- \`POLICY_OPEN/BLOCKED\` z właścicielem decyzji.

Żaden agent nie deklaruje WEB-005 zakończonym na podstawie samej liczby PR. Bez faktycznych testów aplikacji oraz rozliczenia całego HANDOFF R2 **SWARM-006 nadal HOLD**. Finalny pakiet/przekazanie należy dopiero do kolejnego formalnego punktu decyzyjnego 00+owner/HQ.

## §4 — Jedyny krótki prompt dla wszystkich wątków

WEB-005 — START FALI R13

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R13_AGENT_PROMPTS.md

1. Odczytaj zasady wspólne §0–§2.
2. Rozpoznaj swój identyfikator Axx zgodnie z rolą wątku.
3. Otwórz sekcję AGENT Axx i wykonaj tylko swoje zadania w podanym trybie GO/STOP.
4. Zweryfikuj aktualne PR-y, SHA i dokumenty źródłowe.
5. Przygotuj wskazane artefakty oraz końcowy raport R13 dla 00.
6. Nie przejmuj zadań innych agentów i nie uruchamiaj SWARM-006.
