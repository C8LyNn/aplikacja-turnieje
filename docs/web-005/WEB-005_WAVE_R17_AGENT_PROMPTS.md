# WEB-005 — WAVE R17 — CENTRALNE PROMPTY DLA WSZYSTKICH AGENTÓW

**Data:** 2026-10-14 (Europe/Warsaw) · **Wersja:** R17.1  
**Koordynator:** WEB-005/A00 Implementation Lead podległy jednej globalnej Queen/HQ (bez lokalnej Queen).  
**Repo:** \`C8LyNn/aplikacja-turnieje\` · **control docs:** \`chore/web-005/t000-wave1-control\`  
**Źródło:** \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`; \`BACKLOG.md\`, \`DECISIONS.md\`, \`WEB-005_WAVE_R16_AGENT_PROMPTS.md\`, R15 A50/A60 oryginalne raporty, bieżący GitHub.  
**Punkt kontrolny:** Właściciel zgłosił, że R16 została zakończona przez wątki. **Według odczytu GitHub po tym zgłoszeniu PR41, PR42 i PR53 nie zmieniły HEAD; nadal widocznych jest 21 OPEN DRAFT PR #34–54. W control-branch \`agent-reports/Axx\` nie odnaleziono plików R16; żadnych R16 dokumentacyjnych gałęzi nie znaleziono w pobranej liście gałęzi.** To \`R16_DELIVERY_NOT_YET_VERIFIED\`, nie dowód braku pracy w samych wątkach. Nie oznaczaj R16 patchy jako DONE ani FAIL bez raportów.

**Status globalny:** \`WEB005_IN_PROGRESS\`; \`SWARM006_FINAL_HANDOFF_DEFERRED\`; \`RELEASE_NO_GO\`. Dokument R17 jest jedynym wspólnym pakietem promptów i **nie** zezwala na integrację.

## §0 — Reguły ogólne

1. Każdy agent czyta §0–§2 i wyłącznie własną sekcję **AGENT Axx** na podstawie istniejącej tożsamości wątku. Nie przejmuj zadań innych. Agent 00 koordynuje, nie działa jako globalna Queen.
2. **Najpierw odzyskaj R16.** Jeśli wykonałeś pracę w R16, opublikuj oryginalny raport i konkretne artefakty R16 z HEAD/SHA, komendami/exit lub \`NOT_EXECUTED\`. Nie podmieniaj historycznego raportu „R16 zakończona” bez danych. Jeżeli praca była tylko analizą, oznacz ją \`SOURCE_ONLY/NOT_PUBLISHED\`, a nie \`PATCH_COMPLETE\`.
3. **Recheck PR:** status, HEAD SHA, diff, CI i raporty przed jakimkolwiek działaniem. Zakotwiczenie §1 jest snapshotem. Nie przyjmuj automatycznie, że zmiany z R16 zostały wypchnięte na GitHub. W szczególności \`#41=e847cb705...\`, \`#42=1ae0ccb...\`, \`#53=6a8f0c3...\` to nadal odczytane stare HEAD.
4. **R17 warunkowe źródłowe GO dla trzech niedostarczonych zakresów R16, bez nowych PR:** A90/P08 PR41, A70/P09 PR42, A100/P20 PR53. Najpierw sprawdź, czy patch już istnieje. Jeśli **nie** istnieje i agent ma uprawnienia/bezpieczny sposób edycji istniejącej własnej gałęzi, wolno dokończyć dokładnie poprzedni R16 kontrakt source-code/test-first. Jeżeli patch jest już obecny na nowym HEAD, **nie powtarzaj go** — przekaż do A60. Brak możliwości zapisu → \`PUBLICATION_BLOCKED\`, pełny gotowy patch/diff/handoff dla A00, nie fikcyjny commit. Żadne poszerzenie zakresu.
5. **Nie więcej niż trzy code lanes łącznie** i żadnego czwartego dla PR54. A120 PR54 mixed RR403/DE jest source-only/test-first contract, dopóki A00 nie zamknie jednego z dotychczasowych slotów i nie wyda nowego precyzyjnego GO w **kolejnej** decyzji. Nie łącz zmian innych PR-ów.
6. **Evidence taxonomy:** \`SOURCE_CONFIRMED\`, \`STATIC_INFERRED\`, \`HYPOTHESIS\`, \`PATCH_PROPOSED\`, \`PATCH_REVISED\`, \`SOURCE_ACCEPTED\` (niezależna A60 na exact HEAD), \`RUNTIME_VERIFIED\` (prawdziwy command/env/exit/test report na exact SHA), \`FAIL\`, \`BLOCKED\`, \`NOT_EXECUTED\`, \`POLICY_OPEN\`. Autorowe test definitions/PLAN-mode launcher/harness nie są aplikacyjnym PASS. Potencjalna prywatność cache nie jest automatycznie potwierdzonym wyciekiem.
7. **Środowisko testów:** A50 R15 potwierdził Node 22/Git, ale brak pełnego checkoutu repo, pnpm, Docker/psql i bezpiecznie odizolowanego fizycznego PG16. **Żadnych kolejnych PLAN-only skryptów jako zamiennika testów.** A00 musi wskazać jedno konkretne działanie ownera: udostępnienie zaufanego wykonawcy/PC/VM z pełnym per-PR checkoutem, Node22/pnpm10 i zgodą na uruchomienie, osobno PG16. PG destrukcyjne tylko \`TEST_DATABASE_URL\` dedicated DB, \`tm_test_*\`, jawny scope reset/zgoda, brak fallback do produkcji.
8. **CI Pack19**: stary matcher release \`readOnly:true\` vs \`accessMode:"read only"\`; istnieje draft PR35, bez którego nowe izolowane PR-y zatrzymują CI przed testami funkcji. Nie duplikuj PR35, nie obniżaj bramek, nie twórz w WEB-005 composite checkoutu/branch; późniejszy integrator SWARM-006 ma dopiero prawo integrować.
9. **Nie wybieraj niezatwierdzonych polityk:** T055 Basket CAS \`409/412\` i token/legacy; Swiss terminal TS-A/TS-B; SE currentRound; Swiss rematch/BYE; DE ranking; Backup V3 B2 history/revision/legacy; Direct Revert CAS + Host rollout/completion ID; Steam missing-secret 403/503; auth TTL/digest/rotation.
10. **HARD STOP:** merge/cherry-pick/rebase do release/main, staging/live, Replit integrator, paid CI manual rerun bez GO, SQL DDL/migration/ledger adoption, shared/production DB, sekrety i dane użytkowników, cudzy code lane, autoryzowanie własnej QA.
11. **Cross-swarm:** WEB-004 zakończył raportowanie i nie prosimy o kolejne audyty. **SWARM-006 ma otrzymać JEDEN końcowy handoff dopiero po formalnym zamknięciu przyjętego backlogu WEB-005** z A60 i decyzjami owner/HQ; żadnych interim paczek. SWARM-007 może rozwijać architekturę komunikacji/Drive niezależnie; nie zakładaj rzeczywistej synchronizacji.
12. **Publikacja:** agent zapisuje \`WEB-005_Axx_R17_HANDOFF.md\` pod \`docs/web-005/agent-reports/Axx/\` w control branch lub własnej jawnej docs branch, przekazuje A00 **bezpośredni permalink GitHub oraz sha**; nie dopisuj wyników do centralnego promptu. Jeśli nie może zapisać, wkleja pełny rezultat do wątku i oznacza \`PUBLICATION_BLOCKED\`. R17 raport wymaga także odzyskanego R16 handoffu lub jawnego \`R16_ARTIFACTS_UNAVAILABLE\`.

## §1 — Snapshot P01–P21 i cztery źródłowe bramki

**Release base:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. 21 PR #34–54 to niekompozytowe osobne, OPEN DRAFT patch candidates. PR32 release→main osobno; PR33 alternate Steam HOLD. Stan po wskazanym przez właściciela ukończeniu R16 jest identyczny ze stanem bezpośrednio po R15 według bieżącego readback GitHub.

| Packet | PR | HEAD SHA przy kontroli | R15 A60 / R17 next |
|---|---|---|---|
| P01 | #35 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | SOURCE_ACCEPTED scoped; final full CI pending |
| P02 | #36 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | SOURCE_ACCEPTED scoped; full tests pending |
| P03 | #34 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | conditional Steam |
| P04 | #37 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | conditional Proxy |
| P05 | #38 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | OFFLINE_ONLY migration ledger |
| P06 | #39 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | conditional Cancel/Restore |
| P07 | #40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | scoped gate; Pack17 --full pending |
| **P08** | **#41** | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | **SOURCE_BLOCKED:** QP/QPE/OP sourceBasketPosition parity; R16 amendment not visible |
| **P09** | **#42** | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | **SOURCE_BLOCKED:** roster global Undo LIFO; R16 amendment not visible |
| P10 | #43 | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | conditional CSV FileReader |
| P11 | #44 | \`2f0187b7242681c394c09058b5ef647667206bd6\` | conditional post-lock bans/picks |
| P12 | #45 | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | conditional RR terminal |
| P13 | #46 | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | conditional guarded DELETE |
| P14 | #47 | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | conditional DE presentation |
| P15 | #48 | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | conditional MVCC Backup export |
| P16 | #49 | \`99298b81501c3e7764d653604923522a19b9f05c\` | conditional password/visibility |
| P17 | #50 | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | conditional Backup preview |
| P18 | #51 | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | conditional malformed Undo |
| P19 | #52 | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` | conditional stale stage modal |
| **P20** | **#53** | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | **SOURCE_FAIL full privacy:** noncanonical keys, test provider; R16 amendment not visible |
| **P21** | **#54** | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` | **SOURCE_BLOCKED UI scope:** historical RR403 hides lawful DE/Overview; source-only contract |

**A60 original source report:** [A60 R15 independent QA](./agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md), [21-row matrix](./agent-reports/A60/WEB-005_A60_R15_PACKAGE_MATRIX.json). 17 partly/conditionally/offline accepted source scopes, four package full-claims blocked. No full exact-SHA application runtime receipts. **A50 original environment blocker:** [A50 R15 receipt](./agent-reports/A50/WEB-005_A50_R15_RECEIPT.md), [A50 R14 report](./agent-reports/A50/WEB-005_A50_R14_HANDOFF.md). These links exist; don't rediscover from scratch.

**Specific source blockers:** P08 sourceBasketPosition parity missing in qualification/route receipts; P09 roster \`delete_player/restore_player\` bypasses global latest Undo action guard; P20 PR53 URL-prefix cache invalidation misses tuple bans \`["tournaments",id,"player-bans"]\` and match picks \`["matches",matchId,"game-picks"]\` (only after verified match→tournament ownership), and old \`AuthProvider\` fixture lacks \`QueryClientProvider\`; P21 RR historical 401/403 full-page overlay might hide DE/Overview.

**Dependency DAG:** PR39/42/44/46/51 share \`routes/tournaments.ts\`; PR41/48 share \`backup-v3.ts\`; PR43/50/54 touch \`tournament-detail.tsx\`; PR53 React Query auth influences privacy around PR54; CI PR35→PR36→PR40. A10 read-only; only eventual SWARM-006 integrates after final handoff.

## §2 — Agent ownership / 13 roles

| Agent | R17 assignment | Mode |
|---|---|---|
| A00 | Reconcile missing R16 deliverables; authorize same 3 scoped lanes; get owner test executor | COORDINATION |
| A10 | SHA delta P01–P21, missing R16 receipts, direct A50/A60 URLs & final-only manifest | DOCS ONLY |
| A20 | PG16 isolated test-only preflight + migration-ledger HOLD | SOURCE ONLY |
| A30 | PR53 targeted security peer and precise match ownership | READ ONLY |
| A40 | Pack19 upstream CI vs targeted real test commands / Pack17 TAP risk | READ ONLY |
| A50 | P0 actual Node/pnpm checkout and PG16 execution OR concrete owner-action blocker | SAFE TEST ONLY |
| A60 | Independent exact-SHA verdict on updated PR41/42/53 and PR54 contract | STRICT READ ONLY |
| **A70** | R16 P09/PR42 global roster Undo LIFO delivery, conditional carryover | **CODE-ONLY L2** |
| A80 | Sport policy signatures + PR45 tests | SOURCE ONLY |
| **A90** | R16 P08/PR41 sourceBasketPosition parity delivery, conditional carryover | **CODE-ONLY L1** |
| **A100** | R16 P20/PR53 private cache S2B ownership and fixture, conditional carryover | **CODE-ONLY L3** |
| A110 | T055 Basket CAS owner decision, frontend QA | SOURCE ONLY |
| A120 | P21/PR54 mixed RR/DE 403 test oracle, no code | SOURCE ONLY |

**Source change GO is limited to one's own existing draft PR branch and exact previous small scope.** Status after publishing must be \`PATCH_REVISED\`, \`NO_CHANGE_SOURCE_RECONCILED\`, or \`BLOCKED_WITH_EXACT_REASON\`; “finished” without a verifiable SHA/diff is not an acceptable disposition.

---

## AGENT A00 — Local Implementation Lead R17

**TASK:** \`WEB-005-T000-A00-R17\`. **MODE:** COORDINATOR.

1. Explicitly record: user says R16 complete; control branch currently has no R16 per-agent reports and PR41/42/53 are unchanged. **Do not accuse agents of not working.** Request direct R16 output URLs or \`PUBLICATION_BLOCKED\` and reconcile exact SHA.
2. Re-authorize only preexisting bounded lanes A90 PR41, A70 PR42, A100 PR53 **conditional** on missing/unpublished patch, no new PR. Keep A120 PR54 source-only and no fourth lane.
3. Ensure A50 receives one tangible owner action: actual permitted execution in trustworthy PC/VM with complete per-SHA Git checkout, Node22/pnpm10 frozen deps for frontend; separate dedicated PG16 test host and written reset scope authorization. Owner-side setup is outside GitHub connector; avoid repeated plans with no actual executor.
4. Verify A60 original R15 signed source matrix and obtain new exact-SHA review only after actual amendments. Never carry old source acceptance over code changes automatically.
5. Record owner/HQ policy choices needed to close accepted HANDOFF R2, with explicit alternative, consequence, proposed minimum patch, owner signature. Nothing selected silently.
6. Update central backlog and 21-row status/receipt index; distinguish \`R16_THREAD_COMPLETED\` vs \`R16_ARTIFACT_VERIFIED\` and \`QA_ACCEPTED\`. Prepare R17 closure readout.
7. Preserve FINAL-ONLY SWARM-006 handoff rule, no interim dispatch, merge, staging/live.

**DELIVERABLE:** \`WEB-005_A00_R17_RECONCILIATION_AND_NEXT_GO.md\`, exact SHA/agent receipt matrix, owner execution request and policy queue.

## AGENT A10 — Packet Intake / Internal Manifest

**TASK:** \`WEB-005-T018-A10-R12\`. **MODE:** DOCS-ONLY.

1. Reuse R15 manifest and original A60 matrix; verify current 21 PR HEAD, status, hashes for changed branches only, and R16 report location. Do not invent changes.
2. Add two fields: \`r16_thread_claimed_completed\` vs \`r16_publication_url_sha_verified\`; mark null/unknown until exact URLs. Identify P08/P09/P20 draft HEAD drift after any conditional R17 commits.
3. Preserve actual runtime evidence from A50 only, original signed source QA from A60 only. Report all \`NOT_EXECUTED/BLOCKED\` accurately.
4. Keep collision DAG and future SWARM-006 single final manifest as NON-EXECUTED plan; no sending packages yet. SWARM-007 custody fields are requirements, not confirmed Drive transfer.
5. Publish 21-row \`SOURCE_READY/SOURCE_ACCEPTED/QA_ACCEPTED/RUNTIME_VERIFIED/POLICY_OPEN\` with exact SHA and direct receipt URL or null.

**DELIVERABLE:** \`WEB-005_A10_R17_INTERNAL_STATUS.md\` and updated structured matrix.

## AGENT A20 — Test Database Isolation / Migration Ledger

**TASK:** \`WEB-005-T021-A20-R12\`. **MODE:** SOURCE-ONLY.

1. Validate original P05 PR38 historical migration ledger \`REVIEW_ONLY / ready_for_sql:false\` and 0030/0031 fingerprints; no production SQL or new migration.
2. Provide short safe PG16 preflight for actual owner-provided dedicated disposable instance: identity, privileges, tm_test_* reset boundary, TEST_DATABASE_URL no fallback, verified out-of-production scope, explicit written reset consent.
3. Target exact test fixtures PR41 position and PR42 roster LIFO, plus other backend draft patches, with no unapproved execution.
4. Coordinate A50 owner actionable setup; do not claim installed PG16, full checkout or mounted PC from connector alone.

**DELIVERABLE:** \`WEB-005_A20_R17_PG16_UNBLOCK.md\`.

## AGENT A30 — Security Peer PR53 / Owner Mapping

**TASK:** \`WEB-005-T030-T031-A30-R15\`. **MODE:** READ-ONLY.

1. Check current PR53 and A100 changes if published, plus A60 R15 source fail and A30 R15 peer report. Verify noncanonical bans \`["tournaments",tid,"player-bans"]\` and picks \`["matches",mid,"game-picks"]\` handling with trusted match→tournament ownership, no global wipe.
2. Verify stale async queries/401/403/logout cannot retain private tournament A in component/UI, while public B cache remains; classify source inference vs actual runtime.
3. Check \`AuthProvider\` test missing QueryClientProvider wrapper and compatibility with legal support sessions.
4. Peer recheck backend auth PR44/46/49 dependency without editing their code; hand A50 exact tests, A60 independent threat source advice.

**DELIVERABLE:** \`WEB-005_A30_R17_S2B_SECURITY.md\`. STOP code.

## AGENT A40 — Pack19/17 Executable QA Commands

**TASK:** \`WEB-005-T010-T017-A40-R17\`. **MODE:** SOURCE-ONLY.

1. Preserve PR35 Pack19 fix; old release matcher prevents later isolated PR tests. Keep feature-specific skipped tests NOT_EXECUTED and required final integrated gates open.
2. Identify exact Node/pnpm frontend targeted per-SHA commands for PR53 provider/cache, PR54 RR, PR52 modal, PR43 CSV, PR47 DE, PR50 backup; validate against actual scripts (not generic guessed invocations).
3. Consolidate Pack17 \`--full\` dependencies and \`T017-QA-01\` adversarial TAP counter-only/forged-PASS source issue, independent A60 verdict pending. Do not implement it in R17.
4. Provide A50 one executable, minimal test path and failure-mapping, not another substitute PLAN-mode suite. No paid CI rerun or runner weakening.

**DELIVERABLE:** \`WEB-005_A40_R17_TEST_COMMANDS_AND_TAP_GATE.md\`.

## AGENT A50 — Runtime Real Execution or Exact Owner Blocker

**TASK:** \`WEB-005-T133-A50-R12\`. **MODE:** SAFE TEST ONLY.

1. Reuse original R15 report/runbook; **do not repeat PLAN_ONLY invocations** as progress. Establish whether A00/owner actually provided allowed repo checkout+pnpm and safe shell. If yes, run true targeted RTL/typecheck per exact PR SHA, PR53 original \`use-tournament-auth.test.tsx\` first; record TAP/exit/skip. If not, deliver one short owner-facing command/action and \`ENV_BLOCKED\`.
2. After A90/A70/A100 amend PR41/42/53, test new exact HEADs only; old SHA test results do not transfer. Frontend no PG if correct environment, backend PG16 only with A20 physical isolation plus written exact reset consent.
3. Do not use \`DATABASE_URL\` production fallback, production data, paid GH Actions rerun without owner authorization, or create composite branch. Feature test FAIL is recorded only when feature test really ran.
4. Publish actual environment versions, SHA, command, exit and TAP or \`NOT_EXECUTED\`, plus direct GitHub artifact URL; A60 independently receives evidence.

**DELIVERABLE:** \`WEB-005_A50_R17_EXECUTION_OR_BLOCKER.md\` + status matrix.

## AGENT A60 — Independent QA of R16/R17 Changes

**TASK:** \`WEB-005-T130-A60-R17\`. **MODE:** STRICT READ-ONLY.

1. Start from R15 original 21-row signed matrix, avoid re-review of unchanged 17 scopes. Check whether PR41/42/53 were actually amended in R16/R17 and pin new HEAD + changed files.
2. PR41: \`sourceBasketPosition\` QP/QPE/OP parity, valid legacy positive and malformed 400/no clone; no PG PASS if tests not executed.
3. PR42: global latest Undo LIFO now covers \`delete_player/restore_player\` within same tournament lock/transaction; stale X/Y 409 zero-write, lawful newest Undo retained.
4. PR53: custom tournament bans and match picks ownership-specific eviction, no unrelated B wipe, correct QueryClientProvider fixture, in-flight delayed private A response. Do not infer runtime exploitation from source shape.
5. PR54 (source-only): mixed historical RR403 should not suppress valid Overview/DE tab, correct 401/403 privacy; receive A120 source acceptance oracle, R17 no new code.
6. Independently classify \`SOURCE_ACCEPTED / SOURCE_BLOCKED\` on exact new SHA, runtime only if A50 actual commands/exits, 38-case WEB004 historical provenance untouched. Provide A00 ranked blocker and next narrow GO recommendations.
7. No source edits, merge or final SWARM006 acceptance.

**DELIVERABLE:** \`WEB-005_A60_R17_INDEPENDENT_QA.md\` + updated 21-row matrix.

## AGENT A70 — PR42 Roster Undo LIFO conditional R16 delivery

**TASK:** \`WEB-005-T040-A70-MP2A-ROSTER-R17\`. **MODE:** CONDITIONAL GO ON OWN EXISTING PR42.

1. First disclose original R16 work artifact/URL and verify current PR42 SHA. If R16 patch exists elsewhere, publish it safely with new SHA; if already applied, no duplicate. If unfinished, complete the same original bounded R16 code GO: global locked latest Undo action ordering for \`delete_player/restore_player\` before \`undoTournamentRosterAction\`.
2. Test-first deterministic queued stale X vs newer Y action 409 no-write, both delete/restore, positive newest roster Undo; keep generic+revert_match correct, same tx/tournament lock.
3. Amend **only** own existing \`fix/web-005/t040-mp2a-global-undo-lifo-r9\` draft PR #42; do not cherry-pick PR39/44/46/51, no public Revert MP2B API CAS policy change.
4. If unable to push, publish exact proposed patch/diff + inability, mark \`PUBLICATION_BLOCKED\`. No fabricated new HEAD.
5. PG16 targeted test only in owner-approved isolated disposable DB; otherwise test NOT_EXECUTED. Hand changed exact SHA to A60/A50.

**DELIVERABLE:** \`WEB-005_A70_R17_PR42_ROSTER_LIFO_RESULT.md\`, R16 evidence URL and amended PR42 if safe.

## AGENT A80 — Sporting Rules Owner Signatures

**TASK:** \`WEB-005-T050-T051-A80-R10\`. **MODE:** SOURCE-ONLY.

1. Recover original R16 owner policy/QA report or state missing. Consolidate owner-signable TS-A Swiss terminal deny 409 vs TS-B atomic reopen, SE currentRound actionable/generated, Swiss rematch/BYE/NC and DE GF ranks; no preselected default.
2. PR45 RR8→RR4 roster result requires real PG16 A50 + A60 verification; give runnable fixture and expected legal/nonqualifier state, not fabricated PASS.
3. Present one brief priority recommendation after independent owner signoff; no sport-rule coding in R17.

**DELIVERABLE:** \`WEB-005_A80_R17_POLICY_OWNER_QUEUE.md\`.

## AGENT A90 — PR41 Backup QP/QPE/OP Parity conditional R16 delivery

**TASK:** \`WEB-005-T060-A90-B1-POSITION-R17\`. **MODE:** CONDITIONAL GO ON OWN EXISTING PR41.

1. Recover original R16 patch/report URL and recheck PR41 exact HEAD. If code exists locally/docs, publish; if not done, finish same narrowly authorized B1 validation: \`sourceBasketPosition\` consistency across QP/QPE/OP qualification/approved/routes.
2. Test-first legal sourceBasketPosition positive legacy import, negative swapped/missing/invalid position 400 before any clone, no silent rejection of historical valid V3; late failure rollback.
3. Amend only own \`fix/web-005/t060-b1-backup-v3-integrity-r9\` existing PR41; no B2 legacy/revision assumptions, no B3A PR48 merge, no migration/DDL.
4. Physical PG16 positive/rollback only with owner-approved isolated disposable database. Without it \`NOT_EXECUTED\`; no fake passes. Hand exact changed SHA to independent A60.
5. If no ability to push, deliver patch/diff and \`PUBLICATION_BLOCKED\`, not invented SHA.

**DELIVERABLE:** \`WEB-005_A90_R17_PR41_POSITION_RESULT.md\`, original R16 evidence URL and PR41 amended if safe.

## AGENT A100 — PR53 Private Cache S2B conditional R16 delivery

**TASK:** \`WEB-005-T080-A100-S2B-R17\`. **MODE:** CONDITIONAL GO ON OWN EXISTING PR53.

1. Recover R16 work/URL. Verify PR53 actual HEAD (snapshot old \`6a8f0c3...\`), original A60/A30 source keys, and no new branch changes. Avoid duplicate patch if R16 code already exists.
2. Test-first N1 \`["tournaments", tid, "player-bans"]\` evacuation on credential removal or 403 (preserve public B); N2 \`["matches", mid, "game-picks"]\` only when authoritative match→tournament proof and cache metadata are available, never global purge; N3 existing AuthProvider hook test add correct QueryClientProvider wrapper while preserving legal support tests.
3. On **own existing PR53 branch only**, fix confirmed key gaps minimally; if match ownership proof unavailable or fix needs other agent's file, HOLD relevant part and report exact dependency. Don't change auth TTL/token format/backend PR44/46/49.
4. Preserve late in-flight old A suppression, 7-versus-70 strict ID matching, private scopes and public cached B. No claim of production exploitation without actual runtime.
5. Run true RTL/typecheck if allowed checkout/pnpm exists; otherwise NOT_EXECUTED. After changed SHA hand to A30 peer and A60 independent A50 tests. If GitHub write unavailable report exact diff and PUBLICATION_BLOCKED, not phantom PR.

**DELIVERABLE:** \`WEB-005_A100_R17_PR53_S2B_RESULT.md\`, R16 evidence URL and PR53 amended if safe.

## AGENT A110 — Basket CAS / Frontend QA Policy

**TASK:** \`WEB-005-T055-T110-A110-R17\`. **MODE:** SOURCE-ONLY.

1. Recover R16 policy report/owner signature evidence or mark unsigned. Present T055 full PUT CAS choice: version/ETag precondition, conflict 409 vs 412, legacy missing precondition, draft keep/retry, stage/roster transitions. No choosing default.
2. Keep PR43 CSV, PR50 backup preview, PR52 lifecycle stale modal conditional source-reviewed but not app runtime-confirmed; A50 runnable RTL tests, A60 source verdict.
3. UX044 Host unsaved drafts requires owner behavior selection; withdrawn ordinary A→B StageBasketsPanel/backup-overwrite reports stay withdrawn. No new patch in R17.
4. Record PR43/50/54 same tournament-detail file conflict and privacy interplay with PR53 for future SWARM006 only.

**DELIVERABLE:** \`WEB-005_A110_R17_BASKET_POLICY_QA.md\`.

## AGENT A120 — PR54 historical RR403 + DE/Overview QA oracle

**TASK:** \`WEB-005-T100-A120-R17\`. **MODE:** SOURCE-ONLY.

1. Recover original R16 test contract/report or publish it; no need to rediscover R15 A60 source finding. In PR54 mixed stage fixture, historical RR stage GET denied 403 while current lawful DE/Overview GET 200; test must show lawful tabs visible, RR-selected error limited locally.
2. Test N→N+1 canonical RR refresh, late old response, 401/403 privacy correctness, RR legal retry and non-RR no polling storm.
3. Provide smallest precise patch-ready boundary for own \`tournament-detail.tsx\` future code lane, with collision notes PR43/50, without altering PR54 now (existing 3 slots).
4. No runtime/browser PASS without actual A50/browser execution; status SOURCE_INFERRED until independent evidence.

**DELIVERABLE:** \`WEB-005_A120_R17_PR54_TEST_ORACLE.md\`.

---

## §3 — R17 closure gate

A00 must report at completion:
- R16 claimed completed vs source **R16 deliverables verifiably published** count by agent.
- P08/P09/P20 actual **before/after HEAD SHAs**, test-first diffs or \`BLOCKED\` reasons, with new exact A60 independent verdict. Do not mislabel missing GitHub commit as patched.
- P21/PR54 source-only exact test contract, code GO deferred.
- A50 **actual native app test count** vs environment blocker and explicit owner action to unblock.
- Signed vs outstanding HQ product decisions and complete WEB-004 R2 finding dispositions.
- A10 conflict DAG and final-only buffer. **SWARM-006 remains HOLD** until full formal WEB005 closeout and owner signoff, not merely this wave ending.

## §4 — Krótki prompt do wszystkich wątków

WEB-005 — START FALI R17

Otwórz dokument centralny:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md

Przeczytaj wspólne §0–§2, rozpoznaj własny Axx i wykonaj wyłącznie sekcję AGENT Axx. Najpierw opublikuj / wskaż faktyczne raporty R16, nawet jeśli były tylko source-only; nie twierdź, że zmiany zostały wdrożone bez nowego PR SHA. Następnie wykonaj wyznaczony zakres R17 zgodnie z GO/STOP. Zweryfikuj GitHub HEAD/PR/QA, opublikuj R17 handoff z bezpośrednim URL GitHub lub zgłoś PUBLICATION_BLOCKED. Nie uruchamiaj SWARM-006, nie wykonuj merge ani produkcyjnego release.
